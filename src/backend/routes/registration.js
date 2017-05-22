import crypto from 'crypto';
import express from 'express';
import prompt from 'prompt';

import db from '../models/database.js';
import logger from '../utilities/logger.js';

let regInProcess = false;

const router = express.Router();

router.route('/api/registration')
    // serve API registration page
    .get((request, response) => {
        let submissionUrl = `${request.protocol}://${request.hostname}:${process.env.PORT}${request.originalUrl}`;
        return response.status(200)
            .render('regForm', { // render 'serviceStatus.hbs' view
                title: process.env.SYS_REF, // passing data to template
                submissionUrl: submissionUrl // where to send reg request
            });
    })
    // process registration request
    .post((request, response) => {
        if (regInProcess === true) {
            return response.status(502).render('regBusy', { title: process.env.SYS_REF });
        } else {
            regInProcess = true;
            let authorized = process.env.AUTO_AUTHORIZED_SYSTEMS.split(',');
            let reference = request.body.reference;
            let loginId = request.body.loginId;
            let password = request.body.password;
            if (authorized.indexOf(reference) !== -1) {
                // if the applicant is in the authorized list
                registerAccount(db.APIUsers, reference, loginId, password)
                    .then(() => {
                        regInProcess = false;
                        return response.status(200).render('regSuc', {
                            title: process.env.SYS_REF
                        });
                    }).catch((error) => {
                        regInProcess = false;
                        logger.error(`資料庫註冊失敗: ${error}`);
                        return response.status(500).render('regFail', {
                            title: process.env.SYS_REF
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
                        logger.error(`已拒絕${reference}之申請: ${error}`);
                        return response.status(401).render('regFail', { title: process.env.SYS_REF });
                    }
                    registerAccount(db.APIUsers, reference, loginId, password)
                        .then(() => {
                            regInProcess = false;
                            return response.status(200).render('regSuc', { title: process.env.SYS_REF });
                        }).catch((error) => {
                            regInProcess = false;
                            logger.error(`資料庫註冊失敗: ${error}`);
                            return response.status(500).render('regFail', { title: process.env.SYS_REF });
                        });
                });
            }
        }
    });

module.exports = router;

function saltGen(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
}

function sha512(password, salt) {
    let hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    let value = hash.digest('hex');
    return {
        salt: salt,
        passwordHash: value
    };
}

function registerAccount(accountModel, reference, loginId, password) {
    return new Promise((resolve, reject) => {
        let encryptedPasswordData = sha512(password, saltGen(16));
        accountModel.upsert({
            reference: reference,
            loginId: loginId,
            passwordHash: encryptedPasswordData.passwordHash,
            salt: encryptedPasswordData.salt
        }).then(() => {
            resolve();
        }).catch((error) => {
            reject(error);
        });
    });
}
