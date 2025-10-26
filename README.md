# AI Assistant Chrome Extension

> **Privacy-first, local AI assistant** as a Chrome sidebar extension with intelligent page summarization capabilities. Run AI models directly in your browser with zero external API calls.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Chrome](https://img.shields.io/badge/Chrome-128%2B-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Features

**Chat & Conversations**
- **💬 Chat Interface**: Smooth streaming responses with typing animation
- **💾 Multi-Chat Support**: Create and manage multiple chat sessions with persistent history
- **🖼️ Multimodal Input**: Upload images for vision-based queries (Built-in AI only)
- **🎤 Voice Input**: Speech-to-text using browser's native Speech Recognition API
- **📋 Copy Messages**: One-click copy for any AI response

**Summarization & Content Processing**
- **📄 Page Summarization**: Right-click any web page → instant AI summary
- **📺 YouTube Summarization**: Extract and summarize YouTube video transcripts
- **✍️ Text Rewriting**: Rewrite selected text in 8 different tones (Concise, Professional, Casual, Formal, Engaging, Simplified, Technical, Creative)

**Privacy & Performance**
- **🔐 100% Private**: All processing happens locally in your browser — zero external API calls
- **⚡ Fast**: Optimized streaming with real-time response rendering
- **🌐 Offline**: Works completely offline after initial model download
- **💿 Persistent Storage**: All chats saved to device

**AI System**
- **🤖 Triple-Provider AI System**: Automatic fallback across three providers:
  - **Built-in AI** (Gemini Nano) — Chrome's native, fastest, supports images
  - **WebLLM** (Llama 3.2) — browser-based via WebGPU
  - **Transformers.js** (Llama 3.2) — broadest compatibility fallback

## 📦 What's Inside

```
Chrome Extension Architecture:
├── Sidebar UI          (React 19 + Tailwind CSS)
├── Client-side LLMs    (Built-in AI → WebLLM → Transformers.js fallback)
├── Content Script      (@mozilla/readability for page extraction)
├── Background Worker   (Context menu & message routing)
└── Zero External APIs  (Complete privacy)
```

## ⚡ Quick Feature Showcase

**Try These Right After Installing:**

1. **💬 Chat with AI** — Open sidebar, type a question, get instant streaming responses
2. **📄 Summarize Pages** — Right-click any article → "Summarize this page"
3. **📺 YouTube Summaries** — Right-click on YouTube videos → "Summarize this video"
4. **✍️ Rewrite Text** — Select text → Right-click → "Rewrite in [Tone]" (8 tones available)
5. **🎤 Voice Input** — Click microphone button, speak, auto-transcribes
6. **🖼️ Image Chat** — Upload images (Built-in AI only) for vision-based questions
7. **💾 Multi-Chat** — Create multiple conversations, all saved automatically

All features work 100% offline after initial model download!

## 🚀 Quick Start

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/yourusername/chrome-extension.git
cd chrome-extension
```

2. **Install dependencies**:
```bash
npm install
```

3. **Build the extension**:
```bash
npm run build
```

4. **Load in Chrome**:
   - Go to `chrome://extensions/`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked**
   - Select the `dist/` folder

### Development

For local development with hot reload (note: Chrome APIs are not available in dev server):

```bash
npm run dev
```

Then build and reload in `chrome://extensions/` to test extension-specific APIs.

## 💻 Usage

### Chat with AI

1. Click the extension icon to open the sidebar
2. Start typing in the message input field
3. **Optional**: Click the image button 📎 to upload an image (Built-in AI only)
4. **Optional**: Click the microphone button 🎤 to use voice input
5. Press Enter or click Send
6. Watch the AI response stream in real-time

### Multi-Chat Management

- Click the **+ New Chat** button to create additional conversations
- Switch between chats using the sidebar list
- **Double-click** any chat title to rename it
- Each chat maintains its own complete history
- Up to 50 chats stored (oldest auto-deleted when limit reached)

### Summarize Any Web Page

1. Navigate to any article, blog post, or news page
2. **Right-click anywhere on the page**
3. Select **"Summarize this page"** from the context menu
4. The sidebar opens with a summarized view:
   - **Chrome Summarizer API** (when available in Chrome 128+) — native, efficient summaries
   - **LLM Fallback** (Built-in AI → WebLLM → Transformers.js) — full-text summarization
5. Continue the conversation about the page content

### Summarize YouTube Videos

1. Open any YouTube video
2. **Right-click on the video or page**
3. Select **"Summarize this video"**
4. The extension extracts the transcript and generates a summary
5. Ask follow-up questions about the video content

### Rewrite Text in Different Tones

1. Select any text on a web page
2. **Right-click on the selected text**
3. Choose **"Rewrite in [Tone]"** from the submenu
4. Available tones:
   - **Concise** — Shorter, to the point
   - **Professional** — Business-appropriate language
   - **Casual** — Relaxed, conversational style
   - **Formal** — Academic or official tone
   - **Engaging** — Captivating and interesting
   - **Simplified** — Easier to understand
   - **Technical** — More precise terminology
   - **Creative** — Imaginative rephrasing
5. The rewritten text appears in the sidebar with streaming

### Voice Input

1. Click the **microphone button** 🎤 in the message input
2. Grant microphone permission (first time only)
3. Speak your message clearly
4. The extension auto-stops after 2 seconds of silence
5. Review the transcribed text and press Send

## 🔧 Configuration

### Browser Requirements

#### For Built-in AI (Recommended)
- Chrome 128+ or a compatible Chromium build
- Enable feature flag (if required): `chrome://flags/#prompt-api-for-gemini-nano`
- **Supports**: Chat, summarization, multimodal (images), all features
- **Model**: Gemini Nano (managed by Chrome, no manual download)

#### For WebLLM (Secondary Fallback)
- Modern browsers with WebGPU or WASM support
- Works without browser flags
- **Supports**: Chat, summarization, text-only (no images)
- **Models**: Llama-3.2-1B-Instruct (~1GB download)

#### For Transformers.js (Final Fallback)
- Any modern browser with WebAssembly support
- Broadest compatibility
- **Supports**: Chat, summarization, text-only (no images)
- **Models**: Llama-3.2-1B-Instruct (~1GB download)

### Model Details by Provider

| Provider | Model | Size | Supports Images | Speed |
|----------|-------|------|----------------|-------|
| Built-in AI | Gemini Nano | Managed by Chrome | ✅ Yes | ⚡ Fastest |
| WebLLM | Llama-3.2-1B-Instruct | ~1GB | ❌ No | ⏱️ Moderate |
| Transformers.js | Llama-3.2-1B-Instruct | ~1GB | ❌ No | 🚀 Fast |

## 🏗️ Architecture & Developer Notes

### 📁 Project Structure

```
src/
├── App.tsx
├── background.ts
├── content.ts
├── components/ui/   # UI primitives and Chat components
├── hooks/           # Custom React hooks
└── lib/             # Core logic (transport, storage, summarizers)
```


### 📚 Developer Documentation

- **Complete Architecture Guide**: See [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for comprehensive developer guidance
- [Project Memories](.serena/memories/): The following memory files contain detailed implementation notes:
  - `project_overview` — High-level project purpose, tech stack, and development workflow
  - `ai_provider_architecture` — Triple-provider system, multimodal support, and Chrome Summarizer API
  - `advanced-features` — Chat persistence, image upload, and native summarizer integration
  - `current_implementation_status` — Feature completion status and testing results
  - `transformersjs-chrome-patch` — Custom CSP solution for Transformers.js in Chrome extensions
  - `youtube-video-summarization-feature` — YouTube transcript extraction and summarization
  - `rewrite-feature-complete` — Text rewriting with 8 tone presets
  - `voice-input-feature` — Speech recognition implementation


**Where to look for primary logic:**

- AI provider selection & streaming: `src/lib/client-side-chat-transport.ts`
- Page summarization flow & failover: `src/lib/summarizer-utils.ts`, `src/background.ts`, `src/content.ts`, `src/App.tsx`
- YouTube summarization: `src/lib/youtube-utils.ts`
- Text rewriting/tone presets: `src/lib/rewrite-utils.ts`
- Chat persistence: `src/lib/chat-storage.ts`
- Voice input helper: `src/hooks/use-voice-speech-recognition.ts`
- Model download progress UI: `src/components/ui/download-progress-dialog.tsx`
- Build config & multi-entry setup: `vite.config.ts` (rollupOptions.input and output naming for background/content)
- Manifest and web accessible resources: `public/manifest.json`


## 🎨 Tech Stack

### Frontend & UI
- **React 19** — Modern UI framework with hooks
- **TypeScript** — Type safety and better developer experience
- **Tailwind CSS** — Utility-first styling
- **Vite 7** — Fast build tool with HMR
- **shadcn/ui** — Reusable component library
- **Framer Motion** — Smooth animations

### AI & LLMs
- **Vercel AI SDK** (`ai`, `@ai-sdk/react`) — Streaming API abstraction and `useChat` hook
- **@built-in-ai/core** — Chrome's native Gemini Nano wrapper
- **@built-in-ai/web-llm** — WebLLM integration (Llama 3.2)
- **@built-in-ai/transformers-js** — Transformers.js integration (Llama 3.2)

### Content Processing
- **@mozilla/readability** — Article extraction from web pages
- **@danielxceron/youtube-transcript** — YouTube transcript fetching
- **react-markdown** — Markdown rendering in chat messages
- **highlight.js** — Code syntax highlighting (replaced Shiki for smaller bundle)

### Chrome Extension APIs
- **Manifest V3** — Modern Chrome extension format
- **Side Panel API** — Sidebar UI integration
- **Content Scripts** — Page interaction and content extraction
- **Background Service Worker** — Event handling and message routing
- **chrome.storage.local** — Persistent chat storage
- **Web Speech API** — Voice input (speech-to-text)


## 🔐 Privacy & Security

This project enforces strict privacy-by-design principles:

### ✅ Complete Privacy Guarantees

- **Zero External API Calls**: All AI inference runs locally — no data sent to external servers
- **No Telemetry**: No analytics, tracking, or usage data collection
- **No User Accounts**: No sign-ups, logins, or personal information required
- **Local Storage Only**: All chat data stored in `chrome.storage.local` on your device
- **Image Privacy**: Images are NOT persisted in chat history (intentional privacy choice)
- **Transcript Privacy**: YouTube transcripts processed locally, never sent externally

### 🛡️ Security Features

- **Chrome Extension Sandbox**: Runs in Chrome's secure sandboxed environment
- **Content Security Policy**: Strict CSP enforced in `manifest.json`
- **Web-Accessible Resources**: Only necessary assets exposed
- **No eval()**: All code statically bundled (except WebAssembly for models)
- **HTTPS Only**: Content scripts only run on secure pages

### 🔒 Data Storage

- **What's Stored**: Chat messages, titles, timestamps, user preferences
- **What's NOT Stored**: Images, external page content, personal data
- **Storage Location**: Local device only (`chrome.storage.local`)
- **Storage Limit**: Max 50 chats (auto-prunes oldest)
- **User Control**: Full ability to delete individual chats or clear all data

## 📚 Additional Resources

### Documentation
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)

### AI & ML Libraries
- [Vercel AI SDK](https://github.com/vercel/ai)
- [Built-in AI Documentation](https://github.com/jakobhoeg/built-in-ai)
- [WebLLM Project](https://webllm.mlc.ai/)
- [Transformers.js](https://huggingface.co/docs/transformers.js/)

### Content Processing
- [@mozilla/readability](https://github.com/mozilla/readability)
- [YouTube Transcript API](https://github.com/danielxceron/youtube-transcript)

## 📝 License

MIT License - see LICENSE file for details

---

## 🚀 Roadmap & Future Features

### Currently Under Consideration
- [ ] Message editing and retry
- [ ] Export conversations (JSON, Markdown, PDF)
- [ ] Custom system prompts
- [ ] Search within chat history

---

**Built with ❤️ for privacy-conscious users. Run AI locally. Own your data.**