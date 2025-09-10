import con from "../connection.js"; 
import { getActualDateTimeInDBFormat } from "./getActualDateTimeInDBFormat.js";

export async function stopCharging(session_id)
{
    try
    {
        //get date in YYYY-MM-DD HH:mm:ss for use it as timestamp in mysql query
        const datetime = getActualDateTimeInDBFormat();
        //get access to activeInstances object, which is globally declare in chargingFunction.js
        const activeInstances = globalThis.activeInstances;
        //check if activeInstances contain object with session_id as key
        if(!activeInstances[session_id])
        {
            //if activeInstances is not contain this object we return reject
            throw new Error("Błędne id sesji");
        }
        //start transaction
        await con.query('START TRANSACTION');
        //query which set end datetime in charging_sessions table
        await con.execute('UPDATE charging_sessions SET end = ? WHERE session_id = ?', [datetime, session_id]);
        //query which select data from charging_sessions which are need to next queries
        const [sessionData] = await con.execute('SELECT port_id, vehicle_id, user_id, energy_used, total_cost FROM charging_sessions WHERE session_id = ?', [session_id]);
        //query which set status of charging port to free
        await con.execute("UPDATE charging_ports SET status = 'free' WHERE port_id = ?", [sessionData[0].port_id]);
        //query which clear current_charge_levet and set is_charging bool to false (0)
        await con.execute('UPDATE vehicles SET current_charge_level = null, is_charging = 0 WHERE vehicle_id = ?', [sessionData[0].vehicle_id]);
        //insert new record to payments table
        await con.execute("INSERT INTO payments (session_id, issue_time, amount) VALUES (?,?,?)", [session_id, datetime, sessionData[0].total_cost]);
        //add points for user
        const [usersData] = await con.execute("SELECT points FROM users WHERE user_id = ?",[sessionData[0].user_id]);
        const points = Math.round(sessionData[0].energy_used) + usersData[0].points;
        await con.execute("UPDATE users SET points = ? WHERE user_id = ?", [points, sessionData[0].user_id]);
        //commit queries
        await con.query('COMMIT');
        //clear timeout with given id from activeInstances
        await clearTimeout(activeInstances[session_id].timeoutId);
        //delete object with session_id from activeInstances
        await delete activeInstances[session_id];
        //return resolve promise
        return "Ładowanie zakończone";
    }
    catch(error)
    {
        //if was any error we rollback queries and return reject with error message
        await con.query('ROLLBACK');
        throw new Error(error.message);
    }
}

