import merge from 'lodash/merge';

import db from '../controllers/database.js';
import errorHandler from '../utilities/errorHandler.js';
import logger from '../utilities/logger.js';
import eVars from '../config/environment.js';
import messageQueue from './messageQueue.js';
import telegramAPI from '../utilities/telegramAPI.js';

// set how many messages are processed to broadcast for each cycle
const PROCESSED_PER_CYCLE = eVars.ENV === 'production' ? 40 : 10;

module.exports = () => {
    let stagedMessages = null;
    let broadcastRequests = [];
    if (messageQueue.length() > 0) {
        if (messageQueue.length() < PROCESSED_PER_CYCLE) {
            stagedMessages = messageQueue.extractAll();
        } else {
            stagedMessages = messageQueue.extract(PROCESSED_PER_CYCLE);
        }
        stagedMessages.forEach((messageObject) => {
            broadcastRequests.push(
                telegramAPI.sendMessage(messageObject)
                .then((broadcastedMessage) => {
                    return Promise.resolve(broadcastedMessage);
                }).catch((error) => {
                    return Promise.reject(merge(error, messageObject));
                })
            );
        });
        Promise.all(broadcastRequests)
            .then((broadcastedMessages) => {
                console.log('---------------------------------------------');
                broadcastedMessages.forEach((message) => {
                    console.log(JSON.stringify(message, null, '  '));
                    console.log('---------------------------------------------');
                });
            }).catch((error) => {
                if (blockedOrMissing(error)) { // bot is blocked by user or the user is unavailable
                    errorHandler.handler(
                        errorHandler.object(
                            'broadcast.js',
                            'telegramAPI.sendMessage()',
                            `system had been blocked, or the user is unavailable...${'\n'}attempting to remove related user/chat information`,
                            error
                        )
                    );
                    let actionArray = [];
                    actionArray.push(db.Users.destroy({ where: { id: error.chat_id } }));
                    actionArray.push(db.Chats.destroy({ where: { id: error.chat_id } }));
                    db.Sequelize.Promise.all(actionArray)
                        .then(() => {
                            logger.warn('problematic users/chats removed successfully');
                            telegramAPI.sendMessage(
                                telegramAPI.messageObject(
                                    telegramAPI.admin.id,
                                    'problematic users/chats removed successfully'
                                )
                            );
                        }).catch((error) => {
                            errorHandler.handler(
                                errorHandler.object(
                                    'broadcast.js',
                                    'telegramAPI.db.Users/Chats.destroy()',
                                    'failure to remove related user/chat information',
                                    error
                                )
                            );
                        });
                } else { // other error
                    errorHandler.handler(
                        errorHandler.object(
                            'broadcast.js',
                            'telegramAPI.sendMessage()',
                            'broadcasting error',
                            error
                        )
                    );
                }
            });
    }
};

function blockedOrMissing(error) {
    if (
        ( // if bot was blocked
            (error.error_code === 403) &&
            (error.description === 'Forbidden: bot was blocked by the user')
        ) || ( // chat_id is unavailable for some reason
            (error.error_code === 400) &&
            (error.description === 'Bad Request: chat not found')
        )
    ) {
        return true;
    } else {
        return false;
    }
}
