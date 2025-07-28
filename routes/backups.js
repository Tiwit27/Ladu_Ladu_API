import express from "express";
import { exportDB, importDB, upload} from "../controlles/backup.js";
import { verifyToken } from "../functions/token_auth.js";
const router = express.Router();

router.get("/export-db",verifyToken, exportDB);
router.post("/import-db", verifyToken,upload.single("database"), importDB);

export default router;