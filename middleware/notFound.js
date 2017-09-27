const HttpStatus = require('http-status-codes');

const notFound = () =>
{
    return async (ctx, next) =>
    {
        // If the status is 404 (not found)
        if(ctx.status === HttpStatus.NOT_FOUND)
        {
            // Send not found response
            ctx.status = HttpStatus.NOT_FOUND;
            ctx.body =
            {
                message: 'Resource Not Found.'
            };
        }

        // Otherwise continue to the next middlware (there shouldn't be any if this is the last middleware in the chain)
        else
        {
            await next();
        }
    }
}

module.exports = notFound;
