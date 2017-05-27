import dotenv from 'dotenv';

dotenv.config();

const masterAccount = {
    id: process.env.TELEGRAM_ID,
    userName: process.env.TELEGRAM_USERNAME,
    firstName: process.env.TELEGRAM_FIRST_NAME,
    lastName: process.env.TELEGRAM_LAST_NAME,
    mobile: process.env.TELEGRAM_MOBILE
};

const defaultBot = {
    token: process.env.BOT_TOKEN
};

const defaultPollingOptions = {
    interval: 300,
    autoStart: false,
    params: {
        offset: null,
        limit: 100,
        timeout: 10,
        allow_updates: [
            'message',
            'edited_message',
            'channel_post',
            'edited_channel_post',
            'inline_query',
            'chosen_inline_result',
            'callback_query',
            'shipping_query',
            'pre_checkout_query'
        ]
    }
};

module.exports = {
    masterAccount: masterAccount,
    defaultBot: defaultBot,
    defaultPollingOptions: defaultPollingOptions
};
