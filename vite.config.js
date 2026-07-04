import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serve em https://<user>.github.io/mercadog/; Vercel serve na raiz
  base: process.env.GITHUB_PAGES ? '/mercadog/' : '/',
  plugins: [react(), tailwindcss()],
})
