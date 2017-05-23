// middleware to filter and error out when unsupported methods are found in the request
module.exports = (request, response, next) => {
    const supportedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    if ((supportedMethods.indexOf(request.method.toUpperCase())) === -1) {
        response.status(405);
        next(`http method ${request.method} is not supported`);
    }
    next();
};
