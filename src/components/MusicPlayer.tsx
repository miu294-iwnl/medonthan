import React, { useState, useEffect, useRef } from "react"

interface MusicPlayerProps {
  lang?: "vi" | "en"
}

const TRACK_INFO = {
  title: "绿色 (DJ德朋版)",
  artist: "Shirley Chen",
  cover: "https://i.scdn.co/image/ab67616d0000b2731687a3c57e073c7aff0712c5",
  audioSrc: "https://p.scdn.co/mp3-preview/21b21f51cc13a90a0657d691d2fe4214e48577a5",
  spotifyUrl: "https://open.spotify.com/track/3lKtiO8qW54jQM9nm3GOYr",
}

const STORAGE_KEYS = {
  USER_STATE: "medonthan_music_user_state",       // "playing" | "paused"
  VOLUME: "medonthan_music_volume",               // "0" to "1"
  MUTED: "medonthan_music_muted",                 // "true" | "false"
  LOOP: "medonthan_music_loop",                   // "true" | "false"
  MOBILE_DOCKED: "medonthan_music_mobile_docked", // "true" | "false"
}

// Cookie & LocalStorage utility functions
function setCookie(name: string, value: string, days = 365) {
  try {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`
  } catch {}
  try {
    localStorage.setItem(name, value)
  } catch {}
}

function getCookie(name: string): string | null {
  try {
    if (typeof document !== "undefined" && document.cookie) {
      const cookies = document.cookie.split("; ")
      for (const c of cookies) {
        const [k, ...v] = c.split("=")
        if (k === name) {
          return decodeURIComponent(v.join("="))
        }
      }
    }
  } catch {}
  try {
    return localStorage.getItem(name)
  } catch {
    return null
  }
}

export default function MusicPlayer({ lang = "vi" }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return getCookie(STORAGE_KEYS.MUTED) === "true"
  })
  const [volume, setVolume] = useState<number>(() => {
    const v = getCookie(STORAGE_KEYS.VOLUME)
    if (v !== null && !isNaN(parseFloat(v))) {
      return Math.max(0, Math.min(1, parseFloat(v)))
    }
    return 0.5
  })
  const [isLooping, setIsLooping] = useState<boolean>(() => {
    const l = getCookie(STORAGE_KEYS.LOOP)
    if (l !== null) {
      return l === "true"
    }
    return true
  })
  const [isMobileDocked, setIsMobileDocked] = useState<boolean>(() => {
    return getCookie(STORAGE_KEYS.MOBILE_DOCKED) === "true"
  })
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)

  // Initialize audio element & handle cookie-based autoplay
  useEffect(() => {
    const audio = new Audio(TRACK_INFO.audioSrc)
    audio.loop = isLooping
    audio.volume = isMuted ? 0 : volume
    audioRef.current = audio

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration || 0)
    const handleEnded = () => {
      if (!audio.loop) {
        setIsPlaying(false)
        setCookie(STORAGE_KEYS.USER_STATE, "paused")
      }
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)

    // Check cookie preference:
    // null = first time visit -> Autoplay!
    // "playing" = user left it playing last time -> Autoplay!
    // "paused" = user manually paused last time -> Do NOT autoplay, stay paused.
    const savedState = getCookie(STORAGE_KEYS.USER_STATE)
    const shouldAutoplay = savedState === null || savedState === "playing"

    if (shouldAutoplay) {
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
            setAutoplayBlocked(false)
            setCookie(STORAGE_KEYS.USER_STATE, "playing")
          })
          .catch(() => {
            // Autoplay blocked by browser policy, wait for first user interaction
            setIsPlaying(false)
            setAutoplayBlocked(true)

            const handleFirstInteraction = () => {
              const currentState = getCookie(STORAGE_KEYS.USER_STATE)
              if (currentState !== "paused" && audioRef.current && audioRef.current.paused) {
                audioRef.current
                  .play()
                  .then(() => {
                    setIsPlaying(true)
                    setAutoplayBlocked(false)
                    setCookie(STORAGE_KEYS.USER_STATE, "playing")
                  })
                  .catch(() => {})
              }
              window.removeEventListener("click", handleFirstInteraction)
              window.removeEventListener("keydown", handleFirstInteraction)
              window.removeEventListener("touchstart", handleFirstInteraction)
            }

            window.addEventListener("click", handleFirstInteraction, { once: true })
            window.addEventListener("keydown", handleFirstInteraction, { once: true })
            window.addEventListener("touchstart", handleFirstInteraction, { once: true })
          })
      }
    } else {
      // User previously paused: Keep music silent and off
      setIsPlaying(false)
      setAutoplayBlocked(false)
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.pause()
      audio.src = ""
    }
  }, [])

  // Sync volume & mute changes to audio element & cookie
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
    setCookie(STORAGE_KEYS.VOLUME, volume.toString())
    setCookie(STORAGE_KEYS.MUTED, isMuted.toString())
  }, [volume, isMuted])

  // Sync loop state changes to audio element & cookie
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping
    }
    setCookie(STORAGE_KEYS.LOOP, isLooping.toString())
  }, [isLooping])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      setAutoplayBlocked(false)
      setCookie(STORAGE_KEYS.USER_STATE, "paused")
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true)
          setAutoplayBlocked(false)
          setCookie(STORAGE_KEYS.USER_STATE, "playing")
        })
        .catch((err) => console.error("Playback failed:", err))
    }
  }

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev
      setCookie(STORAGE_KEYS.MUTED, next.toString())
      return next
    })
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    setCookie(STORAGE_KEYS.VOLUME, val.toString())
    if (val > 0 && isMuted) {
      setIsMuted(false)
      setCookie(STORAGE_KEYS.MUTED, "false")
    }
  }

  const toggleLoop = () => {
    setIsLooping((prev) => {
      const next = !prev
      setCookie(STORAGE_KEYS.LOOP, next.toString())
      if (audioRef.current) {
        audioRef.current.loop = next
      }
      return next
    })
  }

  const setMobileDockedPreference = (docked: boolean) => {
    setIsMobileDocked(docked)
    setCookie(STORAGE_KEYS.MOBILE_DOCKED, docked.toString())
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00"
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? "0" : ""}${s}`
  }

  const isVi = lang === "vi"

  return (
    <div
      className={`select-none transition-all duration-300 ${
        isMobileDocked
          ? "relative w-full mt-4 sm:fixed sm:bottom-6 sm:left-6 sm:z-40 sm:m-0 sm:w-auto"
          : "fixed bottom-4 left-6 right-6 z-40 sm:left-6 sm:right-auto sm:bottom-6 sm:w-auto"
      }`}
    >
      {/* Autoplay prompt toast if blocked by browser policy */}
      {autoplayBlocked && !isPlaying && (
        <div
          onClick={togglePlay}
          className="mb-2 flex cursor-pointer items-center gap-2 rounded-sm border border-lime/40 bg-panel/95 px-3 py-1.5 shadow-xl backdrop-blur-md transition-all hover:border-lime"
        >
          <span className="size-2 animate-ping rounded-full bg-lime" />
          <span className="font-mono text-[10px] font-semibold tracking-wider text-lime">
            {isVi ? "Nhấn để phát nhạc nền" : "Click to enable background music"}
          </span>
        </div>
      )}

      {/* Main Mini Player Card */}
      <div
        className={`rounded-sm border border-line bg-panel shadow-2xl backdrop-blur-md transition-all duration-300 ${
          isExpanded ? "w-full sm:w-80 p-3.5 sm:p-4" : "w-full sm:w-auto p-2.5 sm:p-2"
        }`}
      >
        <div className="flex flex-col gap-2.5">
          {/* Compact Header / Bar */}
          <div className="flex items-center gap-3">
            {/* Spinning Vinyl Album Art */}
            <div
              onClick={togglePlay}
              className="group relative size-10 flex-shrink-0 cursor-pointer overflow-hidden rounded-full border border-line bg-ink shadow-md"
            >
              <img
                src={TRACK_INFO.cover}
                alt={TRACK_INFO.title}
                className={`size-full object-cover transition-transform duration-700 ${
                  isPlaying ? "animate-spin [animation-duration:6s]" : "opacity-80"
                }`}
              />
              {/* Vinyl center dot */}
              <div className="absolute inset-0 m-auto size-2.5 rounded-full border border-line bg-ink shadow-inner" />
              {/* Play/Pause hover icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="font-mono text-[10px] font-bold text-lime">
                  {isPlaying ? "❚❚" : "▶"}
                </span>
              </div>
            </div>

            {/* Title & Artist Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="truncate font-mono text-[11px] font-bold tracking-tight text-fg">
                  {TRACK_INFO.title}
                </div>
                {isPlaying && (
                  <div className="flex items-end gap-0.5 h-3 flex-shrink-0">
                    <span className="w-0.5 bg-lime animate-[bounce_1s_infinite_100ms] h-full" />
                    <span className="w-0.5 bg-lime animate-[bounce_1s_infinite_300ms] h-2/3" />
                    <span className="w-0.5 bg-lime animate-[bounce_1s_infinite_200ms] h-5/6" />
                  </div>
                )}
              </div>
              <div className="truncate font-mono text-[10px] text-muted">
                {TRACK_INFO.artist}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlay}
                title={isPlaying ? (isVi ? "Tạm dừng" : "Pause") : (isVi ? "Phát nhạc" : "Play")}
                className="flex size-7 items-center justify-center rounded border border-line bg-panel-2 font-mono text-[10px] font-bold text-fg transition-colors hover:border-lime/60 hover:text-lime"
              >
                {isPlaying ? "❚❚" : "▶"}
              </button>

              {/* Mute Button */}
              <button
                onClick={toggleMute}
                title={isMuted ? (isVi ? "Bật âm thanh" : "Unmute") : (isVi ? "Tắt âm thanh" : "Mute")}
                className={`flex size-7 items-center justify-center rounded border border-line bg-panel-2 font-mono text-[10px] transition-colors hover:border-lime/60 ${
                  isMuted ? "text-flame" : "text-muted hover:text-fg"
                }`}
              >
                {isMuted ? (
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>

              {/* Expand / Minimize Toggle Button */}
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                title={isExpanded ? (isVi ? "Thu gọn" : "Collapse") : (isVi ? "Mở rộng" : "Expand")}
                className="flex size-7 items-center justify-center rounded border border-line bg-panel-2 font-mono text-[9px] text-muted transition-colors hover:border-lime/60 hover:text-fg"
              >
                {isExpanded ? "▼" : "▲"}
              </button>

              {/* Mobile-only Dock / Undock Button at the far right */}
              {isMobileDocked ? (
                /* Nút Nổi: chữ NỔI / FLOAT cùng chiều cao h-7 */
                <button
                  onClick={() => setMobileDockedPreference(false)}
                  title={isVi ? "Ghim nổi lên màn hình" : "Float on screen"}
                  className="flex sm:hidden h-7 items-center justify-center rounded border border-lime/50 bg-lime/10 px-2 font-mono text-[10px] font-semibold text-lime transition-colors hover:bg-lime/20"
                >
                  {isVi ? "NỔI" : "FLOAT"}
                </button>
              ) : (
                /* Nút Ẩn: chữ ẨN / HIDE ở ngoài cùng bên phải */
                <button
                  onClick={() => setMobileDockedPreference(true)}
                  title={isVi ? "Ẩn khung nổi xuống cuối trang" : "Dock to bottom"}
                  className="flex sm:hidden h-7 items-center justify-center rounded border border-line bg-panel-2 px-2 font-mono text-[10px] font-semibold text-muted transition-colors hover:border-lime/60 hover:text-fg"
                >
                  {isVi ? "ẨN" : "HIDE"}
                </button>
              )}
            </div>
          </div>

          {/* Expanded Detailed Section */}
          {isExpanded && (
            <div className="mt-1 flex flex-col gap-2.5 border-t border-line/60 pt-2.5">
              {/* Progress Bar & Timestamps */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between font-mono text-[9px] text-muted">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration || 30)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration || 30}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="h-1 w-full cursor-pointer appearance-none rounded bg-line accent-lime"
                />
              </div>

              {/* Volume Slider & Loop Toggle */}
              <div className="flex items-center justify-between gap-3 font-mono text-[10px]">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-muted text-[9px]">VOL</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="h-1 w-20 cursor-pointer appearance-none rounded bg-line accent-lime"
                  />
                  <span className="text-muted text-[9px] w-6">
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                </div>

                {/* Loop Toggle */}
                <button
                  onClick={toggleLoop}
                  title={isVi ? "Tự động lặp lại" : "Loop playback"}
                  className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[9px] transition-colors ${
                    isLooping
                      ? "border-lime/60 bg-lime/10 text-lime"
                      : "border-line text-muted hover:text-fg"
                  }`}
                >
                  <span>↺</span>
                  <span>{isVi ? "Lặp" : "Loop"}</span>
                </button>
              </div>

              {/* Footer Link (Open in Spotify) */}
              <div className="flex items-center justify-between border-t border-line/40 pt-2 font-mono text-[9px]">
                <a
                  href={TRACK_INFO.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#1DB954] hover:underline"
                >
                  <svg className="size-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.502 17.309c-.216.353-.674.466-1.026.25-2.812-1.718-6.351-2.107-10.519-1.155-.404.093-.807-.158-.9-.562-.093-.404.159-.807.562-.9 4.568-1.044 8.49-.607 11.633 1.341.352.216.465.674.25 1.026zm1.468-3.262c-.272.443-.852.583-1.295.311-3.218-1.978-8.125-2.55-11.932-1.393-.497.151-1.025-.136-1.176-.633-.151-.497.136-1.025.633-1.176 4.354-1.321 9.774-.683 13.459 1.583.443.272.583.852.311 1.295zm.126-3.411c-3.859-2.292-10.236-2.503-13.916-1.385-.591.18-1.218-.162-1.398-.753-.18-.591.162-1.218.753-1.398 4.238-1.286 11.28-1.042 15.719 1.593.532.316.707 1.002.392 1.534-.316.532-1.002.707-1.55.409z" />
                  </svg>
                  <span>Mở trên Spotify</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
