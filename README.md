# AI Assistant Chrome Extension with Page Summarization

> **Privacy-first, local AI assistant** as a Chrome sidebar extension with intelligent page summarization capabilities. Run AI models directly in your browser with zero external API calls.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Chrome](https://img.shields.io/badge/Chrome-128%2B-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Features

### Core Capabilities
- **💬 Chat Interface**: Smooth streaming responses with typing animation
- **📄 Page Summarization**: Right-click any web page to get an instant AI summary
- **🔐 100% Private**: All processing happens locally in your browser
- **⚡ Fast**: Optimized streaming with real-time response rendering
- **🌐 Offline**: Works completely offline after first model load
- **🤖 Dual AI Providers**: 
  - **Built-in AI** (Gemini Nano/Phi Mini) - Fastest, managed by Chrome
  - **WebLLM** (Llama 3.2, SmolLM2, Qwen2.5) - Fallback, fully customizable

## 📦 What's Inside

```
Chrome Extension Architecture:
├── Sidebar UI          (React 19 + Tailwind CSS)
├── Built-in AI         (Chrome's native Gemini Nano)
├── WebLLM Fallback     (LLama 3.2, SmolLM2, Qwen2.5 with optional GPU)
├── Content Script      (@mozilla/readability for page extraction)
├── Background Worker   (Context menu & message routing)
└── Zero External APIs  (Complete privacy)
```

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

For live development with hot reload:

```bash
npm run dev
```

Then manually reload the extension in `chrome://extensions/` after making changes.

## 💻 Usage

### Chat with AI

1. Click the extension icon (or use sidebar)
2. Type your question in the input field
3. Press Enter or click Send
4. Watch the AI response stream character-by-character

### Summarize Any Web Page

1. Navigate to any article, blog post, or news page
2. **Right-click anywhere on the page**
3. Select **"Summarize this page"** from context menu
4. The sidebar opens automatically with:
   - **User message**: Page title + URL
   - **AI response**: Intelligent summary of the page content
5. Continue chatting about the summary!

### Features

- **Auto-scrolling**: Chat automatically scrolls as new messages arrive
- **Markdown rendering**: AI responses with code highlighting
- **Copy messages**: Click the copy button on any message
- **Typing animation**: Visual feedback while AI generates
- **Provider switching**: Toggle between Built-in AI and WebLLM (WebLLM only)

## 🔧 Configuration

### Browser Requirements

#### For Built-in AI (Recommended)
- Chrome 128+ or Edge Dev 138.0.3309.2+
- Enable feature flag:
  - **Chrome**: `chrome://flags/#prompt-api-for-gemini-nano`
  - **Edge**: `edge://flags/#prompt-api-for-phi-mini`

#### For WebLLM Fallback
- Any modern browser with WebGPU or WASM support
- Works without enabling any flags
- All models downloaded locally (~360MB - 1GB)

### Model Selection

**Default**: `Llama-3.2-1B-Instruct-q4f16_1-MLC` (Best balance)

Other available models (WebLLM):
- `SmolLM2-360M-Instruct` (360MB, fastest)
- `SmolLM2-135M-Instruct` (135MB, smallest)
- `Qwen2.5-0.5B-Instruct` (500MB)

## 🏗️ Architecture

### Dual-Provider System

```
User Input
    ↓
┌─────────────────────────────────────────────┐
│         Auto-Detection & Selection          │
└─────────────────────────────────────────────┘
         ↓                          ↓
    Built-in AI              WebLLM (Fallback)
    (Gemini Nano)        (LLama 3.2, SmolLM2, Qwen2.5)
         ↓                          ↓
    Streaming Response (same interface)
         ↓
    UI Updates in Real-time
         ↓
    Character-by-character animation
```

### Page Summarization Flow

```
1. User right-clicks on page
    ↓
2. Background service worker creates context menu
    ↓
3. Content script extracts article using @mozilla/readability
    ↓
4. Sidebar receives page data
    ↓
5. Chat clears for fresh context
    ↓
6. Shows: "Summarize: **Page Title**\n{URL}"
    ↓
7. AI provider receives full page content
    ↓
8. Streams summary with typing animation
    ↓
9. User can continue conversation about summary
```

## 📁 Project Structure

```
src/
├── App.tsx                      # Main app + summarization handler
├── background.ts                # Context menu & message routing
├── content.ts                   # Page content extraction
├── components/ui/
│   ├── chat.tsx                # Chat container
│   ├── chat-message.tsx        # Message display
│   ├── message-list.tsx        # Scrollable messages
│   ├── message-input.tsx       # Input field
│   └── markdown-renderer.tsx   # Markdown rendering
├── hooks/
│   ├── use-auto-scroll.ts      # Auto-scroll on new messages
│   ├── use-autosize-textarea.ts # Dynamic textarea height
│   └── use-copy-to-clipboard.ts # Copy functionality
└── lib/
    ├── client-side-chat-transport.ts  # AI streaming transport
    └── utils.ts                       # Utilities
```

## 🎨 Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool & dev server
- **shadcn/ui** - Component library
- **Framer Motion** - Animations

### AI & LLM
- **Vercel AI SDK** - Streaming API abstraction
- **@built-in-ai/core** - Chrome's native Gemini Nano
- **@built-in-ai/web-llm** - WebLLM with Llama 3.2, SmolLM2, Qwen2.5

### Content Processing
- **@mozilla/readability** - Article extraction
- **react-markdown** - Markdown rendering
- **highlight.js** - Code syntax highlighting

### Extension APIs
- **Chrome Extensions Manifest V3**
- **Side Panel API** - Sidebar UI
- **Content Scripts** - Page interaction
- **Background Service Worker** - Event handling

## 🛠️ Development

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Production build
npm run build

# Lint code
npm run lint
```

## 🔐 Privacy & Security

✅ **Zero Data Collection**
- No external API calls
- No telemetry
- No data storage on servers
- No user tracking

✅ **Complete Local Processing**
- All AI models run in your browser
- Page content never leaves your device
- No network requests except for optional model downloads

✅ **Open Source**
- Full transparency
- Community auditable
- No closed-source dependencies


## 📚 Additional Resources

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [Vercel AI SDK](https://github.com/vercel/ai)
- [@mozilla/readability](https://github.com/mozilla/readability)
- [WebLLM Documentation](https://webllm.mlc.ai/docs/)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit changes (`git commit -m 'feat(feature): add amazing feature'`)
4. Push to branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

### Planned Features
- [ ] Voice input (speech-to-text)
- [ ] Image generation
- [ ] Chat history persistence
- [ ] Settings panel
- [ ] Multiple language support
- [ ] Custom model selection UI
- [ ] Export conversations

### Possible Enhancements
- [ ] Mobile companion app
- [ ] Firefox extension version
- [ ] API for external apps
- [ ] Plugin system for custom models

---

**Built with ❤️ for privacy-conscious users. Run AI locally. Own your data.**

Last Updated: October 2025
