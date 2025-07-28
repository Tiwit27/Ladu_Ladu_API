import express from "express";
import { getAllPrefabVehicles, getPrefabVehicle } from "../controlles/prefabVehicle.js";
import { verifyToken } from "../functions/token_auth.js";
const router = express.Router();

router.post("/get-prefab-vehicle", verifyToken, getPrefabVehicle);//is in excel
router.get("/get-all-prefab-vehicles", verifyToken, getAllPrefabVehicles);//is in excel

export default router;