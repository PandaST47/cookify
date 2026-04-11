import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },

  preview: {
    host: true,
    port: 4173,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  esbuild: process.env.NODE_ENV === 'production'
    ? { drop: ['console', 'debugger'] }
    : {},

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'framer': ['framer-motion'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    minify: 'esbuild',
    cssMinify: true,
  },
})
