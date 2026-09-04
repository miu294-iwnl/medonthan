import axios from "axios";

// In-memory cache for playlist data and track covers
const playlistCache = new Map();
const trackCoverCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Extract Spotify playlist ID from URL, URI, or ID string
 */
export function extractPlaylistId(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  // Pattern: https://open.spotify.com/.../playlist/37i9dQZF1DXcBWIGoYBM5M...
  const urlMatch = trimmed.match(/playlist\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  // Pattern: spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
  const uriMatch = trimmed.match(/spotify:playlist:([a-zA-Z0-9]+)/);
  if (uriMatch) return uriMatch[1];

  // Raw playlist ID (typically 15-30 alphanumeric characters)
  if (/^[a-zA-Z0-9]{15,30}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Format milliseconds duration to "m:ss"
 */
function formatDuration(ms) {
  if (!ms || isNaN(ms)) return "3:30";
  const totalSecs = Math.round(ms / 1000);
  const minutes = Math.floor(totalSecs / 60);
  const seconds = totalSecs % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

/**
 * Decode common HTML entities and strip HTML tags
 */
function cleanHtml(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/<[^>]+>/g, "")
    .trim();
}

let spotifyAccessToken = null;
let spotifyTokenExpiresAt = 0;

/**
 * Obtain Spotify API Client Credentials Access Token
 */
async function getSpotifyApiToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (spotifyAccessToken && Date.now() < spotifyTokenExpiresAt) {
    return spotifyAccessToken;
  }

  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({ grant_type: "client_credentials" }).toString(),
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 5000,
      }
    );

    if (tokenRes.data && tokenRes.data.access_token) {
      spotifyAccessToken = tokenRes.data.access_token;
      const expiresInSec = tokenRes.data.expires_in || 3600;
      spotifyTokenExpiresAt = Date.now() + (expiresInSec - 60) * 1000;
      return spotifyAccessToken;
    }
  } catch (err) {
    console.warn("Failed to obtain Spotify API access token:", err.message);
  }
  return null;
}

/**
 * Fetch official playlist metadata (full description, owner, high-res cover) via Spotify Web API
 */
async function fetchOfficialPlaylistMetadata(playlistId) {
  try {
    const token = await getSpotifyApiToken();
    if (!token) return null;

    const res = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    });

    if (res.data) {
      return {
        name: res.data.name || null,
        description: res.data.description ? cleanHtml(res.data.description) : null,
        owner: res.data.owner?.display_name || null,
        cover: res.data.images?.[0]?.url || null,
      };
    }
  } catch (err) {
    console.warn(`Failed to fetch official Spotify metadata for ${playlistId}:`, err.message);
  }
  return null;
}

/**
 * Batch resolve track covers using Spotify public oEmbed with caching
 */
async function resolveTrackCovers(trackIds) {
  const missingIds = trackIds.filter((id) => id && !trackCoverCache.has(id));
  const chunkSize = 15;

  for (let i = 0; i < missingIds.length; i += chunkSize) {
    const chunk = missingIds.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (id) => {
        try {
          const res = await axios.get(
            `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${id}`,
            { timeout: 3500 }
          );
          if (res.data && res.data.thumbnail_url) {
            trackCoverCache.set(id, res.data.thumbnail_url);
          }
        } catch {
          // If oEmbed fails for a track, fallback will handle it
        }
      })
    );
  }
}

/**
 * Fetch playlist metadata and tracklist from Spotify public embed
 */
export async function fetchSpotifyPlaylist(playlistUrlOrId) {
  const input = playlistUrlOrId || process.env.MUSIC_API_SPOTIFYPLAYLIST;
  if (!input) {
    return {
      configured: false,
      message: "MUSIC_API_SPOTIFYPLAYLIST is not configured in server/.env",
    };
  }

  const playlistId = extractPlaylistId(input);
  if (!playlistId) {
    return {
      configured: false,
      error: "Invalid Spotify playlist URL or ID provided",
      providedUrl: input,
    };
  }

  // Check cache
  const cached = playlistCache.get(playlistId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
    const [embedRes, officialMeta] = await Promise.all([
      axios.get(embedUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
        },
        timeout: 10000,
      }),
      fetchOfficialPlaylistMetadata(playlistId),
    ]);

    const html = embedRes.data;
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);

    if (!match) {
      throw new Error("Unable to parse Spotify playlist embed payload");
    }

    const nextData = JSON.parse(match[1]);
    const entity = nextData.props?.pageProps?.state?.data?.entity;

    if (!entity) {
      throw new Error("Spotify playlist entity not found or playlist is private");
    }

    const playlistTitle = officialMeta?.name || entity.name || "Spotify Playlist";

    // Extract description: prefer official Spotify Web API, fallback to embed attributes
    const descAttr = (entity.attributes || []).find(
      (a) => a.key === "episode_description" || a.key === "description" || a.key === "summary"
    );
    const rawSpotifyDesc =
      descAttr?.value ||
      entity.description ||
      entity.rawDescription ||
      "";
    const playlistDesc = officialMeta?.description || cleanHtml(rawSpotifyDesc);

    const playlistOwner =
      officialMeta?.owner ||
      entity.subtitle ||
      (entity.authors && entity.authors[0]?.name) ||
      "";

    const playlistCover =
      officialMeta?.cover ||
      entity.coverArt?.sources?.[0]?.url ||
      "https://images.unsplash.com/photo-1778855639944-69b99210a0df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";

    const rawTracks = entity.trackList || [];

    // Extract track IDs and resolve their unique individual album covers
    const trackIds = rawTracks
      .map((item) => (item.uri ? item.uri.replace("spotify:track:", "") : null))
      .filter(Boolean);

    await resolveTrackCovers(trackIds);

    const tracks = rawTracks.map((item, index) => {
      const trackId = item.uri ? item.uri.replace("spotify:track:", "") : `t_${index + 1}`;
      const durationMs = item.duration || 210000;
      const durationSec = Math.round(durationMs / 1000);
      const trackCover = trackCoverCache.get(trackId) || playlistCover;

      return {
        id: trackId,
        index: index + 1,
        title: item.title || "Untitled Track",
        artist: item.subtitle || "Unknown Artist",
        album: playlistTitle,
        duration: formatDuration(durationMs),
        durationSec,
        cover: trackCover,
        audioSrc: item.audioPreview?.url || "",
        spotifyUrl: `https://open.spotify.com/track/${trackId}`,
        isPlayable: item.isPlayable !== false,
      };
    });

    const result = {
      configured: true,
      playlistId,
      playlistUrl: `https://open.spotify.com/playlist/${playlistId}`,
      title: playlistTitle,
      description: playlistDesc,
      owner: playlistOwner,
      cover: playlistCover,
      trackCount: tracks.length,
      tracks,
    };

    playlistCache.set(playlistId, { timestamp: Date.now(), data: result });
    return result;
  } catch (error) {
    console.error("Failed to fetch Spotify playlist:", error.message);
    return {
      configured: false,
      playlistId,
      playlistUrl: `https://open.spotify.com/playlist/${playlistId}`,
      error: `Failed to fetch Spotify playlist: ${error.message}`,
    };
  }
}
