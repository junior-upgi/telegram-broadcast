import express from 'express';

import tokenValidate from '../middleware/tokenValidate.js';
import db from '../models/database.js';
import messageQueue from '../messageQueue.js';

const router = express.Router();

router.route('/messages')
    .all(tokenValidate)
    .post((request, response, next) => {
        db.Chats.findOne({
            where: { id: request.body.chat_id }
        }).then((chat) => {
            if (chat !== null) {
                messageQueue.add({
                    chat_id: request.body.chat_id,
                    text: request.body.text,
                    parse_mode: 'HTML'
                });
                return response.status(200).json({
                    success: false,
                    statusCode: 200,
                    message: 'message registered and will be broadcasted shortly'
                });
            } else {
                return response.status(404).json({
                    success: false,
                    statusCode: 404,
                    message: `chat_id: ${request.body.chat_id} does not exist`
                });
            }
        }).catch((error) => {
            return response.status(500).json({
                success: false,
                statusCode: 500,
                message: `database lookup error while processing a '/message' request: ${error}`
            });
        });
    });

module.exports = router;
