// import axios from 'axios';
import cron from 'node-cron';

import db from './models/database.js';
import logger from './utilities/logger.js';
import arrayFunc from './utilities/arrayfunctions.js';
import messageQueue from './messageQueue.js';
import telegramAPI from './telegramAPI.js';

// process registration information every 60 seconds (production) or 5 seconds (otherwise)
const procRegPeriod = process.env.ENV === 'production' ? '0 */1 * * * *' : '*/5 * * * * *';
// set how frequently to broadcast queued message
const broadcastFrequency = process.env.ENV === 'production' ? '*/10 * * * * *' : '* * * * * *';
// set how many messages to broadcast each time
const broadcastMessageCount = process.env.ENV === 'production' ? 5 : 3;
// variable to track bot chat history update_id
let lastTrackedUpdateId = null;

const processUpdateJob = cron.schedule(procRegPeriod, () => { processUpdates(); }, false);
const broadcastQueuedMessagesJob = cron.schedule(broadcastFrequency, () => {
    let messages = null;
    if (messageQueue.length() > 0) {
        if (messageQueue.length() < broadcastMessageCount) {
            messages = messageQueue.extractAll();
        } else {
            messages = messageQueue.extract(broadcastMessageCount);
        }
        messages.forEach((message) => {
            telegramAPI.sendMessage({
                chat_id: message.chat_id,
                text: message.text,
                parse_mode: 'HTML'
            }).then((message) => {
                return;
            }).catch((error) => {
                if (
                    ( // if bot was blocked
                        (error.error_code === 403) &&
                        (error.description === 'Forbidden: bot was blocked by the user')
                    ) || ( // chat_id is unavailable for some reason
                        (error.error_code === 400) &&
                        (error.description === 'Bad Request: chat not found')
                    )
                ) {
                    logger.error(`${error.error_code}: ${error.description}`);
                    logger.error(`attempting to remove related user/chat information 【${message.chat_id}】`);
                    let actionArray = [];
                    actionArray.push(db.Users.destroy({ where: { id: message.chat_id } }));
                    actionArray.push(db.Chats.destroy({ where: { id: message.chat_id } }));
                    db.Sequelize.Promise.all(actionArray)
                        .then(() => {
                            return;
                        }).catch((error) => {
                            logger.error(`failure to remove related user/chat information 【${message.chat_id}】: ${error}`);
                            return;
                        });
                } else { // other error
                    logger.error(`broadcasting error: ${error}`);
                    console.log(JSON.stringify(message, null, '  '));
                    return;
                }
            });
        });
    }
}, false);

module.exports = {
    scheduledJobs: {
        processUpdates: processUpdateJob,
        broadcast: broadcastQueuedMessagesJob
    },
    processUpdates: processUpdates
};

