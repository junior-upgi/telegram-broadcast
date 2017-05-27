import express from 'express';

import eVars from '../config/environment.js';
import routerResponse from '../utilities/routerResponse.js';
import { serverStartTime } from '../server.js';

// middleware
import notImplemented from '../middleware/preprocessing/notImplemented.js';

const utilityRouter = express.Router();

utilityRouter.route('/serviceStatus')
    .get((request, response, next) => {
        return routerResponse.template({
            pendingResponse: response,
            statusCode: 200,
            reference: 'serviceStatus',
            data: {
                title: eVars.SYS_REF,
                startTime: serverStartTime
            }
        });
    })
    .post(notImplemented)
    .put(notImplemented)
    .patch(notImplemented)
    .delete(notImplemented);

module.exports = utilityRouter;
