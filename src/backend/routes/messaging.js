import express from 'express';

import tokenValidate from '../middleware/tokenValidate.js';

import messageQueue from '../messageQueue.js';

const router = express.Router();

router.use(tokenValidate);

router.route('/messages')
    .post((request, response, next) => {
        messageQueue.add({
            chat_id: request.body.chat_id,
            text: request.body.text,
            parse_mode: 'HTML'
        });
        response.status(200).end();
    });

module.exports = router;
