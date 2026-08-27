import prisma from "../lib/prisma.js";
import dotenv from "dotenv";
import { searchSteam, getSteamGameDetails, getSteamOwnedGamesData, getSteamAccountStats } from "../services/steamService.js";
import { searchXbox, getXboxGameDetails } from "../services/xboxService.js";

// Always get fresh environment variables in case .env was modified while running
function getEnvConfig() {
  dotenv.config();
  return {
    apiKey: process.env.STEAM_API_KEY ? process.env.STEAM_API_KEY.trim() : "",
    vanityUrl: (process.env.STEAM_VANITY_URL || "mused29").trim(),
  };
}

// Helper to format DB record into frontend Game object
function formatGame(game) {
  let parsedTags = [];
  try {
    const raw = typeof game.tags === "string" ? JSON.parse(game.tags || "[]") : (game.tags || []);
    parsedTags = Array.isArray(raw) ? raw.map((t) => (typeof t === "string" ? t : (t?.Name || String(t)))).filter(Boolean) : [];
  } catch {}

  let parsedTagsEn = [];
  try {
    const raw = typeof game.tagsEn === "string" ? JSON.parse(game.tagsEn || "[]") : (game.tagsEn || []);
    parsedTagsEn = Array.isArray(raw) ? raw.map((t) => (typeof t === "string" ? t : (t?.Name || String(t)))).filter(Boolean) : [];
  } catch {}

  let parsedScreenshots = [];
  try {
    const raw = typeof game.screenshots === "string" ? JSON.parse(game.screenshots || "[]") : (game.screenshots || []);
    parsedScreenshots = Array.isArray(raw) ? raw.map((s) => (typeof s === "string" ? s : (s?.url || s?.Uri || String(s)))).filter(Boolean) : [];
  } catch {}

  let parsedVideos = [];
  try {
    const raw = typeof game.videos === "string" ? JSON.parse(game.videos || "[]") : (game.videos || []);
    parsedVideos = Array.isArray(raw) ? raw : [];
  } catch {}

  // Auto-switch to "playing" if hoursPlayed > 0 and no est hours set or est hours is 0
  let status = game.status;
  if ((!game.hours || game.hours === 0) && (game.hoursPlayed || 0) > 0 && status === "backlog") {
    status = "playing";
  }

  const isOwned = Boolean(game.isOwned || (game.hoursPlayed != null && game.hoursPlayed > 0));
  const isEarlyAccess = Boolean(
    game.isEarlyAccess ||
    (Array.isArray(parsedTags) && parsedTags.some((t) => {
      const lower = t.toLowerCase();
      return lower === "early access" || lower === "truy cập sớm" || lower === "tiếp cận sớm";
    })) ||
    (Array.isArray(parsedTagsEn) && parsedTagsEn.some((t) => t.toLowerCase() === "early access"))
  );

  return {
    ...game,
    genreEn: game.genreEn || game.genre || "Action",
    releaseDateEn: game.releaseDateEn || game.releaseDate || "TBA",
    descriptionEn: game.descriptionEn || game.description || "",
    status,
    isOwned,
    isEarlyAccess,
    originalPrice: game.originalPrice || game.price || 0,
    discountPercent: game.discountPercent || 0,
    screenshots: parsedScreenshots,
    videos: parsedVideos,
    tags: parsedTags,
    tagsEn: parsedTagsEn.length > 0 ? parsedTagsEn : parsedTags,
  };
}

/**
 * GET /api/games - Get all games
 */
export async function getGames(req, res) {
  try {
    const games = await prisma.game.findMany({
      orderBy: { addedAt: "desc" },
    });
    res.json(games.map(formatGame));
  } catch (error) {
    console.error("getGames error:", error);
    res.status(500).json({ error: "Failed to retrieve games" });
  }
}

/**
 * GET /api/search?q=...&platform=... - Search games on Steam or Xbox
 */
export async function searchGames(req, res) {
  const query = (req.query.q || "").trim();
  const platform = (req.query.platform || "Steam").toLowerCase();

  if (!query) {
    return res.json([]);
  }

  try {
    let results = [];
    if (platform === "xbox") {
      results = await searchXbox(query);
    } else {
      results = await searchSteam(query);
    }
    res.json(results);
  } catch (error) {
    console.error("searchGames error:", error);
    res.status(500).json({ error: "Search failed" });
  }
}

/**
 * POST /api/games - Add a new game
 */
