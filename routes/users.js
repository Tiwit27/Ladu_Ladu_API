import express from "express";
import {changeAdminStatus, getUserData, getUserDataByUserId, getUserPoints, updateUserData } from "../controlles/user.js";
import { verifyToken } from "../functions/token_auth.js";
const router = express.Router()

router.post('/get-user-data', verifyToken, getUserData);//is in excel
router.post('/update-user-data', verifyToken, updateUserData);//is in excel
router.post("/change-admin-status", verifyToken, changeAdminStatus);//is in excel
router.post("/get-user-points", verifyToken, getUserPoints);
router.post("/get-user-data-by-user-id",verifyToken, getUserDataByUserId);

export default router