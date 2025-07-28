import con from "../connection.js";
import {getActualDateTimeInDBFormat} from "../functions/getActualDateTimeInDBFormat.js";
import jwt from "jsonwebtoken";
import { verifyToken } from "../functions/token_auth.js";

export const addChargingPort = async (req, res)=>{
    //checking if the station_id is already in the database. If is, return 1 else return 0
    try
    {
        await con.query("START TRANSACTION");
        //check if port with choose plug type is already on this station
        const [selectData] = await con.execute('SELECT count(*) as "check" FROM charging_ports WHERE station_id = ? AND plug_type = ?',[req.body.station_id, req.body.plug_type]);
        if(selectData[0].check == 0)
        {
            //if not, check if req include rate
            if(isNaN(req.body.rate))
            {
                //if not, throw error
                throw new Error("Cena nie może być pusta");
            }
            //set actual timestamp
            const timestamp = getActualDateTimeInDBFormat();
            //add new energy rate
            await con.execute("INSERT INTO energy_rates (station_id, rate, plug_type, start) VALUES (?,?,?,?)", [req.body.station_id, req.body.rate, req.body.plug_type, timestamp]);
        }
        //insert new port
        const [insertData] = await con.execute("INSERT INTO charging_ports (station_id, max_power, status, plug_type) VALUES (?,?,?,?)", [req.body.station_id, req.body.max_power, req.body.status, req.body.plug_type]);
        await con.query("COMMIT");
        //return success
        return res.json({ "message": insertData, "success": true});
    }
    catch(error)
    {
        await con.query("ROLLBACK");
        return res.json({ "message": error.message, "success": false })
    }
}

export const deleteChargingPort = async (req, res)=>{
    try
    {
        //delete charging port
        const [deleteData] = await con.execute("DELETE FROM charging_ports WHERE port_id = ?", [req.body.port_id]);
        if(deleteData.affectedRows == 0)
        {
            //if query was good but affectedRows was 0, means that sth was wrong, we return success false
            throw new Error("Złe id portu");
        }
        return res.json({ "message": deleteData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const updateChargingPort = async (req, res)=>{
    try
    {
        const [updateData] = await con.execute("UPDATE charging_ports SET max_power = ?, status =  ?, plug_type = ? WHERE port_id = ?", [req.body.max_power, req.body.status, req.body.plug_type, req.body.port_id]);
        if(updateData.affectedRows == 0)
        {
            //if query was good but affectedRows was 0, means that sth was wrong, we return success false
            throw new Error("Błędne dane");
        }
        return res.json({ "message": updateData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const getChargingPortData = async (req, res)=>{
    try
    {
        //get data about charging port with given port_id
        const [selectData] = await con.execute("SELECT * FROM charging_ports WHERE port_id = ?", [req.body.port_id]);
        return res.json({ "message": selectData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }

}

export const getAllChargingPorts = async (req, res)=>{
    //return all data from charging_ports table
    try
    {
        const [selectData] = await con.query("SELECT * FROM charging_ports");
        return res.json({ "message": selectData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const getAllChargingPortsInStation = async (req, res)=>{
    //return table of all ports inside station with given station_id
    try
    {
        const [selectData] = await con.execute("SELECT * FROM charging_ports WHERE station_id = ?", [req.body.station_id]);
        return res.json({ "message": selectData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const getGroupAllChargingPorts = async (req, res)=>{
    try
    {
        //get specified data about ports, rates, stations group together
        const [selectData] = await con.query(`SELECT charging_ports.station_id, max_power, charging_ports.plug_type, rate, COUNT(CASE WHEN charging_ports.status = 'free' THEN 1 END) as "free", count(*) as "all" FROM charging_ports INNER JOIN energy_rates ON energy_rates.station_id = charging_ports.station_id AND energy_rates.plug_type = charging_ports.plug_type AND energy_rates.end is null GROUP BY charging_ports.station_id, charging_ports.plug_type, charging_ports.max_power`);
        return res.json({ "message": selectData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}