import express from "express";
import { addEnergyRate, getAllEnergyRates, getAllEnergyRatesOnStation, updateEnergyRate } from "../controlles/energyRate.js";
import { verifyToken } from "../functions/token_auth.js";
const router = express.Router();

router.post("/add-energy-rate", verifyToken, addEnergyRate);//is in excel
router.post("/update-energy-rate", verifyToken, updateEnergyRate);//is in excel
router.get("/get-all-energy-rates", verifyToken, getAllEnergyRates);//is in excel
router.post("/get-all-energy-rates-on-station", verifyToken, getAllEnergyRatesOnStation);//is in excel

export default router;