import con from "../connection.js";
import { DateTime } from "luxon";
import { getActualDateTimeInDBFormat } from "./getActualDateTimeInDBFormat.js";

export async function checkSchedules()
{
    try
    {
        const now = DateTime.local();
        globalThis.schedules.forEach(async schedule => {
            if(schedule.is_open == 0)
            {
                closeStation(schedule);
            }
            else
            {
                let open = DateTime.fromFormat(schedule.open_hour, "HH:mm:ss");
                let close = DateTime.fromFormat(schedule.close_hour, "HH:mm:ss");
                if(now > close || now < open)
                {
                    closeStation(schedule);
                }
                else
                {
                    await con.execute("UPDATE charging_ports SET status = 'free' WHERE station_id = ? AND status = 'off'", [schedule.station_id]);
                }
            }
        });
    }
    catch(error)
    {
        await con.query("ROLLBACK");
        throw new Error(error.message);
    }
}

async function closeStation(schedule)
{
    await con.execute("UPDATE charging_ports SET status = 'off' WHERE station_id = ? AND (status = 'free' || status = 'busy')", [schedule.station_id]);
    const [data] = await con.execute("SELECT session_id, charging_sessions.port_id, charging_ports.status FROM charging_sessions INNER JOIN charging_ports ON charging_sessions.port_id = charging_ports.port_id WHERE charging_ports.station_id = ? AND end is null", [schedule.station_id]);
    data.forEach(async element => {
        //get date in YYYY-MM-DD HH:mm:ss for use it as timestamp in mysql query
        const datetime = getActualDateTimeInDBFormat();
        //start transaction
        await con.query('START TRANSACTION');
        //query which set end datetime in charging_sessions table
        await con.execute('UPDATE charging_sessions SET end = ? WHERE session_id = ?', [datetime, element.session_id]);
        //query which select data from charging_sessions which are need to next queries
        const [sessionData] = await con.execute('SELECT port_id, vehicle_id, user_id, energy_used, total_cost FROM charging_sessions WHERE session_id = ?', [element.session_id]);
        //query which set status of charging port to free
        await con.execute("UPDATE charging_ports SET status = 'free' WHERE port_id = ?", [sessionData[0].port_id]);
        //query which clear current_charge_levet and set is_charging bool to false (0)
        await con.execute('UPDATE vehicles SET current_charge_level = null, is_charging = 0 WHERE vehicle_id = ?', [sessionData[0].vehicle_id]);
        //insert new record to payments table
        await con.execute("INSERT INTO payments (session_id, issue_time, amount) VALUES (?,?,?)", [element.session_id, datetime, sessionData[0].total_cost]);
        //add points for user
        const [usersData] = await con.execute("SELECT points FROM users WHERE user_id = ?",[sessionData[0].user_id]);
        const points = Math.round(sessionData[0].energy_used) + usersData[0].points;
        await con.execute("UPDATE users SET points = ? WHERE user_id = ?", [points, sessionData[0].user_id]);
        //commit queries
        await con.query('COMMIT');
    });
}
