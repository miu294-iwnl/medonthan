import React from 'react'
import ReactDOM from 'react-dom/client'
import { addListener, isLaunch, launch } from 'devtools-detector'
import App from './App'
import './index.css'

// Hard redirect to separate standalone page when devtools is opened
addListener((isOpen) => {
  if (isOpen) {
    try {
      document.documentElement.innerHTML = ''
    } catch {}
    window.location.replace('/nodevtools.html')
  }
})

if (!isLaunch()) {
  launch()
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

