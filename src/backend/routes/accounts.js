import express from 'express';
import md5 from 'md5';
import prompt from 'prompt';

import db from '../models/database.js';
import logger from '../utilities/logger.js';

let regInProcess = false;

const router = express.Router();

router.post('/regReq', (request, response) => {
    if (regInProcess === true) {
        return response.status(502).render('regBusy', { title: process.env.SYS_REF });
    } else {
        regInProcess = true;
        let reference = request.body.reference;
        let loginId = request.body.loginId;
        let password = request.body.password;
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
            db.Authorizations.create({
                loginId: loginId,
                password: md5(password),
                reference: reference
            }).then(() => {
                return response.status(200).render('regSuc', { title: process.env.SYS_REF });
            }).catch((error) => {
                logger.error(`資料庫註冊失敗: ${error}`);
                return response.status(500).render('regFail', { title: process.env.SYS_REF });
            }).finally(() => {
                regInProcess = false;
            });
        });
    }
});

module.exports = router;
