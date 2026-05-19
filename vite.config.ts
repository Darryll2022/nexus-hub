import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// M5: Content Security Policy
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
      '/opencode': {
        target: 'http://127.0.0.1:4096',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/opencode/, ''),
      },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Hash-only filenames — no framework name hints
        entryFileNames: 'assets/[hash].js',
        chunkFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash][extname]',
        banner: '',
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      mangle: { toplevel: true },
      format: { comments: false },
    },
  },
})
