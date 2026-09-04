import { StrictMode, useState, useEffect } from "react"
import { createRoot } from "react-dom/client"
import { addListener, isLaunch, launch } from "devtools-detector"
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
  const [isStillOpen, setIsStillOpen] = useState(true)

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {}
  }, [lang])

  useEffect(() => {
    const handleDetector = (isOpen: boolean) => {
      setIsStillOpen(isOpen)
      if (!isOpen) {
        // Devtools was closed, redirect back to the page the user was on
        let returnUrl = "/games"
        try {
          returnUrl = sessionStorage.getItem("medonthan_return_url") || "/games"
        } catch {}
        window.location.replace(returnUrl)
      }
    }

    addListener(handleDetector)
    if (!isLaunch()) {
      launch()
    }
  }, [])

  const handleRetry = () => {
    if (!isStillOpen) {
      let returnUrl = "/games"
      try {
        returnUrl = sessionStorage.getItem("medonthan_return_url") || "/games"
      } catch {}
      window.location.replace(returnUrl)
    } else {
      window.location.reload()
    }
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
