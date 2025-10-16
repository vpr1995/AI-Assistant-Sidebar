# Chrome Extension Project Overview

## Purpose
This project is building a **privacy-first, local AI assistant as a Chrome sidebar extension**. The extension will run AI models directly in the browser using WebGPU/WebAssembly, providing users with:

- Text generation (LLM chat interface with streaming)
- Image generation (multimodal AI)
- Speech-to-text (Whisper transcription)
- Text-to-speech capabilities
- Complete data privacy (100% local processing, zero external API calls)
- Offline functionality after model caching

The UI is inspired by shadcn.io's AI chatbot interface with streaming responses, markdown rendering, and copy functionality.

## Tech Stack

### Core Framework
- **React 19** - Modern functional components with hooks
- **Vite 7** - Fast build tool with HMR
- **TypeScript** - Strict type checking enabled

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework (✅ installed and configured)
- **shadcn/ui** - React component library (✅ configured)
- **shadcn/ui AI Chatbot Components** - Chat, Message, MessageInput components (✅ installed)

### AI Runtime
- **Vercel AI SDK (`ai`)** - Standardized AI streaming APIs (✅ installed)
- **@ai-sdk/react** - useChat hook for client-side AI (✅ installed)
- **@built-in-ai/core** - Chrome's built-in Gemini Nano/Phi Mini (✅ installed, PRIMARY)
- **@built-in-ai/transformers-js** - Transformers.js wrapper with model selection (✅ installed, FALLBACK)
- **WebGPU** - Hardware acceleration (with WASM fallback)
- **Web Workers** - Off-main-thread model inference (⏳ planned)

### Chrome Extension
- **Manifest V3** - Chrome extension manifest in `public/manifest.json` (✅ configured)
- **Side Panel API** - Sidebar extension (400px - 100% width responsive) (✅ implemented)
- **Background Service Worker** - `src/background.ts` compiled to `dist/background.js` (✅ configured)

## Current State (October 15, 2025)

### ✅ Phase 1: Foundation & Setup (5/5 Completed)
- Project setup with all dependencies
- Chrome extension manifest with side panel API
- Tailwind CSS + shadcn/ui configured
- shadcn/ui AI Chatbot Components installed
- Sidebar layout with header, scrollable content, fixed input

### 🔄 Phase 2: Chat Interface (2/4 Partially Complete)
- Chat component integrated with streaming
- Basic messaging working with user/AI roles
- Markdown rendering optimized (using highlight.js instead of shiki - saved 330 modules)
- Message input working with auto-resize
- Fixed horizontal scrollbar issue (overflow-x-hidden)
- Added typing indicator with bouncing dots animation

### ✅ Phase 3: AI Integration (2/4 Completed)
- ✅ Custom ClientSideChatTransport for useChat hook
- ✅ Built-in AI detection and status display
- ✅ Text streaming with abort capability
- ✅ Download progress tracking for models
- ⏳ Model download progress UI (partially - progress in transport)
- ⏳ Error handling improvements needed

### ⏰ Phases 4-6: Not Started (0/18)
- Advanced features (copy, regenerate, voice input, image generation)
- Storage & settings (chat history, cache management, generation config)
- Testing & polish (accessibility, performance, packaging)

## Recent Achievements
1. **Bundle Optimization**: Reduced from 2,981 to 2,651 modules (11% reduction)
2. **TypeScript/ESLint Clean**: Fixed all compilation errors and type safety issues
3. **UI/UX Improvements**: Responsive layout, typing indicator, no horizontal scroll
4. **AI Integration**: Custom transport, streaming, download progress, error handling

## Project Goals
Build a fully functional local AI assistant that:
1. Runs entirely in the browser (privacy-first)
2. Uses Chrome's sidebar for persistent access
3. Provides ChatGPT-like UX with streaming
4. Supports multiple AI models and tasks (text, image, voice)
5. Works offline after initial model download

## Progress Summary
- **Total Tasks**: 30
- **Completed**: 7/30 (23%)
- **Current Focus**: Chat interface and AI integration refinement
