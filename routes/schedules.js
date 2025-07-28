import express from "express";
import { getStationSchedule, getStationScheduleCurrentStatus, updateSchedule } from "../controlles/schedule.js";
import { verifyToken } from "../functions/token_auth.js";
const router = express.Router()

router.post("/update-schedule", verifyToken,updateSchedule);//is in excel
router.post("/get-station-schedule", verifyToken, getStationSchedule);//is in excel
router.post("/get-station-schedule-status", verifyToken,getStationScheduleCurrentStatus);

export default router