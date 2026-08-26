import { Router } from "express";
import {
  getGames,
  addGame,
  updateGame,
  deleteGame,
  searchGames,
  syncPlaytime,
} from "../controllers/gameController.js";

const router = Router();

router.get("/games", getGames);
router.post("/games", addGame);
router.put("/games/:id", updateGame);
router.delete("/games/:id", deleteGame);
router.post("/games/sync-playtime", syncPlaytime);
router.get("/search", searchGames);

export default router;
