import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
        // include the background service worker so Vite bundles it and outputs to dist/background.js
        background: path.resolve(__dirname, 'src/background.ts'),
        // include the content script so Vite bundles it and outputs to dist/content.js
        content: path.resolve(__dirname, 'src/content.ts'),
      },
      external: (id) => {
        // Only externalize @mozilla/readability for the main app, not for content script
        if (id === '@mozilla/readability') {
          return false; // Bundle it in content.js
        }
        return false;
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Ensure background.ts outputs as background.js and content.ts as content.js
          if (chunkInfo.name === 'background') return 'background.js';
          if (chunkInfo.name === 'content') return 'content.js';
          return 'assets/[name]-[hash].js';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
