import express from "express";
import { addChargingSession, countAllUserChargingSessions, getUserChargingSessions, stopChargingSession } from "../controlles/chargingSession.js";
import { verifyToken } from "../functions/token_auth.js";
const router = express.Router();

router.post("/get-user-charging-sessions", verifyToken, getUserChargingSessions);//is in excel
router.post("/count-all-user-charging-sessions", verifyToken, countAllUserChargingSessions);//is in excel
router.post("/add-charging-session", verifyToken,addChargingSession);//is in excel
router.post("/stop-charging-session", verifyToken,stopChargingSession);//is in excel

export default router;