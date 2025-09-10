import moment from "moment/moment.js";

export function getActualDateTimeInDBFormat()
{
    //returns actual date in format for creates timestamp in mysql database
    var m = moment();
    return m.format('YYYY-MM-DD HH:mm:ss');
}