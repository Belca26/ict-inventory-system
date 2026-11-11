import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      // Avoids CORS friction in local dev — frontend calls /api/*, Vite
      // forwards to the backend. Production uses VITE_API_URL directly instead.
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
