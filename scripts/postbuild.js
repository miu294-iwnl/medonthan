import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, '../dist')
const indexHtmlPath = path.join(distDir, 'index.html')

if (fs.existsSync(indexHtmlPath)) {
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8')

  // Remove any old subdirectories and stale route HTML files to prevent Render/CDN from serving
  // cached old HTML directly (bypassing the rewrite rule /* -> /index.html which always returns latest)
  for (const route of ['music', 'games']) {
    const routeDir = path.join(distDir, route)
    if (fs.existsSync(routeDir)) {
      fs.rmSync(routeDir, { recursive: true, force: true })
    }
    const routeHtml = path.join(distDir, `${route}.html`)
    if (fs.existsSync(routeHtml)) {
      fs.rmSync(routeHtml, { force: true })
    }
  }

  // 404.html and 200.html fallbacks for static hosting (Render, GitHub Pages, Surge, Netlify)
  fs.writeFileSync(path.join(distDir, '404.html'), indexHtml, 'utf8')
  fs.writeFileSync(path.join(distDir, '200.html'), indexHtml, 'utf8')

  console.log('✓ Postbuild: Cleaned static route directories and generated SPA fallbacks')
} else {
  console.warn('! Postbuild: dist/index.html not found, skipping route copies.')
}
