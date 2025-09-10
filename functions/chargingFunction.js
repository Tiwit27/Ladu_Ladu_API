import con from "../connection.js";
import { stopCharging } from "./stopCharging.js";

//declarate global variable for storage data about active charging sessions
globalThis.activeInstances = {};

export async function ChargingFunction(session_id, vehicle_id, battery_capacity, max_charging_power, rate, current_charge_level, response, plug_type, port_id, max_used_energy, energy_used = 0, total_cost = 0)
{
    //function charging which is recursion with timeout
    try {
        //check if current_charge_level is not equal to battery_capacity
        if(current_charge_level >= battery_capacity * 0.998)
        {
            return stopCharging(session_id);
        }
        if(max_used_energy > 0 && max_used_energy == energy_used) 
        {
            await con.query('START TRANSACTION');
            await con.execute('UPDATE vehicles SET current_charge_level = ? WHERE vehicle_id = ?', [current_charge_level, vehicle_id]);
            await con.execute('UPDATE charging_sessions SET energy_used = ?, total_cost = ? WHERE session_id = ?', [energy_used, total_cost, session_id]);
            await con.query("COMMIT");
            return stopCharging(session_id);
        }
        //if function is call from recursion, response is null, and we can start new transaction
        if(response == null)
        {
            //start new transaction if response is null
            await con.query('START TRANSACTION');
        }
        //query which update vehicle current_charge_level to last send from recursion
        await con.execute('UPDATE vehicles SET current_charge_level = ? WHERE vehicle_id = ?', [current_charge_level, vehicle_id]);
        //query which update fields energy_used and total_cost from charging_sessions to sended in last recursion
        await con.execute('UPDATE charging_sessions SET energy_used = ?, total_cost = ? WHERE session_id = ?', [energy_used, total_cost, session_id]);

        //if function is call first, not from recursion, we commit changes.
        if(response != null)
        {
            await con.query('COMMIT');
        }

        //mechanics of charging:
        if(current_charge_level == 0)
        {
            current_charge_level = battery_capacity * 0.01;
        }
        //declarate variables
        let percentageOfCharge;
        let timeoutId;
        let fivesecondsChargeLevel;
        //two difference simulation of charging (DC/AC). Choose based on plug_type
        switch(plug_type)
        {
        //AC charging simulation
        case 'type_2':
            //set percentageOfCharge as decimal number from 0 to 1
            percentageOfCharge = current_charge_level/battery_capacity;
            //check current charge level by percentageOfCharge and choose different type of charging simualtion for realism
            if(percentageOfCharge < 0.05)
            {
                //on start (from 0 to 0.05), charging is like increasing linear function
                //calculate charge per minut [kW]
                fivesecondsChargeLevel = (max_charging_power * (percentageOfCharge * 20) / 60) / 12;
            }
            else if(percentageOfCharge < 0.9)
            {
                //on middle part of charging, charger using 100% power
                //calculate charge per minut [kW]
                fivesecondsChargeLevel = (max_charging_power / 60) / 12;
            }
            else
            {
                //on the end (from 0.9 to 1), charging is like decreasing linear function
                //calculate charge per minut [kW]
                fivesecondsChargeLevel = (max_charging_power * (1 - (percentageOfCharge - 0.9) / 0.1) / 60) / 12;
            }
            fivesecondsChargeLevel = Math.round(fivesecondsChargeLevel * 100) / 100;
            //check max_used_energy
            if(max_used_energy > 0 && energy_used + fivesecondsChargeLevel > max_used_energy)
            {
                fivesecondsChargeLevel = max_used_energy - energy_used;
            }
            //fivesecondsChargeLevel = minuteChargeLevel / 12;
            //add minuteChargeLevel to current_charge_level
            current_charge_level += fivesecondsChargeLevel;
            //add minuteChargeLevel to energy_used
            energy_used += fivesecondsChargeLevel;
            //calculate total cost of used energy on last minute, and add it to total_cost of charging session
            total_cost += (fivesecondsChargeLevel * rate)
            //start timeout and assign id of timeout to variable timeoutId
            timeoutId = setTimeout(()=>ChargingFunction(session_id, vehicle_id, battery_capacity, max_charging_power, rate, current_charge_level, null, plug_type, port_id, max_used_energy, energy_used, total_cost), 5000);
            //add new object inside activeInstances for easly stop timeout by session_id
            activeInstances[session_id] = {timeoutId, session_id};
            if(response != null)
            {
                //if this function is call from react, not from recursion, we return json message for response
                return response.json({"message":session_id,"success":true});
            }
            break;
        //DC charging simulation
        case 'ccs':
        case 'chademo':
            //set percentageOfCharge as decimal number from 0 to 1
            percentageOfCharge = current_charge_level/battery_capacity;
            //check current charge level by percentageOfCharge and choose different type of charging simualtion for realism
            if(percentageOfCharge < 0.1)
            {
                //on start (from 0 to 0.1), charging is like increasing linear function
                //calculate charge per minut [kW]
                fivesecondsChargeLevel = (max_charging_power * (percentageOfCharge * 10) / 60) / 12;
            }
            else if(percentageOfCharge < 0.8)
            {
                //on middle part of charging (from 0.1 to 0.8), charging is like slightly decreasing linear function
                //calculate charge per minut [kW]
                let m = (-0.3 * max_charging_power) / 0.7;
                let b = max_charging_power - (m * 0.1);
                fivesecondsChargeLevel = ((m * percentageOfCharge + b) / 60) / 12;
            }
            else
            {
                //on the end (from 0.8 to 1), charging is like decreasing linear function
                //calculate charge per minut [kW]
                fivesecondsChargeLevel = (max_charging_power * (1 - (percentageOfCharge - 0.8) / 0.2) / 60) / 12;
            }
            //cut decimal digits above 2
            fivesecondsChargeLevel = Math.round(fivesecondsChargeLevel * 100) / 100;
            //check max_used_energy
            if(max_used_energy > 0 && energy_used + fivesecondsChargeLevel > max_used_energy)
            {
                fivesecondsChargeLevel = max_used_energy - energy_used;
            }
            //fivesecondsChargeLevel = minuteChargeLevel / 12;
            //add minuteChargeLevel to current_charge_level
            current_charge_level += fivesecondsChargeLevel;
            //add minuteChargeLevel to energy_used
            energy_used += fivesecondsChargeLevel;
            //calculate total cost of used energy on last minute, and add it to total_cost of charging session
            total_cost += (fivesecondsChargeLevel * rate)
            timeoutId = setTimeout(()=>ChargingFunction(session_id, vehicle_id, battery_capacity, max_charging_power, rate, current_charge_level, null, plug_type, port_id , max_used_energy,energy_used, total_cost), 5000);
            //add new object inside activeInstances for easly stop timeout by session_id
            activeInstances[session_id] = {timeoutId, session_id};
            if(response != null)
            {
                //if this function is call from react, not from recursion, we return json message for response
                return response.json({"message":session_id,"success":true});
            }
            break;
        }
        //commit to save data if all code was good
        await con.query('COMMIT');
    }
    catch (error) 
    {
        //if was any error, query was rollback and all changes is not commited to db
        if(response != null)
        {
            //execute 'commit' if error is in sql syntax, and propably transaction is not commited before new start
            await con.query('COMMIT');
            //Manually rollback, because if it is not, insert of new charging session will be after one minute, its too long
            await con.query('START TRANSACTION');
            //query which delete charging session 
            await con.execute('DELETE FROM charging_sessions WHERE session_id = ?', [session_id]);
            //query which update filed is_charging in vehicles table to false (0) and current_charge_level to null
            await con.execute('UPDATE vehicles SET is_charging = 0, current_charge_level = null WHERE vehicle_id = ?', [vehicle_id]);
            //query which update field status in charging_ports, change busy to free
            await con.execute("UPDATE charging_ports SET status = 'free' WHERE port_id = ?", [port_id]);
            //commit changes
            await con.query('COMMIT');
            //if function is call from react (for first time) not from recursion, we have to return response about error for website
            return response.json({"message":error.message,"success":false})
        }
        //rollback query for restore all queries 
        await con.query('ROLLBACK');
        return stopCharging(session_id);
    }
}
