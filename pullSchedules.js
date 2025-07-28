import con from "./connection.js";
import { checkSchedules } from "./functions/checkSchedules.js";

export async function pullSchedules()
{
    try
    {
        const [scheduleData] = await con.query("SELECT * FROM schedules WHERE day = DAYNAME(NOW())");
        globalThis.schedules = scheduleData;
        checkSchedules();
    }
    catch(error)
    {
        console.log(error);
        throw new Error(error.message);
    }
}