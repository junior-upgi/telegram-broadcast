import express from 'express';
// import prompt from 'prompt';

import db from '../controllers/database.js';
import telegram from '../utilities/telegramAPI.js';
import telegramConfig from '../config/telegramAPI.js';
import encryption from '../utilities/encryption.js';
import eVars from '../config/environment.js';
import routerResponse from '../utilities/routerResponse.js';

import notImplemented from '../middleware/preprocessing/notImplemented.js';

// let regInProcess = false;

const subscribeRouter = express.Router();

subscribeRouter.route('/api/subscriptions')
    .get(serveRegistrationFrom) // serve API registration page
    .post(processRegistrationRequest) // process registration request
    .put(notImplemented)
    .patch(notImplemented)
    .delete(notImplemented);

module.exports = subscribeRouter;

function serveRegistrationFrom(request, response, next) {
    let submissionUrl = `${request.protocol}://${request.hostname}:${eVars.PORT}${request.originalUrl}`;
    return routerResponse.template({
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
    // if (regInProcess === true) { // server is processing another request
    //     return routerResponse.template({
    //         pendingResponse: response,
    //         statusCode: 502,
    //         reference: 'regBusy',
    //         data: {
    //             title: eVars.SYS_REF
    //         }
    //     });
    // } else {
    // regInProcess = true;
    // create an array holding the reference of authorized systems
    let autoAuthorizedSystems = eVars.AUTO_AUTHORIZED_SYSTEMS.split(',');
    let reference = request.body.reference;
    let loginId = request.body.loginId;
    let password = request.body.password;
    // check if the submitted reference is in the auto authorized list
    if (autoAuthorizedSystems.indexOf(reference) !== -1) {
        return registerAccount({
            pendingResponse: response,
            reference: reference,
            loginId: loginId,
            password: password
        }).then(() => {
            // regInProcess = false;
            return routerResponse.template({
                pendingResponse: response,
                statusCode: 200,
                reference: 'regSuc',
                data: { title: eVars.SYS_REF }
            });
        }).catch((error) => {
            // regInProcess = false;
            return routerResponse.template({
                pendingResponse: response,
                statusCode: 500,
                reference: 'regFail',
                data: { title: eVars.SYS_REF }
            });
        });
    } else { // applicant is not in the auto authorized list
        // send a telegram message to alter the system admin about the API access request
        let sentence1 = `'${request.body.reference}' had requested for ${eVars.SYS_REF} API access.\n`;
        let sentence2 = `[reply] to this message and enter\n[<b>/authorize ${request.body.reference}</b>]\nto register this account.\n`;
        let sentence3 = 'the request will have 3 minutes before it\'s expired.';
        telegram.sendMessage({ // message part 1
            chat_id: telegramConfig.masterAccount.id,
            text: `${sentence1}${sentence2}${sentence3}`
        }).then((message) => {
            // console.log(JSON.stringify(message, null, '  '));
            let replyListenerId = telegram.expectReply({
                chat_id: message.chat.id,
                message_id: message.message_id,
                callback: (repliedMessage) => { // callback function to check for authorization string
                    if (
                        // check if the message is from the system admin
                        (repliedMessage.from.id === parseInt(telegramConfig.masterAccount.id)) &&
                        // check if the admin is replying to the exact message
                        (repliedMessage.reply_to_message.message_id === message.message_id) &&
                        // check the authorize string is correct
                        (repliedMessage.text === `/authorize ${request.body.reference}`)
                    ) { // remove listener
                        let deletedListener = telegram.quitListeningToReply(replyListenerId);
                        registerAccount({
                            pendingResponse: response,
                            reference: reference,
                            loginId: loginId,
                            password: password
                        }).then(() => { // alter the original request message to inform authorization
                            return telegram.editMessage({
                                text: `API request for '${request.body.reference}' had been authorized`,
                                message_id: deletedListener.messageId,
                                chat_id: deletedListener.chatId
                            });
                        }).then((editedMessage) => {
                            // regInProcess = false;
                            console.log(editedMessage.text);
                        }).catch((error) => {
                            // regInProcess = false;
                            console.log(JSON.stringify(error, null, '  '));
                        });
                    }
                }
            });
            setTimeout(() => { // wait for three mintues and delete the listener
                let deletedListener = telegram.quitListeningToReply(replyListenerId);
                // check if the listener is still valid
                // (if already authorized, it will return null)
                if (deletedListener !== null) {
                    // alter the original request message to inform the request had expired
                    telegram.editMessage({
                        text: `API request for '${request.body.reference}' had expired`,
                        message_id: deletedListener.messageId,
                        chat_id: deletedListener.chatId
                    }).then((editedMessage) => {
                        console.log(JSON.stringify(editedMessage, null, '  '));
                    }).catch((error) => {
                        console.log(JSON.stringify(error, null, '  '));
                    });
                    // regInProcess = false;
                }
            }, 180000);
            return routerResponse.template({
                pendingResponse: response,
                statusCode: 200,
                reference: 'regPending',
                data: { title: eVars.SYS_REF }
            });
        }).catch((error) => {
            // regInProcess = false;
            return routerResponse.template({
                pendingResponse: response,
                statusCode: 500,
                reference: 'regFail',
                data: { title: eVars.SYS_REF }
            });
        });
        // prompt.start();
        // prompt.get({
        //     properties: {
        //         authoriztion: {
        //             description: `請確認是否同意用戶【${reference}】以【${loginId}】註冊 telegramBroadcast 服務。請輸入'y'(同意)
        //         }
        //     }
        // }, (error, result) => {
        //     if (error || (result.authoriztion !== 'y')) {
        //         regInProcess = false;
        //         console.log('已取消帳號 $loginId 申請');
        //         return routerResponse.template({
        //             pendingResponse: response,
        //             statusCode: 401,
        //             reference: 'regFail',
        //             data: {
        //                 title: eVars.SYS_REF
        //             }
        //         });
        //     }
        //     registerAccount({
        //         reference: reference,
        //         loginId: loginId,
        //         password: password
        //     }).then(() => {
        //         regInProcess = false;
        //         return routerResponse.template({
        //             pendingResponse: response,
        //             statusCode: 200,
        //             reference: 'regSuc',
        //             data: {
        //                 title: eVars.SYS_REF
        //             }
        //         });
        //     }).catch((error) => {
        //         regInProcess = false;
        //         errorHandler.handler(error);
        //         return routerResponse.template({
        //             pendingResponse: response,
        //             statusCode: 500,
        //             reference: 'regFail',
        //             data: {
        //                 title: eVars.SYS_REF
        //             }
        //         });
        //     });
        // });
    }
    // }
}

function registerAccount(args) {
    let encryptedPasswordData = encryption.sha512(args.password, encryption.saltGen(16));
    return db.Subscribers.upsert({
        reference: args.reference,
        loginId: args.loginId,
        passwordHash: encryptedPasswordData.passwordHash,
        salt: encryptedPasswordData.salt
    });
}
