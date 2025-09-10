import con from "../connection.js";
import { checkIfUserIsSuperAdmin } from "../functions/checkIfUserIsSuperAdmin.js";
import { regexPassword } from "../functions/regexPassword.js";
import bcrypt from "bcrypt";

export const getUserData = async (req, res) => {
    //query return all informations about user;
    try
    {
        const [usersData] = await con.execute("SELECT user_id, name, surname, email, admin, points FROM users WHERE email = ?", [req.body.email]);
        if (usersData.length == 0) {
            //if email is not in db, query return false
            throw new Error("Nie ma użytkownika z podanym emailem");
        }
        return res.json({ "message": usersData, "success": true })
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false })
    }
}

export const getUserDataByUserId = async (req, res)=>{
    //query return all informations about user;
    try
    {
        const [usersData] = await con.execute("SELECT user_id, name, surname, email, admin, points FROM users WHERE user_id = ?", [req.body.user_id]);
        if (usersData.length == 0) {
            //if email is not in db, query return false
            throw new Error("Nie ma użytkownika o podanym id");
        }
        return res.json({ "message": usersData, "success": true })
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false })
    }
}

export const updateUserData = async (req, res)=>{
    //required pattern of password
    try
    {
        if (!regexPassword(req.body.password)) {
            throw new Error("Hasło nie zostało podane w poprawnej formie");
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const [usersData] = await con.execute("UPDATE users SET name = ?, surname = ?, email = ?,password = ?, token_version = token_version + 1 WHERE user_id = ?", [req.body.name, req.body.surname, req.body.email, hashedPassword, req.body.user_id]);
        return res.json({ "message": usersData, "success": true })
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const changeAdminStatus = async (req, res)=>{
    //check if user which one want to add admin, is super admin. If is, promise return true
    try
    {
        const [usersData] = await con.execute("UPDATE users SET admin = !admin WHERE user_id = ?", [req.body.user_id]);
        if(usersData.affectedRows == 0)
        {
            throw new Error("Użytkownik o podanym id nie istnieje");
        }
        return res.json({ "message": usersData, "success": true })
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false })
    }
}

export const getUserPoints = async (req, res)=>
{
    try
    {
        //return user`s points
        const [points] = await con.execute("SELECT points FROM users WHERE user_id = ?", [req.body.user_id]);
        return res.json({ "message": points[0].points, "success": true })
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false })
    }
}