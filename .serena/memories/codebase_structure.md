# Codebase Structure

This document outlines the structure of the codebase, detailing the purpose of key directories and files.

## Directory Layout

```
chrome-extension/
├── public/
│   ├── manifest.json          # Chrome extension manifest
│   ├── permission.html         # Permission request page for microphone
│   ├── permission-request.js   # Permission request handler
│   └── icons/                  # Extension icons
├── src/
│   ├── App.tsx                 # Main application component with chat logic
│   ├── main.tsx                # React entry point with ThemeProvider
│   ├── background.ts           # Background service worker
│   ├── content.ts              # Content script for page/YouTube extraction
│   ├── transformers-worker.ts  # Web worker for Transformers.js
│   ├── webllm-worker.ts        # Web worker for WebLLM
│   ├── components/
│   │   └── ui/                 # UI components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility libraries
│   └── types/                  # TypeScript type definitions
├── postinstall/
│   └── run.sh                  # Postinstall script for Transformers.js patch
└── dist/                       # Build output directory
```

## Key Directories

### `src/components/ui/`

UI components built with **shadcn/ui** and styled with **Tailwind CSS**:

-   `app-header.tsx` - Main header with status indicator and settings
-   `chat.tsx` - Main chat container
-   `chat-header.tsx` - Chat session header with title editing
-   `chat-list-item.tsx` - Individual chat item in sidebar
-   `chat-message.tsx` - Message display with markdown rendering
-   `chat-sidebar.tsx` - Multi-chat sidebar with chat list
-   `message-input.tsx` - Input area with provider selector, voice, and send
-   `message-list.tsx` - Scrollable message list container
-   `provider-selector.tsx` - Dropdown for selecting AI provider
-   `provider-status-banners.tsx` - Info banners for provider status
-   `settings-menu.tsx` - Settings dropdown with theme selector
-   `theme-provider.tsx` - Theme context provider
-   `download-progress-dialog.tsx` - Modal for model download progress
-   `typing-indicator.tsx` - Animated typing indicator
-   `audio-visualizer.tsx` - Waveform visualization for voice input
-   `markdown-renderer.tsx` - Markdown to HTML with syntax highlighting

### `src/hooks/`

Custom React hooks for state management and side effects:

-   `use-ai-provider.ts` - AI provider detection and management
-   `use-audio-recording.ts` - Audio recording state
-   `use-auto-scroll.ts` - Auto-scroll to bottom on new messages
-   `use-autosize-textarea.ts` - Textarea auto-resize
-   `use-chat-persistence.ts` - Auto-save chat to localStorage
-   `use-chat-title-editor.ts` - Inline chat title editing
-   `use-chats.ts` - Multi-chat state management
-   `use-chrome-message-listener.ts` - Listen for Chrome runtime messages
-   `use-copy-to-clipboard.ts` - Copy to clipboard handler
-   `use-model-download-progress.ts` - Model download progress tracking
-   `use-provider-context.tsx` - AI provider context
-   `use-theme.ts` - Theme state with OS detection
-   `use-theme-context.tsx` - Theme context hook
-   `use-voice-speech-recognition.ts` - Voice input with Speech Recognition API

### `src/lib/`

Utility libraries and core logic:

-   `client-side-chat-transport.ts` - **Triple-provider AI system** with streaming
-   `chat-storage.ts` - Chat persistence to localStorage
-   `chat-helpers.ts` - Chat management utilities (create, delete, rename)
-   `summarizer-utils.ts` - Chrome Summarizer API + LLM fallback
-   `rewrite-utils.ts` - Text rewrite tones and prompts
-   `youtube-utils.ts` - YouTube transcript extraction utilities
-   `audio-utils.ts` - Audio processing utilities
-   `image-utils.ts` - Image conversion utilities
-   `settings-storage.ts` - User preferences storage
-   `streaming-action-handler.ts` - Stream action handling
-   `iframe-permission-manager.ts` - Microphone permission via iframe
-   `request-microphone-permission.ts` - Permission request helper
-   `utils.ts` - General utilities (cn, etc.)

### `src/types/`

TypeScript type definitions:

-   `chat.ts` - Chat-related types (Chat, ChatMessage, etc.)
-   `chrome-messages.ts` - Chrome runtime message types

## Key Files

