import merge from 'lodash/merge';

import db from '../database.js';
import telegram from '../../utilities/telegramAPI.js';
import telegramConfig from '../../config/telegramAPI.js';

const eventList = [{
    // when someone joins the group
    reference: 'invited',
    event: 'new_chat_participant', // name of the event fired
    messageProcessFunction: regChatInfo // function to call
}, {
    // when someone leaves or was kicked from the group
    reference: 'disinvited',
    event: 'left_chat_participant', // name of the event fired
    messageProcessFunction: unregChatInfo // function to call
}];

module.exports = eventList;

// run this function when the 'new_chat_participant' event is fired
function regChatInfo(message) {
    if (
        (message.chat.type === 'group') && // make sure the event originated from a group
        (message.new_chat_participant.id === telegram.getId()) // the event is about the default bot
    ) {
        // register the chat group info in the database
        // pay attention to the deletedAt field, to avoid problems with soft-deleted records
        db.Chats.upsert(merge(message.chat, { deletedAt: null }))
            .then(() => {
                // send a greeting message
                telegram.sendMessage({
                    chat_id: message.chat.id,
                    text: `hello, ${telegram.name()} is here`
                });
            }).catch((error) => {
                console.log('an error had occured');
                console.log(JSON.stringify(error, null, '  '));
            });
    }
}

// run this function when the 'left_chat_participant' event is fired
function unregChatInfo(message) {
    if (
        (message.chat.type === 'group') && // make sure the event originated from a group
        (message.left_chat_participant.id === telegram.getId()) // the event is about the default bot
    ) {
        // remove registered info about this chat group
        db.Chats.destroy({ where: { id: message.chat.id } })
            .then(() => {
                // send a message to inform the admin
                telegram.sendMessage({
                    chat_id: telegramConfig.masterAccount.id,
                    text: `${telegram.name()} has been removed from ${message.chat.title} group`
                });
            }).catch((error) => {
                console.log('an error had occured');
                console.log(JSON.stringify(error, null, '  '));
            });
    }
}
