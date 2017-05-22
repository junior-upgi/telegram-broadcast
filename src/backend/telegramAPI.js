import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const botAPIUrl = 'https://api.telegram.org/bot';

module.exports = {
    getMe: getMe,
    getChat: getChat,
    getUpdates: getUpdates,
    sendMessage: sendMessage
};

function getMe() {
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: `${botAPIUrl}${process.env.BOT_TOKEN}/getMe`
        }).then((botData) => {
            resolve(botData.data);
        }).catch((error) => {
            reject(error.response.data);
        });
    });
}

function getChat(chat_id) {
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: `${botAPIUrl}${process.env.BOT_TOKEN}/getChat?chat_id=${chat_id}`
        }).then((botData) => {
            resolve(botData.data);
        }).catch((error) => {
            reject(error.response.data);
        });
    });
}

function getUpdates(offset) {
    let offsetString = offset === null ? '' : `?offset=${offset + 1}`;
    return new Promise((resolve, reject) => {
        axios({
            method: 'get',
            url: `${botAPIUrl}${process.env.BOT_TOKEN}/getUpdates${offsetString}`
        }).then((updates) => {
            resolve(updates.data.result);
        }).catch((error) => {
            reject(error.response.data);
        });
    });
}

function sendMessage(chatObject) {
    return new Promise((resolve, reject) => {
        axios({
            method: 'post',
            url: `${botAPIUrl}${process.env.BOT_TOKEN}/sendMessage`,
            data: chatObject,
            headers: { 'Content-Type': 'application/json' }
        }).then((serverResponse) => {
            resolve(serverResponse.data.result);
        }).catch((error) => {
            error.response.data.chatObject = chatObject;
            reject(error.response.data);
        });
    });
}
