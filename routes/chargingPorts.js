import express from "express";
import { addChargingPort, deleteChargingPort, getAllChargingPorts, getAllChargingPortsInStation, getChargingPortData, getGroupAllChargingPorts, updateChargingPort } from "../controlles/chargingPort.js";
import { verifyToken } from "../functions/token_auth.js";

const router = express.Router()

router.post("/add-charging-port", verifyToken, addChargingPort);//is in excel
router.post("/delete-charging-port", verifyToken, deleteChargingPort);//is in excel
router.post("/update-charging-port", verifyToken, updateChargingPort);//is in excel
router.get("/get-all-charging-ports", verifyToken, getAllChargingPorts);//is in excel
router.post("/get-all-charging-ports-in-station", verifyToken, getAllChargingPortsInStation);//is in excel
router.get("/get-group-all-charging-ports", verifyToken ,getGroupAllChargingPorts);//is in excel
router.post("/get-charging-port-data", verifyToken, getChargingPortData);

export default router