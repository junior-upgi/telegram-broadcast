import express from 'express';

import tokenValidate from '../middleware/preprocessing/tokenValidate.js';
import db from '../controllers/database.js';
import telegramAPI from '../utilities/telegramAPI.js';
import messageQueue from '../controllers/messageQueue.js';
import errorHandler from '../utilities/errorHandler.js';
import routerResponse from '../utilities/routerResponse.js';

import notImplemented from '../middleware/preprocessing/notImplemented.js';

const messagesRouter = express.Router();

messagesRouter.route('/messages')
    .all(tokenValidate) // token validation
    .get(notImplemented)
    .post(submitMessageToQueue) // route to receive message submission
    .put(notImplemented)
    .patch(notImplemented)
    .delete(notImplemented);

module.exports = messagesRouter;

function submitMessageToQueue(request, response, next) {
    console.log('-----------------------------------------');
    console.log(request.body.chat_id);
    db.Chats.findOne({
        where: { id: request.body.chat_id }
    }).then((chat) => {
        console.log('-----------------------------------------');
        console.log(chat);
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
                'messages.js',
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
            'messages.js',
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
