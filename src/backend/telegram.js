import axios from 'axios';
import cron from 'node-cron';

import db from './models/database.js';
import logger from './utilities/logger.js';

const botAPIUrl = 'https://api.telegram.org/bot';
const procRegPeriod = process.env.ENV === 'production' ? '0 */1 * * * *' : '*/5 * * * * *'; // process registration information every 60 seconds (production) or 5 seconds (otherwise)
let lastTrackedUpdateId = null; // variable to track bot chat history

module.exports = {
    scheduledUpdateProcessing: cron.schedule(procRegPeriod, () => { processUpdates(); }, false),
    processUpdates: processUpdates,
    getMe: getMe,
    getUpdates: getUpdates
};

function processUpdates() {
    getUpdates()
        .then((updates) => {
            if (updates.length === 0) { // check if there are available update info to process
                lastTrackedUpdateId = null;
                return logger.info(`last tracked update_id: ${lastTrackedUpdateId}`);
            }
            let filteredUpdates = null;
            if (lastTrackedUpdateId === null) { // check all updates
                filteredUpdates = updates.filter((update) => {
                    return (
                        ( // filter out messages that does not say 'register' in eng or chi
                            (update.message.text === '註冊') ||
                            (update.message.text.toLowerCase() === 'register')
                        ) &&
                        // filter out messages sent through chat rooms
                        (update.message.from.id === update.message.chat.id)
                    );
                });
            } else { // check only for newer updates
                filteredUpdates = updates.filter((update) => {
                    return (
                        // filter out older messages
                        (update.update_id > lastTrackedUpdateId) &&
                        ( // filter out messages that does not say 'register' in eng or chi
                            (update.message.text === '註冊') ||
                            (update.message.text.toLowerCase() === 'register')
                        ) &&
                        // filter out messages sent through chat rooms
                        (update.message.from.id === update.message.chat.id)
                    );
                });
            }
            // still updates to be checked after filtering
            if (filteredUpdates.length > 0) {
                db.sequelize.transaction((trx) => { // initiate database transaction
                    let upsertArray = [];
                    // create an update-or-insert query for each entry
                    filteredUpdates.forEach((update) => {
                        upsertArray.push(db.Users.upsert(update.message.from, { transaction: trx }));
                    });
                    return db.Sequelize.Promise.all(upsertArray); // run the array of queries
                }).then(() => {
                    // update the last tracked Id value
                    lastTrackedUpdateId = Math.max(...updates.map((update) => {
                        return update.update_id;
                    }));
                    logger.info(`last tracked update_id: ${lastTrackedUpdateId}`);
                }).catch((error) => {
                    // if unsuccessful, reset the tracked id and display error
                    lastTrackedUpdateId = null;
                    logger.info(`last tracked update_id: ${lastTrackedUpdateId}`);
                    logger.error(`registration failure: ${error}`);
                });
            } else {
                // no updates was found
                logger.info(`last tracked update_id: ${lastTrackedUpdateId}`);
            }
        }).catch((error) => {
            // if unsuccessful, reset the tracked id and display error
            lastTrackedUpdateId = null;
            logger.error(`registration failure: ${error}`);
        });
}

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
