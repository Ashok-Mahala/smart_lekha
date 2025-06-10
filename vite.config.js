import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on mode (development, production, test)
  const env = loadEnv(mode, process.cwd())
  
  console.log(`Building for ${mode} environment`)
  
  return {
    plugins: [react()],
    root: path.resolve(__dirname, 'frontend'),
    publicDir: path.resolve(__dirname, 'frontend/public'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './frontend')
      }
    },
    // Define environment variables that should be available to the client code
    define: {
      __APP_ENV__: JSON.stringify(mode),
    },
    // Environment-specific build options
    build: {
      outDir: path.resolve(__dirname, 'dist'),
      sourcemap: mode !== 'production',
      // Minify only in production
      minify: mode === 'production' ? 'esbuild' : false,
      // Generate manifest only in production
      manifest: mode === 'production',
      // Different rollup options based on environment
      rollupOptions: {
        output: {
          manualChunks: mode === 'production' ? {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          } : undefined,
        }
      },
    },
    // Serve options
    server: {
      port: 5173,
      strictPort: false,
      open: true,
      proxy: {
        // Proxy API requests to backend during development
        '/smlekha': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/smlekha/, '')
        }
      }
    }
  }
}) 