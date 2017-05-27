import Promise from 'bluebird';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import exphbs from 'express-handlebars';
import morgan from 'morgan';
import path from 'path';

// modules
import eVars from './config/environment.js';
import db from './controllers/database.js';
import telegram from './utilities/telegramAPI.js';
import botCommands from './controllers/observedCommands/commands.js';
import botEvents from './controllers/observedEvents/events.js';
import broadcastSystem from './controllers/broadcastSystem.js';

// setup Express framework and routing
export let serverStartTime = null; // log server start time
const app = express(); // init express app
console.log('loading Express framework...');

// Handlebars template engine setup
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
console.log('setup Handlebars templating engine...');

// global routing and middlewares
const main = express.Router(); // create an express router
app.use(`/${eVars.SYS_REF}`, main); // adds system reference name to the endpoint paths globally
main.use(cors()); // allowing cross origin requests
main.use(morgan('dev')); // for debugging
main.use(bodyParser.urlencoded({ extended: true })); // application/x-www-form-urlencoded
main.use(bodyParser.json()); // application/json
console.log('loading global middlewares...');

// custom request preprocessing middlewares
main.use(require('./middleware/preprocessing/preset404.js')); // preset all requests as status 404
main.use(require('./middleware/preprocessing/unsupportedMethods.js')); // catch request using unsupported methods
console.log('loading custom pre-processing middleware...');

// declaration of routing and endpoint handlers
main.use('/', require('./routes/utility.js'));
main.use('/', require('./routes/subscribe.js'));
main.use('/', require('./routes/token.js'));
main.use('/', require('./routes/messages/messages.js'));
console.log('setup routing and end-point handlers...');

// custom request postprocessing middlewares
main.use(require('./middleware/postprocessing/fallThrough.js')); // catch requests that falls through all avail handlers
main.use(require('./middleware/postprocessing/lastResort.js')); // last resort
console.log('loading custom post-processing middleware...');

// initialize different system components
let initProcedures = [];
// prepare a list of initialization procedures
initProcedures.push(db.initialize()); // initialize database.js module and data models
initProcedures.push(telegram.initialize()); // initialize a telegram bot for broadcasting
initProcedures.push(telegram.polling()); // start Bot polling mechanism
initProcedures.push(telegram.observeCommands(botCommands)); // load bot commands
initProcedures.push(telegram.observeEvents(botEvents)); // load bot events
initProcedures.push(broadcastSystem.initialize()); // start broadcasting
// init each system sequentially
Promise.each(initProcedures, (initProcedurePromise) => {
    return initProcedurePromise;
}).then((initProcedureResults) => {
    // display init messages sequentially
    initProcedureResults.forEach((initProcedureResult) => {
        console.log(initProcedureResult.message);
    });
    // start node express server
    app.listen(eVars.PORT, (error) => {
        serverStartTime = new Date();
        if (error) {
            console.log(`${eVars.SYS_REF} server could not be started...`);
            console.log(error);
        } else {
            console.log(`${eVars.SYS_REF} server has been activated (${eVars.BASE_URL}:${eVars.PORT})...`);
        }
    });
}).catch((error) => {
    console.log(JSON.stringify(error, null, '  '));
});
