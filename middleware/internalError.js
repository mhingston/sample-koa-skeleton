const HttpStatus = require('http-status-codes');
const uuid = require('uuid');

const errorMiddleware = (logger) =>
{
    return async (ctx, next) =>
    {
        try // try and run the next middleware
        {
            await next();
        }
    
        catch(error) // if we get here then an uncaught exception has occurred somewhere in the downstream middleware
        {
            const body = {};

            if(error.showMessage)
            {
                body.message = error.message;
            }

            else
            {
                body.message = 'Internal Server Error';
                body.reference = uuid.v1(); // generate UUID (time-based) as a reference
                logger.log('debug', error.message, {reference: body.reference, stack: error.stack});
            }
    
            // send error response
            ctx.status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            ctx.body = body;
        }
    }
}

module.exports = errorMiddleware;
