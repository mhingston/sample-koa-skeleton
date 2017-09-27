require('dotenv').config(); // read the .env file and add variables into the runtime environment

const vault = require('node-vault')();

class Vault // this is just a simple class that thinly wraps node-vault
{
    static async unseal()
    {
        const response = await vault.status(); // get the vault status

        if(response.sealed) // if the vault is sealed, unseal the vault using 3 secret shares
        {
            await Promise.all(
            [
                vault.unseal(
                {
                    secret_shares: 1,
                    key: process.env.VAULT_KEY1
                }),
                vault.unseal(
                {
                    secret_shares: 1,
                    key: process.env.VAULT_KEY2
                }),
                vault.unseal(
                {
                    secret_shares: 1,
                    key: process.env.VAULT_KEY3
                })
            ]);
        }
    }

    static async read(mount)
    {
        const config = {};

        await this.unseal(); // unseal the vault
        const response = await vault.list(mount); // list the secret keys in the mount

        for(const key of response.data.keys)
        {
            const item = await vault.read(`${mount}/${key}`); // read the secret value for each secret key
            config[key] = item.data.value; // add the secret to the config object
        }

        return config;
    }

    static async seal()
    {
        await vault.seal(); // seal the vault
    }
}

module.exports = Vault;
