import telegramAPI from '../../utilities/telegramAPI.js';
import errorHandler from '../../utilities/errorHandler.js';
import routerResponse from '../../utilities/routerResponse.js';
import db from '../../controllers/database.js';
import messageQueue from '../../controllers/messageQueue.js';

module.exports = processMessageSubmissionRequest;

export function processMessageSubmissionRequest(request, response, next) {
    if ( // found a request.body.messages array
        (request.body.messages !== undefined) &&
        Array.isArray(request.body.messages)
    ) {
        messageArray(request, response, next);
    } else if ( // find a single message object
        (request.body.chat_id !== undefined) &&
        (request.body.text !== undefined)
    ) {
        singleMessage(request, response, next);
    } else { // did not find valid messages
        routerResponse.json({
            pendingResponse: response,
            originalRequest: request,
            statusCode: 400,
            success: false,
            message: 'did not find valid messages'
        });
    }
}

function singleMessage(request, response, next) {
    db.Chats.findOne({
        where: { id: request.body.chat_id }
    }).then((chat) => {
        if (chat !== null) {
            messageQueue.add(telegramAPI.messageObject(request.body.chat_id, request.body.text));
            routerResponse.json({
                pendingResponse: response,
                originalRequest: request,
                statusCode: 200,
                success: true,
                message: 'message registered and will be broadcasted shortly'
            });
        } else {
            errorHandler.handler(errorHandler.object(
                'submitMessageToQueue.js',
                'submitMessageToQueue(){db.Chats.findOne()}',
                'Chats 資料表查無註冊資料', {}
            ));
            routerResponse.json({
                pendingResponse: response,
                originalRequest: request,
                statusCode: 404,
                success: false,
                message: `chat_id: ${request.body.chat_id} does not exist`
            });
        }
    }).catch((error) => {
        errorHandler.handler(errorHandler.object(
            'submitMessageToQueue.js',
            'submitMessageToQueue(){db.Chats.findOne()}',
            'Chats 資料表查詢發生錯誤',
            error
        ));
        routerResponse.json({
            pendingResponse: response,
            originalRequest: request,
            statusCode: 500,
            success: false,
            error: error,
            message: 'database lookup error while processing a \'/message\' request'
        });
    });
}

function messageArray(request, response, next) {
    let validMessageCounter = 0; // count how many messages are to valid recipients
    let lookupRequests = []; // to hold a list of lookup request promises
    // prepare a lookup request promise array
    request.body.messages.forEach((message) => {
        lookupRequests.push(
            db.Chats.findOne({
                where: {
                    id: message.chat_id
                }
            }).then((result) => {
                return db.Sequelize.Promise.resolve(result);
            }).catch((error) => {
                return db.Sequelize.Promise.reject(
                    errorHandler.object(
                        'submitMessageToQueue.js',
                        'messageArray(){db.Chat.findOne()}',
                        `could not finished a Chats model lookup on ${message.chat_id}`,
                        error
                    )
                );
            })
        );
    });
    db.Sequelize.Promise.mapSeries(
        lookupRequests, // lookup request promise array
        (result, index) => { // mapper function
            // if result is a valid registered user chat found
            if (result !== null) {
                // push the corresponding message to the message queue
                messageQueue.add(
                    telegramAPI.messageObject(
                        request.body.messages[index].chat_id,
                        request.body.messages[index].text
                    )
                );
                validMessageCounter++; // increase counter
            }
        }
    ).then(() => {
        // respond about how many messages are actually broadcasted
        routerResponse.json({
            pendingResponse: response,
            originalRequest: request,
            statusCode: 200,
            success: true,
            message: `${validMessageCounter}/${lookupRequests.length} messages are queued`
        });
    }).catch((error) => {
        console.log(error);
        errorHandler.fullHandler({
            module: 'submitMessageToQueue.js',
            function: 'messageArray(){Promise.all(lookupRequest)}',
            message: 'could not finished a series of Chats model lookups',
            error: error
        });
    });
}
