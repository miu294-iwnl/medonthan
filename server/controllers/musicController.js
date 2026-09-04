import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fetchSpotifyPlaylist, extractPlaylistId } from "../services/spotifyPlaylistService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.resolve(__dirname, "../.env");

/**
 * GET /api/music/playlist
 * Returns playlist information from MUSIC_API_SPOTIFYPLAYLIST
 */
export async function getSpotifyPlaylist(req, res) {
  try {
    const url = req.query.url || process.env.MUSIC_API_SPOTIFYPLAYLIST;
    const data = await fetchSpotifyPlaylist(url);
    return res.json(data);
  } catch (error) {
    console.error("Error in getSpotifyPlaylist controller:", error);
    return res.status(500).json({ error: "Failed to load Spotify playlist", details: error.message });
  }
}

/**
 * POST /api/music/playlist
 * Updates the MUSIC_API_SPOTIFYPLAYLIST in .env and returns the new playlist data
 */
export async function updateSpotifyPlaylistUrl(req, res) {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Please provide a valid 'url' in request body" });
    }

    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
      return res.status(400).json({ error: "Invalid Spotify playlist URL or ID provided" });
    }

    const cleanUrl = url.trim();
    process.env.MUSIC_API_SPOTIFYPLAYLIST = cleanUrl;

    // Persist to server/.env if exists
    try {
      if (fs.existsSync(envFilePath)) {
        let envContent = fs.readFileSync(envFilePath, "utf8");
        if (envContent.includes("MUSIC_API_SPOTIFYPLAYLIST=")) {
          envContent = envContent.replace(
            /MUSIC_API_SPOTIFYPLAYLIST=.*/g,
            `MUSIC_API_SPOTIFYPLAYLIST=${cleanUrl}`
          );
        } else {
          envContent += `\nMUSIC_API_SPOTIFYPLAYLIST=${cleanUrl}\n`;
        }
        fs.writeFileSync(envFilePath, envContent, "utf8");
      }
    } catch (writeErr) {
      console.warn("Could not write to .env file:", writeErr.message);
    }

    const data = await fetchSpotifyPlaylist(cleanUrl);
    return res.json({
      success: true,
      message: "Updated MUSIC_API_SPOTIFYPLAYLIST successfully",
      playlist: data,
    });
  } catch (error) {
    console.error("Error in updateSpotifyPlaylistUrl controller:", error);
    return res.status(500).json({ error: "Failed to update playlist URL", details: error.message });
  }
}
