import con from "../connection.js";

export async function checkIfUserIsSuperAdmin(user_id) {
    //checking if the user with the given user_id is super_admin. If is, return true else return false
    try
    {
        const [usersData] = await con.execute('SELECT super_admin as "check" FROM users WHERE user_id = ?', [user_id]);
        if(usersData.length == 0)
        {
            throw new Error("Tego użytkownika nie ma w bazie danych");
        }
        return usersData[0].check;
    }
    catch(error)
    {
        throw new Error(error.message);
    }
}