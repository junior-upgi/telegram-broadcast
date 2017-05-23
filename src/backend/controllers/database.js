import path from 'path';
import Sequelize from 'sequelize';

import errorHandler from '../utilities/errorHandler.js';
import logger from '../utilities/logger.js';
import eVars from '../config/environment.js';

// control if the database is recreated at program start
const RESET_DATABASE = false;
// const RESET_DATABASE = eVars.ENV === 'production' ? false : true;

const db = {}; // global database access object

const SQLITE_CONFIG = { // connection object for sqlite database
    dialect: 'sqlite',
    storage: path.join('./', `${eVars.SYS_REF}.db`), // path to database file
    // timezone: eVars.TIMEZONE, // unsupported by SQLite
    // control if database operations are output with verbose messages
    logging: eVars.ENV === 'development' ? logger.info : false,
    define: {
        underscored: false,
        freezeTableName: true,
        timestamps: true,
        paranoid: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt'
    }
};

const sequelize = new Sequelize(SQLITE_CONFIG); // initialize database object

db.APISubscribers = require('../models/apiSubscribers.js')(sequelize, Sequelize);
db.Users = require('../models/users.js')(sequelize, Sequelize);
db.Chats = require('../models/chats.js')(sequelize, Sequelize);

db.initialize = () => {
    return Promise.all([
        db.APISubscribers.sync({ force: RESET_DATABASE })
        .then(() => {
            logger.info('APISubscribers sync\'ed...');
            return db.Sequelize.Promise.resolve();
        }).catch((error) => {
            return db.Sequelize.Promise.reject(
                errorHandler.object(
                    'database.js',
                    'db.APISubscribers.sync()',
                    'unable to sync APISubscribers model',
                    error
                )
            );
        }),
        db.Users.sync({ force: RESET_DATABASE })
        .then(() => {
            logger.info('Users sync\'ed...');
            return db.Sequelize.Promise.resolve();
        }).catch((error) => {
            return db.Sequelize.Promise.reject(
                errorHandler.object(
                    'database.js',
                    'db.Users.sync()',
                    'unable to sync Users model',
                    error
                )
            );
        }),
        db.Chats.sync({ force: RESET_DATABASE })
        .then(() => {
            logger.info('Chats sync\'ed...');
            return db.Sequelize.Promise.resolve();
        }).catch((error) => {
            return db.Sequelize.Promise.reject(
                errorHandler.object(
                    'database.js',
                    'db.Chats.sync()',
                    'unable to sync Chats model',
                    error
                )
            );
        })
    ]);
};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
