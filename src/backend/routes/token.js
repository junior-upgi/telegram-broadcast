import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import md5 from 'md5';

import db from '../models/database.js';
import logger from '../utilities/logger.js';

dotenv.config();

const router = express.Router();

router.post('/getToken', (request, response) => {
    let loginId = request.body.loginId;
    let password = request.body.password;
    if ((!loginId) || (!password)) {
        return response.status(401).json({
            success: false,
            token: null,
            message: '401 Forbidden'
        });
    }
    db.Authorizations.findOne({
        where: {
            loginId: loginId,
            password: md5(password)
        }
    }).then((authorizedUser) => {
        if (authorizedUser === null) {
            return db.Sequelize.Promise.reject(`【 ${loginId} 】登入失敗`);
        }
        logger.info(`${authorizedUser.reference} 提出 jwt 申請`);
        let payload = { loginId: loginId };
        return response.status(200).json({
            success: true,
            token: jwt.sign(payload, process.env.PASS_PHRASE, {
                expiresIn: '24h'
            }),
            message: 'valid web-token is supplied for 24 hours'
        });
    }).catch((error) => {
        logger.warn(`【 ${loginId} 】 jwt 申請失敗: ${error}`);
        return response.status(401).json({
            success: false,
            token: null,
            message: '401 Forbidden'
        });
    });
});

module.exports = router;
