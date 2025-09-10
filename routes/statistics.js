import express from "express";
import { verifyToken } from "../functions/token_auth.js";
import { getChargingStationStatistic, getEnergyUsedStatistic, getPaymentsStatisticByUserId, getPaymentsStatistic, getBestHours, getBestHoursByStationId, getVehicleStatisticsByUserId, getDaysFromLastUsePorts, getDaysFromLastUseStations} from "../controlles/statistic.js";
const router = express.Router();

router.post("/get-energy-used-statistic",verifyToken, getEnergyUsedStatistic);
router.post("/get-charging-station-statistic",verifyToken, getChargingStationStatistic);
router.post("/get-payments-statistic-by-user-id",verifyToken, getPaymentsStatisticByUserId);
router.post("/get-payments-statistic",verifyToken, getPaymentsStatistic);
router.post("/get-best-hours", verifyToken, getBestHours);
router.post("/get-best-hours-by-station-id", verifyToken, getBestHoursByStationId);
router.post("/get-vehicle-statistics-by-user-id", verifyToken, getVehicleStatisticsByUserId);
router.get("/get-days-from-last-use-ports", verifyToken, getDaysFromLastUsePorts);
router.get("/get-days-from-last-use-stations", verifyToken, getDaysFromLastUseStations);

export default router;