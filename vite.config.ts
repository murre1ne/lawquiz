import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the app from /lawquiz/, while Netlify serves it from the
// site root. Netlify sets NETLIFY=true during builds.
export default defineConfig({
  plugins: [react()],
  base: process.env.NETLIFY ? '/' : '/lawquiz/',
})
