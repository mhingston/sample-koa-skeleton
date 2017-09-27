const moment = require('moment');

// A class for misc helper methods
class Helpers
{
    static addParams({sql, params}) // automatically appends @parameters to the sql string
    {
        params = params.map((value) => `@${value[0]}`);
        return `${sql} ${params.join(', ')}`;
    }

    static getType(item) // determine the data type of item
    {
        if(item == null)
        {
            return null;
        }

        switch(typeof item)
        {
            case "boolean":
                return Boolean;
            
            case "number":
                return Number;

            case "string":
                return String;

            case "object":
                if(item instanceof Date)
                {
                    return Date;
                }
        }
    }

    /*
        A value transformer for tedious wrapper - https://github.com/mhingston/tedious-wrapper#method-requestsql-parameters-options-callback

        This transforms the raw output from the TDS driver into another format as required
    */

    static transform(value, metadata)
    {
        switch(Helpers.getType(value))
        {
            case null:
                return ''; // cast nulls as empty strings

            case Boolean:
                return value ? 'Yes' : 'No'; // cast booleans as yes/no

            case String:
                return value.trim(); // remove leading/trailing whitespace on strings

            case Date:
                if(['Time', 'TimeN'].includes(metadata.type.name))
                {
                    return moment(value).format('HH:mm'); // format times as HH:mm
                }

                else if(['Date', 'DateN'].includes(metadata.type.name))
                {
                    return moment(value).format('DD/MM/YYYY'); // format dates as DD/MM/YYYY
                }

                else
                {
                    return moment(value).format('DD/MM/YYYY HH:mm'); // default (datetime) format as DD/MM/YYYY HH:mm
                }

            default:
                return value; // fall-through case, apply no transformation
        }
    }
}

module.exports = Helpers;
