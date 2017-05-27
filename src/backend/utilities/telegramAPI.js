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

    initialize(offset) {
        if ((offset !== undefined) && (Number.isInteger(offset))) {
            this.pollingOptions.params.offset = offset;
        }
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

    observe(args) {
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

    sendMessage(args) {
        console.log(args);
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
