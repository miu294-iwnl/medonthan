import { useEffect, useMemo, useRef, useState } from "react"
import Hls from "hls.js"
import steamIconSvg from "./imports/Steam_icon_logo.svg"
import xboxLogoSvg from "./imports/Xbox_Logo.svg"
import MusicPlayer from "./components/MusicPlayer"
import MusicPage from "./MusicPage"

type Status = "backlog" | "next" | "playing" | "beaten"
type Priority = "low" | "medium" | "high"
type ViewMode = "grid" | "list"
type Lang = "en" | "vi"

interface Review {
  count: number
  sentiment: "overwhelmingly_positive" | "very_positive" | "mostly_positive" | "mixed" | "mostly_negative" | "negative"
}

export interface GameVideo {
  name?: string
  thumbnail?: string
  url: string
}

export interface Game {
  id: string
  title: string
  studio: string
  publisher: string
  genre: string
  genreEn?: string
  year: number
  hours: number
  platform: string
  priority: Priority
  status: Status
  cover: string
  screenshots: string[]
  videos?: GameVideo[]
  description: string
  descriptionEn?: string
  releaseDate: string
  releaseDateEn?: string
  reviewRecent?: Review
  reviewAll?: Review
  tags: string[]
  tagsEn?: string[]
  addedAt: number
  price?: number
  originalPrice?: number
  discountPercent?: number
  hoursPlayed?: number
  isOwned?: boolean
  isEarlyAccess?: boolean
  isUnreleased?: boolean
  lndLink?: string
  storeId?: string
  storeType?: string
}

const T = {
  en: {
    subtitle: "GAMES // TO PLAY",
    titles: (n: number) => `${n} TITLES`,
    played: "PLAYED",
    wishlistLabel: "// WISHLIST",
    heroTitle1: "Everything you're",
    heroTitle2: "going to play",
    heroTitle3: "next.",
    heroDesc: "Track the games on your radar, flag what matters, and pull the next one off the shelf when you're ready. Click a card to see details.",
    all: "All",
    statuses: { backlog: "Backlog", next: "Up Next", playing: "Playing", beaten: "Beaten" },
    priorities: { low: "LOW", medium: "MEDIUM", high: "HIGH" },
    searchPlaceholder: "Search titles, studios, genres…",
    addGame: "+ ADD GAME",
    noMatch: "NO TITLES MATCH",
    modalTitle: "ADD TO WISHLIST",
    platformLabel: "PLATFORM",
    titlePlaceholder: "Game title",
    addBtn: "ADD TO WISHLIST",
    addingBtn: "ADDING GAME...",
    upNext: "UP NEXT",
    gridTitle: "Grid view",
    listTitle: "List view",
    detailStatus: "STATUS",
    detailPriority: "PRIORITY",
    detailClose: "CLOSE",
    detailRemove: "REMOVE FROM LIST",
    detailEdit: "EDITED",
    detailStorePage: "STORE PAGE",
    confirmQuestion: "Remove game from list?",
    confirmYes: "YES, REMOVE",
    confirmNo: "CANCEL",
    detailReviewRecent: "RECENT REVIEWS:",
    detailReviewAll: "ALL REVIEWS:",
    detailReleaseDate: "RELEASE DATE:",
    detailDeveloper: "DEVELOPER:",
    detailPublisher: "PUBLISHER:",
    detailTagsLabel: "Popular user-defined tags:",
    detailHoursPlayed: "TIME PLAYED:",
    detailHoursEst: "EST. HOURS:",
    detailHoursEstEdit: "Click or tap pencil to edit estimated hours",
    detailAddedAt: "ADDED:",
    detailPrice: "PRICE:",
    detailOwnership: "OWNERSHIP:",
    ownedLabel: "OWNED",
    unownedLabel: "NOT OWNED",
    detailToggleOwned: "Click to toggle ownership",
    saleLabel: (pct: number) => `(sale ${pct}%)`,
    unreleasedLabel: "COMING SOON",
    freeLabel: "FREE",
    syncBtn: "SYNC PLAYTIME & STORE",
    syncingBtn: "SYNCING...",
    syncSuccess: (n: number, storeN?: number) => storeN ? `Synced ${n} playtime(s) & ${storeN} store details` : `Synced ${n} Steam game(s)`,
    syncNoKey: "Please add STEAM_API_KEY to server/.env",
    seeMore: "SEE MORE ↓",
    seeLess: "SHOW LESS ↑",
    videoBadge: "TRAILER",
    estHoursLabel: "EST. HOURS (OPTIONAL)",
    gameAlreadyExists: "Game is already in your list",
    timeAgo: (ms: number) => {
      const s = Math.floor(ms / 1000)
      if (s < 60) return "just now"
      const m = Math.floor(s / 60)
      if (m < 60) return `${m}m ago`
      const h = Math.floor(m / 60)
      if (h < 24) return `${h}h ago`
      const d = Math.floor(h / 24)
      if (d < 30) return `${d}d ago`
      const mo = Math.floor(d / 30)
      if (mo < 12) return `${mo}mo ago`
      return `${Math.floor(mo / 12)}y ago`
    },
    sentiments: {
      overwhelmingly_positive: "Overwhelmingly Positive",
      very_positive: "Very Positive",
      mostly_positive: "Mostly Positive",
      mixed: "Mixed",
      mostly_negative: "Mostly Negative",
      negative: "Negative",
    },
  },
  vi: {
    subtitle: "GAME // SẼ CHƠI",
    titles: (n: number) => `${n} TỰA GAME`,
    played: "ĐÃ CHƠI",
    wishlistLabel: "// DANH SÁCH",
    heroTitle1: "Tất cả những game",
    heroTitle2: "bạn sẽ chơi",
    heroTitle3: "sắp tới.",
    heroDesc: "Theo dõi các game đang để mắt, đánh dấu thứ quan trọng và lấy cái tiếp theo ra khi sẵn sàng. Nhấn vào thẻ để xem chi tiết.",
    all: "Tất cả",
    statuses: { backlog: "Chưa chơi", next: "Sắp chơi", playing: "Đang chơi", beaten: "Đã xong" },
    priorities: { low: "THẤP", medium: "VỪA", high: "CAO" },
    searchPlaceholder: "Tìm tên game, studio, thể loại…",
    addGame: "+ THÊM GAME",
    noMatch: "KHÔNG TÌM THẤY KẾT QUẢ",
    modalTitle: "THÊM VÀO DANH SÁCH",
    platformLabel: "NỀN TẢNG",
    titlePlaceholder: "Tên game",
    addBtn: "THÊM VÀO DANH SÁCH",
    addingBtn: "ĐANG THÊM...",
    upNext: "SẮP CHƠI",
    gridTitle: "Dạng lưới",
    listTitle: "Dạng danh sách",
    detailStatus: "TRẠNG THÁI",
    detailPriority: "ƯU TIÊN",
    detailClose: "ĐÓNG",
    detailRemove: "XÓA KHỎI DANH SÁCH",
    detailEdit: "ĐÃ CHỈNH SỬA",
    detailStorePage: "TRANG CỬA HÀNG",
    confirmQuestion: "Xóa game khỏi danh sách?",
    confirmYes: "CÓ, XÓA",
    confirmNo: "KHÔNG",
    detailReviewRecent: "ĐÁNH GIÁ GẦN ĐÂY:",
    detailReviewAll: "TẤT CẢ ĐÁNH GIÁ:",
    detailReleaseDate: "NGÀY PHÁT HÀNH:",
    detailDeveloper: "NHÀ PHÁT TRIỂN:",
    detailPublisher: "NHÀ PHÁT HÀNH:",
    detailTagsLabel: "Tags phổ biến từ người dùng:",
    detailHoursPlayed: "ĐÃ CHƠI:",
    detailHoursEst: "GIỜ DỰ KIẾN:",
    detailHoursEstEdit: "Nhấn để chỉnh sửa giờ dự kiến hoàn thành",
    detailAddedAt: "ĐÃ THÊM:",
    detailPrice: "GIÁ:",
    detailOwnership: "SỞ HỮU:",
    ownedLabel: "ĐÃ SỞ HỮU",
    unownedLabel: "CHƯA SỞ HỮU",
    detailToggleOwned: "Nhấn để chuyển đổi trạng thái sở hữu",
    saleLabel: (pct: number) => `(sale ${pct}%)`,
    unreleasedLabel: "CHƯA RA MẮT",
    freeLabel: "MIỄN PHÍ",
    syncBtn: "ĐỒNG BỘ GIỜ CHƠI & CỬA HÀNG",
    syncingBtn: "ĐANG ĐỒNG BỘ...",
    syncSuccess: (n: number, storeN?: number) => storeN ? `Đã đồng bộ giờ chơi và thông tin ${storeN} game từ Steam` : `Đã đồng bộ dữ liệu ${n} game từ Steam`,
    syncNoKey: "Chưa cấu hình STEAM_API_KEY trong file server/.env",
    seeMore: "XEM THÊM ↓",
    seeLess: "THU GỌN ↑",
    videoBadge: "TRAILER",
    estHoursLabel: "GIỜ DỰ KIẾN (TÙY CHỌN)",
    gameAlreadyExists: "Game này đã có sẵn",
    timeAgo: (ms: number) => {
      const s = Math.floor(ms / 1000)
      if (s < 60) return "vừa xong"
      const m = Math.floor(s / 60)
      if (m < 60) return `${m} phút trước`
      const h = Math.floor(m / 60)
      if (h < 24) return `${h} giờ trước`
      const d = Math.floor(h / 24)
      if (d < 30) return `${d} ngày trước`
      const mo = Math.floor(d / 30)
      if (mo < 12) return `${mo} tháng trước`
      return `${Math.floor(mo / 12)} năm trước`
    },
    sentiments: {
      overwhelmingly_positive: "Cực kỳ tích cực",
      very_positive: "Rất tích cực",
      mostly_positive: "Phần lớn tích cực",
      mixed: "Hỗn hợp",
      mostly_negative: "Phần lớn tiêu cực",
      negative: "Tiêu cực",
    },
  },
}

