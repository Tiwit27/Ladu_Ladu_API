import con from "../connection.js";

export const getPrefabVehicle = async (req, res)=>{
    try{
        //get data about prefab by prefab_id
        const [data] = await con.execute("SELECT * FROM prefab_vehicles WHERE prefab_id = ?", [req.body.prefab_id]);
        if(data.length == 0)
        {
            throw new Error("Nie ma prefaba o takim id");
        }
        return res.json({"message": data, "success": true});
    }
    catch(error)
    {
        return res.json({"message": error.message, "success": false})
    }
}

export const getAllPrefabVehicles = async (req, res)=>{
    try
    {
        //get all prefabs data
        const [data] = await con.query("SELECT * FROM prefab_vehicles");
        return res.json({"message": data, "success": true});
    }
    catch(error)
    {
        return res.json({"message": error.message, "success": false})
    }
}