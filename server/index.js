import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import gameRoutes from "./routes/gameRoutes.js";
import { seedDatabaseIfEmpty } from "./prisma/seed.js";

// Load environment variables securely from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", gameRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Start server
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Medonthan backend server running on http://localhost:${PORT}`);
  await seedDatabaseIfEmpty();
});
