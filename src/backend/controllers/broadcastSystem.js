// import merge from 'lodash/merge';
import Promise from 'bluebird';
import cron from 'node-cron';

import eVars from '../config/environment.js';
import telegram from '../utilities/telegramAPI.js';
import telegramConfig from '../config/telegramAPI.js';
import db from '../controllers/database.js';

// constants for cron scheduling
// const PER_MINUTE = '0 * * * * *';
// const THIRTY_SECONDS = '*/30 * * * * *';
// const TEN_SECONDS = '*/10 * * * * *';
const FIVE_SECONDS = '*/5 * * * * *';
const PER_SECOND = '* * * * * *';

// how often to broadcast messages
const BROADCAST_FREQUENCY = eVars.ENV === 'production' ? FIVE_SECONDS : PER_SECOND;

// set how many messages are processed to broadcast for each cycle
const MESSAGES_PER_CYCLE = eVars.ENV === 'production' ? 40 : 20;

class BroadcastSystem {
    constructor(messagesPerCycle, broadcastFrequency) {
        this.messageQueue = [];
        this.job = cron.schedule(broadcastFrequency, () => {
            // perceed only if there are messages queued for broadcasting
            if (this.messageQueue.length > 0) {
                // loop through designated cycles and perform broadcast actions
                let performedCycles = 0;
                while (
                    (performedCycles < messagesPerCycle) &&
                    (performedCycles < this.messageQueue.length)
                ) {
                    let currentMessage = this.messageQueue[performedCycles];
                    let sendMessageAction = telegram.sendMessage(currentMessage);
                    performedCycles++;
                    sendMessageAction
                        .then((sentMessage) => {
                            console.log(JSON.stringify(sentMessage, null, '  '));
                        }).catch((error) => {
                            console.log(JSON.stringify(error, null, '  '));
                            if (blockedOrMissing(error)) {
                                // broadcast failure is caused by unavailability or voluntary user block
                                unregisterUser(currentMessage.chat_id)
                                    .then(() => {
                                        let messagePartA = `user ${currentMessage.chat_id} HAS BEEN unregistered`;
                                        let messagePartB = 'due to either unavailability or had this bot blocked';
                                        return telegram.sendMessage({
                                            chat_id: telegramConfig.masterAccount.id,
                                            text: `${messagePartA} ${messagePartB}`
                                        });
                                    }).then((sentMessage) => {
                                        console.log(JSON.stringify(sentMessage, null, '  '));
                                    }).catch((error) => {
                                        console.log('error occured while broadcasting');
                                        console.log(JSON.stringify(error, null, '  '));
                                    });
                            } else {
                                console.log('error occured while broadcasting');
                                console.log(JSON.stringify(error, null, '  '));
                            }
                        });
                }
                this.messageQueue.splice(0, performedCycles);
            }
        }, false);
    }

    initialize() {
        return new Promise((resolve, reject) => {
            this.job.start();
            resolve({
                success: true,
                message: 'broadcast system initialized'
            });
        });
    }
    queueMessage(messageObject) {
        this.messageQueue.push(messageObject);
    }
    queueMessages(messageObjectList) {
        this.messageQueue = this.messageQueue.concat(messageObjectList);
    }
}

const broadcastSystem = new BroadcastSystem(MESSAGES_PER_CYCLE, BROADCAST_FREQUENCY);

module.exports = broadcastSystem;

function unregisterUser(id, transactionHandle) {
    let actionArray = [];
    // initiate database transcation
    return db.sequelize.transaction((trx) => {
        let filter = { where: { id: id }, transaction: trx };
        // delete user if exist
        actionArray.push(db.Users.destroy(filter));
        // delete chat if exist
        actionArray.push(db.Chats.destroy(filter));
        return Promise.all(actionArray);
    });
}

function blockedOrMissing(error) {
    if (
        ( // if bot was blocked
            (error.response.body.error_code === 403) &&
            (error.response.body.description === 'Forbidden: bot was blocked by the user')
        ) || ( // chat_id is unavailable for some reason
            (error.response.body.error_code === 400) &&
            (error.response.body.description === 'Bad Request: chat not found')
        )
    ) {
        return true;
    } else {
        return false;
    }
}
