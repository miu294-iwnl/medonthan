import { Router } from "express";
import { getSpotifyPlaylist, updateSpotifyPlaylistUrl } from "../controllers/musicController.js";

const router = Router();

router.get("/music/playlist", getSpotifyPlaylist);
router.post("/music/playlist", updateSpotifyPlaylistUrl);

export default router;
