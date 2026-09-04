import { useEffect, useMemo, useRef, useState } from "react"

function mkStars(count: number, seed = 42) {
  const stars = []
  let s = seed
  const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
  for (let i = 0; i < count; i++) {
    const x = rng() * 100
    const y = rng() * 70        // only upper 70% (sky area)
    const r = rng() < 0.08 ? rng() * 1.8 + 1.2 : rng() * 0.9 + 0.2  // some larger bright stars
    const o = rng() * 0.5 + 0.5
    const d = rng() * 5 + 2
    // blue-white tint: some stars slightly cyan
    const cyan = rng() < 0.3
    stars.push({ x, y, r, o, d, cyan })
  }
  return stars
}

function StarryBackground() {
  const stars = useMemo(() => mkStars(320), [])
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Deep navy sky gradient */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(170deg, #000818 0%, #001240 30%, #001f6b 55%, #000d30 75%, #000510 100%)"
      }} />

      {/* Milky Way band — bright diagonal streak */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(125deg, transparent 20%, rgba(120,160,255,0.06) 35%, rgba(180,210,255,0.18) 48%, rgba(220,235,255,0.28) 54%, rgba(180,210,255,0.18) 60%, rgba(100,140,255,0.07) 72%, transparent 82%)",
      }} />
      {/* Milky Way core glow */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(125deg, transparent 38%, rgba(200,225,255,0.10) 47%, rgba(255,255,255,0.22) 53%, rgba(200,225,255,0.10) 59%, transparent 68%)",
        filter: "blur(8px)",
      }} />
      {/* Extra nebula colours */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 60% 35% at 65% 30%, rgba(80,120,255,0.12) 0%, transparent 70%)",
      }} />

      {/* Stars */}
      {stars.map((s, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: `${s.r * 2}px`,
            height: `${s.r * 2}px`,
            background: s.cyan ? "rgba(180,220,255,1)" : "rgba(255,255,255,1)",
            opacity: s.o,
            boxShadow: s.r > 1.5
              ? `0 0 ${s.r * 3}px ${s.r}px ${s.cyan ? "rgba(140,200,255,0.6)" : "rgba(255,255,255,0.5)"}`
              : undefined,
            animation: `sky-twinkle ${s.d}s ease-in-out ${((i * 0.11) % s.d).toFixed(2)}s infinite`,
          }}
        />
      ))}

      {/* Mountain silhouette */}
      <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 220 L0 160 L80 130 L160 150 L240 100 L320 120 L400 80 L480 110 L560 60 L640 90 L720 50 L800 85 L880 65 L960 95 L1040 75 L1120 105 L1200 85 L1280 115 L1360 140 L1440 120 L1440 220 Z"
          fill="#00051a" />
        <path d="M0 220 L0 175 L100 165 L200 170 L300 155 L400 160 L500 145 L600 155 L700 140 L800 150 L900 138 L1000 148 L1100 142 L1200 152 L1300 160 L1440 155 L1440 220 Z"
          fill="#000820" fillOpacity="0.9" />
      </svg>

      {/* Lake reflection — faint mirror at very bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24"
        style={{ background: "linear-gradient(to top, rgba(0,18,64,0.7) 0%, rgba(0,18,64,0.2) 60%, transparent 100%)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20"
        style={{
          background: "linear-gradient(125deg, transparent 38%, rgba(200,225,255,0.15) 50%, rgba(255,255,255,0.25) 53%, rgba(200,225,255,0.15) 56%, transparent 68%)",
          transform: "scaleY(-1)",
          filter: "blur(4px)",
        }} />
    </div>
  )
}

interface Track {
  id: string
  index: number
  title: string
  artist: string
  album: string
  duration: string
  durationSec?: number
  cover: string
  added?: string
  audioSrc?: string
  spotifyUrl?: string
}

const PLAYLIST_COVER = "https://images.unsplash.com/photo-1778855639944-69b99210a0df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"

const TRACKS: Track[] = [
  { id: "t1", index: 1, title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", duration: "3:20", added: "2 days ago", cover: "https://images.unsplash.com/photo-1671509774803-1640e8853b50?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80" },
  { id: "t2", index: 2, title: "Midnight Rain", artist: "Taylor Swift", album: "Midnights", duration: "2:54", added: "5 days ago", cover: "https://images.unsplash.com/photo-1787045196044-a21278b7e503?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80" },
  { id: "t3", index: 3, title: "Starboy", artist: "The Weeknd", album: "Starboy", duration: "3:50", added: "1 week ago", cover: "https://images.unsplash.com/photo-1656427411300-4a35e3c7d058?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80" },
  { id: "t4", index: 4, title: "As It Was", artist: "Harry Styles", album: "Harry's House", duration: "2:37", added: "1 week ago", cover: "https://images.unsplash.com/photo-1771301455501-694654813e1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80" },
  { id: "t5", index: 5, title: "Levitating", artist: "Dua Lipa", album: "Future Nostalgia", duration: "3:23", added: "2 weeks ago", cover: "https://images.unsplash.com/photo-1761197439059-9d83689611c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80" },
  { id: "t6", index: 6, title: "Heat Waves", artist: "Glass Animals", album: "Dreamland", duration: "3:59", added: "2 weeks ago", cover: "https://images.unsplash.com/photo-1688220019316-3e22587dd158?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80" },
  { id: "t7", index: 7, title: "Bad Guy", artist: "Billie Eilish", album: "WHEN WE ALL FALL", duration: "3:14", added: "3 weeks ago", cover: "https://images.unsplash.com/photo-1671509774803-1640e8853b50?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80" },
  { id: "t8", index: 8, title: "good 4 u", artist: "Olivia Rodrigo", album: "SOUR", duration: "2:58", added: "1 month ago", cover: "https://images.unsplash.com/photo-1787045196044-a21278b7e503?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80" },
  { id: "t9", index: 9, title: "INDUSTRY BABY", artist: "Lil Nas X", album: "MONTERO", duration: "3:32", added: "1 month ago", cover: "https://images.unsplash.com/photo-1656427411300-4a35e3c7d058?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80" },
  { id: "t10", index: 10, title: "Peaches", artist: "Justin Bieber", album: "Justice", duration: "3:18", added: "1 month ago", cover: "https://images.unsplash.com/photo-1771301455501-694654813e1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80" },
  { id: "t11", index: 11, title: "drivers license", artist: "Olivia Rodrigo", album: "SOUR", duration: "4:02", added: "2 months ago", cover: "https://images.unsplash.com/photo-1761197439059-9d83689611c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80" },
  { id: "t12", index: 12, title: "Save Your Tears", artist: "The Weeknd", album: "After Hours", duration: "3:35", added: "2 months ago", cover: "https://images.unsplash.com/photo-1688220019316-3e22587dd158?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80" },
]

function SpotifyIcon({ size = "3.5" }: { size?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-${size} fill-current`} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

function PlayIcon({ size = "3.5" }: { size?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-${size} fill-current`} xmlns="http://www.w3.org/2000/svg">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function ShuffleIcon({ size = "4" }: { size?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-${size} fill-none stroke-current stroke-[1.8]`} xmlns="http://www.w3.org/2000/svg" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="4" y1="4" x2="21" y2="21" />
    </svg>
  )
}

function StarsIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2.5L11.34 7.16L16 8.5L11.34 9.84L10 14.5L8.66 9.84L4 8.5L8.66 7.16L10 2.5Z" />
      <path d="M15.5 1L16.26 3.24L18.5 4L16.26 4.76L15.5 7L14.74 4.76L12.5 4L14.74 3.24L15.5 1Z" opacity="0.7" />
      <path d="M4 12L4.6 13.9L6.5 14.5L4.6 15.1L4 17L3.4 15.1L1.5 14.5L3.4 13.9L4 12Z" opacity="0.6" />
    </svg>
  )
}

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s < 10 ? "0" : ""}${s}`
}

export interface PlaylistData {
  cover: string
  title: string
  description: string | null
  owner: string
  playlistUrl: string
  tracks: Track[]
}

const PLAYLIST_CACHE_KEY = "medonthan_music_playlist_cache"
let inMemoryPlaylist: PlaylistData | null = null

export function getCachedPlaylist(): PlaylistData | null {
  if (inMemoryPlaylist) return inMemoryPlaylist
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(PLAYLIST_CACHE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && Array.isArray(parsed.tracks) && parsed.tracks.length > 0) {
          inMemoryPlaylist = parsed
          return parsed
        }
      }
    } catch {}
  }
  return null
}

export function setCachedPlaylist(data: PlaylistData) {
  inMemoryPlaylist = data
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PLAYLIST_CACHE_KEY, JSON.stringify(data))
    } catch {}
  }
}

let prefetchPromise: Promise<PlaylistData | null> | null = null

export function prefetchMusicPlaylist(): Promise<PlaylistData | null> {
  if (inMemoryPlaylist) return Promise.resolve(inMemoryPlaylist)
  if (prefetchPromise) return prefetchPromise

  prefetchPromise = fetch("/api/music/playlist")
    .then(async (res) => {
      if (res.ok) {
        const data = await res.json()
        if (data.configured && data.tracks && data.tracks.length > 0) {
          const playlistData: PlaylistData = {
            cover: data.cover || PLAYLIST_COVER,
            title: data.title || "PLAYLIST",
            description: data.description && data.description.trim().length > 0 ? data.description.trim() : null,
            owner: data.owner || "MEDONTHAN",
            playlistUrl: data.playlistUrl || "https://open.spotify.com",
            tracks: data.tracks,
          }
          setCachedPlaylist(playlistData)
          return playlistData
        }
      }
      return null
    })
    .catch((err) => {
      console.warn("Music prefetch failed:", err)
      return null
    })
    .finally(() => {
      prefetchPromise = null
    })

  return prefetchPromise
}

export default function MusicPage({ onBack, exiting }: { onBack?: () => void; exiting?: boolean }) {
  const initialCache = getCachedPlaylist()

  const [tracks, setTracks] = useState<Track[]>(() => initialCache?.tracks ?? [])
  const [playlistCover, setPlaylistCover] = useState(() => initialCache?.cover ?? PLAYLIST_COVER)
  const [playlistTitle, setPlaylistTitle] = useState(() => initialCache?.title ?? "")
  const [playlistDesc, setPlaylistDesc] = useState<string | null>(() => initialCache?.description ?? null)
  const [playlistOwner, setPlaylistOwner] = useState<string>(() => initialCache?.owner ?? "MEDONTHAN")
  const [playlistUrl, setPlaylistUrl] = useState(() => initialCache?.playlistUrl ?? "https://open.spotify.com")
  const [loadingPlaylist, setLoadingPlaylist] = useState(() => !initialCache)

  const [playingId, setPlayingId] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [shuffled, setShuffled] = useState(false)
  const [repeated, setRepeated] = useState(false)
  const [skyNight, setSkyNight] = useState(true)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Fetch playlist data configured in MUSIC_API_SPOTIFYPLAYLIST
  useEffect(() => {
    let isMounted = true
    const loadPlaylist = async () => {
      try {
        if (!initialCache) setLoadingPlaylist(true)
        const res = await fetch("/api/music/playlist")
        if (res.ok) {
          const data = await res.json()
          if (data.configured && data.tracks && data.tracks.length > 0 && isMounted) {
            const freshData: PlaylistData = {
              cover: data.cover || PLAYLIST_COVER,
              title: data.title || "PLAYLIST",
              description: data.description && data.description.trim().length > 0 ? data.description.trim() : null,
              owner: data.owner || "MEDONTHAN",
              playlistUrl: data.playlistUrl || "https://open.spotify.com",
              tracks: data.tracks,
            }
            setCachedPlaylist(freshData)
            setPlaylistCover(freshData.cover)
            setPlaylistTitle(freshData.title)
            setPlaylistDesc(freshData.description)
            setPlaylistOwner(freshData.owner)
            setPlaylistUrl(freshData.playlistUrl)
            setTracks(freshData.tracks)
          } else if (isMounted && (!initialCache || tracks.length === 0)) {
            // Fallback to default tracks only if backend isn't configured and no cache
            setTracks(TRACKS)
            setPlaylistCover(PLAYLIST_COVER)
            setPlaylistTitle("NIGHT DRIVE")
            setPlaylistDesc("Những bài nhạc để lái xe đêm. Tốc độ vừa phải, ánh đèn đường, và không gian rộng lớn phía trước.")
          }
        } else if (isMounted && (!initialCache || tracks.length === 0)) {
          setTracks(TRACKS)
          setPlaylistCover(PLAYLIST_COVER)
          setPlaylistTitle("NIGHT DRIVE")
          setPlaylistDesc("Những bài nhạc để lái xe đêm. Tốc độ vừa phải, ánh đèn đường, và không gian rộng lớn phía trước.")
        }
      } catch (err) {
        console.warn("Could not load Spotify playlist from API, using default tracks:", err)
        if (isMounted && (!initialCache || tracks.length === 0)) {
          setTracks(TRACKS)
          setPlaylistCover(PLAYLIST_COVER)
          setPlaylistTitle("NIGHT DRIVE")
          setPlaylistDesc("Những bài nhạc để lái xe đêm. Tốc độ vừa phải, ánh đèn đường, và không gian rộng lớn phía trước.")
        }
      } finally {
        if (isMounted) setLoadingPlaylist(false)
      }
    }
    loadPlaylist()
    return () => { isMounted = false }
  }, [])

  const currentTrack = tracks.find((t) => t.id === playingId) ?? null
  const currentIdx = tracks.findIndex((t) => t.id === playingId)

  const play = (id: string) => {
    setPlayingId(id)
    setPaused(false)
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)
  }
  const togglePause = () => setPaused((p) => !p)
  const prev = () => { if (currentIdx > 0) play(tracks[currentIdx - 1].id) }
  const next = () => {
    if (shuffled && tracks.length > 1) {
      let randIdx = Math.floor(Math.random() * tracks.length)
      if (randIdx === currentIdx) randIdx = (randIdx + 1) % tracks.length
      play(tracks[randIdx].id)
    } else if (currentIdx < tracks.length - 1) {
      play(tracks[currentIdx + 1].id)
    } else if (repeated && tracks.length > 0) {
      play(tracks[0].id)
    }
  }

  // Handle audio playback for playable preview tracks
  useEffect(() => {
    if (!currentTrack?.audioSrc) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      return
    }

    const audio = new Audio(currentTrack.audioSrc)
    audio.volume = volume / 100
    audioRef.current = audio

    const updateTime = () => {
      if (audio.duration) {
        setCurrentTime(audio.currentTime)
        setDuration(audio.duration)
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }
    const onLoadedMetadata = () => {
      if (audio.duration) {
        setDuration(audio.duration)
      }
    }
    const onEnded = () => {
      if (repeated) {
        audio.currentTime = 0
        audio.play().catch(() => { })
      } else {
        next()
      }
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    audio.addEventListener("ended", onEnded)

    if (!paused) {
      audio.play().catch(() => { })
    }

    return () => {
      audio.pause()
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      audio.removeEventListener("ended", onEnded)
    }
  }, [playingId])

  useEffect(() => {
    if (audioRef.current) {
      if (paused) audioRef.current.pause()
      else audioRef.current.play().catch(() => { })
    }
  }, [paused])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  return (
    <div className={`relative min-h-full font-sans transition-colors duration-700 ${skyNight ? "bg-[#000818]" : "bg-ink"} ${exiting ? "page-exiting" : ""}`}>

      {/* ── Starry sky background ── */}
      {skyNight && <StarryBackground />}

      {/* ── Header ── */}
      <header className={`page-enter-header sticky top-0 z-20 flex items-center justify-between border-b px-6 py-3 backdrop-blur transition-colors duration-700 ${skyNight ? "border-white/10 bg-[#03071e]/80" : "border-line bg-ink/90"}`}>
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-sm bg-lime text-ink">
            <span className="font-mono text-sm font-bold">▶</span>
          </div>
          <div className="leading-none">
            <div className="font-mono text-[13px] font-semibold tracking-[0.28em] text-fg">MEDONTHAN</div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-muted">// MUSIC</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack}
              className="font-mono text-[10px] tracking-[0.2em] text-muted transition-colors hover:text-lime">
              ◀ GAMES
            </button>
          )}
          <button onClick={() => setSkyNight((v) => !v)}
            className={`flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 font-mono text-[10px] tracking-[0.16em] transition-all sm:px-3 ${skyNight
                ? "border-[#4338ca]/60 bg-[#4338ca]/20 text-[#a5b4fc] shadow-[0_0_12px_#4338ca30]"
                : "border-line text-muted hover:border-muted/40 hover:text-fg"
              }`}>
            <StarsIcon />
            <span className="hidden sm:inline">{skyNight ? "SKY NIGHT" : "SKY NIGHT"}</span>
          </button>
          <a href={playlistUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#1db954] hover:opacity-80 transition-opacity">
            <SpotifyIcon />
            <span className="hidden font-mono text-[10px] tracking-[0.16em] sm:inline">SPOTIFY</span>
          </a>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6">

        {/* ── Top section: cover + info ── */}
        {loadingPlaylist && tracks.length === 0 ? (
          <div className="page-enter-hero mb-8 flex flex-col gap-6 sm:flex-row sm:items-end animate-pulse">
            <div className="size-44 shrink-0 rounded-sm border border-line/40 bg-panel-2 sm:size-52" />
            <div className="flex flex-col gap-3 min-w-0 flex-1">
              <div className="h-3 w-16 bg-line/60 rounded-sm" />
              <div className="h-8 sm:h-10 w-64 max-w-full bg-line/80 rounded-sm" />
              <div className="h-4 w-96 max-w-full bg-line/40 rounded-sm" />
              <div className="h-3 w-48 bg-line/40 rounded-sm" />
              <div className="mt-2 flex items-center gap-3">
                <div className="h-9 w-28 bg-[#1db954]/20 border border-[#1db954]/30 rounded-sm" />
                <div className="h-9 w-24 bg-panel-2 border border-line rounded-sm" />
              </div>
            </div>
          </div>
        ) : (
          <div className="page-enter-hero mb-8 flex flex-col gap-6 sm:flex-row sm:items-end">
            {/* Cover */}
            <div className="size-44 shrink-0 overflow-hidden rounded-sm shadow-2xl sm:size-52 border border-line/40 bg-ink">
              <img src={playlistCover} alt={playlistTitle} className="size-full object-cover" />
            </div>

            {/* Info */}
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <span className="font-mono text-[9px] tracking-[0.26em] text-muted">PLAYLIST</span>
              <h1 className="font-mono text-2xl font-bold leading-tight text-fg sm:text-3xl lg:text-4xl break-words">{playlistTitle}</h1>
              {playlistDesc && (
                <p className="max-w-2xl font-sans text-sm leading-relaxed text-muted break-words">
                  {playlistDesc}
                </p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] tracking-[0.12em] text-muted/60">
                <span className="text-fg/70">{playlistOwner || "MEDONTHAN"}</span>
                <span className="text-line">·</span>
                <span>{tracks.length} bài hát</span>
                <span className="text-line">·</span>
                <span>~{Math.round(tracks.length * 3.5)} phút</span>
              </div>
              {/* Action buttons */}
              <div className="mt-3 flex items-center gap-2 sm:gap-3">
                {/* Play */}
                <button onClick={() => tracks[0] && play(tracks[0].id)}
                  className="flex items-center gap-2 rounded-sm bg-[#1db954] px-3 py-2.5 font-mono text-[11px] font-bold tracking-[0.16em] text-ink transition-all hover:bg-[#1ed760] hover:shadow-[0_0_20px_#1db95440] sm:px-5">
                  <PlayIcon size="4" />
                  <span className="hidden sm:inline">PHÁT NHẠC</span>
                </button>

                {/* Shuffle */}
                <button onClick={() => setShuffled((s) => !s)}
                  className={`flex items-center gap-2 rounded-sm border px-3 py-2.5 font-mono text-[11px] tracking-[0.14em] transition-all sm:px-4 ${shuffled
                      ? "border-[#1db954]/50 bg-[#1db954]/10 text-[#1db954]"
                      : "border-line text-muted hover:border-muted/50 hover:text-fg"
                    }`}>
                  <ShuffleIcon />
                  <span className="hidden sm:inline">SHUFFLE</span>
                </button>

                {/* Open in Spotify */}
                <a href={playlistUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-sm border border-[#1db954]/30 bg-[#1db954]/10 px-3 py-2.5 font-mono text-[11px] tracking-[0.14em] text-[#1db954] transition-all hover:border-[#1db954]/60 hover:bg-[#1db954]/20 sm:px-4">
                  <SpotifyIcon size="4" />
                  <span className="hidden sm:inline">MỞ TRONG SPOTIFY</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── Track list ── */}
        <div className={`page-enter-list rounded-sm border transition-colors duration-700 ${skyNight ? "border-white/10 bg-white/5 backdrop-blur-sm" : "border-line bg-panel"}`}>

          {/* Column headers */}
          <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-line px-4 sm:px-6 py-2 sm:grid-cols-[2rem_1.4fr_1fr_5rem]">
            <span className="text-center font-mono text-[10px] tracking-[0.16em] text-muted">#</span>
            <span className="font-mono text-[10px] tracking-[0.16em] text-muted">TIÊU ĐỀ</span>
            <span className="hidden font-mono text-[10px] tracking-[0.16em] text-muted sm:block">ALBUM</span>
            <span className="text-right font-mono text-[10px] tracking-[0.16em] text-muted sm:text-center">ĐỘ DÀI</span>
          </div>

          {/* Tracks */}
          {loadingPlaylist && tracks.length === 0 ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-4 sm:px-6 py-2.5 sm:grid-cols-[2rem_1.4fr_1fr_5rem] border-b border-line/20 last:border-0 animate-pulse">
                <div className="h-3 w-3 mx-auto bg-line/40 rounded-sm" />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 shrink-0 rounded-sm bg-line/50" />
                  <div className="space-y-1.5 flex-1 max-w-[240px]">
                    <div className="h-3 w-3/4 bg-line/60 rounded-sm" />
                    <div className="h-2.5 w-1/2 bg-line/40 rounded-sm" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="h-2.5 w-28 bg-line/30 rounded-sm" />
                </div>
                <div className="text-right sm:text-center">
                  <div className="h-2.5 w-8 ml-auto sm:mx-auto bg-line/30 rounded-sm" />
                </div>
              </div>
            ))
          ) : (
            tracks.map((track) => {
            const isPlaying = playingId === track.id && !paused
            const isActive = playingId === track.id
            return (
              <div key={track.id} onClick={() => play(track.id)}
                className={`group grid cursor-pointer grid-cols-[2rem_1fr_auto] items-center gap-3 px-4 sm:px-6 py-2.5 transition-colors sm:grid-cols-[2rem_1.4fr_1fr_5rem] ${isActive ? "bg-lime/5" : "hover:bg-panel-2"}`}>

                {/* Index / play icon */}
                <div className="flex items-center justify-center">
                  {isActive ? (
                    <span className={`font-mono text-[11px] ${isPlaying ? "text-lime" : "text-muted"}`}>
                      {isPlaying ? "▶" : "⏸"}
                    </span>
                  ) : (
                    <>
                      <span className="font-mono text-[11px] text-muted group-hover:hidden">{track.index}</span>
                      <span className="hidden font-mono text-[11px] text-fg group-hover:block">▶</span>
                    </>
                  )}
                </div>

                {/* Title + artist */}
                <div className="flex min-w-0 items-center gap-3">
                  <img src={track.cover || playlistCover} alt="" className="size-9 shrink-0 rounded-sm object-cover" loading="lazy" />
                  <div className="min-w-0">
                    <div className={`font-mono text-sm font-medium leading-snug break-words ${isActive ? "text-lime" : "text-fg"}`} title={track.title}>
                      {track.title}
                    </div>
                    <div className="font-mono text-[11px] text-muted leading-tight mt-0.5 break-words">{track.artist}</div>
                  </div>
                </div>

                {/* Album */}
                <div className="hidden min-w-0 sm:block">
                  <span className="font-mono text-[11px] text-muted/70 transition-colors group-hover:text-muted break-words leading-relaxed" title={track.album}>
                    {track.album}
                  </span>
                </div>

                {/* Duration */}
                <div className="text-right sm:text-center">
                  <span className="font-mono text-[11px] text-muted">{track.duration}</span>
                </div>

              </div>
            )
          })}
        </div>

      </div>

      {/* ── Fixed player bar ── */}
      {currentTrack && (
        <div className={`fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-md transition-colors duration-700 ${skyNight ? "border-white/10 bg-[#03071e]/92" : "border-line bg-panel/95"}`}>

          {/* Progress bar — taller tap target on mobile */}
          <div className="group relative h-1 w-full cursor-pointer bg-line sm:h-0.5"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const clickX = e.clientX - rect.left
              const pct = Math.max(0, Math.min(1, clickX / rect.width))
              setProgress(pct * 100)
              if (audioRef.current && audioRef.current.duration) {
                audioRef.current.currentTime = pct * audioRef.current.duration
                setCurrentTime(audioRef.current.currentTime)
              }
            }}>
            <div className="h-full bg-[#1db954] transition-[width]" style={{ width: `${progress}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 size-3 rounded-full bg-[#1db954] shadow-md transition-[left] sm:size-2.5"
              style={{ left: `calc(${progress}% - 6px)` }} />
          </div>

          {/* ── Mobile layout (stacked) ── */}
          <div className="sm:hidden">

            {/* Row 1: cover + title/artist + like */}
            <div className="flex items-center gap-3 px-4 pb-1 pt-3">
              <div className="relative shrink-0">
                <img src={currentTrack.cover} alt="" className="size-11 rounded-sm object-cover" />
                {/* spinning ring when playing */}
                {!paused && (
                  <div className="absolute inset-0 rounded-sm ring-1 ring-[#1db954]/60 ring-offset-1 ring-offset-transparent" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[13px] font-semibold leading-tight text-fg break-words line-clamp-2" title={currentTrack.title}>
                  {currentTrack.title}
                </div>
                <div className="truncate font-mono text-[10px] leading-tight text-muted mt-0.5">
                  {currentTrack.artist}
                </div>
              </div>
            </div>

            {/* Mobile time display */}
            <div className="flex items-center justify-between px-5 pb-1 font-mono text-[10px] text-muted/75">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || currentTrack.durationSec || 30)}</span>
            </div>

            {/* Row 2: shuffle | prev | play | next | repeat */}
            <div className="flex items-center justify-between px-5 pb-5">
              <button onClick={() => setShuffled((s) => !s)}
                className={`p-2 transition-colors ${shuffled ? "text-[#1db954]" : "text-muted/70"}`}>
                <ShuffleIcon size="5" />
              </button>

              <button onClick={prev} disabled={currentIdx <= 0}
                className="p-2 text-fg/80 transition-colors hover:text-fg disabled:opacity-25">
                <svg viewBox="0 0 24 24" className="size-6 fill-current"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
              </button>

              <button onClick={togglePause}
                className="grid size-14 place-items-center rounded-full bg-[#1db954] text-ink shadow-lg shadow-[#1db95430] transition-transform active:scale-95">
                {paused ? (
                  <svg viewBox="0 0 24 24" className="size-6 fill-current translate-x-0.5"><path d="M8 5v14l11-7z" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="size-6 fill-current"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                )}
              </button>

              <button onClick={next} disabled={currentIdx >= tracks.length - 1}
                className="p-2 text-fg/80 transition-colors hover:text-fg disabled:opacity-25">
                <svg viewBox="0 0 24 24" className="size-6 fill-current"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
              </button>

              <button onClick={() => setRepeated((r) => !r)}
                className={`p-2 transition-colors ${repeated ? "text-[#1db954]" : "text-muted/70"}`}>
                <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-[1.8]" xmlns="http://www.w3.org/2000/svg" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Desktop layout (compact, 3-column) ── */}
          <div className="mx-auto hidden max-w-6xl items-center gap-4 px-6 py-3 sm:flex">

            {/* Track info */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <img src={currentTrack.cover} alt="" className="size-10 shrink-0 rounded-sm object-cover" />
              <div className="min-w-0">
                <div className="font-mono text-[12px] font-medium text-fg break-words line-clamp-1" title={currentTrack.title}>{currentTrack.title}</div>
                <div className="truncate font-mono text-[10px] text-muted" title={currentTrack.artist}>{currentTrack.artist}</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <div className="flex items-center gap-3">
                <button onClick={() => setShuffled((s) => !s)}
                  className={`transition-colors ${shuffled ? "text-[#1db954]" : "text-muted hover:text-fg"}`}>
                  <ShuffleIcon size="3.5" />
                </button>
                <button onClick={prev} disabled={currentIdx <= 0}
                  className="grid size-7 place-items-center text-muted transition-colors hover:text-fg disabled:opacity-30">
                  <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
                </button>
                <button onClick={togglePause}
                  className="grid size-9 place-items-center rounded-full bg-fg text-ink transition-transform hover:scale-105 active:scale-95">
                  {paused ? (
                    <svg viewBox="0 0 24 24" className="size-4 fill-current translate-x-px"><path d="M8 5v14l11-7z" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                  )}
                </button>
                <button onClick={next} disabled={currentIdx >= tracks.length - 1}
                  className="grid size-7 place-items-center text-muted transition-colors hover:text-fg disabled:opacity-30">
                  <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                </button>
                <button onClick={() => setRepeated((r) => !r)}
                  className={`transition-colors ${repeated ? "text-[#1db954]" : "text-muted hover:text-fg"}`}>
                  <svg viewBox="0 0 24 24" className="size-3.5 fill-none stroke-current stroke-[1.8]" xmlns="http://www.w3.org/2000/svg" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.08em] text-muted">
                <span>{formatTime(currentTime)}</span>
                <span className="text-line">/</span>
                <span>{formatTime(duration || currentTrack.durationSec || 30)}</span>
              </div>
            </div>

            {/* Volume */}
            <div className="flex flex-1 items-center justify-end gap-2">
              <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 fill-current text-muted">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
              <input type="range" min="0" max="100" value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-line accent-[#1db954]" />
              <span className="w-6 font-mono text-[9px] text-muted">{volume}</span>
            </div>
          </div>

        </div>
      )}

      {/* Bottom padding — taller on mobile to clear the stacked player */}
      {currentTrack && <div className="h-36 sm:h-24" />}

    </div>
  )
}
