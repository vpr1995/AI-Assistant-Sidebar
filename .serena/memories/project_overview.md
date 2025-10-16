# Chrome Extension Project Overview

## Purpose
This project is building a **privacy-first, local AI assistant as a Chrome sidebar extension**. The extension will run AI models directly in the browser using WebGPU/WebAssembly, providing users with:

- Text generation (LLM chat interface)
- Image generation (multimodal AI)
- Speech-to-text (Whisper transcription)
- Text-to-speech capabilities
- Complete data privacy (100% local processing, zero external API calls)
- Offline functionality after model caching

The UI is inspired by shadcn.io's AI chatbot interface with streaming responses, reasoning display, and source citations.

## Tech Stack

### Core Framework
- **React 19** - Modern functional components with hooks
- **Vite 7** - Fast build tool with HMR
- **TypeScript** - Strict type checking enabled (converted from JavaScript)

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework (installed)
- **shadcn/ui** - React component library for AI chat interface (planned)
- **shadcn/ui AI Chatbot Components** - Pre-built Conversation, Message, PromptInput, Reasoning, Sources, Loader (planned)

### AI Runtime (Planned)
- **Vercel AI SDK (`ai`)** - Standardized AI streaming APIs (installed)
- **@built-in-ai/transformers-js** - Transformers.js wrapper with better APIs (installed)
- **@built-in-ai/core** - Core AI functionality (installed)
- **WebGPU** - Hardware acceleration (with WASM fallback)
- **Web Workers** - Off-main-thread model inference

### Chrome Extension
- **Manifest V3** - Chrome extension manifest in `public/`
- **Side Panel API** - Sidebar extension (400-500px width)
- **Background Service Worker** - `src/background.ts` compiled to `dist/background.js`

## Current State
The project has been converted to full TypeScript:
- ✅ TypeScript compiler and types installed
- ✅ All React components in `.tsx` format (`App.tsx`, `main.tsx`)
- ✅ Vite config in TypeScript (`vite.config.ts`)
- ✅ Strict type checking enabled
- ✅ ESLint configured for TypeScript
- ✅ Chrome extension manifest present in `public/`
- ✅ Background service worker (`background.ts`)
- ✅ Tailwind CSS installed and configured
- ⏳ AI capabilities to be implemented
- ⏳ shadcn/ui components to be added

## Project Goals
Build a fully functional local AI assistant that:
1. Runs entirely in the browser (privacy-first)
2. Uses Chrome's sidebar for persistent access
3. Provides ChatGPT-like UX with streaming
4. Supports multiple AI models and tasks
5. Works offline after initial model download