export async function addGame(req, res) {
  try {
    const { title, platform = "Steam", storeId, storeType, lndLink, hours, isOwned, isEarlyAccess } = req.body;
    const effectivePlatform = platform || "Steam";
    const initialHours = typeof hours === "number" ? hours : (parseInt(hours, 10) || 0);

    let gameData = {
      title: title || "New Game",
      studio: "Unknown Studio",
      publisher: "Unknown Publisher",
      genre: "Action",
      genreEn: "Action",
      year: new Date().getFullYear(),
      hours: initialHours,
      platform: effectivePlatform,
      priority: "medium",
      status: "backlog",
      cover: `https://images.unsplash.com/photo-1542751371-adc38448a05e?w=480&h=640&fit=crop&auto=format`,
      screenshots: JSON.stringify([]),
      videos: JSON.stringify([]),
      description: "",
      descriptionEn: "",
      releaseDate: "TBA",
      releaseDateEn: "TBA",
      tags: JSON.stringify([]),
      tagsEn: JSON.stringify([]),
      addedAt: Date.now(),
      price: 0,
      originalPrice: 0,
      discountPercent: 0,
      hoursPlayed: 0,
      isOwned: isOwned ?? false,
      isEarlyAccess: isEarlyAccess ?? false,
      lndLink: lndLink || null,
      storeId: storeId ? String(storeId) : null,
      storeType: storeType || (effectivePlatform.toLowerCase() === "xbox" ? "xbox" : "steam"),
    };

    // If adding via Steam storeId
    if (storeId && (storeType === "steam" || effectivePlatform.toLowerCase() === "steam")) {
      try {
        const steamDetails = await getSteamGameDetails(storeId);
        gameData.title = steamDetails.title || gameData.title;
        gameData.studio = steamDetails.studio;
        gameData.publisher = steamDetails.publisher;
        gameData.genre = steamDetails.genre;
        gameData.genreEn = steamDetails.genreEn;
        gameData.year = steamDetails.year;
        gameData.cover = steamDetails.cover;
        gameData.screenshots = JSON.stringify(steamDetails.screenshots);
        gameData.videos = JSON.stringify(steamDetails.videos);
        gameData.description = steamDetails.description;
        gameData.descriptionEn = steamDetails.descriptionEn;
        gameData.releaseDate = steamDetails.releaseDate;
        gameData.releaseDateEn = steamDetails.releaseDateEn;
        gameData.tags = JSON.stringify(steamDetails.tags);
        gameData.tagsEn = JSON.stringify(steamDetails.tagsEn);
        gameData.price = steamDetails.price;
        gameData.originalPrice = steamDetails.originalPrice || steamDetails.price || 0;
        gameData.discountPercent = steamDetails.discountPercent || 0;
        gameData.isEarlyAccess = Boolean(steamDetails.isEarlyAccess);
        gameData.platform = "Steam";
        gameData.storeType = "steam";

        // Check Steam playtime and ownership from user account
        const { apiKey, vanityUrl } = getEnvConfig();
        if (apiKey) {
          const ownedMap = await getSteamOwnedGamesMap(vanityUrl, apiKey);
          const hasGame = ownedMap.has(String(storeId));
          gameData.hoursPlayed = ownedMap.get(String(storeId)) || 0;
          gameData.isOwned = hasGame || gameData.hoursPlayed > 0;
        } else {
          gameData.hoursPlayed = 0;
        }
      } catch (err) {
        console.warn("Could not fetch full Steam details, using basics:", err.message);
      }
    } else if (storeId && (storeType === "xbox" || effectivePlatform.toLowerCase() === "xbox")) {
      // If adding via Xbox storeId
      try {
        const xboxDetails = await getXboxGameDetails(storeId);
        gameData.title = xboxDetails.title || gameData.title;
        gameData.studio = xboxDetails.studio;
        gameData.publisher = xboxDetails.publisher;
        gameData.genre = xboxDetails.genre;
        gameData.genreEn = xboxDetails.genre;
        gameData.year = xboxDetails.year;
        gameData.cover = xboxDetails.cover || gameData.cover;
        gameData.screenshots = JSON.stringify(xboxDetails.screenshots);
        gameData.videos = JSON.stringify(xboxDetails.videos);
        gameData.description = xboxDetails.description;
        gameData.descriptionEn = xboxDetails.description;
        gameData.releaseDate = xboxDetails.releaseDate;
        gameData.releaseDateEn = xboxDetails.releaseDate;
        gameData.tags = JSON.stringify(xboxDetails.tags);
        gameData.tagsEn = JSON.stringify(xboxDetails.tags);
        gameData.price = xboxDetails.price;
        gameData.originalPrice = xboxDetails.price;
        gameData.discountPercent = 0;
        gameData.isEarlyAccess = false;
        gameData.platform = "Xbox";
        gameData.storeType = "xbox";
        gameData.hoursPlayed = 0;
      } catch (err) {
        console.warn("Could not fetch full Xbox details, using basics:", err.message);
      }
    }

    // If game has hoursPlayed > 0 and no est hours, auto set status to playing
    if ((!gameData.hours || gameData.hours === 0) && (gameData.hoursPlayed || 0) > 0 && gameData.status !== "beaten") {
      gameData.status = "playing";
    }

    const created = await prisma.game.create({
      data: gameData,
    });

    res.status(201).json(formatGame(created));
  } catch (error) {
    console.error("addGame error:", error);
    res.status(500).json({ error: "Failed to add game" });
  }
}

