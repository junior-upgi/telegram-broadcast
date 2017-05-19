import dotenv from 'dotenv';
import path from 'path';
import Sequelize from 'sequelize';

import logger from '../utilities/logger.js';

dotenv.config();

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

db.APISubscriptions = require('./apiSubscriptions.js')(sequelize, Sequelize);
db.Users = require('./users.js')(sequelize, Sequelize);
db.initialize = () => {
    return Promise.all([
        db.APISubscriptions.sync({ refresh: true }),
        db.Users.sync({ refresh: true })
    ]);
};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
