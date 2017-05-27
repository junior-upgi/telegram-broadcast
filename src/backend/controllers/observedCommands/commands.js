import telegram from '../../utilities/telegramAPI.js';
import registration from './registration.js';

const commandList = [{
    reference: 'register',
    regularExpression: /(^\/start$)|(^\/register$)|(^\/註冊$)/i,
    messageProcessFunction: registration
}, {
    reference: 'test',
    regularExpression: /(^\/test$)|(^\/測試$)/i,
    messageProcessFunction: testFunction
}, {
    reference: 'help',
    regularExpression: /(^\/help$)|(^\/幫助$)|(^\/協助$)/i,
    messageProcessFunction: helpFunction
}];

module.exports = commandList;

function testFunction(message) {
    telegram.sendMessage({
        chat_id: message.chat.id,
        text: 'you\'ve triggered the test function'
    });
}

function helpFunction(message) {
    telegram.sendMessage({
        chat_id: message.chat.id,
        text: 'have you\'ve requested for help???'
    });
    telegram.sendMessage({
        chat_id: message.chat.id,
        text: '/register or /註冊\n     register you to this system\n/test or /測試\n     for testing purpose only\n/help or /幫助 /協助\n     you are looking at the help page'
    });
}