const STATUSES: { key: Status }[] = [
  { key: "backlog" }, { key: "next" }, { key: "playing" }, { key: "beaten" },
]

const PRIORITIES: Priority[] = ["low", "medium", "high"]

const priorityColor: Record<Priority, string> = {
  low: "text-muted", medium: "text-ice", high: "text-flame",
}
const statusColor: Record<Status, string> = {
  backlog: "text-muted", next: "text-lime", playing: "text-ice", beaten: "text-gold",
}

const getGameGenre = (game: Game, lang: Lang) => (lang === "en" && game.genreEn) ? game.genreEn : game.genre
const getGameReleaseDate = (game: Game, lang: Lang) => (lang === "en" && game.releaseDateEn) ? game.releaseDateEn : game.releaseDate
const getGameTags = (game: Game, lang: Lang) => (lang === "en" && game.tagsEn && game.tagsEn.length > 0) ? game.tagsEn : game.tags
const getGameDescription = (game: Game, lang: Lang) => (lang === "en" && game.descriptionEn) ? game.descriptionEn : game.description
const sentimentColor: Record<Review["sentiment"], string> = {
  overwhelmingly_positive: "text-[#c084fc]",
  very_positive: "text-[#4fc3f7]",
  mostly_positive: "text-[#66bb6a]",
  mixed: "text-[#f5c518]",
  mostly_negative: "text-[#ef5350]",
  negative: "text-flame",
}

const fmtVnd = (price: number, freeLabel: string) =>
  price === 0
    ? freeLabel
    : price.toLocaleString("vi-VN") + "₫"

function parseGameDate(str?: string): Date | "unreleased" | "tba" | null {
  if (!str || typeof str !== "string") return null
  const s = str.trim()
  if (!s) return null

  const lower = s.toLowerCase()
  if (/sắp ra mắt|chưa ra mắt|chưa phát hành|coming soon|to be announced|wishlist now|not yet released/i.test(lower)) {
    return "unreleased"
  }
  if (/^(tba|tbd)$/i.test(lower)) {
    return "tba"
  }

  // Check simple 4-digit year (e.g. '2027', '2028')
  if (/^\d{4}$/.test(s)) {
    const yr = parseInt(s, 10)
    return new Date(yr, 11, 31, 23, 59, 59)
  }

  // Check 'Q1 2027', 'Q2 2027', 'Q3 2026', 'Q4 2026'
  const qMatch = s.match(/q([1-4])\s+(\d{4})/i)
  if (qMatch) {
    const q = parseInt(qMatch[1], 10)
    const yr = parseInt(qMatch[2], 10)
    const month = q * 3 - 1
    return new Date(yr, month, 28)
  }

  // Check Vietnamese month-year like 'Tháng 12 2026', 'Tháng 4 2027', 'Thg12 2026'
  const vnMonthYearMatch = s.match(/(?:tháng|thg)\s*(\d{1,2})[,\s]+(\d{4})/i)
  if (vnMonthYearMatch) {
    const month = parseInt(vnMonthYearMatch[1], 10) - 1
    const yr = parseInt(vnMonthYearMatch[2], 10)
    return new Date(yr, month + 1, 0, 23, 59, 59)
  }

  // Check Vietnamese day-month-year: '30 Thg11, 2022', '18 thg 4, 2023', '21 Thg08, 2012'
  const vnDayMonthYearMatch = s.match(/(\d{1,2})\s+(?:tháng|thg)\s*(\d{1,2})[,\s]+(\d{4})/i)
  if (vnDayMonthYearMatch) {
    const day = parseInt(vnDayMonthYearMatch[1], 10)
    const month = parseInt(vnDayMonthYearMatch[2], 10) - 1
    const yr = parseInt(vnDayMonthYearMatch[3], 10)
    return new Date(yr, month, day, 23, 59, 59)
  }

  const parsed = Date.parse(s)
  if (!isNaN(parsed)) {
    return new Date(parsed)
  }

  return null
}

export function isGameUnreleased(game?: {
  releaseDate?: string
  releaseDateEn?: string
  isUnreleased?: boolean
  year?: number
  price?: number
} | null): boolean {
  if (!game) return false
  if (game.isUnreleased) return true

  const now = new Date()
  const dateCandidates = [game.releaseDate, game.releaseDateEn].filter(Boolean) as string[]
  let hasValidPastDate = false
  let hasUnreleasedOrFuture = false

  for (const dateStr of dateCandidates) {
    const res = parseGameDate(dateStr)
    if (res === "unreleased" || res === "tba") {
      hasUnreleasedOrFuture = true
    } else if (res instanceof Date) {
      if (res.getTime() > now.getTime()) {
        hasUnreleasedOrFuture = true
      } else {
        hasValidPastDate = true
      }
    }
  }

  if (hasValidPastDate) return false
  if (hasUnreleasedOrFuture) return true

  if (game.year && game.year > now.getFullYear()) {
    return true
  }

  return false
}

const getGamePriceLabel = (
  game: { price?: number; releaseDate?: string; releaseDateEn?: string; isUnreleased?: boolean; year?: number },
  t: (typeof T)["en" | "vi"]
) => {
  const unreleased = isGameUnreleased(game)
  if (unreleased && (game.price === 0 || game.price == null)) {
    return {
      text: t.unreleasedLabel,
      isUnreleased: true,
      isFree: false,
      colorClass: "text-ice",
    }
  }
  if (game.price === 0) {
    return {
      text: t.freeLabel,
      isUnreleased: false,
      isFree: true,
      colorClass: "text-lime",
    }
  }
  return {
    text: fmtVnd(game.price ?? 0, t.freeLabel),
    isUnreleased: false,
    isFree: false,
    colorClass: "text-fg/80",
  }
}

function slugify(text: string) {
  return text
    .toString()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
}

function getGameUrlPath(game: Game) {
  const storeId = game.storeId || game.id
  const slug = slugify(game.title)
  if (game.platform === "Xbox" || game.storeType === "xbox") {
    return `/games/store/${slug}/${storeId}`
  }
  return `/app/${storeId}/${slug}`
}

function getGameStoreLink(game: Game) {
  const storeId = game.storeId || game.id
  const slug = slugify(game.title)
  if (game.platform === "Xbox" || game.storeType === "xbox") {
    return `https://www.xbox.com/vi-vn/games/store/${slug}/${storeId}`
  }
  if (game.storeId) {
    return `https://store.steampowered.com/app/${game.storeId}/${slug}/`
  }
  return `https://store.steampowered.com/search/?term=${encodeURIComponent(game.title)}`
}

const LANG_KEY = "game-wishlist-lang"

