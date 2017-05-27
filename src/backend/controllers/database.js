import fs from 'fs';
import path from 'path';
import Promise from 'bluebird';
import Sequelize from 'sequelize'; // requires the sequalize library

import config from '../config/database';

// initialize sequelize database object
const sequelize = new Sequelize(config);

// create a global database access object
const db = {
    Sequelize: Sequelize,
    sequelize: sequelize,
    initialize: initialize,
    unregisterUser: unregisterUser
};

function initialize() {
    return new Promise((resolve, reject) => {
        // dynamically load model from models directory
        let modelPath = path.resolve('./src/backend/models');
        let modelSyncList = [];
        fs.readdirSync(modelPath)
            .filter((fileName) => { // filter out files not named *.js
                return ((fileName.indexOf('.') !== 0) && (fileName.slice(-3) === '.js'));
            }).forEach((fileName) => {
                // prepare the model names from the file names ound
                let modelName = fileName.slice(0, -3).charAt(0).toUpperCase() + fileName.slice(0, -3).slice(1);
                // register models dynamically
                db[modelName] = require(path.join(path.resolve('./src/backend/models'), fileName))(sequelize, Sequelize);
                // push a model sync function into the array
                modelSyncList.push(db[modelName].sync({ force: config.resetDatabase }));
            });
        // sync the models sequentially
        Promise.each(modelSyncList, (modalSyncPromise) => {
            return modalSyncPromise;
        }).then(() => {
            resolve({
                success: true,
                message: 'system database initialized successfully'
            });
        }).catch((error) => {
            reject({
                success: false,
                message: 'failed to initialize system database',
                error: error
            });
        });
    });
}

function unregisterUser(id) {
    // initiate database transcation
    return db.sequelize.transaction((trx) => {
        let filter = { where: { id: id }, transaction: trx };
        return Promise.all([
            db.Users.destroy(filter), // delete user if exist
            db.Chats.destroy(filter) // delete chat if exist
        ]);
    });
}

module.exports = db; // export the database access object
