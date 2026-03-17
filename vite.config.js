import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './extension/manifest.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    // ...(!process.env.VERCEL ? [crx({ manifest })] : [])
  ],
  resolve: {
    alias: {
      '@clerk/chrome-extension': '@clerk/react'
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
})
