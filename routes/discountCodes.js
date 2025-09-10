import express from "express";
import { generateDicountCode, getAllUserNotUsedDiscountCodes } from "../controlles/discountCode.js";
import { verifyToken } from "../functions/token_auth.js";
const router = express.Router();

router.post("/generate-discount-code", verifyToken, generateDicountCode);//is in excel
router.post("/get-all-user-not-used-discount-codes", verifyToken, getAllUserNotUsedDiscountCodes);

export default router;