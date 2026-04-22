import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite configuration for AI Songwriting Partner
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Disable HMR if the platform requests it to avoid WebSocket connection errors
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || 'dummy_key'),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || 'dummy_key')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
