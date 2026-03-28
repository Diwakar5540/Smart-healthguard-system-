import express from "express";
import multer from "multer";
import { detectBloodGroup } from "../controllers/bloodGroupController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Store file in memory (no disk write needed)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, or WebP images are accepted."));
    }
    cb(null, true);
  },
});

// POST /api/blood-group/detect
router.post("/detect", authMiddleware, upload.single("image"), detectBloodGroup);

export default router;
