import express from 'express';
import jwt from 'jsonwebtoken';

import db from '../controllers/database.js';
import eVars from '../config/environment.js';
import encryption from '../utilities/encryption.js';
import errorHandler from '../utilities/errorHandler.js';
import logger from '../utilities/logger.js';
import routerResponse from '../utilities/routerResponse.js';

import notImplemented from '../middleware/preprocessing/notImplemented.js';

const tokenRouter = express.Router();

tokenRouter.route('/api/getToken')
    .get(notImplemented)
    .post(getToken) // verify and issue token
    .put(notImplemented)
    .patch(notImplemented)
    .delete(notImplemented);

module.exports = tokenRouter;

function getToken(request, response, next) {
    let loginId = request.body.loginId;
    let password = request.body.password;
    if ((!loginId) || (!password)) {
        routerResponse.json({
            pendingResponse: response,
            originalRequest: request,
            statusCode: 401,
            success: false
        });
    }
    db.APISubscribers.findOne({
        where: { loginId: loginId }
    }).then((apiUser) => {
        if (apiUser === null) { // user not found
            return db.Sequelize.Promise.reject(
                errorHandler.object(
                    'token.js',
                    'getToken(){db.APISubscriber.findOne()}',
                    `帳號 ${loginId} 帳號不存在`, {}
                )
            );
        }
        // password verification
        logger.info(`${apiUser.reference} 提出 jwt 申請`);
        let currentHash = encryption.sha512(password, apiUser.salt).passwordHash;
        if (currentHash === apiUser.passwordHash) {
            // hash verified
            let payload = { loginId: loginId };
            routerResponse.json({
                pendingResponse: response,
                originalRequest: request,
                statusCode: 200,
                success: true,
                data: {
                    token: jwt.sign(payload, eVars.PASS_PHRASE, { expiresIn: '24h' })
                },
                message: 'valid web-token is supplied for 24 hours'
            });
            logger.info(`${loginId} jwt issued`);
        } else { // hash verification failed
            return db.Sequelize.Promise.reject(
                errorHandler.object(
                    'token.js',
                    'getToken(){db.APISubscriber.findOne()}',
                    `帳號 ${loginId} 登入失敗`, {}
                )
            );
        }
    }).catch((error) => {
        if (errorHandler.processed(error)) {
            errorHandler.handler(error);
        } else {
            errorHandler.handler(
                errorHandler.object(
                    'token.js',
                    'getToken(){db.APISubscriber.findOne()}',
                    `帳號 ${loginId} jwt 申請失敗`,
                    error
                )
            );
        }
        routerResponse.json({
            pendingResponse: response,
            originalRequest: request,
            statusCode: 401,
            success: false
        });
    });
}
