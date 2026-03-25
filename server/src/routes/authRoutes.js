import express from "express";
import { register, login, generateEnrollmentOptions, verifyEnrollment, fingerprintVerify, logout } from "../controllers/authController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/fingerprint-verify", fingerprintVerify);
router.get("/logout", logout);

// Fingerprint enrollment (after login)
router.get("/enroll/options", authMiddleware, generateEnrollmentOptions);
router.post("/enroll/verify", authMiddleware, verifyEnrollment);

export default router;
