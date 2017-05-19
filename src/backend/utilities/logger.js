import fs from 'fs';
import moment from 'moment-timezone';
import winston from 'winston';

const loggingDirectory = 'logs';

if (!fs.existsSync(loggingDirectory)) { // create if logging directory does not exist
    fs.mkdirSync(loggingDirectory);
}

const logger = new(winston.Logger)({
    transports: [
        // colorize the output to the console
        new(winston.transports.Console)({
            timestamp: () => moment().format('YYYY-MM-DD HH:mm:ss'),
            colorize: true,
            level: 'silly'
        }),
        new(winston.transports.File)({
            filename: `${loggingDirectory}/serverOperation.log`,
            timestamp: () => moment().format('YYYY-MM-DD HH:mm:ss'),
            level: process.env.ENV === 'production' ? 'info' : 'silly'
        })
    ]
});

module.exports = logger;
