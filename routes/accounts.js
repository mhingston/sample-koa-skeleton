const path = require('path');
const Session = require(path.join(process.env.APP_DIR, 'lib', 'Session'));
const Helpers = require(path.join(process.env.APP_DIR, 'lib', 'Helpers'));
const Router = require('koa-router');

const main = ({cache, db, logger}) =>
{
    const router = new Router({prefix: '/accounts'});

    router.get('/',
    Session.require({IsAdmin: true}), // Admin user required
    async (ctx, next) =>
    {
        const results = await db.request(
        {
            sql: `SELECT * FROM Account`,
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
    
        const body = {results: results[0]};
        Session.respond({ctx, body});
    });

    router.get('/:account_id',
    Session.require({IsAdmin: true}), // Admin user required
    async (ctx, next) =>
    {
        const results = await db.request(
        {
            sql: `SELECT * FROM Account WHERE AccountID = @AccountID`,
            parameters:
            [
                ['AccountID', db.types.Int, parseInt(ctx.query.account_id)],
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
    
        const body = {results: results[0]};
        Session.respond({ctx, body});
    });

    return router.routes();
}

module.exports = main;
