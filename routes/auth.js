import express from "express";
import {automaticLogin, login, register, resetPassword } from "../controlles/auth.js";
import { verifyToken } from "../functions/token_auth.js";
const router = express.Router()

router.post('/login', login)//is in excel
router.post('/register', register)//is in excel
router.post("/reset-password", resetPassword)//is in excel
router.get("/automatic-login", verifyToken, automaticLogin);

export default router