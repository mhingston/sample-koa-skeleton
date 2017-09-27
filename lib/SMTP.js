const path = require('path');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const config = require(path.join(process.env.APP_DIR, 'config'));

class SMTP // basic class to thinly wrap nodemailer
{
    static sendEmail()
    {
        const transport = nodemailer.createTransport(smtpTransport(config.smtp));
        transport.sendMail(...arguments);
    }
}

module.exports = SMTP;
