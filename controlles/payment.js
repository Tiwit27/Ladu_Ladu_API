import con from "../connection.js";
import { getActualDateTimeInDBFormat } from "../functions/getActualDateTimeInDBFormat.js";

export const getAllUserPayments = async (req, res)=>{
    try
    {
        //returns all user`s payments, paid and not paid
        const [queryData] = await con.execute("SELECT payment_id, charging_stations.address , vehicles.name, payments.session_id, issue_time, payment_time, amount, discount_code FROM payments INNER JOIN charging_sessions ON payments.session_id = charging_sessions.session_id INNER JOIN vehicles ON charging_sessions.vehicle_id = vehicles.vehicle_id INNER JOIN charging_ports ON charging_sessions.port_id = charging_ports.port_id INNER JOIN charging_stations ON charging_ports.station_id = charging_stations.station_id WHERE charging_sessions.user_id = ? AND payment_time is not null", [req.body.user_id]);
        return res.json({ "message": queryData, "success": true })
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false })
    }
}

export const getAllUserUnpaidPayments = async (req, res)=>{
    try
    {
        //return only unpaid user`s payments
        const [queryData] = await con.execute("SELECT payment_id, charging_stations.address , vehicles.name, payments.session_id, issue_time, payment_time, amount, discount_code FROM payments INNER JOIN charging_sessions ON payments.session_id = charging_sessions.session_id INNER JOIN vehicles ON charging_sessions.vehicle_id = vehicles.vehicle_id INNER JOIN charging_ports ON charging_sessions.port_id = charging_ports.port_id INNER JOIN charging_stations ON charging_ports.station_id = charging_stations.station_id WHERE charging_sessions.user_id = ? AND payment_time is null", [req.body.user_id]);
        return res.json({ "message": queryData, "success": true })
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false })
    }
}

export const payPayment = async (req, res)=>{
    try
    {
        //create actual timestamp
        const timestamp = getActualDateTimeInDBFormat();
        //select data for next query
        const [queryData] = await con.execute("SELECT payment_time, amount FROM payments WHERE payment_id = ?", [req.body.payment_id]);
        if(queryData[0].payment_time != null)
        {
            //if payment time is not null, throw error
            throw new Error("Ta płatność jest już opłacona");
        }
        //if payment got discount code
        if(req.body.discount_code.trim().length != 0)
        {
            //select data about code
            const [discountCodeData] = await con.execute("SELECT code_id, percent_of_discount, is_used, user_id FROM discount_codes WHERE code = ?", [req.body.discount_code]);
            if(discountCodeData.length == 0 || discountCodeData[0].user_id != req.body.user_id)
            {
                //if code is not good, throw error
                throw new Error("Błędny kod rabatowy");
            }
            if(discountCodeData[0].is_used == 1)
            {
                //if code is used, throw error
                throw new Error("Ten kod rabatowy został już wykorzystany");
            }
            //calculate new amount
            const newAmount = queryData[0].amount * ((100 - discountCodeData[0].percent_of_discount) / 100);
            //new transaction for easy rollback
            await con.query("START TRANSACTION");
            //set payment paid
            await con.execute("UPDATE payments SET payment_time = ?, discount_code = ?, amount = ? WHERE payment_id = ?", [timestamp, discountCodeData[0].code_id, newAmount,req.body.payment_id]);
            //set discount code used
            await con.execute("UPDATE discount_codes SET is_used = 1 WHERE code_id = ?", [discountCodeData[0].code_id]);
            //commit for save changes
            await con.query("COMMIT");
            return res.json({ "message": newAmount, "success": true })
        }
        //if payment havent discount code, set payment paid
        await con.execute("UPDATE payments SET payment_time = ? WHERE payment_id = ?", [timestamp, req.body.payment_id]);
        return res.json({ "message": queryData[0].amount, "success": true });
    }
    catch(error)
    {
        await con.query("ROLLBACK");
        return res.json({ "message": error.message, "success": false });
    }
}

export const getDataForFacture = async (req, res)=>{
    try
    {
        //return data for facture
        const [factureData] = await con.execute("SELECT payments.session_id, payments.issue_time, payments.payment_time, payments.amount, discount_codes.percent_of_discount, charging_sessions.start, charging_sessions.energy_used, charging_sessions.total_cost, charging_stations.address, charging_ports.plug_type, energy_rates.rate, vehicles.name FROM payments INNER JOIN charging_sessions ON payments.session_id = charging_sessions.session_id LEFT JOIN discount_codes ON payments.discount_code = discount_codes.code_id INNER JOIN charging_ports ON charging_sessions.port_id = charging_ports.port_id INNER JOIN charging_stations ON charging_ports.station_id = charging_stations.station_id INNER JOIN vehicles ON charging_sessions.vehicle_id = vehicles.vehicle_id INNER JOIN energy_rates ON charging_stations.station_id = energy_rates.station_id AND energy_rates.plug_type = charging_ports.plug_type WHERE payments.payment_id = ? LIMIT 1", [req.body.payment_id]);
        if(factureData.affectedRows == 0)
        {
            throw new Error("Błędny payment_id");
        }
        return res.json({ "message": factureData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}