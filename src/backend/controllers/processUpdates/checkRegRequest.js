module.exports = (update) => {
    console.log(update);
    if (
        // private chat to bot
        (update.message.chat.type = 'private') &&
        // a bot command /start message was received
        (
            (
                (
                    (update.message.text !== undefined) &&
                    (update.message.entities !== undefined)
                ) &&
                (
                    (update.message.text === '/start') &&
                    (update.message.entities[0].type === 'bot_command')
                )
            ) ||
            (
                (
                    (update.message.text !== undefined)
                ) &&
                (
                    (update.message.text === '註冊') ||
                    (update.message.text.toLowerCase() === 'register')
                )
            )
        )
    )
        return true;
    else
        return false;
};
