import express from 'express';
// import prettyjson from 'prettyjson';

import messageQueue from '../messageQueue.js';

const router = express.Router();

router.route('/Messages')
    .post((request, response, next) => {
        messageQueue.add({
            chat_id: request.body.chat_id,
            text: request.body.text
        });
        response.status(200).end();
    });

module.exports = router;
