import logger from '../utilities/logger.js';

import eVars from '../config/environment.js';
import telegramAPI from '../utilities/telegramAPI.js';

module.exports = {
    handler: errorHandler,
    object: errorObject,
    processed: processed,
    fullHandler: fullErrorHandler
};

function errorHandler(errorObject) {
    // console output
    logger.error('error object content');
    console.log(JSON.stringify(errorObject, null, '  '));
    // admin mobile alert through telegram
    telegramAPI.sendMessage(
        telegramAPI.admin.id,
        `${eVars.SYS_REF} encountered error:${'\n'}${JSON.stringify(errorObject, null, '  ')}`
    );
    return;
}

// wrap error information in a standard object
function errorObject(moduleName, functionName, message, error) {
    return {
        module: moduleName,
        function: functionName,
        message: message,
        error: error
    };
}

// verify if the error argument is already a prepared error object
function processed(error) {
    if (error) {
        if ((error.module) && (error.function) && (error.message)) {
            return true;
        }
    }
    return false;
}

// check the args.error to see if it's already a prepared error object
// otherwise handle the error information from scratch
function fullErrorHandler(args) {
    if (args.error) {
        if ((args.error.module) && (args.error.function) && (args.error.message)) {
            errorHandler(args.error);
        }
    }
    errorHandler(errorObject(args.module, args.function, args.message, args.error));
}
