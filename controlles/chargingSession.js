import con from "../connection.js";
import { ChargingFunction } from "../functions/chargingFunction.js";
import { getActualDateTimeInDBFormat } from "../functions/getActualDateTimeInDBFormat.js";
import { stopCharging } from "../functions/stopCharging.js";

export const addChargingSession = async (req,res)=>{
    try
    {
        //get actual datetime in db pattern
        const datetime = getActualDateTimeInDBFormat();
        let max_used_energy;
        if(req.body.is_max_used_energy_set && req.body.max_used_energy > 0) 
        {
            max_used_energy = req.body.max_used_energy;
        }
        else
        {
            max_used_energy = -1;
        }
        //check if vehicle with vehicle_id is not charging now
        const [selectVehicleData] = await con.execute("SELECT is_charging, dc_plug_type FROM vehicles WHERE vehicle_id = ?", [req.body.vehicle_id]);
        if(selectVehicleData.length == 0)
        {
            //if vehicle_id was wrong return reject
            throw new Error("Nie ma samochodu o podanym id");
        }
        if(selectVehicleData[0].is_charging == 1)
        {
            //if vehicle already charging return reject
            throw new Error("Samochód jest już ładowany");
        }
        const [selectPortData] = await con.execute("SELECT status, plug_type FROM charging_ports WHERE port_id = ?", [req.body.port_id]);
        if(selectPortData.length == 0)
        {
            //if port_id was wrong return reject
            throw new Error("Nie ma portu o podanym id");
        }
        if(selectPortData[0].status != "free")
        {
            //if port was not free return reject
            throw new Error("Port jest aktualnie niedostępny");
        }
        if(selectPortData[0].plug_type != 'type_2' && selectVehicleData[0].dc_plug_type == null)
        {
            throw new Error("Zły typ wtyczki");
        }
        //main function as transaction a few queries
        //start transaction
        await con.query('START TRANSACTION');
        //query which add new charging session 
        const [sessionData] = await con.execute("INSERT INTO charging_sessions (user_id, port_id, vehicle_id, start, energy_used, total_cost) VALUES (?,?,?,?,0,0)",[req.body.user_id, req.body.port_id, req.body.vehicle_id, datetime]);
        //query which update filed is_charging in vehicles table to true (1)
        await con.execute("UPDATE vehicles SET is_charging = 1 WHERE vehicle_id = ?", [req.body.vehicle_id]);
        //query which update field status in charging_ports, change free to busy
        await con.execute("UPDATE charging_ports SET status = 'busy' WHERE port_id = ?", [req.body.port_id]);
        //help queries for call setTimeout function inside which battery is charging
        //select data from vehicles
        let vehicleData;
        if(selectPortData[0].plug_type == 'type_2')
        {
            [vehicleData] = await con.execute('SELECT battery_capacity, max_charging_power_ac as "max_charging_power" FROM vehicles WHERE vehicle_id = ?', [req.body.vehicle_id])
        }
        else
        {
            [vehicleData] = await con.execute('SELECT battery_capacity, max_charging_power_dc as "max_charging_power", dc_plug_type FROM vehicles WHERE vehicle_id = ?', [req.body.vehicle_id])
        }
        //select data from charging_ports
        const [chargingPortData] = await con.execute('SELECT station_id, max_power, plug_type FROM charging_ports WHERE port_id = ?', [req.body.port_id]);
        //select data from energy_rates
        const [energyRateData] = await con.execute('SELECT rate FROM energy_rates WHERE station_id = ? AND end is null AND plug_type = ?', [chargingPortData[0].station_id, chargingPortData[0].plug_type]);
        //choose lower max charging power
        const randomCurrentCapacity = Math.floor(Math.random() * (vehicleData[0].battery_capacity * 0.7));
        if(Number(chargingPortData[0].max_power) > Number(vehicleData[0].max_charging_power))
        {
            //if vehicle`s max charging power is lower, we call function with all need params and max_charging_power
            ChargingFunction(sessionData.insertId, req.body.vehicle_id ,vehicleData[0].battery_capacity, vehicleData[0].max_charging_power, energyRateData[0].rate, randomCurrentCapacity, res, chargingPortData[0].plug_type, req.body.port_id, max_used_energy)
        }
        else
        {
            //if chargingPort`s max charging power is lower, we call function with all need params and max_power
            ChargingFunction(sessionData.insertId, req.body.vehicle_id ,vehicleData[0].battery_capacity, chargingPortData[0].max_power, energyRateData[0].rate, randomCurrentCapacity, res, chargingPortData[0].plug_type, req.body.port_id, max_used_energy)
        }
    }
    catch(error)
    {
        await con.query('ROLLBACK');
        return res.json({"message":error.message,"success":false})
    }
}

export const stopChargingSession = async (req,res)=>{
    //stop charging session function which call stopCharging function with Promise
    try
    {
        const [stopChargingData] = await stopCharging(req.body.session_id);
        return res.json({ "message": stopChargingData, "success": true })
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false })
    }
}

export const getUserChargingSessions = async (req, res)=>{
    //query returns all user`s charging sessions
    try
    {
        console.log(req.body.user_id);
        const [sessionsData] = await con.execute("SELECT charging_sessions.session_id, charging_sessions.user_id, charging_sessions.port_id, charging_stations.address, charging_sessions.vehicle_id, charging_sessions.start, charging_sessions.end, charging_sessions.energy_used, charging_sessions.total_cost FROM charging_sessions INNER JOIN charging_ports ON charging_sessions.port_id = charging_ports.port_id INNER JOIN charging_stations ON charging_ports.station_id = charging_stations.station_id WHERE user_id = ?", [req.body.user_id]);
        return res.json({ "message": sessionsData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const countAllUserChargingSessions = async (req, res)=>{
    //query returns counted quantity of all user`s charging sessions
    try
    {
        const [sessionsData] = await con.execute('SELECT count(session_id) as "quantity" FROM charging_sessions WHERE user_id = ?', [req.body.user_id]);
        return res.json({ "message": sessionsData[0].quantity, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}