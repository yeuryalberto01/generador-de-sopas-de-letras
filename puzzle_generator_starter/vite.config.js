import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const backendHost = process.env.VITE_BACKEND_HOST || process.env.BACKEND_HOST || '127.0.0.1'
const backendPort = process.env.VITE_BACKEND_PORT || process.env.BACKEND_PORT || '8001'
const backendTarget = `http://${backendHost}:${backendPort}`

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic'
  })],
  define: {
    'process.env.NODE_ENV': '"development"'
  },
  esbuild: {
    /**
     * Emit ASCII-only bundles so every accent is escaped as \uXXXX.
     * Esto evita que navegadores que fuerzan ISO-8859-1 vean textos truncados.
     */
    charset: 'ascii'
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})
