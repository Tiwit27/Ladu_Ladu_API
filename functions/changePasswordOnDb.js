import con from "../connection.js";
import bcrypt from "bcrypt";

export async function changePasswordOnDB(password, email) {
    //changing password in database in account with providet email. If success - return true, else return false
    try
    {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [updateData] = await con.execute("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);
        if(updateData.affectedRows == 0)
        {
            return false;
        }
        return true;
    }
    catch(error)
    {
        throw new Error(error.message);
    }
}