import express from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        healthRecords: {
          orderBy: { createdAt: "desc" },
          take: 10
        }
      }
    });
    
    // Convert healthRecord strings (JSON) back to objects
    const profile = {
      ...user,
      healthRecords: user.healthRecords.map(record => ({
        ...record,
        symptoms: typeof record.symptoms === "string" ? JSON.parse(record.symptoms) : record.symptoms,
        result: typeof record.result === "string" ? JSON.parse(record.result) : record.result
      }))
    };

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
