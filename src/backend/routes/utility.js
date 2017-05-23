import express from 'express';

import eVars from '../config/environment.js';
import routerResponse from '../utilities/routerResponse.js';
import { startTime } from '../server.js';

// middleware
import notImplemented from '../middleware/preprocessing/notImplemented.js';

const utilityRouter = express.Router();

utilityRouter.route('/serviceStatus')
    .get((request, response, next) => {
        routerResponse.template({
            pendingResponse: response,
            statusCode: 200,
            reference: 'serviceStatus',
            data: {
                title: eVars.SYS_REF,
                startTime: startTime
            }
        });
        return;
    })
    .post(notImplemented)
    .put(notImplemented)
    .patch(notImplemented)
    .delete(notImplemented);

module.exports = utilityRouter;
