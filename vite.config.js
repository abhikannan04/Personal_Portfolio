import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Don't watch build output; rebuilding it while the dev server runs
    // can lock files on Windows and crash the watcher.
    watch: { ignored: ['**/dist/**'] },
  },
  build: {
    // three.js + R3F + drei is ~1 MB; keep it in its own long-cached chunk.
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
        },
      },
    },
  },
})
