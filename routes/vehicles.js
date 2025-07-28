import express from "express";
import { addVehicle, countAllUserVehicles, deleteVehicle, getAllUserVehicles, getVehicleData, updateVehicle } from "../controlles/vehicle.js";
import { verifyToken } from "../functions/token_auth.js";
const router = express.Router()

router.post("/add-vehicle", verifyToken, addVehicle);//is in excel
router.post("/update-vehicle", verifyToken, updateVehicle);//is in excel
router.post("/delete-vehicle", verifyToken, deleteVehicle);//is in excel
router.post("/get-vehicle-data", verifyToken, getVehicleData);//is in excel
router.post("/get-all-user-vehicles", verifyToken, getAllUserVehicles);//is in excel
router.post("/count-all-user-vehicles", verifyToken, countAllUserVehicles);//is in excel

export default router