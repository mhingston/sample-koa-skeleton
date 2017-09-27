const path = require('path');
const blake = require('blakejs');
const moment = require('moment');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');
const config = require(path.join(process.env.APP_DIR, 'config'));
const pkg = require(path.join(process.env.APP_DIR, 'package.json'));

class Session
{
	static get key()
	{
		return process.env.JWT_KEY; // get key from runtime environment (injected via call to Hashicorp Vault)
	}

	static get cert()
	{
		return process.env.WT_CERT; // get cert from runtime environment (injected via call to Hashicorp Vault)
    }
    
    static consumeToken(token) // consume SSO token
    {
        let decoded;

        try
        {
            decoded = jwt.verify(token, config.sso.secret, config.sso.options);
        }
        
        catch(error)
        {
            this.throw(
            {
                message: `Unable to verify token: ${error}`,
                showMessage: true
            });
        }

        return decoded;
    }

    static generateToken({accountID, userID}) // generate SSO token
    {
        const payload =
        {
            AccountID: accountID,
            UserID: userID
        };
    
        const encoded = jwt.sign(payload, config.sso.secret, config.sso.options);
        
        const body =
        {
            sso_token: encoded,
            sso_url: config.sso.url
        };
    
        this.respond({ctx, body});
    }

    /*
        JWT sign wrapper

        This metadata helps prevent the token being tampered with. If the clients IP address or user agent changes then the token is invalidated (i.e. bad audience).
    */
	static sign({ctx, payload})
	{
		const token = jwt.sign(payload, this.key,
	    {
	        issuer: pkg.name,
	        audience: blake.blake2sHex(`${ctx.ip}:${ctx.header['user-agent']}`),
	        algorithm: config.jwt.signingAlgorithm
	    });

	    return token;
    }
    
    static throw({message = 'Bad request.', status = HttpStatus.BAD_REQUEST, showMessage = false}) // helper that return an error response
    {
        const error = new Error(message);
        error.status = status;
        error.showMessage = showMessage;
        throw error;
    }

	static require(properties) // session middleware that implements a very basic ACL by checking for properties within the JWT included in the request
	{
		return async (ctx, next) =>
		{
            let decoded;
            let token;

			if(/^bearer/i.test(ctx.header.authorization)) // if there is an Authorization header then extract the JWT from there
			{
				token = ctx.header.authorization.substr(7);
			}

			else if(_.get(ctx, 'request.body.session')) // if there is a session object on the request body (i.e. POST) then extract the JWT from there
			{
				token = ctx.request.body.session;
			}

			else if(_.get(ctx, 'req.body.session')) // if there is a session object on the req body (i.e. form submission) then extract the JWT from there
			{
				token = ctx.req.body.session;
			}

			if(!token) // if there is no token return an error response
		    {
                this.throw(
                {
                    message: 'Authorization token missing.',
                    status: HttpStatus.FORBIDDEN,
                    showMessage: true
                });   
                return;             
		    }

		    try // try decoding the JWT
		    {
				decoded = this.verify({ctx, token});
		    }

		    catch(error) // if the JWT can't be decoded send an error response
		    {
                this.throw(
                {
                    message: `Unable to verify authorization token: ${error.message}`,
                    showMessage: true
                });
                return;
		    }

            // check that the JWT has come from a valid origin as defined in .env
		    let validOrigin = false;
            const origin = ctx.request.origin.match(/^https?:\/\/([^:#\/?]*)/i);
            const validOrigins = process.env.VALID_ORIGINS.split(',').map((domain) => new RegExp(domain+'$', 'i'));

            if(origin && origin[1])
            {
                for(const domain of validOrigins)
                {
                    if(domain.test(origin[1]))
                    {
                        validOrigin = true;
                        break;
                    }
                }
            }

            // Only allow secure contexts (i.e. HTTPS) except when running in dev env
            // Only allow valid origins
            if((!ctx.secure && process.env.NODE_ENV !== 'development') || !validOrigin)
            {
                this.throw({showMessage: true});
                return;
            }

			ctx.state = decoded; // set ctx.state to the decoded JWT object

            /* Begin checking for properies within ctx.state.User */
            let passed = false;

			if(!properties && ctx.state.User)
			{
				passed = true;
			}

			else if(properties && ctx.state.User)
			{
				let passes = 0;
				const keys = Object.keys(properties);

				for(const key of keys)
				{
					if(Array.isArray(properties[key]))
					{
						for(const value of properties[key])
						{
							if(_.get(ctx, `state.User['${key}']`) === value)
							{
								passes++;
								break;
							}
						}
					}

					else
					{
						if(_.get(ctx, `state.User['${key}']`) === properties[key])
						{
							passes++;
						}
					}
				}

				if(passes === keys.length)
				{
					passed = true;
				}
            }
            /* End checking for properties on ctx.state.User */

			if(passed) // if all the checks passed then continue to the next middleware
			{
				await next();
			}

			else // otherwise return an unauthorized response
			{
                this.throw(
                {
                    message: 'Unauthorized.',
                    status: HttpStatus.FORBIDDEN,
                    showMessage: true
                });
            }
		}
	}

	static respond({ctx, data = ctx.state, body = {}, status = 200})
	{
        /* Begin delete meta data from existing token */
        delete data.iat;
        delete data.exp;
        delete data.aud;
        delete data.iss;
        /* End delete meta data from existing token */

		const token = jwt.sign(data, this.key, // create a token from the data in ctx.state
	    {
	        issuer: pkg.name,
	        audience: blake.blake2sHex(`${ctx.ip}:${ctx.header['user-agent']}`),
	        algorithm: config.jwt.signingAlgorithm,
	        expiresIn: config.jwt.expiresIn
        });

        // Send the token in the response
		ctx.status = status;
		body.token = token;
		ctx.body = body;
	}

	static verify({ctx, token}) // basic wrapper for jwt.verify
	{
		const decoded = jwt.verify(token, this.cert,
		{
			issuer: pkg.name,
			audience: blake.blake2sHex(`${ctx.ip}:${ctx.header['user-agent']}`),
			algorithms: config.jwt.algorithms
		});

		return decoded;
	}
}

module.exports = Session;
