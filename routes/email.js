const path = require('path');
const SMTP = require(path.join(process.env.APP_DIR, 'lib', 'SMTP'));
const Session = require(path.join(process.env.APP_DIR, 'lib', 'Session'));
const Router = require('koa-router');

const main = ({cache, db, logger}) =>
{
    const router = new Router({prefix: '/email'});

    router.post('/send',
    Session.require(), // user must be logged in
    async (ctx, next) =>
    {
        if(!ctx.request.body.from || ctx.request.body.subject || ctx.request.body.text)
        {
            Session.throw({showMessage: true});
            return
        }

        const mailOptions =
        {
            from: ctx.request.body.from,
            to: 'support@example.com',
            subject: ctx.request.body.subject,
            text: ctx.request.body.text
        };
    
        await SMTP.sendMail(mailOptions);
        ctx.body = {message: 'Your email has been sent.'};
    });

    return router.routes();
}

module.exports = main;
