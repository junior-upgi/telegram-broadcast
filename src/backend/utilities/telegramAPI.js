import merge from 'lodash/merge';
import Promise from 'bluebird';
import Tgfancy from 'tgfancy';

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

    name() {
        return this.first_name;
    }

    getId() {
        return this.id;
    }

    getUpdates(options) {
        return this.bot.getUpdates();
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
    editMessage(args) {
        return this.bot.editMessageText(args.text, args);
    }

    // add a event listener to expect a certain mssage to receive a reply
    expectReply(args) {
        return this.bot.onReplyToMessage(args.chat_id, args.message_id, args.callback);
    }

    // remove the listener to message replies
    quitListeningToReply(replyListenerId) {
        return this.bot.removeReplyListener(replyListenerId);
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

    observeEvents(args) {
        return new Promise((resolve, reject) => {
            args.forEach((arg) => {
                this.bot.on(arg.event, (message) => {
                    arg.messageProcessFunction(message);
                });
            });
            resolve({
                success: true,
                message: 'bot events are observed'
            });
        });
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
