const winston = require('winston');
require('winston-daily-rotate-file');

class Logger // basic class to thinly wrap winston
{
    constructor()
    {
        this.transports = [];
        
        if(process.env.NODE_ENV === 'development') // use console.log transport for dev environment
        {
            this.transports.push(new winston.transports.Console(
            {
                level: 'debug',
                handleExceptions: true
            }));
        }
            
        this.transports.push(new winston.transports.DailyRotateFile( // use daily rotate file transport
        {
            filename: `./${process.env.LOG_LEVEL || 'error'}`,
            datePattern: '.dd-MM-yyyy.log',
            localTime: true,
            maxDays: 7,
            level: process.env.LOG_LEVEL || 'error',
            handleExceptions: true
        }));
    }

    log()
    {
        if(!this.logger)
        {
            this.logger = new winston.Logger({transports: this.transports}); // initialise logger
        }
        
        this.logger.log(...arguments); // log message
    }
}

module.exports = Logger;