/**
 * PUT /api/games/:id - Update game properties (status, priority, hoursPlayed, isOwned, isEarlyAccess, etc.)
 */
export async function updateGame(req, res) {
  try {
    const { id } = req.params;
    const { status, priority, hoursPlayed, lndLink, price, hours, isOwned, isEarlyAccess, genreEn, releaseDateEn, descriptionEn } = req.body;

    const dataToUpdate = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (priority !== undefined) dataToUpdate.priority = priority;
    if (hoursPlayed !== undefined) dataToUpdate.hoursPlayed = hoursPlayed;
    if (lndLink !== undefined) dataToUpdate.lndLink = lndLink;
    if (price !== undefined) dataToUpdate.price = price;
    if (hours !== undefined) dataToUpdate.hours = hours;
    if (isOwned !== undefined) dataToUpdate.isOwned = Boolean(isOwned);
    if (isEarlyAccess !== undefined) dataToUpdate.isEarlyAccess = Boolean(isEarlyAccess);
    if (genreEn !== undefined) dataToUpdate.genreEn = genreEn;
    if (releaseDateEn !== undefined) dataToUpdate.releaseDateEn = releaseDateEn;
    if (descriptionEn !== undefined) dataToUpdate.descriptionEn = descriptionEn;

    const updated = await prisma.game.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json(formatGame(updated));
  } catch (error) {
    console.error("updateGame error:", error);
    res.status(500).json({ error: "Failed to update game" });
  }
}

/**
 * DELETE /api/games/:id - Remove game from database
 */
export async function deleteGame(req, res) {
  try {
    const { id } = req.params;
    await prisma.game.delete({
      where: { id },
    });
    res.json({ success: true, id });
  } catch (error) {
    console.error("deleteGame error:", error);
    res.status(500).json({ error: "Failed to delete game" });
  }
}

/**
 * GET /api/steam/stats - Get overall Steam account stats (total playtime across all games, games count)
 */
export async function getSteamStats(req, res) {
  try {
    const { apiKey, vanityUrl } = getEnvConfig();
    if (!apiKey) {
      return res.json({
        totalPlaytimeHours: 0,
        totalPlaytimeMinutes: 0,
        totalGames: 0,
        configured: false,
      });
    }

    const stats = await getSteamAccountStats(vanityUrl, apiKey);
    res.json({
      ...stats,
      vanityUrl,
      configured: true,
    });
  } catch (error) {
    console.error("getSteamStats error:", error);
    res.status(500).json({ error: "Failed to fetch Steam stats" });
  }
}

/**
 * POST /api/games/sync-playtime - Sync playtime, ownership, and Steam store metadata for all added games
 */
