import express from 'express';
import prompt from 'prompt';

import db from '../controllers/database.js';
import encryption from '../utilities/encryption.js';
import errorHandler from '../utilities/errorHandler.js';
import eVars from '../config/environment.js';
import logger from '../utilities/logger.js';
import routerResponse from '../utilities/routerResponse.js';

import notImplemented from '../middleware/preprocessing/notImplemented.js';

let regInProcess = false;

const subscribeRouter = express.Router();

subscribeRouter.route('/api/subscription')
    .get(serveRegistrationFrom) // serve API registration page
    .post(processRegistrationRequest) // process registration request
    .put(notImplemented)
    .patch(notImplemented)
    .delete(notImplemented);

module.exports = subscribeRouter;

function serveRegistrationFrom(request, response, next) {
    let submissionUrl = `${request.protocol}://${request.hostname}:${eVars.PORT}${request.originalUrl}`;
    routerResponse.template({
        pendingResponse: response,
        statusCode: 200,
        reference: 'regForm',
        data: {
            title: eVars.SYS_REF,
            submissionUrl: submissionUrl
        }
    });
}

function processRegistrationRequest(request, response, next) {
    if (regInProcess === true) { // server is processing another request
        routerResponse.template({
            pendingResponse: response,
            statusCode: 502,
            reference: 'regBusy',
            data: {
                title: eVars.SYS_REF
            }
        });
    } else {
        regInProcess = true;
        let authorized = eVars.AUTO_AUTHORIZED_SYSTEMS.split(',');
        let reference = request.body.reference;
        let loginId = request.body.loginId;
        let password = request.body.password;
        if (authorized.indexOf(reference) !== -1) {
            // if the applicant is in the auto authorized list
            registerAccount({
                subscriberModel: db.APISubscribers,
                reference: reference,
                loginId: loginId,
                password: password
            }).then(() => {
                regInProcess = false;
                routerResponse.template({
                    pendingResponse: response,
                    statusCode: 200,
                    reference: 'regSuc',
                    data: {
                        title: eVars.SYS_REF
                    }
                });
            }).catch((error) => {
                regInProcess = false;
                errorHandler.handler(error);
                routerResponse.template({
                    pendingResponse: response,
                    statusCode: 500,
                    reference: 'regFail',
                    data: {
                        title: eVars.SYS_REF
                    }
                });
            });
        } else {
            prompt.start();
            prompt.get({
                properties: {
                    authoriztion: {
                        description: `請確認是否同意用戶【${reference}】以【${loginId}】註冊 telegramBroadcast 服務。請輸入'y'(同意)，其他取消`
                    }
                }
            }, (error, result) => {
                if (error || (result.authoriztion !== 'y')) {
                    regInProcess = false;
                    logger.warn('已取消帳號 $loginId 申請');
                    routerResponse.template({
                        pendingResponse: response,
                        statusCode: 401,
                        reference: 'regFail',
                        data: {
                            title: eVars.SYS_REF
                        }
                    });
                }
                registerAccount({
                    subscriberModel: db.APISubscribers,
                    reference: reference,
                    loginId: loginId,
                    password: password
                }).then(() => {
                    regInProcess = false;
                    routerResponse.template({
                        pendingResponse: response,
                        statusCode: 200,
                        reference: 'regSuc',
                        data: {
                            title: eVars.SYS_REF
                        }
                    });
                }).catch((error) => {
                    regInProcess = false;
                    errorHandler.handler(error);
                    routerResponse.template({
                        pendingResponse: response,
                        statusCode: 500,
                        reference: 'regFail',
                        data: {
                            title: eVars.SYS_REF
                        }
                    });
                });
            });
        }
    }
}

function registerAccount(args) {
    return new Promise((resolve, reject) => {
        let encryptedPasswordData = encryption.sha512(args.password, encryption.saltGen(16));
        args.subscriberModel.upsert({
            reference: args.reference,
            loginId: args.loginId,
            passwordHash: encryptedPasswordData.passwordHash,
            salt: encryptedPasswordData.salt
        }).then(() => {
            resolve();
        }).catch((error) => {
            errorHandler.handler(errorHandler.object(
                'subscribe.js',
                'registerAccount(){args.subscriberModel.upsert()}',
                'API 訂閱資料寫入發生錯誤',
                error
            ));
            reject(error);
        });
    });
}
