import db from '../database.js';
import max from 'lodash/max';
import maxBy from 'lodash/maxBy';
import merge from 'lodash/merge';

// utilities
import errorHandler from '../../utilities/errorHandler.js';
import logger from '../../utilities/logger.js';
import telegramAPI from '../../utilities/telegramAPI.js';

// update type checking functions
import checkGroupInvite from './checkGroupInvite.js';
import checkGroupDisinvite from './checkGroupDisinvite.js';
import checkRegRequest from './checkRegRequest.js';

// variable to track bot chat history update_id
let lastTrackedUpdateId = null;

// initialize the lastTrackedUpdateId value
function initialize() {
    return db.Sequelize.Promise.all([
        db.Chats.max('update_id'),
        db.Users.max('update_id')
    ]).then((maxValues) => {
        let maxValue = max(maxValues);
        if (maxValue === undefined) {
            lastTrackedUpdateId = null;
        } else {
            lastTrackedUpdateId = maxValue;
        }
        return db.Sequelize.Promise.resolve('processUpdate.js module initialized...');
    }).catch((error) => {
        lastTrackedUpdateId = null;
        return db.Sequelize.Promise.reject(
            errorHandler.object(
                'processUpdates.js',
                'initialize()',
                'module initialization failure',
                error
            )
        );
    });
}

// perform process update
function perform() {
    let maxUpdateId = null; // used to record the max update_id of the current batch
    let actionArray = []; // holds a list of query actions to be performed
    let replyArray = []; // holds a list of response actions to be performed
    return telegramAPI.getUpdates({
        offset: lastTrackedUpdateId
    }).then((updates) => {
        let targetBotName = updates.targetBotInfo.first_name;
        // check if there are available update info to process
        if (updates.length === 0) {
            logger.info('there are no updates available');
            return db.Sequelize.Promise.resolve([]);
        }
        // record the max update_id value in the current updates list
        maxUpdateId = maxBy(updates, 'update_id').update_id;
        return db.sequelize.transaction((trx) => { // initiate database transaction
            updates.forEach((update) => {
                // check to evaluate the update only if the update_id is greater
                if (update.update_id > lastTrackedUpdateId) {
                    if (checkRegRequest(update)) { // check for user registration
                        // construct an user and chat record object, pay attention to the 'deletedAt' attribute
                        let userData = merge(update.message.from, { update_id: update.update_id, deletedAt: null });
                        let chatData = merge(update.message.chat, { update_id: update.update_id, deletedAt: null });
                        // push user and private chat registration queries into the array
                        actionArray.push(db.Users.upsert(userData, { transaction: trx }));
                        actionArray.push(db.Chats.upsert(chatData, { transaction: trx }));
                        // push a response action request into the array
                        replyArray.push(telegramAPI.sendMessage(
                            telegramAPI.messageObject(chatData.id, `you've registered with ${targetBotName}`)
                        ));
                    } else if (checkGroupInvite({
                            update: update,
                            targetBot: updates.targetBotInfo
                        })) { // check for group invite
                        // create a chat record object, pay attention to the 'deletedAt' attribute
                        let chatData = merge(update.message.chat, { update_id: update.update_id, deletedAt: null });
                        // invitation chat type is 'private' for some reason
                        chatData.type = 'group';
                        // push chat group registration query into the array
                        actionArray.push(db.Chats.upsert(chatData, { transaction: trx }));
                        // push a response action request into the array
                        replyArray.push(telegramAPI.sendMessage(
                            telegramAPI.messageObject(chatData.id, `hello, ${targetBotName} is here`)
                        ));
                    } else if (checkGroupDisinvite({
                            update: update,
                            targetBot: updates.targetBotInfo
                        })) { // check for group disinvite
                        // push chat group record removal
                        let filter = { where: { id: update.message.chat.id }, transaction: trx };
                        actionArray.push(db.Chats.destroy(filter));
                        // push a response action request into the array
                        replyArray.push(telegramAPI.sendMessage(
                            telegramAPI.messageObject(
                                process.env.TELEGRAM_ID,
                                `${targetBotName} had been removed from ${update.message.chat.title} 群組`
                            )
                        ));
                    }
                }
            });
            // run the array of query actions
            return db.Sequelize.Promise.all(actionArray);
        }).catch((error) => {
            return db.Sequelize.Promise.reject(
                errorHandler.object(
                    'processUpdates.js',
                    'perform()',
                    'transaction failure',
                    error
                )
            );
        });
    }).then(() => {
        // run the array of reply actions
        return db.Sequelize.Promise.all(replyArray);
    }).then(() => {
        // update the last tracked Id value to the MAX of current list of updates
        lastTrackedUpdateId = maxUpdateId;
        return db.Sequelize.Promise.resolve('update information had been processed...');
    }).catch((error) => {
        if (errorHandler.processed(error)) {
            return db.Sequelize.Promise.reject(error);
        } else {
            return db.Sequelize.Promise.reject(
                errorHandler.object(
                    'processUpdates.js',
                    'perform()',
                    'update information processing failure',
                    error
                )
            );
        }
    });
}

module.exports = {
    initialize: initialize,
    perform: perform
};
