import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic'
  })],
  define: {
    'process.env.NODE_ENV': '"development"'
  },
  esbuild: {
    /**
     * Emit ASCII-only bundles so every acento/ñ is escaped as \uXXXX.
     * Esto evita que navegadores que fuerzan ISO-8859-1 vean textos como "ConfiguraciÃ³n".
     */
    charset: 'ascii'
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})
