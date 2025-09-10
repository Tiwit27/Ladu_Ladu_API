import con from "../connection.js";
import { pullSchedules } from "../pullSchedules.js";

export const addChargingStation = async (req, res) => {
    try
    {
        //start transaction
        await con.query("START TRANSACTION");
        //x have to be more than -90 and less than 90
        if (req.body.x > 90 || req.body.x < -90) {
            throw new Error("Zła wartośc X");
        }
        //y have to be more than -180, and less than 180
        if (req.body.y > 180 || req.body.y < -180) {
            throw new Error("Zła wartośc Y");
        }
        //query adding new charging station
        const [chargingStationData] = await con.execute('INSERT INTO charging_stations(address, x, y) VALUES (?,?,?)', [req.body.address, req.body.x, req.body.y]);
        //set const values from req.body.time
        const values = req.body.time;
        //set days of week table
        const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        for(let i = 0; i < 7; i++)
        {
            if(values[i].is_open)
            {
                if(values[i].open >= values[i].close)
                {
                    throw new Error("Godzina otwarcia nie może być większa niż godzina zamknięcia");
                }
                //query
                const [queryData] = await con.execute('INSERT INTO schedules (station_id, day, open_hour, close_hour, is_open) VALUES (?,?,?, ?,1)', [chargingStationData.insertId, daysOfWeek[i], values[i].open, values[i].close]);
                //check if row was changed
                if(queryData.affectedRows == 0)
                {
                    throw new Error("Błąd podczas zapisu harmonogramu");
                }
            }
            else
            {
                const [queryData] = await con.execute('INSERT INTO schedules (station_id, day, open_hour, close_hour, is_open) VALUES (?,?,null, null,0)', [chargingStationData.insertId, daysOfWeek[i]]);
                //check if row was changed
                if(queryData.affectedRows == 0)
                {
                    //if is not, throw error
                    throw new Error("Błąd podczas zapisu harmonogramu");
                }
            }
            
        }
        await con.query('COMMIT');
        pullSchedules();
        //return res information 
        return res.json({ "message": chargingStationData.insertId, "success": true });
    }
    catch(error)
    {
        //if was error, rollback every changes and return success false
        await con.query("ROLLBACK");
        return res.json({ "message": error.message, "success": false })
    }
}

export const deleteChargingStation = async (req, res) => {
    try
    {
        const [stationData] = await con.execute("DELETE FROM charging_stations WHERE station_id = ?", [req.body.station_id]);
        console.log(stationData.affectedRows);
        if (stationData.affectedRows == 0) {
            //if is not any error but anyone is deleted means that station_id was wrong
            throw new Error("Błędne id stacji");
        }
        return res.json({ "message": stationData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const getAllChargingStations = async (req, res) => {
    //return all informations from charging_stations table
    try
    {
        const [stationData] = await con.query("SELECT * FROM charging_stations");
        return res.json({ "message": stationData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const updateChargingStation = async (req, res)=>{
    //check is address not null
    try
    {
        if(!req.body.address.trim())
        {
            throw new Error("Adres nie może być pusty");
        }
        //check is x and y not null
        if(!req.body.x || !req.body.y)
        {
            throw new Error("X i Y nie moga być puste");
        }
        //x have to be more than -90 and less than 90
        if (req.body.x > 90 || req.body.x < -90) {
            throw new Error("Zła wartość X");
        }
        //y have to be more than -180, and less than 180
        if (req.body.y > 180 || req.body.y < -180) {
            throw new Error("Zła wartość Y");
        }
         //update charging station data in record where station_id is equal to req.body.station_id
        const [stationData] = await con.execute("UPDATE charging_stations SET address = ?, x = ?, y = ? WHERE station_id = ?", [req.body.address, req.body.x, req.body.y, req.body.station_id]);
        return res.json({ "message": stationData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const getChargingStationData = async (req,res)=>{
    //returns data about charging station with given station_id
    try
    {
        const [stationData] = await con.execute("SELECT * FROM charging_stations WHERE station_id = ?", [req.body.station_id]);
        return res.json({ "message": stationData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const getChargingStationDataByPortId = async (req, res)=>{
    try
    {
        //get data for next query
        const [portData] = await con.execute("SELECT station_id FROM charging_ports WHERE port_id = ?", [req.body.port_id]);
        if(portData.length == 0)
        {
            throw new Error("Błędne id portu");
        }
        //select data about charging stations
        const [stationData] = await con.execute("SELECT * FROM charging_stations WHERE station_id = ?", [portData[0].station_id]);
        return res.json({ "message": stationData[0], "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}