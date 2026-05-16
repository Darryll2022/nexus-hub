import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// M5: Content Security Policy
// connect-src includes http://127.0.0.1:4096 for local opencode server (dev + local prod).
// This is safe on Vercel — the server won't be running there, so the rule is harmless.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://api.groq.com https://openrouter.ai http://127.0.0.1:4096",
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
    proxy: {
      // Dev proxy: /opencode/* → http://127.0.0.1:4096/*
      // Removes CORS issues when calling the opencode server from the browser in dev.
      // SSE streams (EventSource) pass through correctly with changeOrigin: true.
      '/opencode': {
        target: 'http://127.0.0.1:4096',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/opencode/, ''),
      },
    },
  },
})
