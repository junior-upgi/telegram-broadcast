import merge from 'lodash/merge';
import Promise from 'bluebird';
import Tgfancy from 'tgfancy';

import db from '../controllers/database.js';
import config from '../config/telegramAPI.js';

export class TelegramBot {
    constructor(botToken, pollingOptions) {
        this.bot = null;
        this.token = botToken;
        this.pollingOptions = pollingOptions;
    }

    initialize() {
        return new Promise((resolve, reject) => {
            this.bot = new Tgfancy(this.token, {
                polling: this.pollingOptions,
                tgfancy: {
                    orderedSending: true
                }
            });
            this.bot.getMe()
                .then((botInfo) => {
                    this.id = botInfo.id;
                    this.username = botInfo.username;
                    this.first_name = botInfo.first_name;
                    resolve({
                        success: true,
                        message: 'telegram bot initialized successfully'
                    });
                }).catch((error) => {
                    reject({
                        success: false,
                        message: 'unable to find the default bot info',
                        error: error
                    });
                });
        });
    }

    polling() {
        return new Promise((resolve, reject) => {
            this.bot.startPolling()
                .then(() => {
                    resolve({
                        success: true,
                        message: `${this.first_name} polling has been initiated`
                    });
                }).catch((error) => {
                    reject({
                        success: false,
                        message: `failure to start ${this.first_name} polling`,
                        error: error
                    });
                });
        });
    }

    getUpdates(options) {
        return this.bot.getUpdates();
    }

    name() {
        return this.first_name;
    }

    expectReply(args) {
        return this.bot.onReplyToMessage(args.chat_id, args.message_id, args.callback);
    }

    quitListeningToReply(replyListenerId) {
        return this.bot.removeReplyListener(replyListenerId);
    }

    editMessage(args) {
        return this.bot.editMessageText(args.text, args);
    }

    observeCommands(args) {
        return new Promise((resolve, reject) => {
            args.forEach((arg) => {
                this.bot.onText(arg.regularExpression, (message) => {
                    arg.messageProcessFunction(message);
                });
            });
            resolve({
                success: true,
                message: 'bot commands are observed'
            });
        });
    }

    // TODO refactor this to the controllers section
    observeEvents() {
        return new Promise((resolve, reject) => {
            // this event is fired when someone joins the group
            this.bot.on('new_chat_participant', (message) => {
                if (
                    (message.chat.type === 'group') &&
                    (message.new_chat_participant.id === this.id)
                ) {
                    db.Chats.upsert(merge(message.chat, { deletedAt: null }))
                        .then(() => {
                            this.sendMessage({
                                chat_id: message.chat.id,
                                text: `hello, ${this.first_name} is here`
                            });
                        }).catch((error) => {
                            console.log('an error had occured');
                            console.log(JSON.stringify(error, null, '  '));
                        });
                }
            });
            // this event is fired when someone leaves or was kicked from the group
            this.bot.on('left_chat_participant', (message) => {
                console.log(JSON.stringify(message, null, '  '));
                if (
                    (message.chat.type === 'group') &&
                    (message.left_chat_participant.id === this.id)
                ) {
                    db.Chats.destroy({ where: { id: message.chat.id } })
                        .then(() => {
                            this.sendMessage({
                                chat_id: config.masterAccount.id,
                                text: `${this.first_name} has been removed from ${message.chat.title} group`
                            });
                        }).catch((error) => {
                            console.log('an error had occured');
                            console.log(JSON.stringify(error, null, '  '));
                        });
                }
            });
            resolve({
                success: true,
                message: 'bot events are observed'
            });
        });
    }

    sendMessage(args) {
        return this.bot.sendMessage(
            args.chat_id,
            args.text,
            merge(args, {
                parse_mode: 'HTML'
            })
        );
    }
}

const defaultBot = new TelegramBot(config.defaultBot.token, config.defaultPollingOptions);

export default defaultBot;

export function blockedOrUnavailable(error) {
    let errorCode = error.response.body.error_code;
    let description = error.response.body.description;
    if (
        ( // if bot was blocked
            (errorCode === 403) &&
            (description === 'Forbidden: bot was blocked by the user')
        ) || ( // chat_id is unavailable for some reason
            (errorCode === 400) &&
            (description === 'Bad Request: chat not found')
        )
    ) {
        return true;
    } else {
        return false;
    }
}
