import axios from 'axios';
import dotenv from 'dotenv';
import merge from 'lodash/merge';

dotenv.config();

const botAPIUrl = 'https://api.telegram.org/bot';
const adminId = process.env.TELEGRAM_ID;
// const adminUsername = process.env.TELEGRAM_USERNAME;
// const adminName = process.env.TELEGRAM_NAME;
// const adminMobile = process.env.TELEGRAM_MOBILE;
const botId = process.env.BOT_ID;
// const botUsername = process.env.BOT_USERNAME;
// const botFirstName = process.env.BOT_FIRST_NAME;
const botToken = process.env.BOT_TOKEN;

module.exports = {
    getMe: getMe,
    getChat: getChat,
    getUpdates: getUpdates,
    sendMessage: sendMessage,
    messageObject: messageObject,
    admin: {
        id: adminId
    },
    bot: {
        id: botId,
        token: botToken
    }
};


function telegramAPIUrl(token) {
    if (token === undefined) {
        return `${botAPIUrl}${botToken}`;
    } else {
        return `${botAPIUrl}${token}`;
    }
}

function getMe(token) {
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: `${telegramAPIUrl(token)}/getMe`
        }).then((botData) => {
            resolve(botData.data.result);
        }).catch((error) => {
            reject(error.response.data);
        });
    });
}

function getChat(args) {
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: `${telegramAPIUrl(args.token)}/getChat?chat_id=${args.chat_id}`
        }).then((botData) => {
            resolve(botData.data);
        }).catch((error) => {
            reject(error.response.data);
        });
    });
}

function getUpdates(args) {
    let offsetString = args.offset === null ? '' : `?offset=${args.offset + 1}`;
    let updates = null;
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: `${telegramAPIUrl(args.token)}/getUpdates${offsetString}`
        }).then((serverResponse) => {
            updates = serverResponse.data.result;
            // get the bot information on which the updates belongs to
            return getMe(args.token);
        }).then((botInfo) => {
            // add the target bot info to the returned object
            resolve(merge(updates, { targetBotInfo: botInfo }));
        }).catch((error) => {
            reject(error.response.data);
        });
    });
}

function sendMessage(args) {
    return new Promise((resolve, reject) => {
        axios({
            method: 'post',
            url: `${telegramAPIUrl(args.token)}/sendMessage`,
            data: args,
            headers: { 'Content-Type': 'application/json' }
        }).then((serverResponse) => {
            resolve(serverResponse.data.result);
        }).catch((error) => {
            error.response.data.chatObject = args;
            reject(error.response.data);
        });
    });
}

function messageObject(chat_id, text) {
    return {
        chat_id: chat_id,
        text: text,
        parse_mode: 'HTML'
    };
}
