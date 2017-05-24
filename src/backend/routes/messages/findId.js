import db from '../../controllers/database.js';
import routerResponse from '../../utilities/routerResponse.js';
import errorHandler from '../../utilities/errorHandler.js';

// middleware to transform supplied info from url query to a id before actually processing the message
module.exports = (request, response, next) => {
    if (
        ( // check url has first_name/last_name query params
            (request.query.first_name !== undefined) &&
            (request.query.first_name !== null) &&
            (request.query.first_name !== '') &&
            (request.query.last_name !== undefined) &&
            (request.query.last_name !== null) &&
            (request.query.last_name !== '')
        ) || ( // or if the url has username query param
            (request.query.username !== undefined) &&
            (request.query.username !== null) &&
            (request.query.username !== '')
        )
    ) {
        // find the user by the query params
        db.Users.findOne({
            where: {
                $or: [{
                    first_name: request.query.first_name,
                    last_name: request.query.last_name
                }, {
                    username: request.query.username
                }]
            }
        }).then((result) => {
            // if the user is found
            if (result !== null) {
                // transform the request object accordingly
                if ( // found a request.body.messages array
                    (request.body.messages !== undefined) &&
                    Array.isArray(request.body.messages)
                ) { // set each array object with the found id
                    request.body.messages.forEach((message, index, originalArray) => {
                        originalArray[index].chat_id = result.id;
                    });
                    next();
                } else if ( // find a single message object
                    (request.body.chat_id !== undefined) &&
                    (request.body.text !== undefined)
                ) { // set the chat_id
                    request.body.chat_id = result.id;
                    next();
                } else { // did not find valid message texts
                    routerResponse.json({
                        pendingResponse: response,
                        originalRequest: request,
                        statusCode: 400,
                        success: false,
                        message: 'did not find valid messages'
                    });
                }
            } else {
                // query params does not yield a valid user
                routerResponse.json({
                    originalRequest: request,
                    pendingResponse: response,
                    success: false,
                    statusCode: 400,
                    message: 'queried user is not found in the registry'
                });
            }
        }).catch((error) => {
            // database query errored
            errorHandler.fullHandler({
                model: 'findId.js',
                function: 'findId(){db.Users.findOne()}',
                message: 'Users model lookup error',
                error: error
            });
            routerResponse.json({
                originalRequest: request,
                pendingResponse: response,
                success: false,
                statusCode: 500,
                error: error,
                message: 'Users model lookup error'
            });
        });
    } else { // if no username, first_name/last_name query params present
        next();
    }
};
