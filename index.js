//imports and settings
import express from 'express'
import con from "./connection.js";
import cors from 'cors'
import { heartbeat } from "./heartbeat.js";


//express
const app = express();
const port = 8800;

//local imports
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import chargingStationsRoutes from "./routes/chargingStations.js";
import energyRatesRoutes from "./routes/energyRates.js";
import vehiclesRoutes from "./routes/vehicles.js";
import chargingPortsRoutes from "./routes/chargingPorts.js";
import chargingSessionsRoutes from "./routes/chargingSessions.js";
import schedulesRoutes from "./routes/schedules.js";
import prefabVehiclesRoutes from "./routes/prefabVehicles.js";
import paymentsRoutes from "./routes/payments.js";
import discountCodesRoutes from "./routes/discountCodes.js";
import statisticsRoutes from "./routes/statistics.js";
import backupsRoutes from "./routes/backups.js";
import { verifyToken } from './functions/token_auth.js';
import { getActualDateTimeInDBFormat } from './functions/getActualDateTimeInDBFormat.js';
import { pullSchedules } from './pullSchedules.js';
import { automaticCheckSchedule } from './automaticCheckSchedule.js';

//express settings
app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json())


// test
app.listen(port, '0.0.0.0',async () => {
    try
    {
        console.log("Listening on port " + port);
        const [data] = await con.query("SELECT session_id FROM charging_sessions WHERE end is null");
        data.forEach(async element => {
            //get date in YYYY-MM-DD HH:mm:ss for use it as timestamp in mysql query
            const datetime = getActualDateTimeInDBFormat();
            //start transaction
            await con.query('START TRANSACTION');
            //query which set end datetime in charging_sessions table
            await con.execute('UPDATE charging_sessions SET end = ? WHERE session_id = ?', [datetime, element.session_id]);
            //query which select data from charging_sessions which are need to next queries
            const [sessionData] = await con.execute('SELECT port_id, vehicle_id, user_id, energy_used, total_cost FROM charging_sessions WHERE session_id = ?', [element.session_id]);
            //query which set status of charging port to free
            await con.execute("UPDATE charging_ports SET status = 'free' WHERE port_id = ?", [sessionData[0].port_id]);
            //query which clear current_charge_levet and set is_charging bool to false (0)
            await con.execute('UPDATE vehicles SET current_charge_level = null, is_charging = 0 WHERE vehicle_id = ?', [sessionData[0].vehicle_id]);
            //insert new record to payments table
            await con.execute("INSERT INTO payments (session_id, issue_time, amount) VALUES (?,?,?)", [element.session_id, datetime, sessionData[0].total_cost]);
            //add points for user
            const [usersData] = await con.execute("SELECT points FROM users WHERE user_id = ?",[sessionData[0].user_id]);
            const points = Math.round(sessionData[0].energy_used) + usersData[0].points;
            await con.execute("UPDATE users SET points = ? WHERE user_id = ?", [points, sessionData[0].user_id]);
            //commit queries
            await con.query('COMMIT');
        });
    }
    catch(error)
    {
        await con.query("ROLLBACK");
        console.log(error.message);
    }
})


//routes
app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use("/api/charging-stations", chargingStationsRoutes);
app.use("/api/energy-rates", energyRatesRoutes);
app.use("/api/vehicles", vehiclesRoutes);
app.use("/api/charging-ports", chargingPortsRoutes);
app.use("/api/charging-sessions", chargingSessionsRoutes);
app.use("/api/schedules", schedulesRoutes);
app.use("/api/prefab-vehicles", prefabVehiclesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/discount-codes", discountCodesRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/backups", backupsRoutes);

//cron - heartbeat
heartbeat.call();

//pullSchedules
try
{
    pullSchedules();
}
catch(error)
{
    console.log(error.message);
}

//automatic check schedules
automaticCheckSchedule();
