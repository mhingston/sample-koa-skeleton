require('dotenv').config(); // read the .env file and add variables into the runtime environment

const config = 
{
    database:
    {
        connection:
        {
            userName: process.env.DB_USER,
            password: process.env.DB_PASS,
            server: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT),
            options:
            {
                abortTransactionOnError: true,
                database: process.env.DB_DEFAULT,
                connectTimeout: 15000,
                requestTimeout: 120000,
                encrypt: true,
                isolationLevel: 'SNAPSHOT',
                useUTC: false
            }
        },
        pool:
        {
            min: 1,
            max: 10,
            idleTimeout: 30000,
            acquireTimeout: 12000
        }
    },
    smtp:
    {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        auth:
        {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    },
    port: parseInt(process.env.PORT),
    sso:
    {
        options:
        {
            expiresIn: process.env.SSO_EXPIRES
        },
        secret: process.env.SSO_SECRET,
        url: process.env.SSO_URL
    },
    jwt:
    {
        algorithms: process.env.JWT_ALGORITHMS.split(','),
        signingAlgorithm: process.env.JWT_SIGINING_ALGORITHM,
        expiresIn: process.env.JWT_EXPIRES
    }
};

module.exports = config;
