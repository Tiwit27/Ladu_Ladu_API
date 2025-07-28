import con from "../connection.js";

export async function checkIfVehicleNameIsInDB(user_id, name)
{
    //check if vehicle is in db and return resolve or reject
    try
    {
        const [vehiclesData] = con.execute('SELECT count(*) as "check" FROM vehicles WHERE name = ? AND user_id = ?', [name, user_id]);
        return vehiclesData[0].check;
    }
    catch(error)
    {
        throw new Error(error.message);
    }
}
