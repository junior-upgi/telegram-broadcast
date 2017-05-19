import axios from 'axios';
import dotenv from 'dotenv';
import cron from 'node-cron';

import db from './models/database.js';
import logger from './utilities/logger.js';

dotenv.config();

const botAPIUrl = 'https://api.telegram.org/bot';
const procRegPeriod = '*/30 * * * * *'; // perform registration information every 30 seconds
let lastTrackedUpdateId = null; // variable to track bot chat history

module.exports = {
    checkRegistration: checkRegistration,
    getMe: getMe,
    getUpdates: getUpdates
};

function getMe() {
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: `${botAPIUrl}${process.env.BOT_TOKEN}/getMe`
        }).then((botData) => {
            resolve(botData.data.result);
        }).catch((error) => {
            reject(error);
        });
    });
}

function getUpdates() { // get bot chat history
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: `${botAPIUrl}${process.env.BOT_TOKEN}/getUpdates`
        }).then((updates) => {
            resolve(updates.data.result);
        }).catch((error) => {
            reject(error);
        });
    });
}

function checkRegistration() {
    return cron.schedule(procRegPeriod, () => {
        let filteredUpdates = null;
        getUpdates().then((updates) => { // grab the update data
            filteredUpdates = updates.filter((update) => {
                if (lastTrackedUpdateId !== null) {
                    return (
                        // filter out updates already processed
                        (update.update_id > lastTrackedUpdateId) &&
                        ( // filter out message does not say '註冊' or 'register'
                            (update.message.text === '註冊') ||
                            (update.message.text === 'register')
                        ) &&
                        // filter out message from chat rooms (not equal to user id)
                        (update.message.from.id === update.message.chat.id)
                    );
                } else {
                    return (
                        ( // filter out message does not say '註冊' or 'register'
                            (update.message.text === '註冊') ||
                            (update.message.text === 'register')
                        ) &&
                        // filter out message from chat rooms (not equal to user id)
                        (update.message.from.id === update.message.chat.id)
                    );
                }
            });
            // still updates to be checked after filtering
            if (filteredUpdates.length > 0) {
                db.sequelize.transaction((trx) => { // initiate database transaction
                    let upsertArray = [];
                    filteredUpdates.forEach((update) => {
                        // add a update-or-insert query into the array
                        upsertArray.push(db.Users.upsert(update.from, { transaction: trx }));
                    });
                    return Promise.all(upsertArray); // run the array of queries
                }).then(() => {
                    // if successfully executed, update the tracked Id
                    lastTrackedUpdateId = Math.max(...updates.map((update) => {
                        return update.update_id;
                    }));
                    logger.info(`registration info processed (lastTrackedUpdateId: ${lastTrackedUpdateId})...`);
                }).catch((error) => {
                    // if unsuccessful, reset the tracked id and display error
                    lastTrackedUpdateId = null;
                    logger.error(`registration failure: ${error}`);
                });
            }
        });
    }, false);
}
