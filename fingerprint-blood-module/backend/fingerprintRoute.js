/**
 * Fingerprint Blood Group Detection — Express Router
 *
 * Endpoint: POST /api/fingerprint-detect
 * Input:    multipart/form-data with field "fingerprint_image"
 * Output:   JSON prediction result
 *
 * This route uses a mock predictor by default.
 * To use real model inference, replace the prediction call below.
 *
 * INTEGRATION: Add to server/src/app.js:
 *   import fingerprintDetectRoutes from "../../fingerprint-blood-module/backend/fingerprintRoute.js";
 *   app.use("/api", fingerprintDetectRoutes);
 */

import express from "express";
import multer from "multer";
import { mockPredict } from "./predictor.js";

const router = express.Router();

// ─── Multer config: in-memory storage ───────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, or WebP images are accepted."));
    }
    cb(null, true);
  },
});

// ─── POST /api/fingerprint-detect ───────────────────────────────────────────
router.post(
  "/fingerprint-detect",
  upload.single("fingerprint_image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message: "No fingerprint image provided.",
        });
      }

      const imageBuffer = req.file.buffer;

      // Validate minimum file size (reject tiny/corrupted uploads)
      if (imageBuffer.length < 3000) {
        return res.status(422).json({
          status: "error",
          message: "Image quality too low. Please retake with a clearer fingerprint image.",
        });
      }

      // ─── Run Prediction ─────────────────────────────────────────────
      // Currently using mock predictor.
      // To use a real trained model:
      //   1. Install @tensorflow/tfjs-node
      //   2. Load MobileNetV2 model: const model = await tf.loadLayersModel('file://./model/mobilenetv2_bloodgroup/model.json')
      //   3. Preprocess image buffer with sharp/canvas
      //   4. Run model.predict(tensor)
      //   5. Return argmax class + confidence

      const result = mockPredict();

      return res.json(result);
    } catch (err) {
      console.error("[FingerprintDetect] Error:", err);
      return res.status(500).json({
        status: "error",
        message: "Internal server error during fingerprint analysis.",
      });
    }
  }
);

export default router;
