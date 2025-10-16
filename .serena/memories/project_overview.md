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
- **JavaScript/JSX** - No TypeScript (currently)

### UI & Styling (Planned)
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - React component library for AI chat interface
- **shadcn/ui AI Chatbot Components** - Pre-built Conversation, Message, PromptInput, Reasoning, Sources, Loader

### AI Runtime (Planned)
- **Vercel AI SDK (`ai`)** - Standardized AI streaming APIs
- **@built-in-ai/transformers-js** - Transformers.js wrapper with better APIs
- **WebGPU** - Hardware acceleration (with WASM fallback)
- **Web Workers** - Off-main-thread model inference

### Chrome Extension
- **Manifest V3** - Chrome extension manifest
- **Side Panel API** - Sidebar extension (400-500px width)
- **Chrome Storage API** - Message persistence and settings

## Current State
The project is currently a basic React + Vite template with:
- Simple counter app in `App.jsx`
- HMR development server working
- ESLint configuration with React hooks and refresh plugins
- No Chrome extension manifest yet (to be added)
- No AI capabilities yet (to be implemented)

## Project Goals
Build a fully functional local AI assistant that:
1. Runs entirely in the browser (privacy-first)
2. Uses Chrome's sidebar for persistent access
3. Provides ChatGPT-like UX with streaming
4. Supports multiple AI models and tasks
5. Works offline after initial model download
