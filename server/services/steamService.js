import axios from "axios";

// Helper to strip HTML tags
function stripHtml(html = "") {
  return html
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/gi, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Search Steam games by query string
 */
export async function searchSteam(query) {
  try {
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=vietnamese&cc=vn`;
    const response = await axios.get(url, { timeout: 6000 });
    const items = response.data?.items || [];

    return items.map((item) => {
      const appId = String(item.id);
      return {
        id: appId,
        storeId: appId,
        storeType: "steam",
        name: item.name,
        // High quality vertical poster or capsule header fallback
        cover: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900_2x.jpg`,
        thumbnail: item.tiny_image || `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
        price: item.price ? Math.round(item.price.final / 100) : 0,
        platform: "Steam",
      };
    });
  } catch (error) {
    console.error("Steam search error:", error.message);
    return [];
  }
}

/**
 * Get detailed game info from Steam Store API (Vietnam region & Vietnamese locale)
 */
export async function getSteamGameDetails(appId) {
  try {
    const [vnApiRes, enApiRes, vnPageRes, enPageRes] = await Promise.allSettled([
      axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=vn&l=vietnamese`, { timeout: 8000 }),
      axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&l=english`, { timeout: 8000 }),
      axios.get(`https://store.steampowered.com/app/${appId}/?l=vietnamese`, {
        timeout: 6000,
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Cookie": "birthtime=283993201; mature_content=1; lastagecheckage=1-January-1990; wants_mature_content=1",
        },
      }),
      axios.get(`https://store.steampowered.com/app/${appId}/?l=english`, {
        timeout: 6000,
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Cookie": "birthtime=283993201; mature_content=1; lastagecheckage=1-January-1990; wants_mature_content=1",
        },
      }),
    ]);

    const dataVn = vnApiRes.status === "fulfilled" ? vnApiRes.value.data?.[appId]?.data : null;
    const dataEn = enApiRes.status === "fulfilled" ? enApiRes.value.data?.[appId]?.data : null;
    const data = dataVn || dataEn;

    if (!data) {
      throw new Error(`Failed to fetch details for Steam AppId: ${appId}`);
    }

    // Process screenshots
    const screenshots = (data.screenshots || []).map((s) => s.path_full || s.path_thumbnail);

    // Process trailers / videos
    const videos = (data.movies || []).map((m) => {
      const url = m.hls_h264 || m.mp4?.max || m.mp4?.["480"] || m.webm?.max || m.webm?.["480"] || m.dash_h264 || "";
      return {
        name: m.name || "Trailer",
        thumbnail: m.thumbnail,
        url,
      };
    }).filter((v) => !!v.url);

    // Scrape VN tags
    let tags = [];
    const htmlVn = vnPageRes.status === "fulfilled" ? (vnPageRes.value.data || "") : "";
    if (htmlVn) {
      const regex = /<a[^>]*class=["']app_tag["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = regex.exec(htmlVn)) !== null) {
        const tag = match[1].trim();
        if (tag && tag !== "+" && !tags.includes(tag)) {
          tags.push(tag);
        }
      }
    }
    if (tags.length === 0) {
      tags = (dataVn?.genres || data?.genres || []).map((g) => g.description).filter(Boolean);
    }

    // Scrape EN tags
    let tagsEn = [];
    const htmlEn = enPageRes.status === "fulfilled" ? (enPageRes.value.data || "") : "";
    if (htmlEn) {
      const regex = /<a[^>]*class=["']app_tag["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = regex.exec(htmlEn)) !== null) {
        const tag = match[1].trim();
        if (tag && tag !== "+" && !tagsEn.includes(tag)) {
          tagsEn.push(tag);
        }
      }
    }
    if (tagsEn.length === 0) {
      tagsEn = (dataEn?.genres || []).map((g) => g.description).filter(Boolean);
    }

    // Process release year & dates (VN & EN)
    const releaseDateStr = dataVn?.release_date?.date || data?.release_date?.date || "TBA";
    const releaseDateEnStr = dataEn?.release_date?.date || releaseDateStr;
    let releaseYear = new Date().getFullYear();
    const yearMatch = releaseDateStr.match(/\b(19\d\d|20\d\d)\b/);
    if (yearMatch) {
      releaseYear = parseInt(yearMatch[0], 10);
    }

    // Process genres (VN & EN)
    const genreVn = tags[0] || (dataVn?.genres?.[0]?.description) || "Action";
    const genreEn = tagsEn[0] || (dataEn?.genres?.[0]?.description) || genreVn;

    // Process price & discounts (VN pricing)
    let price = 0;
    let originalPrice = 0;
    let discountPercent = 0;
    const priceOverview = dataVn?.price_overview || data?.price_overview;
    if (!data.is_free && priceOverview) {
      price = Math.round(priceOverview.final / 100);
      originalPrice = Math.round(priceOverview.initial / 100);
      discountPercent = priceOverview.discount_percent || 0;
    }

    // Process descriptions (VN & EN)
    const rawDescVn = dataVn?.about_the_game || dataVn?.detailed_description || data?.about_the_game || "";
    const description = rawDescVn
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/src="\/\//g, 'src="https://')
      .trim();

    const rawDescEn = dataEn?.about_the_game || dataEn?.detailed_description || "";
    const descriptionEn = rawDescEn
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/src="\/\//g, 'src="https://')
      .trim();

    // Cover image
    let cover = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900_2x.jpg`;
    try {
      const check = await axios.head(cover, { timeout: 2500 });
      if (check.status !== 200) {
        cover = data.header_image || data.capsule_image || (screenshots[0] || "");
      }
    } catch {
      cover = data.header_image || data.capsule_image || (screenshots[0] || "");
    }

    // Check if Early Access game
    const isEarlyAccess =
      (data.genres || []).some(
        (g) => g.id === "70" || g.id === "73" || g.description.toLowerCase().includes("truy cập sớm") || g.description.toLowerCase().includes("early access")
      ) ||
      htmlVn.includes("early_access_header") ||
      htmlEn.includes("early_access_header") ||
      tags.some((t) => t.toLowerCase() === "early access" || t.toLowerCase() === "truy cập sớm" || t.toLowerCase() === "tiếp cận sớm");

    if (isEarlyAccess) {
      if (!tags.some((t) => t.toLowerCase() === "early access" || t.toLowerCase() === "truy cập sớm")) {
        tags.unshift("Early Access");
      }
      if (!tagsEn.some((t) => t.toLowerCase() === "early access")) {
        tagsEn.unshift("Early Access");
      }
    }

    return {
      title: data.name,
      studio: data.developers?.[0] || "Unknown Studio",
      publisher: data.publishers?.[0] || data.developers?.[0] || "Unknown Publisher",
      genre: genreVn,
      genreEn: genreEn,
      year: releaseYear,
      hours: 0,
      platform: "Steam",
      cover: cover,
      screenshots,
      videos,
      description,
      descriptionEn,
      releaseDate: releaseDateStr,
      releaseDateEn: releaseDateEnStr,
      tags,
      tagsEn,
      price,
      originalPrice,
      discountPercent,
      isEarlyAccess,
      storeId: String(appId),
      storeType: "steam",
    };
  } catch (error) {
    console.error(`Steam details error for ${appId}:`, error.message);
    throw error;
  }
}

/**
 * Resolve Steam vanity URL (e.g. mused29) to Steam64 ID
 */
export async function resolveSteamVanityUrl(vanityUrl, apiKey) {
  if (!apiKey || !vanityUrl) return null;
  // If already a numeric 64-bit ID
  if (/^\d{17}$/.test(vanityUrl)) {
    return vanityUrl;
  }

  try {
    const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${apiKey}&vanityurl=${encodeURIComponent(vanityUrl)}`;
    const res = await axios.get(url, { timeout: 6000 });
    if (res.data?.response?.success === 1) {
      return res.data.response.steamid;
    }
  } catch (err) {
    console.error("Resolve vanity URL error:", err.message);
  }
  return null;
}

