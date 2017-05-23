module.exports = (args) => {
    if (
        // message originated from a chat group
        (
            (args.update.message.chat.type === 'private') &&
            (args.update.message.from.id !== args.update.message.chat.id)
        ) &&
        // update is a result of a disinvite
        (args.update.message.left_chat_member !== undefined) &&
        // invitation is to the designated bot
        (
            (args.update.message.left_chat_member.id === args.targetBot.id) ||
            (args.update.message.left_chat_member.username === args.targetBot.username)
        )
    )
        return true;
    else
        return false;
};