function processUpdates() {
    let maxUpdateId = null;
    let replyArray = [];
    telegramAPI
        .getUpdates(lastTrackedUpdateId)
        .then((updates) => {
            if (updates.length === 0) { // check if there are available update info to process
                lastTrackedUpdateId = null;
                logger.info('there are no updates available');
                return db.Sequelize.Promise.resolve([]);
            }
            // preserve a copy of the max update_id value in the current updates list
            maxUpdateId = arrayFunc.getObjAttribMaxValue(updates, 'update_id');
            let actionArray = [];
            return db.sequelize.transaction((trx) => { // initiate database transaction
                updates.forEach((update) => {
                    // index'ed update is not processed if update_id is greater
                    if (update.update_id > lastTrackedUpdateId) {
                        if (checkRegRequest(update)) { // check for user registration
                            // construct an object of the intended user data
                            let userData = Object.assign(
                                update.message.from, {
                                    update_id: update.update_id
                                }
                            );
                            // push user registration query into the array
                            actionArray.push(db.Users.upsert(userData, { transaction: trx }));
                            // construct an object of the intended chat data
                            let chatData = Object.assign(
                                update.message.chat, {
                                    update_id: update.update_id
                                }
                            );
                            // push private chat registration query into the array
                            actionArray.push(db.Chats.upsert(Object.assign(chatData), { transaction: trx }));
                            // construct a response object
                            let regReply = {
                                chat_id: chatData.id,
                                text: `you've registered with ${process.env.BOT_FIRST_NAME}`,
                                parse_mode: 'HTML'
                            };
                            // push a response action request into the array
                            replyArray.push(telegramAPI.sendMessage(regReply));
                        } else if (checkGroupInvite(update)) { // check for group invite
                            // construct an object of the intended chat data
                            let chatData = Object.assign(
                                update.message.chat, {
                                    update_id: update.update_id
                                }
                            );
                            // invitation chat type is 'private' for some reason
                            chatData.type = 'group';
                            // push chat group registration query into the array
                            actionArray.push(db.Chats.upsert(chatData, { transaction: trx }));
                            // construct a response object
                            let regReply = {
                                chat_id: chatData.id,
                                text: `hello，${process.env.BOT_FIRST_NAME} is here`,
                                parse_mode: 'HTML'
                            };
                            // push a response action request into the array
                            replyArray.push(telegramAPI.sendMessage(regReply));
                        } else if (checkGroupDisinvite(update)) {
                            // push chat group record removal
                            actionArray.push(db.Chats.destroy({
                                where: { id: update.message.chat.id },
                                transaction: trx
                            }));
                            // construct a response object
                            let regReply = {
                                chat_id: process.env.TELEGRAM_ID,
                                text: `${process.env.BOT_FIRST_NAME} had been removed from ${update.message.chat.title}`,
                                parse_mode: 'HTML'
                            };
                            // push a response action request into the array
                            replyArray.push(telegramAPI.sendMessage(regReply));
                        }
                    }
                });
                return db.Sequelize.Promise.all(actionArray); // run the array of queries
            });
        }).then(() => {
            if (lastTrackedUpdateId === null) {
                // reply broadcast is suppressed when:
                // server's initialization run
                // server recovering from error
                return Promise.resolve([]);
            } else {
                // if all data is written successfully
                // broadcast reply in the array to users or chat groups accordingly
                return db.Sequelize.Promise.all(replyArray);
            }
        }).then((replyResults) => {
            console.log(JSON.stringify(replyResults, null, '  '));
            // update the last tracked Id value to the MAX of current list of updates
            lastTrackedUpdateId = maxUpdateId;
            //     logger.info(`last tracked update_id: ${lastTrackedUpdateId}`);
        }).catch((error) => {
            // if unsuccessful, reset the tracked id and display error
            lastTrackedUpdateId = null;
            logger.error(`registration failure: ${error}`);
        });
}

function checkGroupInvite(update) {
    if (
        // message originated from a chat group
        (
            (update.message.chat.type === 'private') &&
            (update.message.from.id !== update.message.chat.id)
        ) &&
        // update is a result of a invitation
        (update.message.new_chat_member !== undefined) &&
        // invitation is to the designated bot
        (
            (update.message.new_chat_member.id === parseInt(process.env.BOT_ID)) ||
            (update.message.new_chat_member.username === process.env.BOT_USERNAME)
        )
    )
        return true;
    else
        return false;
}

function checkGroupDisinvite(update) {
    if (
        // message originated from a chat group
        (
            (update.message.chat.type === 'private') &&
            (update.message.from.id !== update.message.chat.id)
        ) &&
        // update is a result of a disinvite
        (update.message.left_chat_member !== undefined) &&
        // invitation is to the designated bot
        (
            (update.message.left_chat_member.id === parseInt(process.env.BOT_ID)) ||
            (update.message.left_chat_member.username === process.env.BOT_USERNAME)
        )
    )
        return true;
    else
        return false;
}

function checkRegRequest(update) {
    if (
        // private chat to bot
        (update.message.chat.type = 'private') &&
        // a bot command /start message was received
        (
            (update.message.text !== undefined) &&
            (update.message.entities !== undefined)
        ) && (
            (update.message.text === '/start') &&
            (update.message.entities[0].type === 'bot_command')
        )
    )
        return true;
    else
        return false;
}
