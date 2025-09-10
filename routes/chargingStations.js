import express from "express";
import { addChargingStation, deleteChargingStation, getAllChargingStations, getChargingStationData, getChargingStationDataByPortId, updateChargingStation } from "../controlles/chargingStation.js";
import { verifyToken } from "../functions/token_auth.js";
const router = express.Router();

router.post("/add-charging-station", verifyToken, addChargingStation);//is in excel
router.post("/delete-charging-station", verifyToken, deleteChargingStation);//is in excel
router.get("/get-all-charging-stations", verifyToken, getAllChargingStations);//is in excel
router.post("/update-charging-station", verifyToken, updateChargingStation);//is in excel
router.post("/get-charging-station-data", verifyToken, getChargingStationData);//is in excel
router.post("/get-charging-station-data-by-port-id", verifyToken, getChargingStationDataByPortId);

export default router;