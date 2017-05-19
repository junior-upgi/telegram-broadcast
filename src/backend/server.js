import dotenv from 'dotenv';
import express from 'express';

import logger from './utilities/logger.js';

dotenv.config(); // loads .env file from root of project

const app = express(); // init express app
const main = express.Router(); // init express routing system
app.use(`/${process.env.SYS_REF}`, main); // adds system reference name to the endpoint paths globally

// default routing error handlers
if (process.env.ENV === 'development') {
    app.use((error, request, response, next) => {
        logger.error('DEFAULT DEVELOPMENT ERROR HANDLER MIDDLEWARE TRIGGERED');
        response.status(error.status || 500);
        response.json({
            message: error.message,
            error: error
        });
    });
}
if (process.env.ENV === 'production') {
    app.use((error, request, response, next) => {
        response.status(error.status || 500);
        response.json({
            message: error.message,
            error: {}
        });
    });
}

app.listen(process.env.PORT, (error) => { // start app
    if (error) {
        logger.error(`${process.env.SYS_REF}啟動程序發生異常: ${error}`);
    }
    logger.info(`${process.env.SYS_REF}系統正確啟動 (${process.env.BASE_URL}:${process.env.PORT})...`);
});