let cachedOwnedGamesData = null;
let lastOwnedGamesFetch = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Fetch all owned games and calculate account stats (total playtime, count, playtime map)
 */
export async function getSteamOwnedGamesData(vanityOrSteamId, apiKey, forceFresh = false) {
  if (!apiKey || !vanityOrSteamId) {
    return {
      playtimeMap: new Map(),
      totalPlaytimeHours: 0,
      totalPlaytimeMinutes: 0,
      totalGames: 0,
      steamId: null,
    };
  }

  const now = Date.now();
  if (!forceFresh && cachedOwnedGamesData && now - lastOwnedGamesFetch < CACHE_TTL) {
    return cachedOwnedGamesData;
  }

  try {
    const steamId = await resolveSteamVanityUrl(vanityOrSteamId, apiKey);
    if (!steamId) {
      console.warn("Could not resolve Steam ID for user:", vanityOrSteamId);
      return {
        playtimeMap: new Map(),
        totalPlaytimeHours: 0,
        totalPlaytimeMinutes: 0,
        totalGames: 0,
        steamId: null,
      };
    }

    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`;
    const res = await axios.get(url, { timeout: 8000 });
    const games = res.data?.response?.games || [];

    const playtimeMap = new Map();
    let totalMinutes = 0;
    for (const g of games) {
      const minutes = g.playtime_forever || 0;
      totalMinutes += minutes;
      const hours = minutes > 0 ? Math.round((minutes / 60) * 10) / 10 : 0;
      playtimeMap.set(String(g.appid), Math.round(hours));
    }

    const totalPlaytimeHours = Math.round(totalMinutes / 60);

    const result = {
      playtimeMap,
      totalPlaytimeHours,
      totalPlaytimeMinutes: totalMinutes,
      totalGames: games.length,
      steamId,
    };

    cachedOwnedGamesData = result;
    lastOwnedGamesFetch = now;
    return result;
  } catch (err) {
    console.error("GetOwnedGames error:", err.message);
    return {
      playtimeMap: new Map(),
      totalPlaytimeHours: 0,
      totalPlaytimeMinutes: 0,
      totalGames: 0,
      steamId: null,
    };
  }
}

/**
 * Fetch all owned games playtime map { appId -> hoursPlayed } for a user
 */
export async function getSteamOwnedGamesMap(vanityOrSteamId, apiKey, forceFresh = false) {
  const data = await getSteamOwnedGamesData(vanityOrSteamId, apiKey, forceFresh);
  return data.playtimeMap;
}

/**
 * Fetch overall account stats (total hours played across all Steam games, game count)
 */
export async function getSteamAccountStats(vanityOrSteamId, apiKey, forceFresh = false) {
  const data = await getSteamOwnedGamesData(vanityOrSteamId, apiKey, forceFresh);
  return {
    totalPlaytimeHours: data.totalPlaytimeHours,
    totalPlaytimeMinutes: data.totalPlaytimeMinutes,
    totalGames: data.totalGames,
    steamId: data.steamId,
  };
}

