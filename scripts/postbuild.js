import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, '../dist')
const indexHtmlPath = path.join(distDir, 'index.html')

if (fs.existsSync(indexHtmlPath)) {
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8')

  // Clean up any old subdirectories if they exist to prevent static web servers from issuing directory redirects
  for (const route of ['music', 'games']) {
    const routeDir = path.join(distDir, route)
    if (fs.existsSync(routeDir)) {
      fs.rmSync(routeDir, { recursive: true, force: true })
    }
    fs.writeFileSync(path.join(distDir, `${route}.html`), indexHtml, 'utf8')
  }

  // 404.html and 200.html fallbacks for static hosting (Render, GitHub Pages, Surge, Netlify)
  fs.writeFileSync(path.join(distDir, '404.html'), indexHtml, 'utf8')
  fs.writeFileSync(path.join(distDir, '200.html'), indexHtml, 'utf8')

  console.log('✓ Postbuild: Cleaned static route directories and generated SPA fallbacks')
} else {
  console.warn('! Postbuild: dist/index.html not found, skipping route copies.')
}
