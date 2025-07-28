import { DateTime } from "luxon";
import con from "../connection.js";
import { pullSchedules } from "../pullSchedules.js";

export const updateSchedule = async (req, res)=>{
    //check if station with station_id existing
    try
    {
        const [stationData] = await con.execute('SELECT count(*) as "check" FROM charging_stations WHERE station_id =  ?', [req.body.station_id]);
        if(stationData[0].check == 0)
        {
            //if is not, return reject
            throw new Error("Nie ma stacji o podanym id");
        }
        //set const values from req.body.time
        const values = req.body.time;
        //set days of week table
        const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        //start transation
        await con.query("START TRANSACTION");
        //for loop for change all day of week
        for(let i = 0; i < 7; i++)
        {
            //check if values[i].is_open true
            if(values[i].is_open)
            {
                //check if open hour is not later than close
                if(values[i].open >= values[i].close)
                {
                    await con.query("ROLLBACK");
                    throw new Error("Godzina otwarcia nie może być większa niż godzina zamknięcia");
                }
                //query
                const [queryData] = await con.execute('UPDATE schedules SET open_hour = ?, close_hour = ?, is_open = 1 WHERE station_id = ? AND day = ?', [values[i].open, values[i].close, req.body.station_id, daysOfWeek[i]]);
                //check if row was changed
                if(queryData.affectedRows == 0)
                {
                    //if is not, throw error
                    throw new Error("Błąd podczas zapisu harmonogramu");
                }
            }
            else
            {
                //query with null insted of open and close data
                const [queryData] = await con.execute('UPDATE schedules SET open_hour = null, close_hour = null, is_open = 0 WHERE station_id = ? AND day = ?', [req.body.station_id, daysOfWeek[i]]);
                //check if row was changed
                if(queryData.affectedRows == 0)
                {
                    //if is not, throw error
                    throw new Error("Błąd podczas zapisu harmonogramu");
                }
            }
        }
        //commit changes and return success message
        await con.query("COMMIT");
        console.log("UPDATED");
        pullSchedules();
        return res.json({"message":"Harmonogram został zmieniony","success":true});
    }
    catch(error)
    {
        //if was any error rollback changes and return success false
        await con.query("ROLLBACK");
        return res.json({"message":error.message,"success":false});
    }
}

export const getStationSchedule = async (req, res)=>{
    //return list of infotmation about schedule on given station_id
    try
    {
        const [scheduleData] = await con.execute("SELECT * FROM schedules WHERE station_id = ?", [req.body.station_id]);
        if(scheduleData.affectedRows == 0)
        {
            //if any row was affected, means that station_id was wrong
            throw new Error("Nie ma stacji o podanym id")
        }
        return res.json({"message":scheduleData,"success":true});
    }
    catch(error)
    {
        return res.json({"message":error.message,"success":false});
    }
}

export const getStationScheduleCurrentStatus = async (req, res)=>{
    try
    {
        //check if stations is now open
        const [scheduleData] = await con.execute("SELECT open_hour, close_hour FROM schedules WHERE station_id = ? AND DAYNAME(NOW()) = day", [req.body.station_id]);
        const now = DateTime.local();
        const open = DateTime.fromFormat(scheduleData[0].open_hour, "HH:mm:ss");
        const close = DateTime.fromFormat(scheduleData[0].close_hour, "HH:mm:ss");
        if(now > close || now < open)
        {
            //if is close, return false in message
            return res.json({"message":false,"success":true});
        }
        //if is open, return open
        return res.json({"message":true,"success":true});
    }
    catch(error)
    {
        return res.json({"message":error.message,"success":false});
    }
}