import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';

import db from './models/database.js';
import logger from './utilities/logger.js';
import telegram from './telegram.js';

dotenv.config(); // loads .env file from root of project

const app = express(); // init express app
app.use(cors()); // allowing cross origin requests
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // use json body parser middleware
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

// Handlebars templating engine setup
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, '/../public/layouts'),
    partialsDir: path.join(__dirname, '/../public/partials')
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, '/../public'));
app.set('layouts', path.join(__dirname, '/../public/layouts'));
app.set('partials', path.join(__dirname, '/../public/partials'));

main.use('/', require('./routes/views.js'));
main.use('/', require('./routes/accounts.js'));
main.use('/', require('./routes/token.js'));

db.initialize().then(() => { // initialize database
    app.listen(process.env.PORT, (error) => { // start app
        if (error) {
            logger.error(`${process.env.SYS_REF}啟動程序發生異常: ${error}`);
        }
        logger.info(`${process.env.SYS_REF}系統正確啟動 (${process.env.BASE_URL}:${process.env.PORT})...`);
        telegram.checkRegistration().start();
    });
}).catch((error) => {
    logger.error(`${process.env.SYS_REF} server could not initialize database: ${error}`);
});
