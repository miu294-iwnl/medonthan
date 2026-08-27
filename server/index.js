import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import gameRoutes from "./routes/gameRoutes.js";
import { seedDatabaseIfEmpty } from "./prisma/seed.js";

// Load environment variables securely from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../dist");

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

// Serve frontend static files if dist folder exists
app.use(express.static(distPath));

// Serve nodevtools.html specifically
app.get("/nodevtools.html", (req, res) => {
  res.sendFile(path.join(distPath, "nodevtools.html"));
});

// Fallback to index.html for SPA routes (except /api)
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});

// Start server
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Medonthan backend server running on http://localhost:${PORT}`);
  await seedDatabaseIfEmpty();
});
