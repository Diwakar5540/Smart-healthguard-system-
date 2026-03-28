import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import fingerprintRoutes from "./routes/fingerprintRoutes.js";
import bloodGroupRoutes from "./routes/bloodGroupRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/fingerprint", fingerprintRoutes);
app.use("/api/blood-group", bloodGroupRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Smart Health Guard API is running...");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
