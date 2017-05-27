import db from '../database.js';
import telegram from '../../utilities/telegramAPI.js';

module.exports = (message) => {
    console.log(JSON.stringify(message, null, '  '));
    if (message.chat.type === 'private') {
        let actionArray = [];
        let userData = message.from;
        let chatData = message.chat;
        // to avoid problems with ORM soft-deleted records
        // basically this restores a soft-deleted record, if exists, otherwise create
        userData.deletedAt = null;
        chatData.deletedAt = null;
        // push user and private chat registration queries into the array
        db.sequelize.transaction((trx) => {
            actionArray.push(db.Users.upsert(userData, { transaction: trx }));
            actionArray.push(db.Chats.upsert(chatData, { transaction: trx }));
            return db.Sequelize.Promise.all(actionArray);
        }).then(() => {
            return telegram.sendMessage({
                chat_id: chatData.id,
                text: `you've registered with ${telegram.name()}`
            });
        }).catch((error) => {
            console.log('could not complete user registration');
            console.log(JSON.stringify(message, null, '  '));
        });
    } else { // if the command was not issued in a 'private' chat, such as a 'group'
        let reply = {
            chat_id: message.chat.id,
            text: `you can only /register with ${telegram.name()} in a private conversation`,
            reply_to_message_id: message.message_id
        };
        telegram.sendMessage(reply)
            .catch((error) => {
                console.log(JSON.stringify(error, null, '  '));
            });
    }
};
