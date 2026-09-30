import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    // Allow the sandbox preview host (https://<port>-<sandbox>.e2b.app) to
    // reach the dev server during previews.
    allowedHosts: ['.e2b.app'],
  },
})
