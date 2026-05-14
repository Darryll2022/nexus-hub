import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// M5: Content Security Policy
// - default-src 'self'           → no external resources unless explicitly allowed
// - script-src 'self' 'unsafe-inline'  → needed for Vite HMR in dev; tighten for prod via nonces
// - style-src 'self' 'unsafe-inline'   → Tailwind inline styles need this
// - connect-src 'self' + allowed API origins → restricts fetch() to known LLM endpoints
// - img-src 'self' data:         → allow data: URIs (e.g. base64 avatars)
// - frame-ancestors 'none'       → prevents clickjacking
// - object-src 'none'            → no Flash / legacy plugins
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://api.groq.com https://openrouter.ai",
  "img-src 'self' data:",
  "font-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': CSP,
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
})
