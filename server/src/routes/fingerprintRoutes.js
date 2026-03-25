import express from 'express';
import { lookupByFingerprint } from '../controllers/fingerprintController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/lookup', lookupByFingerprint);

export default router;
