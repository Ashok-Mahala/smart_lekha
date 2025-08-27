import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  server: {
    host: '0.0.0.0',     // <- Accept connections from any IP
    port: 5174,          // <- Optional: set custom port
    strictPort: true     // <- Optional: fail if port is taken
  }
})
