import con from "../connection.js";

export async function checkIfEmailIsInDatabase(email) {
    try
    {
        const [selectData] = await con.execute("SELECT COUNT(email) as 'check' FROM users WHERE email = ?", [email]);
        return selectData[0].check;
    }
    catch(error)
    {
        throw new Error(error.message);
    }
}