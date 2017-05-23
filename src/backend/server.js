import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';

// modules
import db from './controllers/database.js';
import controller from './controllers/controller.js';
import errorHandler from './utilities/errorHandler.js';
import eVars from './config/environment.js';
import logger from './utilities/logger.js';

// middlewares
import preset404 from './middleware/preprocessing/preset404.js';
import unsupportedMethods from './middleware/preprocessing/unsupportedMethods.js';
import fallThrough from './middleware/postprocessing/fallThrough.js';
import lastResort from './middleware/postprocessing/lastResort.js';

const app = express(); // init express app

export const startTime = new Date();

// allowing cross origin requests
app.use(cors());

// use body parser middleware
app.use(bodyParser.urlencoded({ extended: true })); // application/x-www-form-urlencoded
app.use(bodyParser.json()); // application/json

// init express routing system
const main = express.Router();

// adds system reference name to the endpoint paths globally
app.use(`/${eVars.SYS_REF}`, main);

// handlebars templating engine setup
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

db.initialize() // initialize database
    .then(() => {
        // initialize processUpdates module
        return controller.processUpdates.initialize();
    }).then((initMessage) => {
        logger.info(initMessage);
        // process update data for the initial time
        return controller.processUpdates.perform();
    }).then((updateStatus) => {
        logger.info(updateStatus);
        // start node.js server
        app.listen(eVars.PORT, (error) => {
            if (error) {
                db.Sequelize.Promise.reject(
                    errorHandler.object(
                        'server.js',
                        'app.listen()',
                        `${eVars.SYS_REF} 啟動程序異常`,
                        error
                    )
                );
            }
            // start scheduled jobs
            controller.scheduledJobs.processUpdates.start(); // start chat update parsing processor
            controller.scheduledJobs.broadcast.start(); // start broadcasting

            // request preprocessing middleware
            main.use(preset404);
            main.use(unsupportedMethods);

            // routing and endpoint handlers
            main.use('/', require('./routes/utility.js'));
            main.use('/', require('./routes/subscribe.js'));
            main.use('/', require('./routes/token.js'));
            main.use('/', require('./routes/messages.js'));

            // request postprocessing middleware
            main.use(fallThrough); // catch requests that falls through all avail handlers
            main.use(lastResort); // last resort

            logger.info(`${eVars.SYS_REF} 系統正確啟動 (port: ${eVars.PORT})...`);
        });
    }).catch((error) => { // database init failure
        errorHandler.fullHandler({
            module: 'server.js',
            function: 'db.initialize()',
            message: `${eVars.SYS_REF} server could not initialize the database`,
            error: error
        });
    });
