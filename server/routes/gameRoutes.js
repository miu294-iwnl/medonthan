import { Router } from "express";
import {
  getGames,
  addGame,
  updateGame,
  deleteGame,
  searchGames,
  syncPlaytime,
  getSteamStats,
} from "../controllers/gameController.js";
import { requireAdminAuth } from "../controllers/authController.js";

const router = Router();

router.get("/games", getGames);
router.post("/games", requireAdminAuth, addGame);
router.put("/games/:id", updateGame);
router.delete("/games/:id", deleteGame);
router.post("/games/sync-playtime", syncPlaytime);
router.get("/steam/stats", getSteamStats);
router.get("/search", searchGames);

export default router;
