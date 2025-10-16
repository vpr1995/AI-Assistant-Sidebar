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
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - React component library
- **shadcn/ui AI Chatbot Components** - Chat, Message, MessageInput components

### AI Runtime
- **Vercel AI SDK (`ai`)** - Standardized AI streaming APIs
- **@ai-sdk/react** - useChat hook for client-side AI
- **@built-in-ai/core** - Chrome's built-in Gemini Nano/Phi Mini (PRIMARY)
- **@built-in-ai/transformers-js** - Transformers.js wrapper with model selection (FALLBACK)
- **WebGPU** - Hardware acceleration (with WASM fallback)
- **Web Workers** - Off-main-thread model inference (planned)

### Chrome Extension
- **Manifest V3** - In `public/manifest.json`
- **Side Panel API** - For the sidebar
- **Background Service Worker** - `src/background.ts`

## Architecture

### Dual-Provider AI System
This extension uses a smart dual-provider architecture:
1.  **Primary Provider: Chrome Built-in AI** (`@built-in-ai/core`)
    *   Uses Chrome's native Gemini Nano or Edge's Phi Mini.
    *   Fast, efficient, and managed by the browser.
    *   Requires enabling a Chrome flag: `chrome://flags/#prompt-api-for-gemini-nano`.
2.  **Fallback Provider: Transformers.js** (`@built-in-ai/transformers-js`)
    *   Used when Built-in AI is not available.
    *   Allows manual model selection and runs on any modern browser with WebGPU/WASM support.

### Data Flow
The data flow is entirely client-side:
`User Input → ClientSideChatTransport → Built-in AI/Transformers.js Model → Stream → UI Update`

A custom `ClientSideChatTransport` is implemented to integrate with the `@ai-sdk/react` `useChat` hook and handle the logic for both AI providers.

### State Management
- **Local State**: `useState` for component-level state.
- **Chrome Storage**: For persisting chat history and user settings (planned).
- **No Global State**: No Redux/Zustand is used.

## Key Workflows

- **Development**: `npm run dev` starts the Vite dev server.
- **Build**: `npm run build` creates the production-ready extension in the `dist/` directory.
- **Linting**: `npm run lint` checks for code quality issues.
- **Preview**: `npm run preview` serves the built app locally.

### Chrome Extension Testing
1.  Run `npm run build`.
2.  Go to `chrome://extensions/`, enable "Developer mode".
3.  Click "Load unpacked" and select the `dist/` folder.
4.  To see changes, rebuild and click the reload icon on the extension card.

## Conventions

### Code Style
- **Components**: Functional components with hooks. Use function declarations, not arrow functions for top-level components.
- **Types**: Always use explicit types for props, state, and function parameters. Use interfaces for object shapes.
- **Imports**: Group imports by category (React, external, internal components, hooks, utils, styles).
- **Styling**: Use Tailwind CSS with the `cn()` utility for conditional classes.
- **File Naming**: Use `kebab-case.tsx` for components and `use-kebab-case.ts` for hooks.

### Commit Messages
Use conventional commit format (e.g., `feat(chat): add streaming support`).

## File Structure

```
src/
├── App.tsx              # Main sidebar container component
├── main.tsx             # React entry point
├── background.ts        # Background service worker
├── components/
│   └── ui/              # shadcn/ui components
│       ├── chat.tsx
│       ├── chat-message.tsx
│       └── message-input.tsx
├── hooks/               # Custom React hooks
│   ├── use-auto-scroll.ts
│   └── use-autosize-textarea.ts
└── lib/                 # Utility libraries
    ├── client-side-chat-transport.ts # Custom transport for useChat
    └── utils.ts         # Shared utilities like cn()
```

## TypeScript Configuration

- **`tsconfig.app.json`**: Config for the React app with `jsx: "react-jsx"` and strict mode enabled.
- **`tsconfig.node.json`**: Config for Node.js scripts like `vite.config.ts`.

Always use TypeScript for new files and adhere to the strict mode rules.

