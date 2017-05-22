import dotenv from 'dotenv';
import path from 'path';
import Sequelize from 'sequelize';

import logger from '../utilities/logger.js';

dotenv.config(); // should not be removed

const resetDatabase = false;
// const resetDatabase = process.env.ENV === 'production' ? false : true;
const db = {}; // global database access object
const sqliteConfig = { // connection object for sqlite database
    dialect: 'sqlite',
    storage: path.join('./', `${process.env.SYS_REF}.db`), // path to database file
    // timezone: process.env.TIMEZONE, // unsupported by SQLite
    logging: process.env.ENV === 'development' ? logger.info : false,
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
const sequelize = new Sequelize(sqliteConfig);

db.APIUsers = require('./apiUsers.js')(sequelize, Sequelize);
db.Users = require('./users.js')(sequelize, Sequelize);
db.Chats = require('./chats.js')(sequelize, Sequelize);
db.initialize = () => {
    return Promise.all([
        db.APIUsers.sync({ force: resetDatabase }),
        db.Users.sync({ force: resetDatabase }),
        db.Chats.sync({ force: resetDatabase })
    ]);
};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
