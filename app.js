const Koa = require('koa');
const cors = require('koa2-cors');
const helmet = require('koa-helmet');
const compress = require('koa-compress');
const bodyParser = require('koa-bodyparser');
const errorMiddleware = require('./middleware/internalError');
const notFoundMiddleware = require('./middleware/notFound');
const router = require('./routes/index');
const Cache = require('./lib/Cache');
const HttpStatus = require('http-status-codes');
const Logger = require('./lib/Logger');
const Vault = require('./lib/Vault');
const TediousWrapper = require('tedious-wrapper');

let app; // app instance
let cache = {}; // Object to be used as in-memory cache
let config; // config object
let db; // database instance
let logger; // logger instance

const main = async () =>
{
    app = new Koa(); // initialise the app server
    app.proxy = true; // set to true when running behind a reverse proxy

    /* Begin Koa middlware */
    app.use(errorMiddleware(logger)); // this handles uncaught exceptions, it should always be the first middleware in the chain
    app.use(cors()); // CORS
    app.use(helmet({noCache: true})); // Helmet defaults + no caching as this is a REST API
    app.use(compress()); // GZIP compression
    app.use(bodyParser( // Body parser setup
    {
        formLimit: `${process.env.FORM_LIMIT}mb`,
        jsonLimit: `${process.env.JSON_LIMIT}mb`,
        onerror: (error, ctx) =>
        {
            ctx.status = HttpStatus.UNPROCESSABLE_ENTITY;
            ctx.body =
            {
                message: 'Unable to parse request body.'
            }
        }
    }));
    app.use(router({cache, db, logger})); // inject the cache, db and logger instances to the router and use the routes defined within the router
    app.use(notFoundMiddleware()); // 404 handler, it should always be the last middleware in the chain
    /* End Koa middlware */

    // Setup the HTTP server binding and start the app server
    app.listen(config.port, () => logger.log('info', `Listening on http://127.0.0.1:${config.port}`));
}

const bootstrap = async () =>
{
    const secrets = await Vault.read('secrets'); // read all secrets stored in the "secrets" mount of our Hashicorp Vault
    Object.keys(secrets).forEach((key) => process.env[key.toUpperCase()] = secrets[key]); // add the secrets to the runtime environment
    process.env.APP_DIR = __dirname; // add the directory of this file to the runtime environment
    config = require('./config'); // read the config file
    logger = new Logger(); // setup a new logger
    db = new TediousWrapper(config.database, logger.log); // initialise the database connection
    cache = await Cache.refresh({db, logger}); // update the cache
    main();
}

bootstrap(); // entry point
