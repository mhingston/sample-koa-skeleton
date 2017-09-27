const _ = require('lodash');
const moment = require('moment');
const HttpStatus = require('http-status-codes');
const Session = require('./Session');
const Franchise = require('./Franchise');
const Helpers = require('./Helpers');

class User
{
    static async login({ctx, cache, db, logger}) // authenticate the user via email/password or SSO token
    {
        let accountID = null;
        let userID = null;
        const ssoToken = _.get(ctx, 'request.body.sso_token', null);

        if(ssoToken) // if the SSO token is present then decode it to the AccountID/UserID
        {
            const decoded = Session.consumeToken(ssoToken);
            accountID = decoded.AccountID;
            userID = decoded.UserID;
        }
        
        const sql = `exec User_Login`;
        const params =
        [
            ['EmailAddress', db.types.VarChar, _.get(ctx, 'request.body.email', null)],
            ['Password', db.types.VarChar, _.get(ctx, 'request.body.password', null)],
            ['AccountID', db.types.Int, accountID],
            ['UserID', db.types.Int, userID]
        ];

        const results = await db.request( // call the stored procedure with the above parameters
        {
            sql: Helpers.addParams({sql, params}),
            parameters: params
        });

        if(!Array.isArray(results[0]) || !results[0].length) // if there result set is empty return an error response
        {
            Session.throw(
            {
                message: 'Invalid email/password or bad SSO token',
                status: HttpStatus.UNAUTHORIZED,
                showMessage: true
            });
        }

        const user = results[0][0]; // get the user object from the result sets
        ctx.state = Object.assign({}, {User: user, Filter: {}}); // initialise session state
        const body = {};
        ctx.state.Filter.FilterID = results[1][0].FilterID;
		ctx.state.Filter.StartDate = moment().startOf('month').toISOString();
        ctx.state.Filter.EndDate = moment().endOf('month').toISOString();
        Session.respond({ctx, body}); // respond to client
    }
}

module.exports = User;
