import Promise from 'bluebird';
import routerResponse from '../../utilities/routerResponse.js';
import db from '../../controllers/database.js';
import broadcastSystem from '../../controllers/broadcastSystem.js';

module.exports = processMessageSubmissionRequest;

function processMessageSubmissionRequest(request, response, next) {
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
        return routerResponse.json({
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
            broadcastSystem.queueMessage({
                chat_id: request.body.chat_id,
                text: request.body.text
            });
            return routerResponse.json({
                pendingResponse: response,
                originalRequest: request,
                statusCode: 200,
                success: true,
                message: 'message(s) registered and will be broadcasted shortly'
            });
        } else {
            return routerResponse.json({
                pendingResponse: response,
                originalRequest: request,
                statusCode: 404,
                success: false,
                message: 'chat_id does not exist'
            });
        }
    }).catch((error) => {
        return routerResponse.json({
            pendingResponse: response,
            originalRequest: request,
            statusCode: 500,
            success: false,
            error: error,
            message: 'database lookup error while processing the request'
        });
    });
}

function messageArray(request, response, next) {
    let validMessageCounter = 0; // count how many messages are to valid recipients
    let lookupRequests = []; // to hold a list of user lookup request promises
    // construct the contents of the lookup request promise array
    request.body.messages.forEach((message) => {
        lookupRequests.push(
            db.Chats.findOne({
                where: { id: message.chat_id }
            })
        );
    });
    // process the lookupRequests sequentially
    Promise.each(lookupRequests, (lookupResultPromise) => {
        return lookupResultPromise;
    }).then((lookupResults) => { // if all lookups are completed without errors
        // loop through the results
        lookupResults.forEach((lookupResult, index) => {
            // console.log(lookupResult);
            if (lookupResult !== null) { // if a chat is found
                validMessageCounter++; // increase counter
                // queue the message
                broadcastSystem.queueMessage(request.body.messages[index]);
            }
        });
        // respond about how many messages are actually broadcasted
        return routerResponse.json({
            pendingResponse: response,
            originalRequest: request,
            statusCode: 200,
            success: true,
            message: `${validMessageCounter}/${lookupResults.length} messages are queued`
        });
    }).catch((error) => {
        return routerResponse.json({
            pendingResponse: response,
            originalRequest: request,
            statusCode: 500,
            success: true,
            error: error,
            message: 'could not finished a series of Chats model lookups'
        });
    });
}
