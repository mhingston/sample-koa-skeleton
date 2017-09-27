const Router = require('koa-router');

const main = ({cache, db, logger}) =>
{
    /* Begin importing routes */
    const Accounts = require('./accounts')({cache, db, logger});
    const Email = require('./email')({cache, db, logger});
    const Search = require('./search')({cache, db, logger});
    const User = require('./user')({cache, db, logger});
    /* End importing routes */

    const router = new Router(); // setup new router
    router.use(Accounts); // use Accounts routes
    router.use(Email); // use Email routes
    router.use(Search); // use Search routes
    router.use(User); // use User routes

    return router.routes();
}

module.exports = main;
