import { defineConfig } from 'vite'
import type { PluginOption, ResolvedConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { copyFile, mkdir } from 'fs/promises'

const transformersAssetFiles = [
  'ort-wasm-simd-threaded.jsep.mjs',
  'ort-wasm-simd-threaded.jsep.wasm',
]

function copyTransformersAssetsPlugin(): PluginOption {
  let outDir = 'dist'
  let rootDir = process.cwd()

  return {
    name: 'copy-transformers-assets',
    apply: 'build' as const,
    configResolved(config: ResolvedConfig) {
      outDir = config.build.outDir ?? 'dist'
      rootDir = config.root
    },
    async closeBundle() {
      const srcDir = path.resolve(rootDir, 'node_modules/@huggingface/transformers/dist')
      const destDir = path.resolve(rootDir, outDir, 'transformers')

      await mkdir(destDir, { recursive: true })

      for (const fileName of transformersAssetFiles) {
        const source = path.join(srcDir, fileName)
        const destination = path.join(destDir, fileName)

        try {
          await copyFile(source, destination)
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to copy transformers asset'
          throw new Error(
            `[copy-transformers-assets] Unable to copy ${fileName}: ${message}`,
          )
        }
      }
    },
  }
}


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), copyTransformersAssetsPlugin()],
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
