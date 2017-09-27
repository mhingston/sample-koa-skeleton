const path = require('path');
const Session = require(path.join(process.env.APP_DIR, 'lib', 'Session'));
const Helpers = require(path.join(process.env.APP_DIR, 'lib', 'Helpers'));
const Router = require('koa-router');

const main = ({cache, db, logger}) =>
{
    const router = new Router({prefix: '/search'});

    router.post('/',
    Session.require({IsAdmin: true}), // admin user required
    async (ctx, next) =>
    {
        let searchType;
    
        switch(ctx.request.body.search_type) // determine search type from form
        {
            case 'reg_no':
                searchType = 0;
                break;
    
            case 'email_address':
                 searchType = 1;
                break;
    
            case 'last_name':
                searchType = 2;
                break;
    
            case 'postcode':
                searchType = 3
                break;
        }
    
        const searchText = ctx.request.body.search_text; // get search text from form
    
        if(isNaN(searchType) || !searchText) // if search type and search text are missing return an error response
        {
            Session.throw({showMessage: true});
        }
    
        const results = await db.request( // search the database
        {
            sql: `exec Search @UserID, @SearchType, @SearchText`,
            parameters:
            [
                ['UserID', db.types.Int, ctx.state.User.UserID],
                ['SearchType', db.types.Int, searchType],
                ['SearchText', db.types.NVarChar, searchText]
            ],
            options:
            {
                transformers:
                [
                    {
                        column: /.*/,
                        transform: Helpers.transform
                    }
                ]
            }
        });

        // return the results
        const body = {results: results[0]};
        Session.respond({ctx, body});
    });

    return router.routes();
}

module.exports = main;
