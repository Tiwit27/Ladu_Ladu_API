import con from "../connection.js";
import { checkIfVehicleNameIsInDB } from "../functions/checkIfVehicleNameIsInDB.js";

//adding new vehicle, only by prefab, not other. But this can be extended with adding own vehicles
export const addVehicle = async (req, res)=>{
    try
    {
        //check if the name which user select is not in his db of vehicles
        await con.query("START TRANSACTION");
        const [checkVehicleName] = await con.execute('SELECT count(*) as "check" FROM vehicles WHERE name = ? AND user_id = ?', [req.body.name, req.body.user_id]);
        if(checkVehicleName[0].check > 0)
        {
            throw new Error("Użytkownik już posiada samochód o tej nazwie");
        }
        let insertData;
        //add vehicle based on prefab
        if(req.body.prefab_id != -1)
        {
            //select information from prefab
            const [prefabData] = await con.execute("SELECT * FROM prefab_vehicles WHERE prefab_id = ?",[req.body.prefab_id]);
            //insert information to vehicles
            [insertData] = await con.query("INSERT INTO vehicles (user_id, name, battery_capacity, max_charging_power_ac, max_charging_power_dc, dc_plug_type) VALUES (?,?,?,?,?,?)",[req.body.user_id,req.body.name, prefabData[0].battery_capacity, prefabData[0].max_charging_power_ac, prefabData[0].max_charging_power_dc, prefabData[0].dc_plug_type]);
        }
        //add new vehicle, not from prefabs list
        else
        {
            //check is battery_capacity is not too much or is not less than 0
            if(req.body.battery_capacity >= 300 || req.body.battery_capacity <= 0)
            {
                throw new Error("Zła pojemność baterii");
            }
            //check is max_charging_power_ac is not too much or is not less than 0
            if(req.body.max_charging_power_ac >= 50 || req.body.max_charging_power <= 0)
            {
                throw new Error("Zła maksymalna moc ładowania AC");
            }
            let values
            //check if vehicle support DC type of charging
            if(req.body.dc_plug_type == 'null')
            {
                //if not, set max_charging_power_dc and dc_plug_type to null
                values = [req.body.user_id, req.body.name, req.body.battery_capacity, req.body.max_charging_power_ac, null, null];
            }
            else
            {
                //check is max_charging_power_ac is not too much or is not less than 0
                if(req.body.max_charging_power_dc >= 400 || req.body.max_charging_power <= 0)
                {
                    throw new Error("Zła maksymalna moc ładowania DC");
                }
                //if support, set data from req to mysql query
                values = [req.body.user_id, req.body.name, req.body.battery_capacity, req.body.max_charging_power_ac, req.body.max_charging_power_dc, req.body.dc_plug_type];
            }
            [insertData] = await con.execute("INSERT INTO vehicles (user_id, name, battery_capacity, max_charging_power_ac, max_charging_power_dc, dc_plug_type) VALUES (?,?,?,?,?,?)",values);
        }
        //commit 
        await con.query("COMMIT");
        //return res
        return res.json({"message": insertData, "success": true });
    }
    catch(error)
    {
        //if was any error rollback and return false
        await con.query("ROLLBACK");
        return res.json({"message": error.message, "success": false })
    }
}

export const updateVehicle = async (req, res)=>{
    //check if vehicle is in db and return resolve or reject
    try
    {
        const [vehicleData] = await con.execute('SELECT count(*) as "check" FROM vehicles WHERE name = ? AND user_id = ? AND vehicle_id != ?', [req.body.name, req.body.user_id, req.body.vehicle_id]);
        //if response is more than 0 means that user have vehicle with this name
        if(vehicleData[0].check > 0)
        {
            throw new Error("Użytkownik już posiada samochód o tej nazwie");
        }
        //check is battery_capacity is not too much or is not less than 0
        if(req.body.battery_capacity >= 300 || req.body.battery_capacity <= 0)
        {
            throw new Error("Zła pojemność baterii");
        }
        //check is max_charging_power is not too much or is not less than 0
        if(req.body.max_charging_power_ac >= 50 || req.body.max_charging_power_ac <= 0)
        {
            throw new Error("Zła maksymalna moc ładowania AC");
        }
        let q;
        let values;
        //update vehicle with given data
        if(req.body.dc_plug_type == null)
        {
            //if not, set max_charging_power_dc and dc_plug_type to null
            q = 'UPDATE vehicles SET name = ?, battery_capacity = ?, max_charging_power_ac = ? WHERE vehicle_id = ?';
            values = [req.body.name, req.body.battery_capacity, req.body.max_charging_power_ac, req.body.vehicle_id];
        }
        else
        {
            //check is max_charging_power is not too much or is not less than 0
            if(req.body.max_charging_power_dc >= 400 || req.body.max_charging_power_dc <= 0)
            {
                throw new Error("Zła maksymalna moc ładowania DC");
            }
            //if is, set max_charging_power_dc and dc_plug_type to data from req
            q = 'UPDATE vehicles SET name = ?, battery_capacity = ?, max_charging_power_ac = ?, max_charging_power_dc = ?, dc_plug_type = ? WHERE vehicle_id = ?';
            values = [req.body.name, req.body.battery_capacity, req.body.max_charging_power_ac, req.body.max_charging_power_dc, req.body.dc_plug_type, req.body.vehicle_id];
        }
        const [updateVehicleData] = await con.execute(q, values);
        return res.json({"message": updateVehicleData, "success": true })
    }
    catch(error)
    {
        return res.json({"message": error.message, "success": false })
    }
}

export const deleteVehicle = async (req, res)=>{
    try
    {
        const [vehicleData] = await con.execute("DELETE FROM vehicles WHERE vehicle_id = ?", [req.body.vehicle_id]);
        if(vehicleData.affectedRows == 0)
        {
            //if is not any error but anyone is deleted means that station_id was wrong
            throw new Error("Nie ma samochodu o podanym id");
        }
        return res.json({"message": vehicleData, "success": true })
    }
    catch(error)
    {
        return res.json({"message": error.message, "success": false })
    }
}

export const getVehicleData = async (req, res)=>{
    //return all data about vehicle with given vehicle_id
    try
    {
        const [vehicleData] = await con.execute("SELECT * FROM vehicles WHERE vehicle_id =  ?", [req.body.vehicle_id]);
        if(vehicleData.length == 0)
        {
            //if is not any error but anyone is deleted means that station_id was wrong
            throw new Error("Nie ma samochodu o podanym id");
        }
        return res.json({"message": vehicleData, "success": true })
    }
    catch(error)
    {
        return res.json({"message": error.message, "success": false })
    }
}

export const getAllUserVehicles = async (req, res)=>{
    //return all data about user`s vehicles
    try
    {
        const [vehicleData] = await con.execute("SELECT * FROM vehicles WHERE user_id = ?", [req.body.user_id]);
        return res.json({"message": vehicleData, "success": true })
    }
    catch(error)
    {
        return res.json({"message": error.message, "success": false })
    }
}

export const countAllUserVehicles = async (req, res)=>{
    //return counted quantity of user`s vahicles
    try
    {
        const [vehicleData] = await con.execute('SELECT count(vehicle_id) as "quantity" FROM vehicles WHERE user_id = ?', [req.body.user_id]);
        return res.json({"message": vehicleData[0].quantity, "success": true })
    }
    catch(error)
    {
        return res.json({"message": error.message, "success": false })
    }
}