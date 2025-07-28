import con from "../connection.js";
import { changePasswordOnDB } from "../functions/changePasswordOnDB.js"
import { checkIfEmailIsInDatabase } from "../functions/checkIfEmailIsInDatabase.js";
import { regexEmail } from "../functions/regexEmail.js";
import { regexPassword } from "../functions/regexPassword.js";
import generator from 'generate-password'
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

//dotenv
dotenv.config();

//nodemailer
const nodemailerEmail = "zs6interpares@gmail.com";
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: nodemailerEmail,
        pass: "fluf zvls mpms ejio"
    },
    tls: {
        rejectUnauthorized: false,
    },
})

export const login = async (req, res) => {
    try
    {
        //select data from users
        const [selectData] = await con.execute("SELECT * FROM users WHERE email = ?", [req.body.email]);
        //if user with this email is not found throw error
        if(selectData.length == 0)
        {
            throw new Error("Błędny adres email");
        }
        //match hashed password with password given by user
        const isMatch = await bcrypt.compare(req.body.password, selectData[0].password);
        //if is wrong, throw error
        if(!isMatch)
        {
            throw new Error("Błędne hasło");
        }
        const token = await jwt.sign({email: req.body.email, id: selectData[0].user_id, tokenVersion: selectData[0].token_version}, process.env.SECRET_KEY, {expiresIn: '7d'});
        //if all was good, return selectData and true
        return res.json({ "message": selectData, "auth_token": token,"success": true });
    }
    catch(error)
    {
        //return error.message
        return res.json({ "message": error.message, "success": false }); 
    }
}

export const register = async (req, res) => {

    try
    {
        //required pattern of email
        if (!regexEmail(req.body.email)) {
            throw new Error("Email został podany w złej formie");
        }
        //required pattern of password
        if (!regexPassword(req.body.password)) {
            throw new Error("Hasło zostało podane w złej formie");
        }
        //call function for check if this email is not in database
        const isEmailInDB = await checkIfEmailIsInDatabase(req.body.email);
         //if is more than 0, the email is already registered
        if (isEmailInDB > 0) {
            throw new Error("Użytkownik z takim emailem jest już zarejestrowany");
        }
        //create hashed password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        //else if 0, means that the email is not in database
        const [insertData] = await con.execute("INSERT INTO users(name, surname, email, password) values (?,?,?,?)", [req.body.name, req.body.surname, req.body.email, hashedPassword]);
        //create token
        const token = await jwt.sign({email: req.body.email, id: insertData.insertId, tokenVersion: 0}, process.env.SECRET_KEY, {expiresIn: '7d'});
        return res.json({ "message": insertData, "auth_token": token,"success": true });
    }
    catch(error)
    {
        //if error return false
        return res.json({ "message": error.message, "success": false });
    }
}

