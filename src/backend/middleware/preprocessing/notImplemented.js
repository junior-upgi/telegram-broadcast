import eVars from '../../config/environment.js';

module.exports = (request, response, next) => {
    response.status(501);
    next(`${request.protocol}://${request.hostname}:${eVars.PORT}${request.originalUrl} has not been implemented`);
};
