const path = require('path');
const rateLimit = require('koa-rate-limit');
const User = require(path.join(process.env.APP_DIR, 'lib', 'User'));
const Session = require(path.join(process.env.APP_DIR, 'lib', 'Session'));
const HttpStatus = require('http-status-codes');
const Router = require('koa-router');

const main = ({cache, db, logger}) =>
{
    const router = new Router({prefix: '/user'});

    router.post('/authenticate',
    rateLimit({}), // rate limit access to this endpoint using defaults
    async (ctx, next) => // authenticate a user via email/password or SSO token
    {
        if((ctx.request.body.email && ctx.request.body.password) || ctx.request.body.sso_token)
        {
            await User.login({ctx, cache, db, logger});
        }

        else
        {
            Session.throw(
            {
                message: 'Unauthorized',
                status: HttpStatus.FORBIDDEN,
                showMessage: true
            });
        }
    });

    router.post('/password',
    Session.require(), // user must be logged in
    async (ctx, next) => // change user password
    {
        const validPassword = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/; // valid password regex
    
        if(!ctx.request.body.current_password || !ctx.request.body.new_password) // if the existing and new password haven't been provided return an error response
        {
            Session.throw({showMessage: true});
            return;
        }
    
        if(!validPassword.test(ctx.request.body.new_password)) // if the new password doesn't meet the password requirements return an error response
        {
            Session.throw(
            {
                message: 'Password does not meet complexity requirements.',
                showMessage: true
            });
            return;
        }
        
        const results = await db.request( // test if the current password is correct
        {
            sql: `SELECT *
            FROM UserPasswordSalt
            WHERE UserID = @UserID
            AND dbo.fn_PwdCrypt_salt(@CurrentPassword, salt) = PasswordHash`,
            parameters:
            [
                ['UserID', db.types.Int, ctx.state.User.UserID],
                ['CurrentPassword', db.types.VarChar, ctx.request.body.current_password]
            ]
        });
    
        if(Array.isArray(results[0]) && results[0].length) // if the current password is correct change the password
        {
            await db.request(
            {
                sql: 'exec _ADMIN_ChangeUserPassword @UserID, @NewPassword',
                parameters:
                [
                    ['UserID', db.types.Int, ctx.state.User.UserID],
                    ['NewPassword', db.types.VarChar, ctx.request.body.new_password]
                ]
            });
            
            ctx.body =
            {
                message: 'Your password has been updated.'
            };
        }
        
        else // the password is incorrect
        {
            Session.throw(
            {
                message: 'Current password is incorrect.',
                showMessage: true
            });
        }
    });

    return router.routes();
}

module.exports = main;
