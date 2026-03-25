
import { detectVitaminDeficiency, detectDisease } from "../utils/detectionLogic.js";

const prisma = new PrismaClient();

export const getVitaminResult = async (req, res) => {
  try {
    const { symptoms } = req.body;
    const userId = req.user.id; // From auth middleware

    if (!symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({ message: "Symptoms must be an array" });
    }

    const result = detectVitaminDeficiency(symptoms);

    // Save health record
    await prisma.healthRecord.create({
      data: {
        userId,
        symptoms: JSON.stringify(symptoms),
        result: JSON.stringify(result),
        type: "vitamin"
      }
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Vitamin Result Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getDiseaseResult = async (req, res) => {
  try {
    const { symptoms, labValues } = req.body;
    const userId = req.user.id; // From auth middleware

    if (!symptoms || !Array.isArray(symptoms) || !labValues) {
      return res.status(400).json({ message: "Missing symptoms or lab values" });
    }

    const result = detectDisease(symptoms, labValues);

    // Save health record
    await prisma.healthRecord.create({
      data: {
        userId,
        symptoms: JSON.stringify(symptoms),
        result: JSON.stringify(result),
        type: result.disease.toLowerCase()
      }
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Disease Result Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
