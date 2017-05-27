import db from '../../controllers/database.js';
import routerResponse from '../../utilities/routerResponse.js';

// middleware to transform supplied info from url query to a id before actually processing the message
module.exports = (request, response, next) => {
    let first_name = request.query.first_name;
    let last_name = request.query.last_name;
    let username = request.query.username;
    if (
        ( // check url has first_name/last_name query params
            (first_name !== undefined) && (first_name !== null) && (first_name !== '') &&
            (last_name !== undefined) && (last_name !== null) && (last_name !== '')
        ) || ( // or if the url has username query param
            (username !== undefined) && (username !== null) && (username !== '')
        )
    ) {
        // find the user by the query params if the above is true
        db.Users
            .findOne({
                where: {
                    $or: [
                        { first_name: first_name, last_name: last_name },
                        { username: username }
                    ]
                }
            }).then((result) => {
                if (result !== null) { // if the user is found
                    // transform the request object accordingly
                    if ( // check if an array of messages is received
                        (request.body.messages !== undefined) &&
                        Array.isArray(request.body.messages)
                    ) { // set the chat_id of each array object
                        request.body.messages.forEach((message, index, originalArray) => {
                            originalArray[index].chat_id = result.id;
                        });
                        next();
                    } else if ( // if only a single message object is found
                        (request.body.text !== undefined)
                    ) { // set the chat_id
                        request.body.chat_id = result.id;
                        next();
                    } else { // did not find valid message texts
                        return routerResponse.json({
                            pendingResponse: response,
                            originalRequest: request,
                            statusCode: 400,
                            success: false,
                            message: 'did not find valid message(s)'
                        });
                    }
                } else {
                    // query params does not yield a valid user
                    return routerResponse.json({
                        originalRequest: request,
                        pendingResponse: response,
                        success: false,
                        statusCode: 400,
                        message: 'no such user'
                    });
                }
            }).catch((error) => {
                // database query errored
                return routerResponse.json({
                    originalRequest: request,
                    pendingResponse: response,
                    success: false,
                    statusCode: 500,
                    error: error,
                    message: 'Users model lookup error'
                });
            });
    } else { // no query found in the url
        next();
    }
};
