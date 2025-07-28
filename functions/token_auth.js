import jwt from "jsonwebtoken";

globalThis.tokens = {};

export function verifyToken(req,res, next)
{
    //get token from req.headers
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) 
    {
        //if in headers is not token return success false
        return res.json({ "message": "Token nie został wysłany", "success": false , "token": false});
    }
    //verify token
    jwt.verify(token, process.env.SECRET_KEY, (error, user) => {
        if (error) 
        {
            //if token is wrong, return success false
            return res.json({ "message": "Błędny, lub stary token", "success": false , "token": false});
        }
        //set data about user from token to req.user
        req.user = user;
        //call next function
        next();
    });
}