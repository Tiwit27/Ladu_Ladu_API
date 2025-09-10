import con from "../connection.js";

export const getEnergyUsedStatistic = async (req, res)=>{
    try
    {
        //return statistics about energy used
        const start = new Date();
        start.setDate(start.getDate() - req.body.start);
        const [statisticData] = await con.execute('SELECT charging_stations.address as "Nazwa_stacji",charging_sessions.port_id as "Id_portu_ładowania", sum(energy_used) as "Całkowite_zużycie_energii", ROUND(avg(energy_used), 2) as "Średnie_zużycie_energii", count(*) as "Sesje_ładowania" FROM charging_sessions INNER JOIN charging_ports ON charging_sessions.port_id = charging_ports.port_id INNER JOIN charging_stations ON charging_ports.station_id = charging_stations.station_id WHERE end > ? group by charging_ports.port_id', [start])
        if(statisticData.length == 0)
        {
            throw new Error("Brak danych do wyświetlenia statystyki");
        }
        return res.json({ "message": statisticData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const getChargingStationStatistic = async (req,res)=>{
    try
    {
        //return statistics about charging station
        const start = new Date();
        start.setDate(start.getDate() - req.body.start);
        const [statisticData] = await con.execute('SELECT charging_stations.address as "Nazwa_stacji", count(*) as "Sesje_ładowania", sum(energy_used) as "Całkowite_zużycie_energii", ROUND(avg(energy_used), 2) as "Średnie_zużcie_energii" FROM charging_sessions INNER JOIN charging_ports ON charging_sessions.port_id = charging_ports.port_id INNER JOIN charging_stations ON charging_ports.station_id = charging_stations.station_id WHERE end > ? GROUP BY charging_ports.station_id', [start]);
        if(statisticData.length == 0)
        {
            throw new Error("Brak danych do wyświetlenia statystyki");
        }
        return res.json({ "message": statisticData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const getPaymentsStatisticByUserId = async (req, res)=>{
    try
    {
        //return statistics about user`s payments
        const start = new Date();
        start.setDate(start.getDate() - req.body.start);
        const [statisticData] = await con.execute('SELECT charging_sessions.user_id, SUM(payments.amount) as "Suma_wydatków", SUM(charging_sessions.total_cost) as "Suma_wydatków_bez_rabatów", count(*) as "Sesje_ładowania", ROUND(AVG(amount),2) as "Średni_koszt_ładowania" FROM charging_sessions INNER JOIN payments ON charging_sessions.session_id = payments.session_id WHERE charging_sessions.end > ? AND user_id = ? GROUP BY charging_sessions.user_id', [start, req.body.user_id]);
        if(statisticData.length == 0)
        {
            throw new Error("Brak danych do wyświetlenia statystyki");
        }
        return res.json({ "message": statisticData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const getPaymentsStatistic = async (req, res)=>{
    try
    {
        //return payments statistics
        const start = new Date();
        start.setDate(start.getDate() - req.body.start);
        const [statisticData] = await con.execute('SELECT charging_sessions.user_id, SUM(payments.amount) as "Suma_wydatków", SUM(charging_sessions.total_cost) as "Suma_wydatków_bez_rabatów", count(*) as "Sesje_ładowania", ROUND(AVG(amount),2) as "Średni_koszt_ładowania" FROM charging_sessions INNER JOIN payments ON charging_sessions.session_id = payments.session_id WHERE charging_sessions.end > ? GROUP BY charging_sessions.user_id', [start]);
        if(statisticData.length == 0)
        {
            throw new Error("Brak danych do wyświetlenia statystyki");
        }
        return res.json({ "message": statisticData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const getBestHours = async (req, res)=>{
    try
    {
        //return statistics about best hours all stations
        const start = new Date();
        start.setDate(start.getDate() - req.body.start);
        const [statisticData] = await con.execute('SELECT count(*) as "Sesje_ładowania", HOUR(charging_sessions.end) as "Godzina_ładowania" FROM charging_sessions WHERE charging_sessions.end > ? GROUP BY HOUR(charging_sessions.end) ORDER BY count(*) DESC', [start]);
        if(statisticData.length == 0)
        {
            throw new Error("Brak danych do wyświetlenia statystyki");
        }
        return res.json({ "message": statisticData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const getBestHoursByStationId = async (req, res)=>{
    try
    {
        //get statistics about best hours on specified station
        const start = new Date();
        start.setDate(start.getDate() - req.body.start);
        const [statisticData] = await con.execute('SELECT charging_stations.address as "Nazwa_stacji",count(*) as "Sesje_ładowania", HOUR(charging_sessions.end) as "Godzina_ładowania" FROM charging_sessions INNER JOIN charging_ports ON charging_sessions.port_id = charging_ports.port_id INNER JOIN charging_stations ON charging_ports.station_id = charging_stations.station_id WHERE charging_sessions.end > ? AND charging_stations.station_id = ? GROUP BY HOUR(charging_sessions.end) ORDER BY count(*) DESC', [start, req.body.station_id]);
        if(statisticData.length == 0)
        {
            throw new Error("Brak danych do wyświetlenia statystyki");
        }
        return res.json({ "message": statisticData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const getVehicleStatisticsByUserId = async (req, res)=>{
    try
    {
        //get statisitcs about user`s vehicles charging
        const start = new Date();
        start.setDate(start.getDate() - req.body.start);
        const [statisticData] = await con.execute('SELECT vehicles.name, vehicles.user_id, COUNT(*) as "Sesje_ładowania", sum(charging_sessions.energy_used) as "Całkowite_zużycie_energii", sum(payments.amount) as "Całkowite_koszty_ładowania", (sum(charging_sessions.total_cost) - sum(payments.amount)) as "Zaoszczędzone_środki" FROM charging_sessions INNER JOIN payments ON charging_sessions.session_id = payments.session_id INNER JOIN vehicles ON charging_sessions.vehicle_id = vehicles.vehicle_id WHERE charging_sessions.user_id = ? AND charging_sessions.end > ? GROUP BY vehicles.vehicle_id, vehicles.user_id', [req.body.user_id, start])
        if(statisticData.length == 0)
        {
            throw new Error("Brak danych do wyświetlenia statystyki");
        }
        return res.json({ "message": statisticData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const getDaysFromLastUsePorts = async (req, res)=>{
    try
    {
        //return list of ports with information about last use of specified port
        const [statisticData] = await con.query('SELECT charging_stations.address, charging_ports.port_id, DATEDIFF(NOW(), IFNULL(MAX(charging_sessions.end), charging_ports.create_time)) as "Dni_od_ostatniego_użycia" FROM charging_ports LEFT JOIN charging_sessions ON charging_ports.port_id = charging_sessions.port_id INNER JOIN charging_stations ON charging_ports.station_id = charging_stations.station_id GROUP BY charging_ports.port_id ORDER BY Dni_od_ostatniego_użycia DESC');
        if(statisticData.length == 0)
        {
            throw new Error("Brak danych do wyświetlenia statystyki");
        }
        return res.json({ "message": statisticData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}

export const getDaysFromLastUseStations = async (req, res)=>{
    try
    {
        //return list of stations with information about last use of specified station
        const [statisticData] = await con.query('SELECT charging_stations.address, DATEDIFF(NOW(), IFNULL(MAX(charging_sessions.end), charging_stations.create_time)) as "Dni_od_ostatniego_użycia" FROM charging_ports LEFT JOIN charging_sessions ON charging_ports.port_id = charging_sessions.port_id INNER JOIN charging_stations ON charging_ports.station_id = charging_stations.station_id GROUP BY charging_stations.station_id ORDER BY `Dni_od_ostatniego_użycia` DESC;');
        if(statisticData.length == 0)
        {
            throw new Error("Brak danych do wyświetlenia statystyki");
        }
        return res.json({ "message": statisticData, "success": true });
    }
    catch(error)
    {
        return res.json({ "message": error.message, "success": false });
    }
}