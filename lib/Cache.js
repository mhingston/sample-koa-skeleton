// This is a simple class with static methods that get data from other sources and store it in memory
class Cache
{
    static async getColumnGroups({db, logger})
    {
        // get column groups from the database and apply transformation to the column on receipt of the data
        const results = await db.request(
        {
            sql: `SELECT ColumnGroupID, ColumnGroup
            FROM MI_ColumnGroup`,
            options:
            {
                transformers:
                [
                    {
                        column: 'ColumnGroup',
                        transform: (value, metadata) => value.trim().toLowerCase().replace(/\s-\s/g, ' ').replace(/\s/g, '_')
                    }
                ]
            }
        });

        return results[0]; // results is an array of result sets, we only want the first result set, i.e. results[0]
    }

    static async getContactTypes({db, logger})
    {
        // get contact types from the database and apply transformation to the column on receipt of the data
        const results = await db.request(
        {
            sql: `SELECT ContactTypeID, ContactType
            FROM ContactType`,
            options:
            {
                transformers:
                [
                    {
                        column: 'ContactType',
                        transform: (value, metadata) => value.trim().toLowerCase().replace(/\s-\s/g, ' ').replace(/\s/g, '_')
                    }
                ]
            }
        });

        return results[0]; // results is an array of result sets, we only want the first result set, i.e. results[0]
    }

    static getEventTypes()
    {
        // example object for jstree - https://www.jstree.com/docs/json/
        const eventTypes =
        {
            core:
            {
                data:
                [
                    {
                        id: 1,
                        text: 'Event 1'
                    },
                    {
                        id: 2,
                        text: 'Event 2'
                    },
                    {
                        id: 3,
                        text: 'Event 3'
                    }
                ]
            }
        }
        
        return eventTypes;
    }

    static async refresh({db, logger}) // update the cache by calling the methods above to get the data
    {
        const cache = {};
        cache.columnGroups = await this.getColumnGroups({db, logger});
        cache.contactTypes = await this.getContactTypes({db, logger});
        cache.eventTypes = this.getEventTypes();
        return cache;
    }
}

module.exports = Cache;
