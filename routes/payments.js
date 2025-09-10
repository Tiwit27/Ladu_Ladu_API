import express from "express";
import { getAllUserPayments, getAllUserUnpaidPayments, getDataForFacture, payPayment } from "../controlles/payment.js";
import { verifyToken } from "../functions/token_auth.js";
const router = express.Router();

router.post("/get-all-user-payments", verifyToken, getAllUserPayments);//is in excel
router.post("/get-all-user-unpaid-payments", verifyToken, getAllUserUnpaidPayments);//is in excel
router.post("/pay-payment", verifyToken, payPayment);//is in excel
router.post("/get-data-for-facture", verifyToken, getDataForFacture);

export default router;