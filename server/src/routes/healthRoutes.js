import express from "express";
import { getVitaminResult, getDiseaseResult } from "../controllers/healthController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/vitamin", authMiddleware, getVitaminResult);
router.post("/disease", authMiddleware, getDiseaseResult);

export default router;