export async function syncPlaytime(req, res) {
  try {
    const { apiKey, vanityUrl } = getEnvConfig();

    if (!apiKey) {
      return res.status(400).json({
        error: "STEAM_API_KEY is not configured in server/.env",
        message: "Vui lòng cấu hình STEAM_API_KEY trong file server/.env để đồng bộ dữ liệu Steam.",
      });
    }

    // 1. Fetch user Steam account data (playtime map, account totals)
    const steamData = await getSteamOwnedGamesData(vanityUrl, apiKey, true);
    const ownedMap = steamData.playtimeMap;

    // 2. Fetch all Steam games in the database
    const steamGames = await prisma.game.findMany({
      where: {
        OR: [
          { storeType: "steam" },
          { platform: "Steam" },
        ],
      },
    });

    // 3. Fetch latest Steam store details in parallel for all games with numeric storeId
    const storeDetailsMap = new Map();
    const storeFetchPromises = steamGames
      .filter((g) => g.storeId && /^\d+$/.test(g.storeId))
      .map(async (g) => {
        try {
          const details = await getSteamGameDetails(g.storeId);
          if (details) {
            storeDetailsMap.set(String(g.storeId), details);
          }
        } catch (err) {
          console.warn(`Could not sync store details for app ${g.storeId}:`, err.message);
        }
      });

    await Promise.allSettled(storeFetchPromises);

    // 4. Update each game with both Playtime & Store details
    let updatedCount = 0;
    let updatedStoreCount = 0;

    for (const g of steamGames) {
      if (g.storeId) {
        const updateData = {};
        const hours = ownedMap.get(String(g.storeId)) || 0;
        const isOwned = ownedMap.has(String(g.storeId)) || hours > 0;

        // Playtime & ownership
        if (g.hoursPlayed !== hours) {
          updateData.hoursPlayed = hours;
        }
        if (g.isOwned !== isOwned) {
          updateData.isOwned = isOwned;
        }
        // Auto set to playing if played > 0 hours and no est hours was specified
        if ((!g.hours || g.hours === 0) && hours > 0 && g.status === "backlog") {
          updateData.status = "playing";
        }

        // Store metadata
        const storeDetails = storeDetailsMap.get(String(g.storeId));
        if (storeDetails) {
          let storeChanged = false;

          if (storeDetails.price !== undefined && storeDetails.price !== g.price) {
            updateData.price = storeDetails.price;
            storeChanged = true;
          }
          if (storeDetails.originalPrice !== undefined && storeDetails.originalPrice !== g.originalPrice) {
            updateData.originalPrice = storeDetails.originalPrice;
            storeChanged = true;
          }
          if (storeDetails.discountPercent !== undefined && storeDetails.discountPercent !== g.discountPercent) {
            updateData.discountPercent = storeDetails.discountPercent;
            storeChanged = true;
          }
          if (storeDetails.releaseDate && storeDetails.releaseDate !== g.releaseDate) {
            updateData.releaseDate = storeDetails.releaseDate;
            storeChanged = true;
          }
          if (storeDetails.releaseDateEn && storeDetails.releaseDateEn !== g.releaseDateEn) {
            updateData.releaseDateEn = storeDetails.releaseDateEn;
            storeChanged = true;
          }
          if (storeDetails.year && storeDetails.year !== g.year) {
            updateData.year = storeDetails.year;
            storeChanged = true;
          }
          if (storeDetails.genre && storeDetails.genre !== g.genre) {
            updateData.genre = storeDetails.genre;
            storeChanged = true;
          }
          if (storeDetails.genreEn && storeDetails.genreEn !== g.genreEn) {
            updateData.genreEn = storeDetails.genreEn;
            storeChanged = true;
          }
          if (storeDetails.studio && storeDetails.studio !== "Unknown Studio" && storeDetails.studio !== g.studio) {
            updateData.studio = storeDetails.studio;
            storeChanged = true;
          }
          if (storeDetails.publisher && storeDetails.publisher !== "Unknown Publisher" && storeDetails.publisher !== g.publisher) {
            updateData.publisher = storeDetails.publisher;
            storeChanged = true;
          }
          if (storeDetails.isEarlyAccess !== undefined && Boolean(storeDetails.isEarlyAccess) !== Boolean(g.isEarlyAccess)) {
            updateData.isEarlyAccess = Boolean(storeDetails.isEarlyAccess);
            storeChanged = true;
          }
          if (storeDetails.tags && storeDetails.tags.length > 0) {
            const tagsStr = JSON.stringify(storeDetails.tags);
            if (tagsStr !== g.tags) {
              updateData.tags = tagsStr;
              storeChanged = true;
            }
          }
          if (storeDetails.tagsEn && storeDetails.tagsEn.length > 0) {
            const tagsEnStr = JSON.stringify(storeDetails.tagsEn);
            if (tagsEnStr !== g.tagsEn) {
              updateData.tagsEn = tagsEnStr;
              storeChanged = true;
            }
          }
          if (storeDetails.screenshots && storeDetails.screenshots.length > 0 && (!g.screenshots || g.screenshots === "[]")) {
            updateData.screenshots = JSON.stringify(storeDetails.screenshots);
            storeChanged = true;
          }
          if (storeDetails.videos && storeDetails.videos.length > 0 && (!g.videos || g.videos === "[]")) {
            updateData.videos = JSON.stringify(storeDetails.videos);
            storeChanged = true;
          }
          if (storeDetails.description && (!g.description || g.description.length < 50)) {
            updateData.description = storeDetails.description;
            storeChanged = true;
          }
          if (storeDetails.descriptionEn && (!g.descriptionEn || g.descriptionEn.length < 50)) {
            updateData.descriptionEn = storeDetails.descriptionEn;
            storeChanged = true;
          }
          if (storeDetails.cover && (!g.cover || g.cover.includes("unsplash"))) {
            updateData.cover = storeDetails.cover;
            storeChanged = true;
          }

          if (storeChanged) {
            updatedStoreCount++;
          }
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.game.update({
            where: { id: g.id },
            data: updateData,
          });
          updatedCount++;
        }
      }
    }

    const allGames = await prisma.game.findMany({ orderBy: { addedAt: "desc" } });
    res.json({
      success: true,
      updatedCount,
      updatedStoreCount,
      totalSteamGames: steamData.totalGames || steamGames.length,
      totalSteamPlaytimeHours: steamData.totalPlaytimeHours || 0,
      totalSteamPlaytimeMinutes: steamData.totalPlaytimeMinutes || 0,
      games: allGames.map(formatGame),
    });
  } catch (error) {
    console.error("syncPlaytime error:", error);
    res.status(500).json({ error: "Failed to sync data from Steam" });
  }
}

