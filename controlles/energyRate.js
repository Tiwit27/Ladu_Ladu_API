import con from "../connection.js";
//getActualDateTimeInDBFormat returns data in format for db, like: YYYY-MM-DD HH-mm-ss
import {getActualDateTimeInDBFormat } from "../functions/getActualDateTimeInDBFormat.js";

export const addEnergyRate = async (req, res)=>{
    //query adding new record in energy_rate table
    try
    {
        const [ratesData] = await con.execute("INSERT INTO energy_rates(station_id, rate, start, plug_type) VALUES (?,?,?,?)", [req.body.station_id, req.body.rate, getActualDateTimeInDBFormat(), req.body.plug_type]);
        return res.json({"message":ratesData,"success":true});
    }
    catch(error)
    {
        return res.json({"message":error.message,"success":false});
    }
}

export const updateEnergyRate = async (req,res)=>{
    try 
    {
        //get actual datetime in db pattern
        var datetime = getActualDateTimeInDBFormat();
        //start transaction
        await con.query('START TRANSACTION');
        //query which end old rate of energy and as end datetime set actual datetime
        await con.execute('UPDATE energy_rates SET end = ? WHERE rate_id = ?', [datetime, req.body.rate_id]);
        //get data from energy_rates with given rate_Id
        const [energyRatesData] = await con.execute("SELECT station_id, plug_type FROM energy_rates WHERE rate_id = ?",[req.body.rate_id]);
        //query which start new rate of energy and as start datetime set actual datetime
        await con.execute('INSERT INTO energy_rates(station_id, rate, start, plug_type) VALUES (?, ?, ?, ?)', [energyRatesData[0].station_id, req.body.rate, datetime, energyRatesData[0].plug_type]);
        //commit query
        await con.query('COMMIT');
        //if all was good, we can return success: true 
        res.json({"message":"Cena energi została zmieniona","success":true})
    } 
    catch (error) 
    {
        //if was any error, query was rollback and all changes is not commited to db
        await con.query('ROLLBACK');
        res.json({"message":error.message,"success":false})
    }
}

export const getAllEnergyRates = async (req, res)=>{
    //get all energy rates in table
    try
    {
        const [ratesData] = await con.query("SELECT * FROM energy_rates WHERE end is null");
        return res.json({"message":ratesData,"success":true});
    }
    catch(error)
    {
        return res.json({"message":error.message,"success":false});
    }
}

export const getAllEnergyRatesOnStation = async (req,res)=>{
    //get all energy rates on station with station_id
    try
    {
        const [ratesData] = await con.execute("SELECT * FROM energy_rates WHERE station_id = ? AND end is null", [req.body.station_id]);
        return res.json({"message":ratesData,"success":true});
    }   
    catch(error)
    {
        return res.json({"message":error.message,"success":false});
    }
}