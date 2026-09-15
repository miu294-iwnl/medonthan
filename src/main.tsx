import React from 'react'
import ReactDOM from 'react-dom/client'
import { addListener, isLaunch, launch } from 'devtools-detector'
import App from './App'
import './index.css'

// Hard redirect to separate standalone page when devtools is opened in production
const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local') || hostname === '[::1]'

if (!isLocal && !import.meta.env.DEV) {
  addListener((isOpen) => {
    if (isOpen) {
      try {
        const currentTarget = window.location.pathname + window.location.search + window.location.hash
        if (currentTarget && !currentTarget.includes('nodevtools')) {
          sessionStorage.setItem('medonthan_return_url', currentTarget)
        }
        document.documentElement.innerHTML = ''
      } catch {}
      window.location.replace('/nodevtools.html')
    }
  })

  if (!isLaunch()) {
    launch()
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