export const resetPassword = async (req, res) => {
    try
    {
        //start transaction for do a few queries on one time
        await con.query("START TRANSACTION");
        //check email
        const isEmailInDB = await checkIfEmailIsInDatabase(req.body.email);
        if(isEmailInDB == 0)
        {
            //if return 0, throw error
            throw new Error("Użytkownik z takim emailem nie jest zarejestrowany");
        }
        //select data for next query
        const [userData] = await con.execute("SELECT user_id, name FROM users WHERE email = ?", [req.body.email]);
        //generate new password
        var password = generator.generate({
            length: 10,
            numbers: true
        });
        //call function which change old password to new generated in database
        const changePassword = await changePasswordOnDB(password, req.body.email);
        if(!changePassword)
        {
            //if error throw it
            throw new Error("Zmiana hasła nie powiodła się");
        }
        //set new token version
        con.execute("UPDATE users SET token_version = token_version + 1 WHERE user_id = ?", [userData[0].user_id]);
        //settings about mail which will be send to user
        var mailOptions = {
            from: nodemailerEmail,
            to: req.body.email,
            subject: "Resetowanie Hasła",
            attachments: [{
                filename: 'logo_nazwa.png',
                path: './logo_nazwa.png',
                cid: 'logo'
           }],
            html: `
                <!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset hasła - Ładu Ładu</title>
    <style>
        @font-face {
            font-family: 'NightClubBTNRegular';
            src: url('cid:NightclubBTNRegular.ttf');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
        }
        
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .logo {
            height: 70px;
        }
        .brand-name {
            font-family: 'NightClubBTNRegular', Arial, sans-serif;
            font-size: 28px;
            margin-left: 15px;
            color: #ff8c09;
        }
        .content {
            padding: 30px 20px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #ff8c09;
        }
        .button {
            display: inline-block;
            background-color: #ff8c09;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #e37900;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #777777;
        }
        .temp-password-box {
            background-color: #fff4e1;
            border: 2px solid #ff8c09;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        .temp-password {
            font-family: monospace;
            font-size: 24px;
            font-weight: bold;
            color: #ff8c09;
            letter-spacing: 2px;
            margin: 10px 0;
        }
        .steps {
            margin: 25px 0;
        }
        .step {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        .step-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            background-color: #ff8c09;
            color: white;
            border-radius: 50%;
            font-weight: bold;
            margin-right: 15px;
        }
        @media (prefers-color-scheme: dark) {
            body {
                background-color: #1a1b1e;
                color: #c1c2c5;
            }
            .container {
                background-color: #25262b;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            }
            .title {
                color: #ff8c09;
            }
            .button {
                background-color: #ff8c09;
            }
            .button:hover {
                background-color: #e37900;
            }
            .footer {
                color: #909296;
                border-top: 1px solid #373a40;
            }
            .temp-password-box {
                background-color: #2c2417;
                border-color: #ff8c09;
            }
            .temp-password {
                color: #ff8c09;
            }
            .step-number {
                background-color: #ff8c09;
            }
            .header {
                border-bottom: 1px solid #373a40;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="display: flex; align-items: center; justify-content: center;">
                <img src="cid:logo" alt="Ładu Ładu" class="logo">
            </div>
        </div>
        <div class="content">
            <h1 class="title">Reset hasła</h1>
            <p>Witaj ${userData[0].name}!</p>
            <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w aplikacji Ładu Ładu.</p>
            
            <p>Poniżej znajduje się Twoje tymczasowe hasło:</p>
            
            <div class="temp-password-box">
                <p class="temp-password">${password}</p>
            </div>
            
            <div class="steps">
                <h3>Jak zresetować hasło:</h3>
                <div class="step">
                    <span class="step-number">1</span>
                    <span>Zaloguj się do aplikacji Ładu Ładu używając tymczasowego hasła</span>
                </div>
                <div class="step">
                    <span class="step-number">2</span>
                    <span>Po zalogowaniu przejdź do zakładki profil i kliknij przycisk "Edytuj dane"</span>
                </div>
                <div class="step">
                    <span class="step-number">3</span>
                    <span>Wprowadź i potwierdź swoje nowe hasło, zatwierdź klikając "Zaktualizuj dane"</span>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="https://ckz3.jastrzebie.pl/login" class="button">Przejdź do aplikacji</a>
            </div>
            
            <p>Pozdrawiamy,<br>Zespół Ładu Ładu</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 Ładu Ładu. Wszystkie prawa zastrzeżone.</p>
            <p>Ta wiadomość została wygenerowana automatycznie, prosimy na nią nie odpowiadać.</p>
        </div>
    </div>
</body>
</html>`
        }
        //send mail with option above
        await transporter.sendMail(mailOptions);
        //commit
        await con.query("COMMIT");
        return res.json({ "message": "Hasło zostało zmieniony", "success": true });
    }
    catch(error)
    {
        //rollback and return false
        con.query("ROLLBACK");
        return res.json({ "message": error.message, "success": false });
    }
}

export const automaticLogin = async (req, res)=>{
    //function for login when token is active
    try
    {
        //take data to next query
        const [userData] = await con.execute("SELECT token_version FROM users WHERE user_id = ?", [req.user.id]);
        //check version in token with version in DB
        if(req.user.tokenVersion != userData[0].token_version)
        {
            //if versions are different, throw error
            throw new Error("Dane użytkownika zostały zmienione. Wymaga ponownego zalogowania.");
        }
        //if versions are the same, return new token for user
        const token = await jwt.sign({email: req.user.email, id: req.user.user_id, tokenVersion: req.user.token_version}, process.env.SECRET_KEY, {expiresIn: '7d'});
        return res.json({ "message": token, "success": true , "token": true});
    }
    catch(error)
    {
        //return success false
        return res.json({ "message": error.message, "success": false , "token": false});
    }
}