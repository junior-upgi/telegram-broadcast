import logger from '../utilities/logger.js';
import telegramAPI from '../utilities/telegramAPI.js';

import eVars from '../config/environment.js';

module.exports = {
    handler: errorHandler,
    object: errorObject,
    processed: processed,
    fullHandler: fullErrorHandler
};

function errorHandler(args) {
    logger.error('error object content');
    console.log(JSON.stringify(args, null, '  '));
    telegramAPI.sendMessage(
        telegramAPI.messageObject(
            telegramAPI.admin.id,
            `${eVars.SYS_REF} encountered error:${'\n'}${JSON.stringify(args, null, '  ')}`
        )
    );
    return;
}

function errorObject(moduleName, functionName, message, error) {
    return {
        module: moduleName,
        function: functionName,
        message: message,
        error: error
    };
}

function processed(error) {
    if (error) {
        if ((error.module) && (error.function) && (error.message)) {
            return true;
        }
    }
    return false;
}

function fullErrorHandler(args) {
    if (args.error) {
        if ((args.error.module) && (args.error.function) && (args.error.message)) {
            errorHandler(args.error);
        }
    }
    let errorObject = errorObject(args.module, args.function, args.message, args.error);
    errorHandler(errorObject);
}
