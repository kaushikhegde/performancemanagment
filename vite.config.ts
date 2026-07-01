import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    // NOTE: the Gemini API key is intentionally NOT exposed to the client.
    // AI calls go through the Express server (server.js -> /api/ai/generate).
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Proxy AI requests to the Express server during `vite` dev.
      // Run `node server.js` alongside `npm run dev` to exercise real AI locally;
      // otherwise these fail fast and the UI uses its local mock output.
      proxy: {
        '/api': {
          target: process.env.AI_SERVER_URL || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  };
});
