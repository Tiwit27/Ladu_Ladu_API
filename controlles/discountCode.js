import con from "../connection.js";
import generator from "generate-password";
import nodemailer from "nodemailer";

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

export const generateDicountCode = async (req, res)=>{
    try
    {
        //check if precent is more or equal 0% and if is less or equal 100%
        if(req.body.percent_of_discount <= 0)
        {
            throw new Error("Procent rabatu nie może być niższy niż 0%");
        }
        if(req.body.percent_of_discount > 100)
        {
            throw new Error("Procent rabatu nie może być wyższy niż 100%");
        }
        let code;
        while(true)
        {
            //generate as long as code is not unique
            code = generator.generate({length: 10, numbers: true});
            let [codesData] = await con.execute('SELECT count(*) as "check" FROM discount_codes WHERE code = ?',[code]);
            if(codesData[0].check == 0)
            {
                //if is unique, brake
                break;
            }
        }
        //set transaction for easy rollback all changes
        await con.query("START TRANSACTION");
        //insert new code
        await con.execute("INSERT INTO discount_codes (code, percent_of_discount, user_id) VALUES (?,?,?)", [code, req.body.percent_of_discount, req.body.user_id]);
        //select data about user
        const [usersData] = await con.execute("SELECT email, name,points FROM users WHERE user_id = ?", [req.body.user_id]);
        if(usersData[0].points < req.body.points)
        {
            //if user's points are less than points need to get dicount code, throw error and rollback changes
            throw new Error("Użytkownik nie posiada tyle punktów");
        }
        //if user have more points, take the points from user db
        const points = usersData[0].points - req.body.points;
        //set new points
        await con.execute("UPDATE users SET points = ? WHERE user_id = ?", [points, req.body.user_id]);
        //commit
        await con.query("COMMIT");
        //send discount code to user`s mail
        var mailOptions = {
            from: nodemailerEmail,
            to: usersData[0].email,
            subject: "Kod Rabatowy",
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
                    <title>Twój kod rabatowy - Ładu Ładu</title>
                    <style>
                        @font-face {
                            font-family: 'NightClubBTNRegular';
                            src: url('cid:NightclubBTNRegular');
                            font-weight: normal;
                            font-style: normal;
                            font-display: swap;
                        }
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
                            sans-serif;
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
                            height: auto;
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
                        .discount-box {
                            background-color: #fff9f0;
                            border: 2px dashed #ff8c09;
                            border-radius: 8px;
                            padding: 20px;
                            margin: 25px 0;
                            text-align: center;
                        }
                        .discount-code {
                            font-size: 28px;
                            font-weight: bold;
                            color: #ff8c09;
                            letter-spacing: 2px;
                            margin: 10px 0;
                        }
                        .discount-value {
                            font-size: 20px;
                            font-weight: bold;
                            color: #333333;
                            margin: 10px 0;
                        }
                        .expiry {
                            font-size: 14px;
                            color: #777777;
                            margin-top: 10px;
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
                        .steps {
                            margin: 25px 0;
                        }
                        .step {
                            margin-bottom: 15px;
                        }
                        .step-number {
                            display: inline-block;
                            width: 25px;
                            height: 25px;
                            background-color: #ff8c09;
                            color: white;
                            border-radius: 50%;
                            text-align: center;
                            line-height: 25px;
                            margin-right: 10px;
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
                            .discount-box {
                                background-color: #2c2417;
                                border-color: #ff8c09;
                            }
                            .discount-code {
                                color: #ff8c09;
                            }
                            .discount-value {
                                color: #c1c2c5;
                            }
                            .expiry {
                                color: #909296;
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
                                <img src="cid:logo" alt="Ładu Ładu"  style="height: 70px;" class="logo">
                            </div>
                        </div>
                        <div class="content">
                            <h1 class="title">Twój kod rabatowy</h1>
                            <p>Witaj ${usersData[0].name}!</p>
                            <p>Dziękujemy za korzystanie z naszej aplikacji Ładu Ładu.</p>
                            
                            <div class="discount-box">
                                <p class="discount-code">${code}</p>
                                <p class="discount-value">${req.body.percent_of_discount}% zniżki</p>
                            </div>
                            
                            <div class="steps">
                                <h3>Jak wykorzystać kod rabatowy:</h3>
                                <div class="step">
                                    <span class="step-number">1</span>
                                    <span>Zaloguj się do aplikacji Ładu Ładu</span>
                                </div>
                                <div class="step">
                                    <span class="step-number">2</span>
                                    <span>Podczas płatności za ładowanie, wprowadź kod w polu "Kod rabatowy"</span>
                                </div>
                                <div class="step">
                                    <span class="step-number">3</span>
                                    <span>Kliknij "Zapłać" i ciesz się zniżką!</span>
                                </div>
                            </div>
                            
                            <div style="text-align: center;">
                                <a href="https://ckz3.jastrzebie.pl/main/payments" class="button">Przejdź do aplikacji</a>
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
        return res.json({ "message": code, "success": true });
    }
    catch(error)
    {
        await con.query("ROLLBACK");
        return res.json({ "message": error.message, "success": false });
    }
}

export const getAllUserNotUsedDiscountCodes = async (req, res)=>{
    try
    {
        //return all user`s not used codes
        const [codesData] = await con.execute("SELECT code, percent_of_discount FROM discount_codes WHERE user_id = ? AND is_used = 0", [req.body.user_id]);
        return res.json({ "message": codesData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}