import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const REPORT_API_TARGET =
  process.env.VITE_REPORT_API_TARGET ?? process.env.REPORT_API_TARGET ?? 'http://localhost:3001'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/reports': {
        target: REPORT_API_TARGET,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