export default function App() {
  const [page, setPage] = useState<"games" | "music">(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase()
      if (path === "/music" || path.startsWith("/music/")) {
        return "music"
      }
    }
    return "games"
  })
  const [exiting, setExiting] = useState(false)

  const switchPage = (next: "games" | "music", updateHistory = true) => {
    if (next === page) return
    setExiting(true)
    setTimeout(() => {
      setPage(next)
      setExiting(false)
      if (updateHistory) {
        if (next === "music") {
          window.history.pushState({ page: "music" }, "", "/music")
        } else {
          window.history.pushState({ page: "games" }, "", "/games")
        }
      }
    }, 240)
  }

  // Redirect root / to /games automatically
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname
      if (!path || path === "/") {
        window.history.replaceState({ page: "games" }, "", "/games")
      }
    }
  }, [])

  const [games, setGames] = useState<Game[]>([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [steamTotalHours, setSteamTotalHours] = useState<number | null>(null)
  const [filter, setFilter] = useState<Status | "all">("all")
  const [query, setQuery] = useState("")
  const [adding, setAdding] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [toastInfo, setToastInfo] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const s = localStorage.getItem(LANG_KEY)
      if (s === "en" || s === "vi") return s
    } catch { }
    return "vi"
  })

  const t = T[lang]

  useEffect(() => { try { localStorage.setItem(LANG_KEY, lang) } catch { } }, [lang])

  // Fetch Steam account statistics (total playtime of all games on Steam)
  const fetchSteamStats = async () => {
    try {
      const res = await fetch("/api/steam/stats")
      if (res.ok) {
        const data = await res.json()
        if (typeof data.totalPlaytimeHours === "number" && data.configured) {
          setSteamTotalHours(data.totalPlaytimeHours)
        }
      }
    } catch (e) {
      console.error("Failed to load Steam stats:", e)
    }
  }

  // Fetch games from backend SQLite API
  const fetchGames = async () => {
    try {
      setLoadingGames(true)
      const res = await fetch("/api/games")
      if (res.ok) {
        const data: Game[] = await res.json()
        setGames(data)

        // Match route path on initial load if URL contains /app/... or /games/store/...
        const path = window.location.pathname.toLowerCase()
        if (path && path !== "/" && path !== "/games" && path !== "/games/" && !path.startsWith("/music")) {
          const matched = data.find((g) => {
            const gamePath = getGameUrlPath(g)
            return path.startsWith(gamePath.toLowerCase()) ||
              (g.storeId && path.includes(g.storeId)) ||
              (g.id && path.includes(g.id))
          })
          if (matched) {
            setSelectedId(matched.id)
          }
        }
      }
    } catch (e) {
      console.error("Failed to load games from API:", e)
    } finally {
      setLoadingGames(false)
    }
  }

  useEffect(() => {
    fetchGames()
    fetchSteamStats()
  }, [])

  // Handle browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname.toLowerCase()
      if (path === "/music" || path.startsWith("/music/")) {
        setPage("music")
        setSelectedId(null)
      } else {
        setPage("games")
        if (!path || path === "/" || path === "/games" || path === "/games/") {
          setSelectedId(null)
        } else {
          const matched = games.find((g) => {
            const gamePath = getGameUrlPath(g)
            return path.startsWith(gamePath.toLowerCase()) ||
              (g.storeId && path.includes(g.storeId)) ||
              (g.id && path.includes(g.id))
          })
          if (matched) {
            setSelectedId(matched.id)
          }
        }
      }
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [games])

  const openGameDetail = (game: Game) => {
    setSelectedId(game.id)
    window.history.pushState({ gameId: game.id }, "", getGameUrlPath(game))
  }

  const closeGameDetail = () => {
    setSelectedId(null)
    window.history.pushState({}, "", "/games")
  }

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") closeGameDetail() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [])

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastInfo({ message: msg, type })
    setTimeout(() => setToastInfo(null), 4000)
  }

  const visible = useMemo(() => games.filter((g) => {
    const okStatus = filter === "all" || g.status === filter
    const gGenre = getGameGenre(g, lang)
    const okQuery = !query ||
      g.title.toLowerCase().includes(query.toLowerCase()) ||
      gGenre.toLowerCase().includes(query.toLowerCase()) ||
      (g.genre && g.genre.toLowerCase().includes(query.toLowerCase())) ||
      (g.genreEn && g.genreEn.toLowerCase().includes(query.toLowerCase())) ||
      g.studio.toLowerCase().includes(query.toLowerCase())
    return okStatus && okQuery
  }), [games, filter, query, lang])

  const counts = useMemo(() => {
    const c: Record<Status, number> = { backlog: 0, next: 0, playing: 0, beaten: 0 }
    games.forEach((g) => {
      if (c[g.status] !== undefined) c[g.status] += 1
    })
    return c
  }, [games])

  const totalHoursPlayed = useMemo(
    () => games.reduce((sum, g) => sum + (g.hoursPlayed || 0), 0),
    [games],
  )

  const displayTotalHours = steamTotalHours !== null ? steamTotalHours : totalHoursPlayed

  const selectedGame = useMemo(() => games.find((g) => g.id === selectedId) ?? null, [games, selectedId])

  const setStatus = async (id: string, s: Status) => {
    setGames((p) => p.map((g) => g.id === id ? { ...g, status: s } : g))
    try {
      await fetch(`/api/games/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      })
    } catch (e) {
      console.error("Failed to update status:", e)
    }
  }

  const setPriority = async (id: string, p: Priority) => {
    setGames((prev) => prev.map((g) => g.id === id ? { ...g, priority: p } : g))
    try {
      await fetch(`/api/games/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: p }),
      })
    } catch (e) {
      console.error("Failed to update priority:", e)
    }
  }

  const cycleStatus = (id: string) => {
    const g = games.find((item) => item.id === id)
    if (!g) return
    const order: Status[] = ["backlog", "next", "playing", "beaten"]
    const nextStatus = order[(order.indexOf(g.status) + 1) % order.length]
    setStatus(id, nextStatus)
  }

  const cyclePriority = (id: string) => {
    const g = games.find((item) => item.id === id)
    if (!g) return
    const nextPriority = PRIORITIES[(PRIORITIES.indexOf(g.priority) + 1) % PRIORITIES.length]
    setPriority(id, nextPriority)
  }

  const remove = async (id: string) => {
    setGames((p) => p.filter((g) => g.id !== id))
    if (selectedId === id) closeGameDetail()
    try {
      await fetch(`/api/games/${id}`, { method: "DELETE" })
    } catch (e) {
      console.error("Failed to delete game:", e)
    }
  }

  const addGame = async (title: string, platform: string, storeId?: string, storeType?: string, lndLink?: string, hours?: number) => {
    const normTitle = (title || "").toLowerCase().trim()
    const alreadyExists = games.some(
      (g) => (storeId && String(g.storeId) === String(storeId)) || (normTitle && g.title.toLowerCase().trim() === normTitle)
    )

    if (alreadyExists) {
      showToast(t.gameAlreadyExists, "error")
      setAdding(false)
      return
    }

    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, platform, storeId, storeType, lndLink, hours }),
      })
      if (res.status === 409) {
        showToast(t.gameAlreadyExists, "error")
      } else if (res.ok) {
        const created = await res.json()
        setGames((prev) => [created, ...prev])
      }
    } catch (e) {
      console.error("Failed to add game:", e)
    }
    setAdding(false)
  }

  const handleSyncPlaytime = async () => {
    if (syncing) return
    setSyncing(true)
    try {
      const res = await fetch("/api/games/sync-playtime", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setGames(data.games)
        if (typeof data.totalSteamPlaytimeHours === "number") {
          setSteamTotalHours(data.totalSteamPlaytimeHours)
        } else {
          fetchSteamStats()
        }
        showToast(t.syncSuccess(data.updatedCount || 0, data.updatedStoreCount))
      } else {
        showToast(data.message || t.syncNoKey, "error")
      }
    } catch (e) {
      console.error("Sync error:", e)
      showToast(t.syncNoKey, "error")
    } finally {
      setSyncing(false)
    }
  }

  if (page === "music") return <MusicPage onBack={() => switchPage("games")} exiting={exiting} />

  return (
    <div className={`min-h-full ${exiting ? "page-exiting" : ""}`}>
      {/* Toast Alert */}
      {toastInfo && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-sm px-4 py-3 shadow-2xl backdrop-blur-md ${toastInfo.type === "error"
            ? "border border-flame/70 bg-[#160c0c] text-flame shadow-flame/10"
            : "border border-lime/50 bg-panel text-fg"
          }`}>
          <span className={`text-sm ${toastInfo.type === "error" ? "text-flame font-bold" : "text-lime"}`}>
            {toastInfo.type === "error" ? "✕" : "✦"}
          </span>
          <span className={`font-mono text-xs font-semibold ${toastInfo.type === "error" ? "text-flame" : "text-fg"}`}>
            {toastInfo.message}
          </span>
          <button onClick={() => setToastInfo(null)} className="ml-2 font-mono text-xs text-muted hover:text-fg">✕</button>
        </div>
      )}

      {/* Header */}
      <header className="page-enter-header sticky top-0 z-20 border-b border-line bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-sm bg-lime text-ink">
              <span className="font-mono text-sm font-bold">▶</span>
            </div>
            <div className="leading-none">
              <div className="font-mono text-[13px] font-semibold tracking-[0.28em] text-fg">MEDONTHAN</div>
              <div className="mt-1 font-mono text-[10px] tracking-[0.3em] text-muted">{t.subtitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => switchPage("music")}
              className="font-mono text-[10px] tracking-[0.2em] text-muted transition-colors hover:text-lime">
              ♫ MUSIC
            </button>
            <div className="hidden items-center gap-6 font-mono text-[11px] tracking-[0.18em] text-muted sm:flex">
              <span>{t.titles(games.length)}</span>
              <span className="text-line">/</span>
              <span>{displayTotalHours}<span className="text-lime">H</span> {t.played}</span>
            </div>

            {/* Sync Steam playtime button */}
            <button
              onClick={handleSyncPlaytime}
              disabled={syncing}
              title={t.syncBtn}
              className="flex items-center gap-2 rounded-sm border border-line bg-panel px-3 py-1.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-muted transition-colors hover:border-lime/60 hover:text-lime disabled:opacity-50"
            >
              <svg className={`size-3.5 ${syncing ? "animate-spin text-lime" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden md:inline">{syncing ? t.syncingBtn : t.syncBtn}</span>
            </button>

            {/* Language switcher */}
            <div className="flex items-center rounded-sm border border-line bg-panel p-0.5">
              <button onClick={() => setLang("vi")} className={`rounded-sm px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.1em] transition-colors ${lang === "vi" ? "bg-lime text-ink" : "text-muted hover:text-fg"}`}>VI</button>
              <button onClick={() => setLang("en")} className={`rounded-sm px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.1em] transition-colors ${lang === "en" ? "bg-lime text-ink" : "text-muted hover:text-fg"}`}>EN</button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        <section className="page-enter-hero mb-10">
          <p className="font-mono text-[11px] tracking-[0.34em] text-lime">{t.wishlistLabel}</p>
          <h1 className="mt-4 max-w-2xl font-mono text-4xl font-semibold leading-[1.05] tracking-tight text-fg sm:text-5xl">
            {t.heroTitle1}<br /><span className="text-lime">{t.heroTitle2}</span> {t.heroTitle3}
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">{t.heroDesc}</p>
        </section>

        <div className="page-enter-filter mb-6 flex flex-wrap items-center gap-2">
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")} label={t.all} count={games.length} />
          {STATUSES.map((s) => (
            <FilterPill key={s.key} active={filter === s.key} onClick={() => setFilter(s.key)}
              label={t.statuses[s.key]} count={counts[s.key]} />
          ))}
        </div>

        <div className="page-enter-list mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">⌕</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchPlaceholder}
              className="w-full rounded-sm border border-line bg-panel py-3 pl-10 pr-4 text-sm text-fg outline-none transition-colors placeholder:text-muted/70 focus:border-lime/60" />
          </div>
          <div className="flex items-center rounded-sm border border-line bg-panel p-1">
            <button onClick={() => setViewMode("list")} title={t.listTitle}
              className={`grid size-9 place-items-center rounded-sm transition-colors ${viewMode === "list" ? "bg-lime/15 text-lime" : "text-muted hover:text-fg"}`}><ListIcon /></button>
            <button onClick={() => setViewMode("grid")} title={t.gridTitle}
              className={`grid size-9 place-items-center rounded-sm transition-colors ${viewMode === "grid" ? "bg-lime/15 text-lime" : "text-muted hover:text-fg"}`}><GridIcon /></button>
          </div>
          <button onClick={() => setAdding(true)}
            className="rounded-sm bg-lime px-5 py-3 font-mono text-[12px] font-semibold tracking-[0.14em] text-ink transition-transform hover:-translate-y-0.5 active:translate-y-0">
            {t.addGame}
          </button>
        </div>

        {loadingGames ? (
          <div className="page-enter-list grid place-items-center rounded-sm border border-dashed border-line py-24 text-center">
            <div className="size-6 animate-spin rounded-full border-2 border-lime border-t-transparent" />
            <p className="mt-3 font-mono text-xs tracking-[0.2em] text-muted">LOADING LIBRARY...</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="page-enter-list grid place-items-center rounded-sm border border-dashed border-line py-24 text-center">
            <p className="font-mono text-xs tracking-[0.2em] text-muted">{t.noMatch}</p>
          </div>
        ) : viewMode === "list" ? (
          <div className="page-enter-list flex flex-col gap-2">
            {visible.map((g) => (
              <GameRow key={g.id} game={g} t={t} lang={lang} selected={selectedId === g.id}
                onClick={() => openGameDetail(g)}
                onStatus={() => cycleStatus(g.id)} onPriority={() => cyclePriority(g.id)} onRemove={() => remove(g.id)} />
            ))}
          </div>
        ) : (
          <div className="page-enter-list grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((g) => (
              <GameCard key={g.id} game={g} t={t} lang={lang} selected={selectedId === g.id}
                onClick={() => openGameDetail(g)}
                onStatus={() => cycleStatus(g.id)} onPriority={() => cyclePriority(g.id)} onRemove={() => remove(g.id)} />
            ))}
          </div>
        )}

        {/* Background Music Player (Docked below game list on mobile, floating on desktop) */}
        <MusicPlayer lang={lang} />
      </main>

      {selectedGame && (
        <DetailPanel game={selectedGame} t={t} lang={lang}
          onClose={closeGameDetail}
          onSetStatus={(s) => setStatus(selectedGame.id, s)}
          onSetPriority={(p) => setPriority(selectedGame.id, p)}
          onRemove={() => { remove(selectedGame.id); closeGameDetail() }}
          onToggleOwned={async (isOwned) => {
            setGames((prev) => prev.map((g) => g.id === selectedGame.id ? { ...g, isOwned } : g))
            try {
              await fetch(`/api/games/${selectedGame.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isOwned }),
              })
            } catch (e) { }
          }}
          onSetHours={async (hours) => {
            setGames((prev) => prev.map((g) => g.id === selectedGame.id ? { ...g, hours } : g))
            try {
              await fetch(`/api/games/${selectedGame.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hours }),
              })
            } catch (e) { }
          }}
          onSetLndLink={async (link) => {
            setGames((prev) => prev.map((g) => g.id === selectedGame.id ? { ...g, lndLink: link } : g))
            try {
              await fetch(`/api/games/${selectedGame.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lndLink: link }),
              })
            } catch (e) { }
          }} />
      )}

      {adding && <AddModal t={t} onClose={() => setAdding(false)} onAdd={addGame} />}
    </div>
  )
}

/* ── icons ──────────────────────────────────────────────────────── */
function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  )
}
function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="2" width="14" height="2.5" rx="1" />
      <rect x="1" y="6.75" width="14" height="2.5" rx="1" />
      <rect x="1" y="11.5" width="14" height="2.5" rx="1" />
    </svg>
  )
}

function SteamIcon({ className = "size-4" }: { className?: string }) {
  return (
    <img src={steamIconSvg} alt="Steam" className={`${className} shrink-0 object-contain`} />
  )
}

function XboxIcon({ className = "size-4" }: { className?: string }) {
  return (
    <img src={xboxLogoSvg} alt="Xbox" className={`${className} shrink-0 object-contain invert`} />
  )
}

type Translations = typeof T["en"]

/* ── FilterPill ─────────────────────────────────────────────────── */
function FilterPill({ active, onClick, label, count }: {
  active: boolean; onClick: () => void; label: string; count: number
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[11px] tracking-[0.14em] transition-colors ${active ? "border-lime bg-lime/10 text-lime" : "border-line bg-panel text-muted hover:border-muted/50 hover:text-fg"}`}>
      {label.toUpperCase()}
      <span className={active ? "text-lime/70" : "text-muted/60"}>{count}</span>
    </button>
  )
}

/* ── GameCard ───────────────────────────────────────────────────── */
function GameCard({ game, t, lang, selected, onClick, onStatus, onPriority, onRemove }: {
  game: Game; t: Translations; lang: Lang; selected: boolean
  onClick: () => void; onStatus: () => void; onPriority: () => void; onRemove: () => void
}) {
  const currentGenre = getGameGenre(game, lang)
  return (
    <article onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-sm border bg-panel transition-all ${selected ? "border-lime/60 ring-1 ring-lime/20" : "border-line hover:border-muted/40"}`}>
      <div className="relative aspect-[3/4] overflow-hidden bg-panel-2">
        <img
          src={game.cover}
          alt={game.title}
          onError={(e) => {
            const target = e.currentTarget
            if (game.screenshots?.[0] && target.src !== game.screenshots[0]) {
              target.src = game.screenshots[0]
            }
          }}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />

        {/* Badges top left */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {game.isEarlyAccess && (
            <div className="rounded-sm bg-[#00bcd4] px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.14em] text-ink shadow">
              EARLY ACCESS
            </div>
          )}
          {game.isOwned && (
            <div className="rounded-sm bg-lime/90 px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.14em] text-ink shadow">
              ✓ {t.ownedLabel}
            </div>
          )}
          {game.status === "next" && (
            <div className="rounded-sm bg-lime px-2 py-1 font-mono text-[9px] font-bold tracking-[0.18em] text-ink">{t.upNext}</div>
          )}
          {game.status === "beaten" && (
            <div className="beaten-badge rounded-sm px-2 py-1 font-mono text-[9px] font-bold tracking-[0.18em] text-ink shadow-md">
              ✦ {t.statuses.beaten.toUpperCase()}
            </div>
          )}
        </div>

        <button onClick={(e) => { e.stopPropagation(); onRemove() }} aria-label="Remove"
          className="absolute right-3 top-3 grid size-7 place-items-center rounded-sm border border-line bg-ink/70 font-mono text-xs text-muted opacity-0 backdrop-blur transition hover:border-flame/60 hover:text-flame group-hover:opacity-100">✕</button>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-muted">
            <span>{game.year}</span><span className="text-line">·</span><span>{game.platform}</span>
          </div>
          <h3 className="mt-2 font-mono text-base font-semibold leading-tight text-fg">{game.title}</h3>
          <p className="mt-1 text-xs text-muted">{game.studio}</p>
          {game.addedAt && (
            <p className="mt-1 font-mono text-[9px] tracking-[0.14em] text-muted/50">
              +{t.timeAgo(Date.now() - game.addedAt)}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-sm bg-panel-2 px-2 py-1 font-mono text-[10px] tracking-[0.1em] text-muted">{currentGenre}</span>
          {(game.price != null || isGameUnreleased(game)) && (() => {
            const priceInfo = getGamePriceLabel(game, t)
            return (
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <span className={`font-semibold tracking-[0.06em] ${priceInfo.colorClass}`}>
                  {priceInfo.text}
                </span>
                {game.discountPercent != null && game.discountPercent > 0 && !priceInfo.isUnreleased && (
                  <span className="font-bold text-flame">
                    -{game.discountPercent}%
                  </span>
                )}
              </div>
            )
          })()}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={(e) => { e.stopPropagation(); onPriority() }}
            className={`rounded-sm border border-line px-2 py-1 font-mono text-[10px] tracking-[0.12em] transition-colors hover:border-muted/50 ${priorityColor[game.priority]}`}>
            {t.priorities[game.priority]}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onStatus() }}
            className={`rounded-sm border px-2 py-1 font-mono text-[10px] tracking-[0.12em] transition-colors ${game.status === "beaten" ? "beaten-btn" : `border-line hover:border-muted/50 ${statusColor[game.status]}`
              }`}>
            {game.status === "beaten"
              ? <span className="beaten-shimmer">✦ {t.statuses[game.status].toUpperCase()}</span>
              : t.statuses[game.status].toUpperCase()
            }
          </button>
        </div>
      </div>
    </article>
  )
}

/* ── GameRow ────────────────────────────────────────────────────── */
function GameRow({ game, t, lang, selected, onClick, onStatus, onPriority, onRemove }: {
  game: Game; t: Translations; lang: Lang; selected: boolean
  onClick: () => void; onStatus: () => void; onPriority: () => void; onRemove: () => void
}) {
  const currentGenre = getGameGenre(game, lang)
  const statusCls = `rounded-sm border px-2 py-1 font-mono text-[10px] tracking-[0.12em] transition-colors ${game.status === "beaten" ? "beaten-btn" : `border-line hover:border-muted/50 ${statusColor[game.status]}`
    }`
  const statusContent = game.status === "beaten"
    ? <span className="beaten-shimmer">✦ {t.statuses[game.status].toUpperCase()}</span>
    : t.statuses[game.status].toUpperCase()

  const priorityCls = `rounded-sm border border-line px-2 py-1 font-mono text-[10px] tracking-[0.12em] transition-colors hover:border-muted/50 ${priorityColor[game.priority]}`

  return (
    <article onClick={onClick}
      className={`group flex cursor-pointer gap-3 rounded-sm border bg-panel px-3 py-3 transition-all sm:items-center sm:gap-4 sm:px-4 ${selected ? "border-lime/60 ring-1 ring-lime/20" : "border-line hover:border-muted/40"}`}>

      {/* Thumbnail */}
      <div className="size-12 shrink-0 self-center overflow-hidden rounded-sm bg-panel-2">
        <img
          src={game.cover}
          alt=""
          onError={(e) => {
            const target = e.currentTarget
            if (game.screenshots?.[0] && target.src !== game.screenshots[0]) {
              target.src = game.screenshots[0]
            }
          }}
          className="size-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Info block */}
      <div className="min-w-0 flex-1 self-center">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-mono text-sm font-semibold text-fg">{game.title}</h3>
          {game.isEarlyAccess && (
            <span className="shrink-0 rounded-sm bg-[#00bcd4]/15 border border-[#00bcd4]/30 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#00bcd4]">
              EARLY ACCESS
            </span>
          )}
          {game.isOwned && (
            <span className="shrink-0 rounded-sm bg-lime/15 border border-lime/30 px-1.5 py-0.5 font-mono text-[9px] font-bold text-lime">
              ✓ {t.ownedLabel}
            </span>
          )}
          {game.status === "next" && (
            <span className="hidden shrink-0 rounded-sm bg-lime/15 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.14em] text-lime sm:inline">{t.upNext}</span>
          )}
          {game.status === "beaten" && (
            <span className="beaten-badge hidden shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.14em] text-ink sm:inline">✦ {t.statuses.beaten.toUpperCase()}</span>
          )}
        </div>
        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 font-mono text-[10px] tracking-[0.12em] text-muted sm:flex-nowrap">
          <span className="shrink-0">{game.platform}</span>
          <span className="text-line">·</span>
          <span className="shrink-0">{currentGenre}</span>
          {(game.price != null || isGameUnreleased(game)) && (() => {
            const priceInfo = getGamePriceLabel(game, t)
            return (
              <>
                <span className="text-line">·</span>
                <span className={`shrink-0 font-semibold ${priceInfo.isUnreleased ? "text-ice" : priceInfo.isFree ? "text-lime" : "text-fg/70"}`}>
                  {priceInfo.text}
                </span>
                {game.discountPercent != null && game.discountPercent > 0 && !priceInfo.isUnreleased && (
                  <span className="shrink-0 font-bold text-flame">
                    {t.saleLabel(game.discountPercent)}
                  </span>
                )}
              </>
            )
          })()}
          {game.hoursPlayed != null && game.hoursPlayed > 0 && (
            <><span className="text-line">·</span>
              <span className="shrink-0 font-semibold text-ice">▶ {game.hoursPlayed}h</span></>
          )}
          {game.addedAt && (
            <><span className="text-line">·</span>
              <span className="shrink-0 text-muted/50">+{t.timeAgo(Date.now() - game.addedAt)}</span></>
          )}
        </div>
      </div>

      {/* Desktop: auto-sized buttons side by side */}
      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
        <button onClick={(e) => { e.stopPropagation(); onStatus() }} className={statusCls}>{statusContent}</button>
        <button onClick={(e) => { e.stopPropagation(); onPriority() }} className={priorityCls}>{t.priorities[game.priority]}</button>
      </div>

      {/* Mobile: stacked, both stretch to same width */}
      <div className="flex shrink-0 flex-col gap-1.5 sm:hidden" style={{ width: "5.5rem" }}>
        <button onClick={(e) => { e.stopPropagation(); onStatus() }} className={`${statusCls} w-full text-center`}>{statusContent}</button>
        <button onClick={(e) => { e.stopPropagation(); onPriority() }} className={`${priorityCls} w-full text-center`}>{t.priorities[game.priority]}</button>
      </div>
    </article>
  )
}

/* ── TrophyIcon ─────────────────────────────────────────────────── */
function TrophyIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="trophy-gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c8922a" />
          <stop offset="40%" stopColor="#f0c040" />
          <stop offset="55%" stopColor="#fde68a" />
          <stop offset="70%" stopColor="#f0c040" />
          <stop offset="100%" stopColor="#c8922a" />
        </linearGradient>
      </defs>
      <path d="M8 4h12v9a6 6 0 0 1-12 0V4Z" fill="url(#trophy-gold)" />
      <path d="M8 6H5a3 3 0 0 0 3 3" stroke="url(#trophy-gold)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M20 6h3a3 3 0 0 1-3 3" stroke="url(#trophy-gold)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <rect x="12.5" y="17" width="3" height="4" fill="url(#trophy-gold)" />
      <rect x="9" y="21" width="10" height="2.5" rx="1" fill="url(#trophy-gold)" />
    </svg>
  )
}

function VideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    let hls: Hls | null = null

    if (src.includes(".m3u8")) {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        })
        hls.loadSource(src)
        hls.attachMedia(video)
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src
      }
    } else {
      video.src = src
    }

    return () => {
      if (hls) {
        hls.destroy()
      }
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls
      playsInline
      className="size-full object-contain bg-black"
    />
  )
}

/* ── ImageGallery (supports both images and videos safely) ───────── */
type MediaItem = { type: "video"; url: string; thumbnail?: string; name?: string } | { type: "image"; url: string }

function ImageGallery({ cover, screenshots, videos }: { cover: string; screenshots: string[]; videos?: GameVideo[] }) {
  const allMedia: MediaItem[] = useMemo(() => {
    const list: MediaItem[] = []
    if (videos && Array.isArray(videos) && videos.length > 0) {
      videos.forEach((v) => {
        if (v && typeof v.url === "string" && v.url.trim().length > 0) {
          list.push({ type: "video", url: v.url, thumbnail: v.thumbnail, name: v.name })
        }
      })
    }
    if (cover && typeof cover === "string") {
      list.push({ type: "image", url: cover })
    }
    if (screenshots && Array.isArray(screenshots) && screenshots.length > 0) {
      screenshots.forEach((s) => {
        const url = typeof s === "string" ? s : ((s as any)?.url || (s as any)?.Uri)
        if (url && typeof url === "string") {
          list.push({ type: "image", url })
        }
      })
    }
    return list.length > 0 ? list : [{ type: "image", url: cover }]
  }, [cover, screenshots, videos])

  const [idx, setIdx] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const isHorizontalSwipe = useRef<boolean | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Reset index when media list changes
  useEffect(() => {
    setIdx(0)
    setDragOffset(0)
    setIsDragging(false)
  }, [allMedia])

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    isHorizontalSwipe.current = null
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const deltaX = currentX - startX.current
    const deltaY = currentY - startY.current

    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY)
      }
    }

    if (isHorizontalSwipe.current) {
      // Apply rubber-band effect at boundaries
      let offset = deltaX
      if ((idx === 0 && deltaX > 0) || (idx === allMedia.length - 1 && deltaX < 0)) {
        offset = deltaX * 0.3
      }
      setDragOffset(offset)
    }
  }

  const handleTouchEnd = () => {
    if (isHorizontalSwipe.current) {
      const containerWidth = containerRef.current?.offsetWidth || 320
      const threshold = Math.min(60, containerWidth * 0.18)

      if (dragOffset < -threshold && idx < allMedia.length - 1) {
        setIdx((i) => i + 1)
      } else if (dragOffset > threshold && idx > 0) {
        setIdx((i) => i - 1)
      }
    }

    startX.current = null
    startY.current = null
    isHorizontalSwipe.current = null
    setIsDragging(false)
    setDragOffset(0)
  }

  // Pointer / Mouse drag handlers for desktop
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return // already handled by touch events
    startX.current = e.clientX
    startY.current = e.clientY
    isHorizontalSwipe.current = true
    setIsDragging(true)
      ; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return
    if (!isDragging || startX.current === null) return
    const deltaX = e.clientX - startX.current
    let offset = deltaX
    if ((idx === 0 && deltaX > 0) || (idx === allMedia.length - 1 && deltaX < 0)) {
      offset = deltaX * 0.3
    }
    setDragOffset(offset)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return
    if (!isDragging) return
    const containerWidth = containerRef.current?.offsetWidth || 320
    const threshold = Math.min(60, containerWidth * 0.18)

    if (dragOffset < -threshold && idx < allMedia.length - 1) {
      setIdx((i) => i + 1)
    } else if (dragOffset > threshold && idx > 0) {
      setIdx((i) => i - 1)
    }

    startX.current = null
    startY.current = null
    isHorizontalSwipe.current = null
    setIsDragging(false)
    setDragOffset(0)
  }

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIdx((i) => Math.max(0, i - 1))
  }
  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIdx((i) => Math.min(allMedia.length - 1, i + 1))
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`group/gal relative aspect-video select-none overflow-hidden bg-panel-2 touch-pan-y ${isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
    >
      {/* Horizontal Carousel Track - Real-time follow */}
      <div
        className="flex h-full w-full"
        style={{
          transform: `translateX(calc(-${idx * 100}% + ${dragOffset}px))`,
          transition: isDragging ? "none" : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {allMedia.map((m, i) => (
          <div key={i} className="relative h-full w-full shrink-0 flex-[0_0_100%] overflow-hidden bg-panel-2">
            {m.type === "video" ? (
              <VideoPlayer src={m.url} poster={m.thumbnail} />
            ) : (
              <img
                src={m.url}
                alt=""
                draggable={false}
                className="size-full select-none object-cover pointer-events-none"
              />
            )}
            {m.type === "video" && (
              <div className="absolute left-3 top-3 rounded-sm bg-flame px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.14em] text-white shadow pointer-events-none">
                ▶ TRAILER
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-panel/60 to-transparent" />

      {/* Prev */}
      {allMedia.length > 1 && idx > 0 && (
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-sm border border-line bg-ink/70 text-muted opacity-0 backdrop-blur transition hover:border-lime/50 hover:text-lime group-hover/gal:opacity-100"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Next */}
      {allMedia.length > 1 && idx < allMedia.length - 1 && (
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-sm border border-line bg-ink/70 text-muted opacity-0 backdrop-blur transition hover:border-lime/50 hover:text-lime group-hover/gal:opacity-100"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Dots */}
      {allMedia.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
          {allMedia.map((m, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i) }}
              className={`rounded-full transition-all ${i === idx
                  ? m.type === "video" ? "h-1.5 w-4 bg-flame" : "h-1.5 w-4 bg-lime"
                  : "size-1.5 bg-muted/50 hover:bg-muted"
                }`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {allMedia.length > 1 && (
        <div className="absolute right-3 top-2.5 rounded-sm bg-ink/70 px-2 py-0.5 font-mono text-[9px] tracking-[0.14em] text-muted backdrop-blur">
          {idx + 1}/{allMedia.length}
        </div>
      )}
    </div>
  )
}

/* ── ReviewLine ─────────────────────────────────────────────────── */
function ReviewLine({ review, label, t }: { review: Review; label: string; t: Translations }) {
  if (!review || !review.count) return null
  const color = sentimentColor[review.sentiment] || "text-lime"
  const sentimentText = t.sentiments[review.sentiment] || review.sentiment
  const count = review.count >= 1000
    ? `(${(review.count / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k)`
    : `(${review.count.toLocaleString()})`
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-36 shrink-0 font-mono text-[10px] tracking-[0.14em] text-muted">{label}</span>
      <span className={`font-mono text-[11px] font-semibold ${color}`}>{sentimentText}</span>
      <span className="font-mono text-[10px] text-muted/60">{count}</span>
    </div>
  )
}

/* ── DetailPanel ────────────────────────────────────────────────── */
function DetailPanel({ game, t, lang, onClose, onSetStatus, onSetPriority, onRemove, onSetLndLink, onSetHours, onToggleOwned }: {
  game: Game; t: Translations; lang: Lang
  onClose: () => void
  onSetStatus: (s: Status) => void
  onSetPriority: (p: Priority) => void
  onRemove: () => void
  onSetLndLink: (link: string) => void
  onSetHours: (hours: number) => void
  onToggleOwned: (isOwned: boolean) => void
}) {
  const currentDescription = getGameDescription(game, lang)
  const currentReleaseDate = getGameReleaseDate(game, lang)
  const currentTags = getGameTags(game, lang)
  const statusOrder: Status[] = ["backlog", "next", "playing", "beaten"]
  const [closing, setClosing] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [addingLnd, setAddingLnd] = useState(false)
  const [lndInput, setLndInput] = useState("")
  const [editingHours, setEditingHours] = useState(false)
  const [hoursInput, setHoursInput] = useState(String(game.hours || 0))
  const [expandedDesc, setExpandedDesc] = useState(false)

  useEffect(() => {
    setHoursInput(String(game.hours || 0))
    setEditingHours(false)
    setExpandedDesc(false)
  }, [game.id, game.hours])

  const handleClose = () => {
    setClosing(true)
    setTimeout(onClose, 210)
  }

  const handleRemove = () => {
    setConfirmRemove(false)
    onRemove()
  }

  const saveLnd = () => {
    if (lndInput.trim()) {
      onSetLndLink(lndInput.trim())
      setAddingLnd(false)
      setLndInput("")
    }
  }

  const saveHours = () => {
    const parsed = parseInt(hoursInput, 10)
    if (!isNaN(parsed) && parsed >= 0) {
      onSetHours(parsed)
    }
    setEditingHours(false)
  }

  const storeUrl = getGameStoreLink(game)

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-ink/60 backdrop-blur-sm ${closing ? "overlay-exit" : "overlay-enter"}`}
        onClick={handleClose}
      />
      <aside className={`fixed bottom-0 right-0 top-0 z-40 flex w-full max-w-[26rem] flex-col border-l border-line bg-panel shadow-2xl ${closing ? "panel-exit" : "panel-enter"}`}>

        {/* Panel header */}
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3">
          <span className="font-mono text-[10px] tracking-[0.26em] text-lime">// STORE INFO</span>
          <button onClick={handleClose}
            className="font-mono text-[11px] tracking-[0.14em] text-muted transition-colors hover:text-fg">
            {t.detailClose} ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Image/Video gallery */}
          <ImageGallery cover={game.cover} screenshots={game.screenshots} videos={game.videos} />

          {/* Title + studio + Early Access banner */}
          <div className="px-5 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-mono text-lg font-semibold leading-tight text-fg">{game.title}</h2>
                <p className="mt-0.5 font-mono text-[11px] tracking-[0.08em] text-muted">{game.studio}</p>
              </div>
              {game.isEarlyAccess && (
                <span className="shrink-0 rounded-sm bg-[#00bcd4]/15 border border-[#00bcd4]/40 px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.1em] text-[#00bcd4]">
                  ⚡ EARLY ACCESS
                </span>
              )}
            </div>
          </div>

          {/* Description (About this game with collapsible See More) */}
          {currentDescription && (
            <div className="relative px-5 pt-3">
              <div
                className={`steam-about-content overflow-hidden transition-all duration-300 ${expandedDesc ? "max-h-none" : "max-h-36"
                  }`}
                dangerouslySetInnerHTML={{ __html: currentDescription }}
              />
              {!expandedDesc && (
                <div className="pointer-events-none absolute inset-x-5 bottom-8 h-20 bg-gradient-to-t from-panel via-panel/85 to-transparent" />
              )}
              <div className="mt-2.5 flex justify-center">
                <button
                  type="button"
                  onClick={() => setExpandedDesc(!expandedDesc)}
                  className="relative z-10 flex items-center gap-1.5 rounded-sm border border-line bg-panel-2 px-3.5 py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-lime transition-all hover:border-lime/60 hover:bg-lime/10"
                >
                  <span>{expandedDesc ? t.seeLess : t.seeMore}</span>
                </button>
              </div>
            </div>
          )}

          {/* Store Info Table */}
          <div className="mx-5 mt-5 space-y-2 border-t border-line pt-4">
            {/* Ownership Status */}
            <div className="flex items-center gap-3">
              <span className="w-36 shrink-0 font-mono text-[10px] tracking-[0.14em] text-muted">{t.detailOwnership}</span>
              <button
                type="button"
                onClick={() => onToggleOwned(!game.isOwned)}
                title={t.detailToggleOwned}
                className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.1em] transition-colors ${game.isOwned
                    ? "border border-lime/40 bg-lime/15 text-lime hover:bg-lime/25"
                    : "border border-line bg-panel-2 text-muted hover:border-muted/50 hover:text-fg"
                  }`}
              >
                <span>{game.isOwned ? "✓" : "✕"}</span>
                <span>{game.isOwned ? t.ownedLabel : t.unownedLabel}</span>
              </button>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="w-36 shrink-0 font-mono text-[10px] tracking-[0.14em] text-muted">{t.detailReleaseDate}</span>
              <span className="font-mono text-[11px] text-fg/90">{currentReleaseDate}</span>
            </div>

            {/* Price with sale percentage */}
            {(game.price != null || isGameUnreleased(game)) && (() => {
              const priceInfo = getGamePriceLabel(game, t)
              return (
                <div className="flex items-baseline gap-3">
                  <span className="w-36 shrink-0 font-mono text-[10px] tracking-[0.14em] text-muted">{t.detailPrice}</span>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className={`font-mono text-[13px] font-semibold ${priceInfo.isUnreleased ? "text-ice" : priceInfo.isFree ? "text-lime" : "text-fg"}`}>
                      {priceInfo.text}
                    </span>
                    {game.discountPercent != null && game.discountPercent > 0 && !priceInfo.isUnreleased && (
                      <span className="font-mono text-[11px] font-bold text-flame">
                        {t.saleLabel(game.discountPercent)}
                      </span>
                    )}
                    {game.originalPrice != null && game.discountPercent != null && game.discountPercent > 0 && !priceInfo.isUnreleased && (
                      <span className="font-mono text-[10px] text-muted line-through">
                        {fmtVnd(game.originalPrice, t.freeLabel)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })()}

            <div className="flex items-baseline gap-3">
              <span className="w-36 shrink-0 font-mono text-[10px] tracking-[0.14em] text-muted">{t.detailDeveloper}</span>
              <span className="font-mono text-[11px] text-lime/90">{game.studio}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="w-36 shrink-0 font-mono text-[10px] tracking-[0.14em] text-muted">{t.detailPublisher}</span>
              <span className="font-mono text-[11px] text-lime/90">{game.publisher ?? game.studio}</span>
            </div>
            {game.reviewRecent && (
              <ReviewLine review={game.reviewRecent} label={t.detailReviewRecent} t={t} />
            )}
            {game.reviewAll && (
              <ReviewLine review={game.reviewAll} label={t.detailReviewAll} t={t} />
            )}
            {game.addedAt && (
              <div className="flex items-baseline gap-3">
                <span className="w-36 shrink-0 font-mono text-[10px] tracking-[0.14em] text-muted">{t.detailAddedAt}</span>
                <span className="font-mono text-[11px] text-fg/70">{t.timeAgo(Date.now() - game.addedAt)}</span>
              </div>
            )}
          </div>

          {/* Hours played block with inline edit for Estimated Hours */}
          {game.hoursPlayed != null && (
            <div className="mx-5 mt-4 flex items-center gap-4 rounded-sm border border-line bg-panel-2 px-4 py-3">
              <div className="flex-1">
                <div className="font-mono text-[9px] tracking-[0.2em] text-muted">{t.detailHoursPlayed}</div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl font-semibold text-ice leading-none">{game.hoursPlayed}</span>
                  <span className="font-mono text-[11px] text-muted">h</span>
                </div>
              </div>
              <div className="h-8 w-px bg-line" />
              <div className="flex-1">
                <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.2em] text-muted">
                  <span>{t.detailHoursEst}</span>
                  {!editingHours && (
                    <button
                      onClick={() => setEditingHours(true)}
                      className="text-muted/60 hover:text-lime text-[10px]"
                      title={t.detailHoursEstEdit}
                    >
                      ✎
                    </button>
                  )}
                </div>
                {editingHours ? (
                  <div className="mt-1 flex items-center gap-1">
                    <input
                      type="number"
                      autoFocus
                      value={hoursInput}
                      onChange={(e) => setHoursInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveHours(); if (e.key === "Escape") setEditingHours(false) }}
                      className="w-16 rounded-sm border border-lime/60 bg-panel px-1.5 py-0.5 font-mono text-lg text-fg outline-none"
                    />
                    <button onClick={saveHours} className="rounded-sm border border-lime/40 bg-lime/10 px-1.5 py-1 font-mono text-[10px] text-lime hover:bg-lime/20">✓</button>
                    <button onClick={() => setEditingHours(false)} className="rounded-sm border border-line px-1.5 py-1 font-mono text-[10px] text-muted hover:text-fg">✕</button>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingHours(true)}
                    className="group/est mt-1 flex cursor-pointer items-baseline gap-1.5"
                    title={t.detailHoursEstEdit}
                  >
                    <span className="font-mono text-2xl font-semibold text-muted leading-none group-hover/est:text-fg">~{game.hours}</span>
                    <span className="font-mono text-[11px] text-muted">h</span>
                  </div>
                )}
              </div>
              {game.hours > 0 && (
                <>
                  <div className="h-8 w-px bg-line" />
                  <div className="flex-1 flex flex-col items-center justify-center">
                    {game.status === "beaten" ? (
                      <>
                        <TrophyIcon />
                        <div className="mt-1 beaten-shimmer font-mono text-[9px] font-bold tracking-[0.18em]">CLEARED</div>
                      </>
                    ) : (
                      <>
                        <div className="font-mono text-[9px] tracking-[0.2em] text-muted self-start">COMPLETION</div>
                        <div className="mt-1 w-full">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                            <div
                              className="h-full rounded-full bg-ice transition-all"
                              style={{ width: `${Math.min(100, Math.round((game.hoursPlayed! / game.hours) * 100))}%` }}
                            />
                          </div>
                          <div className="mt-1 font-mono text-[10px] text-ice">
                            {Math.min(100, Math.round((game.hoursPlayed! / game.hours) * 100))}%
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Popular User-Defined Tags */}
          {currentTags && currentTags.length > 0 && (
            <div className="mx-5 mt-4 border-t border-line pt-4">
              <p className="font-mono text-[10px] tracking-[0.14em] text-muted">{t.detailTagsLabel}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {currentTags.map((tag, idx) => {
                  const label = typeof tag === "string" ? tag : ((tag as any)?.Name || String(tag))
                  return (
                    <span
                      key={idx}
                      className="rounded-sm border border-line bg-panel-2 px-2.5 py-1 font-mono text-[10px] text-fg/80 transition-colors hover:border-lime/40 hover:text-lime"
                    >
                      {label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Status & Priority controls */}
          <div className="mx-5 my-5 space-y-3 border-t border-line pt-4">
            <div>
              <span className="mb-2 block font-mono text-[10px] tracking-[0.18em] text-muted">{t.detailStatus}</span>
              <div className="grid grid-cols-4 gap-1.5">
                {statusOrder.map((s) => (
                  <button key={s} onClick={() => onSetStatus(s)}
                    className={`rounded-sm border py-2 font-mono text-[10px] tracking-[0.1em] transition-colors ${game.status === s
                        ? s === "beaten" ? "beaten-badge text-ink font-bold" : "border-lime bg-lime/15 text-lime font-semibold"
                        : "border-line text-muted hover:text-fg"
                      }`}>
                    {t.statuses[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-2 block font-mono text-[10px] tracking-[0.18em] text-muted">{t.detailPriority}</span>
              <div className="grid grid-cols-3 gap-1.5">
                {PRIORITIES.map((p) => (
                  <button key={p} onClick={() => onSetPriority(p)}
                    className={`rounded-sm border py-2 font-mono text-[10px] tracking-[0.1em] transition-colors ${game.priority === p
                        ? p === "high" ? "border-flame bg-flame/15 text-flame font-semibold"
                          : p === "medium" ? "border-ice bg-ice/15 text-ice font-semibold"
                            : "border-muted bg-muted/15 text-fg font-semibold"
                        : "border-line text-muted hover:text-fg"
                      }`}>
                    {t.priorities[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions with Store Page & LND buttons */}
        <div className="flex shrink-0 flex-col gap-2 border-t border-line p-5">
          <div className="flex items-center gap-2">
            {/* Store Page Link Button */}
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-[#1e4d7a] bg-[#102438]/80 py-2.5 font-mono text-[11px] font-bold tracking-[0.14em] text-[#4cc9f0] transition-colors hover:border-[#4cc9f0] hover:bg-[#163554] hover:text-white"
            >
              {game.platform === "Xbox" || game.storeType === "xbox" ? (
                <XboxIcon className="size-4" />
              ) : (
                <SteamIcon className="size-4" />
              )}
              <span>{t.detailStorePage}</span>
            </a>

            {/* LND Link / Add LND button */}
            {game.lndLink ? (
              <div className="flex flex-1 items-center gap-1.5">
                <a href={game.lndLink.startsWith("http") ? game.lndLink : `https://${game.lndLink}`}
                  target="_blank" rel="noopener noreferrer"
                  className="lnd-btn flex flex-1 items-center justify-center gap-2 rounded-sm py-2.5 font-mono text-[11px] font-bold tracking-[0.16em] transition-all">
                  <span>LND LINK</span> ↗
                </a>
                <button onClick={() => { setAddingLnd(true); setLndInput(game.lndLink ?? "") }}
                  className="rounded-sm border border-line p-2.5 font-mono text-[11px] text-muted hover:text-fg">✎</button>
              </div>
            ) : (
              <div className="flex-1">
                {addingLnd ? (
                  <div className="flex flex-1 gap-1">
                    <input autoFocus value={lndInput} onChange={(e) => setLndInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveLnd(); if (e.key === "Escape") setAddingLnd(false) }}
                      placeholder="linkneverdie.net/..."
                      className="min-w-0 flex-1 rounded-sm border border-line bg-panel-2 px-2 py-1.5 font-mono text-[10px] text-fg outline-none placeholder:text-muted/40 focus:border-lime/60" />
                    <button onClick={saveLnd}
                      className="rounded-sm border border-lime/40 bg-lime/10 px-2 font-mono text-[10px] text-lime hover:bg-lime/20">✓</button>
                    <button onClick={() => setAddingLnd(false)}
                      className="rounded-sm border border-line px-2 font-mono text-[10px] text-muted hover:text-fg">✕</button>
                  </div>
                ) : (
                  <button onClick={() => setAddingLnd(true)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-dashed border-muted/30 py-2.5 font-mono text-[11px] tracking-[0.16em] text-muted/50 transition-colors hover:border-muted/60 hover:text-muted">
                    <span className="text-base leading-none">+</span> LND
                  </button>
                )}
              </div>
            )}
          </div>

          {confirmRemove && (
            <div className="flex flex-col gap-2 rounded-sm border border-flame/30 bg-flame/5 p-3">
              <p className="font-mono text-[11px] tracking-[0.12em] text-flame/80">{t.confirmQuestion}</p>
              <div className="flex gap-2">
                <button onClick={handleRemove}
                  className="flex-1 rounded-sm border border-flame/50 bg-flame/10 py-2 font-mono text-[11px] tracking-[0.14em] text-flame transition-colors hover:bg-flame/20">
                  {t.confirmYes}
                </button>
                <button onClick={() => setConfirmRemove(false)}
                  className="flex-1 rounded-sm border border-line py-2 font-mono text-[11px] tracking-[0.14em] text-muted transition-colors hover:text-fg">
                  {t.confirmNo}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setConfirmRemove(true)}
              className="flex-1 rounded-sm border border-flame/30 py-2.5 font-mono text-[11px] tracking-[0.16em] text-flame/70 transition-colors hover:border-flame hover:bg-flame/10 hover:text-flame">
              {t.detailRemove}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

/* ── AddModal with Steam & Xbox live search ─────────────────────── */
interface SuggestionItem {
  id: string
  storeId: string
  storeType: string
  name: string
  cover: string
  thumbnail?: string
  price?: number
  isUnreleased?: boolean
  platform: string
}

function AddModal({ t, onClose, onAdd }: {
  t: Translations; onClose: () => void; onAdd: (title: string, platform: string, storeId?: string, storeType?: string, lndLink?: string, hours?: number) => Promise<void> | void
}) {
  const [title, setTitle] = useState("")
  const [platform, setPlatform] = useState("Steam")
  const [lndLink, setLndLink] = useState("")
  const [hoursEst, setHoursEst] = useState("")
  const [selectedSug, setSelectedSug] = useState<SuggestionItem | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [showSug, setShowSug] = useState(false)
  const [sugIndex, setSugIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Debounced API search
  useEffect(() => {
    if (!title.trim() || title.trim().length < 2 || platform === "Khác") {
      setSuggestions([])
      setLoading(false)
      return
    }

    setLoading(true)
    setShowSug(true)
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(title.trim())}&platform=${encodeURIComponent(platform)}`)
        if (res.ok) {
          const results = await res.json()
          setSuggestions(results)
        }
      } catch (err) {
        console.error("Search error:", err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [title, platform])

  const pickSuggestion = (s: SuggestionItem) => {
    setTitle(s.name)
    setSelectedSug(s)
    setShowSug(false)
    setSuggestions([])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSug) return
    if (e.key === "ArrowDown") { e.preventDefault(); setSugIndex((i) => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === "ArrowUp") { e.preventDefault(); setSugIndex((i) => Math.max(i - 1, -1)) }
    if (e.key === "Enter" && sugIndex >= 0 && suggestions[sugIndex]) {
      e.preventDefault()
      pickSuggestion(suggestions[sugIndex])
    }
    if (e.key === "Escape") { setShowSug(false) }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || submitting) return
    setSubmitting(true)
    try {
      const parsedHours = parseInt(hoursEst, 10)
      await onAdd(
        title.trim(),
        platform,
        selectedSug?.storeId,
        selectedSug?.storeType,
        lndLink.trim() || undefined,
        !isNaN(parsedHours) && parsedHours >= 0 ? parsedHours : 0,
      )
    } finally {
      setSubmitting(false)
    }
  }

  const field = "w-full rounded-sm border border-line bg-panel-2 px-3 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-muted/60 focus:border-lime/60"

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-sm border border-line bg-panel p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-mono text-sm font-semibold tracking-[0.2em] text-fg">{t.modalTitle}</h2>
          <button type="button" onClick={onClose} className="font-mono text-muted transition-colors hover:text-fg">✕</button>
        </div>
        <div className="space-y-3">
          {/* Title input with live search */}
          <div className="relative">
            <input
              autoFocus
              className={field}
              placeholder={t.titlePlaceholder}
              value={title}
              onChange={(e) => { setTitle(e.target.value); setSelectedSug(null); setSugIndex(-1) }}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => setShowSug(false), 200)}
              onFocus={() => suggestions.length > 0 && setShowSug(true)}
              autoComplete="off"
            />
            {/* Dropdown */}
            {showSug && platform !== "Khác" && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-sm border border-line bg-panel shadow-2xl">
                {loading && suggestions.length === 0 ? (
                  <div className="flex items-center gap-2 px-3 py-3 font-mono text-[11px] text-muted">
                    <span className="inline-block size-3 animate-spin rounded-full border border-muted border-t-transparent" />
                    {platform === "Steam" ? "Searching Steam Store..." : "Searching Xbox Store..."}
                  </div>
                ) : suggestions.length > 0 ? (
                  <ul>
                    {suggestions.map((s, i) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onMouseDown={() => pickSuggestion(s)}
                          className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${i === sugIndex ? "bg-line text-fg" : "text-muted hover:bg-panel-2 hover:text-fg"
                            }`}
                        >
                          {s.thumbnail || s.cover ? (
                            <img src={s.thumbnail || s.cover} alt="" className="size-8 shrink-0 rounded-sm object-cover" />
                          ) : (
                            <div className="size-8 shrink-0 rounded-sm bg-panel-2" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-mono text-[12px] text-fg">{s.name}</div>
                            {(s.price !== undefined || s.isUnreleased) && (
                              <div className="font-mono text-[10px] text-muted">
                                {s.isUnreleased || s.price == null
                                  ? t.unreleasedLabel
                                  : s.price === 0
                                    ? t.freeLabel
                                    : fmtVnd(s.price, t.freeLabel)}
                              </div>
                            )}
                          </div>
                          <span className={`shrink-0 font-mono text-[9px] tracking-[0.14em] font-semibold ${platform === "Steam" ? "text-[#66c0f4]" : "text-[#52b043]"
                            }`}>
                            {platform.toUpperCase()}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-3 py-3 font-mono text-[11px] text-muted/50">
                    {loading ? "Searching..." : "No games found"}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <span className="mb-2 block font-mono text-[10px] tracking-[0.16em] text-muted">{t.platformLabel}</span>
            <div className="flex gap-2">
              {["Steam", "Xbox", "Khác"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setPlatform(p); setSelectedSug(null); setShowSug(false) }}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm border py-2 font-mono text-[11px] tracking-[0.1em] transition-colors ${platform === p ? "border-lime bg-lime/10 text-lime" : "border-line text-muted hover:text-fg"
                    }`}
                >
                  {p === "Steam" && <img src={steamIconSvg} alt="" className="size-3.5 object-contain" />}
                  {p === "Xbox" && <img src={xboxLogoSvg} alt="" className="size-3.5 object-contain invert" />}
                  <span>{p}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-1/2">
              <span className="mb-2 block font-mono text-[10px] tracking-[0.16em] text-muted">{t.estHoursLabel}</span>
              <input
                type="number"
                min="0"
                className={field}
                placeholder="vd: 40"
                value={hoursEst}
                onChange={(e) => setHoursEst(e.target.value)}
              />
            </div>
            <div className="w-1/2">
              <span className="mb-2 block font-mono text-[10px] tracking-[0.16em] text-muted">LINK LND <span className="text-muted/40">(OPT)</span></span>
              <input className={field} placeholder="linkneverdie.net/..."
                value={lndLink} onChange={(e) => setLndLink(e.target.value)} />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-sm bg-lime py-3 font-mono text-[12px] font-semibold tracking-[0.16em] text-ink transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <span className="size-3.5 animate-spin rounded-full border-2 border-ink border-t-transparent" />
              <span>{t.addingBtn}</span>
            </>
          ) : (
            t.addBtn
          )}
        </button>
      </form>
    </div>
  )
}