### `src/App.tsx`

The main application component, responsible for:
-   Managing chat sessions and message state
-   Handling provider detection and switching
-   Processing summarization, rewrite, and YouTube requests from background script
-   Rendering the chat UI with sidebar
-   Managing theme and settings

### `src/main.tsx`

React entry point that:
-   Wraps the app with `ThemeProvider`
-   Renders the root component
-   Initializes React 19 with createRoot

### `src/background.ts`

Background service worker that:
-   Creates context menus ("Summarize this page," "Rewrite text," "Summarize this video")
-   Routes messages between content script and sidebar
-   Opens sidebar when context menu items are clicked
-   Manages message queuing with ready signal handshake

### `src/content.ts`

Content script injected into web pages that:
-   Extracts page content using `@mozilla/readability`
-   Fetches YouTube video transcripts with `@danielxceron/youtube-transcript`
-   Responds to extraction requests from background script
-   Handles multiple URL formats for YouTube

### `src/lib/client-side-chat-transport.ts`

**Core AI transport layer** implementing the triple-provider system:

1.  **Built-in AI (Primary)**: Chrome's Gemini Nano
2.  **WebLLM (Secondary)**: Browser-based LLM
3.  **Transformers.js (Tertiary)**: Hugging Face Transformers.js

Features:
-   Automatic provider detection and fallback
-   Streaming responses with progress tracking
-   Model download progress callbacks
-   Support for summarization and chat
-   Generic provider handling for all three providers

### `src/transformers-worker.ts` & `src/webllm-worker.ts`

Web workers that run AI models in separate threads:
-   Prevent blocking the main UI thread
-   Handle model loading and inference
-   Configured with proper runtime paths for extension environment

### `public/manifest.json`

Chrome extension manifest (V3) that defines:
-   Extension metadata (name, version, description)
-   Permissions (storage, sidePanel, contextMenus, activeTab, scripting)
-   Content scripts for all URLs and YouTube
-   Background service worker
-   Side panel configuration
-   Web accessible resources (transformers assets)
-   Content Security Policy for WASM

### `vite.config.ts`

Vite build configuration with:
-   Multiple entry points (main, background, content)
-   Custom plugin to copy Transformers.js ONNX runtime assets
-   React plugin with Fast Refresh
-   Output configuration for proper file naming
-   Tailwind CSS integration

### `postinstall/run.sh`

Post-install script that:
-   Patches `@huggingface/transformers` package for Chrome extension compatibility
-   Sets `IS_BROWSER_ENV = true` in env.js
-   Handles cross-platform sed differences (macOS vs Linux)

## Build Output (`dist/`)

```
dist/
├── index.html                      # Sidebar HTML
├── background.js                   # Background service worker
├── content.js                      # Content script
├── permission.html                 # Permission request page
├── permission-request.js           # Permission handler
├── transformers/                   # ONNX runtime assets
│   ├── ort-wasm-simd-threaded.jsep.mjs
│   └── ort-wasm-simd-threaded.jsep.wasm
└── assets/
    ├── main-*.js                   # Main app bundle (~2.2MB gzipped)
    ├── main-*.css                  # Styles (~44KB)
    ├── transformers-worker-*.js    # Transformers.js worker
    └── webllm-worker-*.js          # WebLLM worker
```

## Architecture Patterns

### Triple-Provider Fallback Chain
```
User Message → ClientSideChatTransport
    ↓
1. Try Built-in AI (if available)
    ↓ (if unavailable)
2. Try WebLLM
    ↓ (if unavailable)
3. Use Transformers.js (always works)
```

### Message Flow for Features
```
Context Menu Click → background.ts
    ↓
Extract Content → content.ts
    ↓
Send to Sidebar → chrome.runtime.sendMessage
    ↓
Process in App.tsx → transport.streamSummary()
    ↓
Stream Response → Chat UI
```

### Multi-Chat Architecture
```
App.tsx (manages active chat)
    ↓
ChatSidebar (shows all chats)
    ↓
localStorage (persists chat history)
    ↓
use-chats hook (CRUD operations)
```

## Module Counts

-   **Total modules**: ~2,700
-   **Main bundle**: ~2,400 modules
-   **Background**: Minimal, ~50 modules
-   **Content script**: ~330 modules (includes readability)
