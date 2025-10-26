# Chrome Extension: Local AI Assistant - Project Overview

## 🎯 Project Purpose

A **privacy-first, local AI assistant** built as a Chrome sidebar extension. It features page summarization, text rewriting, and YouTube video summarization. The extension leverages in-browser AI models, ensuring complete data privacy with zero external API calls.

### Core Features

-   **Text Generation**: An LLM-powered chat interface with streaming responses.
-   **Multi-Chat Support**: Create and manage multiple chat sessions with persistent history.
-   **Page Summarization**: Summarize any web page via a right-click context menu.
-   **YouTube Video Summarization**: Summarize YouTube videos by extracting transcripts.
-   **Text Rewriting**: Rewrite selected text in one of eight different tones.
-   **Voice Input**: Speech-to-text using the browser's Speech Recognition API.
-   **Complete Privacy**: All processing is done locally; no data leaves the user's device.
-   **Offline Functionality**: AI models are cached locally after the first use.
-   **Streaming UI**: Responses are streamed character-by-character with a typing animation.
-   **Theming**: Light, Dark, and System theme options with smooth animations.
-   **Model Download Progress**: A dialog indicates the download progress of AI models.

## 🛠️ Tech Stack

### Core Frameworks

-   **React 19**: For building a modern, functional component-based UI.
-   **Vite 7**: A fast build tool with Hot Module Replacement (HMR).
-   **TypeScript**: For strict type-checking and improved code quality.

### UI & Styling

-   **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
-   **shadcn/ui**: A collection of reusable UI components.
-   **Framer Motion**: For creating smooth and professional animations.

### AI & Machine Learning

-   **Vercel AI SDK (`ai`)**: Provides standardized AI streaming APIs.
-   **@ai-sdk/react**: Includes the `useChat` hook for client-side AI state management.
-   **@built-in-ai/core**: The primary provider, utilizing Chrome's built-in Gemini Nano.
-   **@built-in-ai/web-llm**: The secondary fallback provider, using WebLLM.
-   **@built-in-ai/transformers-js**: The tertiary fallback provider, using Hugging Face Transformers.js.
-   **WebGPU / WASM**: For hardware-accelerated in-browser model inference.

### Content Processing

-   **@mozilla/readability**: For extracting the main content from web pages.
-   **@danielxceron/youtube-transcript**: For fetching YouTube video transcripts.
-   **react-markdown**: For rendering Markdown content in chat messages.
-   **highlight.js**: For syntax highlighting in code blocks.

### Chrome Extension APIs

-   **Manifest V3**: The modern format for Chrome extensions.
-   **Side Panel API**: For displaying the extension's UI in the browser sidebar.
-   **Content Scripts**: For interacting with web page content.
-   **Background Service Worker**: For managing context menus and message routing.

## 🏗️ Architecture

### Triple-Provider AI System

The extension uses a triple-provider approach to ensure functionality across different browser environments:

1.  **Primary Provider**: Chrome's Built-in AI (`@built-in-ai/core`), which uses Gemini Nano. This is the fastest and most efficient option, as it's hardware-optimized and managed by the browser.
2.  **Secondary Fallback Provider**: WebLLM (`@built-in-ai/web-llm`), which is used when the Built-in AI is not available. It uses the WebLLM project for browser-based LLM inference.
3.  **Tertiary Fallback Provider**: Transformers.js (`@built-in-ai/transformers-js`), which provides the broadest compatibility. It uses Hugging Face's Transformers.js library and works on nearly any modern browser with WebAssembly support.

### Feature Implementation

-   **Page Summarization**: When a user right-clicks on a page and selects "Summarize this page," a content script extracts the page's content using `@mozilla/readability`. The content is then sent to the sidebar, where the AI generates a summary. The extension first attempts to use the Chrome Summarizer API (if available), then falls back to the triple-provider chat system.
-   **YouTube Video Summarization**: For YouTube videos, the extension extracts the video's transcript using `@danielxceron/youtube-transcript`. The transcript is then summarized by the AI using the triple-provider system.
-   **Text Rewriting**: Users can select text on any page, right-click, and choose from eight different tones to rewrite the text. The rewritten text is then displayed in the sidebar using streaming responses.
-   **Voice Input**: Users can click the microphone button to use speech-to-text. The browser's native Speech Recognition API converts speech to text, which is then added to the message input.
-   **Multi-Chat**: Users can create multiple chat sessions, each with its own history. Chat data is persisted to localStorage and automatically restored on page load.

### Transformers.js Chrome Extension Patch

A custom solution was implemented to make Transformers.js work within Chrome extensions, which have strict Content Security Policies. The solution includes:
-   A postinstall script that patches the Transformers.js package
-   A Vite plugin that copies ONNX runtime assets to the extension bundle
-   Runtime configuration in the worker to load assets locally
-   Manifest updates to expose the assets as web-accessible resources

## 🔧 Development Workflow

1.  **Development**: Run `npm run dev` to start the Vite development server.
2.  **Build**: Run `npm run build` to create a production build of the extension in the `dist/` directory.
3.  **Testing**: Load the `dist/` directory as an unpacked extension in Chrome's developer mode to test its functionality.

## 🎨 Code Style & Conventions

-   **Components**: Functional components with hooks are preferred.
-   **Styling**: All styling is done using Tailwind CSS, with conditional classes managed by the `cn()` utility.
-   **File Naming**:
    -   Components: `kebab-case.tsx`
    -   Hooks: `use-kebab-case.ts`
    -   Utilities: `kebab-case.ts`
-   **Commits**: The Conventional Commits format is used for commit messages (e.g., `feat(youtube): add video summarization`).

## 🔒 Privacy & Security

-   **100% Local Processing**: All AI inference runs in the browser. No data is sent to external servers.
-   **No API Keys Required**: The extension does not require any API keys or accounts.
-   **Chrome Extension Sandboxing**: The extension runs in a sandboxed environment enforced by Chrome.
-   **Transformers.js CSP Patch**: A custom solution ensures the extension complies with Chrome's Content Security Policy while still being able to load AI models.
