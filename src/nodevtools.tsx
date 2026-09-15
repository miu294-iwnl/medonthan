import { StrictMode, useState, useEffect } from "react"
import { createRoot } from "react-dom/client"
import NoDevTools from "./components/NoDevTools"
import "./index.css"

const LANG_KEY = "medonthan_lang"

function StandaloneNoDevTools() {
  const [lang, setLang] = useState<"vi" | "en">(() => {
    try {
      const s = localStorage.getItem(LANG_KEY)
      if (s === "en" || s === "vi") return s
    } catch {}
    return "vi"
  })

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {}
  }, [lang])

  const getReturnUrl = () => {
    try {
      const saved = sessionStorage.getItem("medonthan_return_url")
      if (saved && !saved.includes("nodevtools")) {
        return saved
      }
      const page = localStorage.getItem("medonthan_active_page")
      if (page === "music") return "/music"
      return "/games"
    } catch {
      return "/games"
    }
  }

  const handleRetry = () => {
    window.location.replace(getReturnUrl())
  }

  return (
    <NoDevTools
      lang={lang}
      setLang={setLang}
      onRetry={handleRetry}
    />
  )
}

const root = document.getElementById("nodevtools-root")
if (root) {
  createRoot(root).render(
    <StrictMode>
      <StandaloneNoDevTools />
    </StrictMode>
  )
}
