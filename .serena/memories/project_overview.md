# Chrome Extension - AI Assistant with Page Summarization

## Project Purpose
A **privacy-first, local AI assistant** as a Chrome sidebar extension with added page summarization feature. The extension runs AI models directly in the browser using WebGPU/WebAssembly, providing complete data privacy with zero external API calls.

### Core Features
- **Text Generation**: LLM chat interface with streaming responses
- **Page Summarization**: Right-click context menu to summarize any web page
- **Complete Privacy**: 100% local processing, no external API calls
- **Offline Functionality**: Models cached locally after first use
- **Streaming UI**: Character-by-character responses with typing animation

## Tech Stack

### Core Framework
- **React 19** - Modern functional components with hooks
- **Vite 7** - Fast build tool with HMR
- **TypeScript** - Strict type checking enabled

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - React component library
- **Framer Motion** - Smooth animations

### AI Runtime
- **Vercel AI SDK (`ai`)** - Standardized AI streaming APIs
- **@ai-sdk/react** - useChat hook for client-side AI
- **@built-in-ai/core** - Chrome's built-in Gemini Nano/Phi Mini (PRIMARY)
- **@built-in-ai/web-llm** - WebLLM with model selection (FALLBACK)
- **WebGPU** - Hardware acceleration (with WASM fallback)

### Content Processing
- **@mozilla/readability** - Extracts main article content from any webpage
- **react-markdown** - Renders markdown in messages with syntax highlighting

### Chrome Extension
- **Manifest V3** - Modern extension format
- **Side Panel API** - For the sidebar
- **Content Scripts** - Page content extraction
- **Background Service Worker** - Context menu and message routing

## Architecture

### Dual-Provider AI System
1. **Primary**: Chrome Built-in AI (`@built-in-ai/core`)
   - Uses native Gemini Nano (Chrome) or Phi Mini (Edge)
   - Zero model download after first use (Chrome manages caching)
   - Fastest inference, hardware-optimized

2. **Fallback**: WebLLM (`@built-in-ai/web-llm`)
   - Used when Built-in AI unavailable
   - Manual model selection from multiple options
   - User manages cache

### Page Summarization Flow
```
User right-clicks on page
    ↓
Background service worker receives context menu click
    ↓
Sends message to content script
    ↓
Content script extracts page content using @mozilla/readability
    ↓
Sends extracted data back to background
    ↓
Background broadcasts to sidebar
    ↓
App.tsx receives summarization request
    ↓
Clears existing messages
    ↓
Shows user message: "Summarize: **Page Title**\n{URL}"
    ↓
Calls transport.streamSummary() with page content
    ↓
AI response streams in with typing animation
    ↓
User can continue chatting about summary
```

### Data Flow
```
User Input → useChat Hook → ClientSideChatTransport 
    ↓
AI Provider (Built-in AI or WebLLM)
    ↓
Streaming Response
    ↓
UI Updates in Real-Time
```

## File Structure

```
src/
├── App.tsx                 # Main sidebar container, chat logic, summarization handler
├── background.ts           # Background service worker, context menu, message routing
├── content.ts              # Content script for page content extraction
├── main.tsx                # React entry point
├── components/
│   └── ui/                 # shadcn/ui components
│       ├── chat.tsx
│       ├── chat-message.tsx
│       ├── message-list.tsx
│       ├── message-input.tsx
│       ├── markdown-renderer.tsx
│       ├── typing-indicator.tsx
│       └── ... other components
├── hooks/                  # Custom React hooks
│   ├── use-auto-scroll.ts
│   ├── use-autosize-textarea.ts
│   ├── use-audio-recording.ts
│   └── use-provider-context.tsx
└── lib/                    # Utility libraries
    ├── client-side-chat-transport.ts  # Custom transport with streamSummary()
    ├── audio-utils.ts
    └── utils.ts
```

## Key Implementation Details

### Summarization Feature
1. **Content Extraction**: Uses `@mozilla/readability` for clean article extraction
2. **User Message**: Shows title (bold) and URL (white text for visibility)
3. **Chat Reset**: Clears chat on each new summarization for fresh context
4. **Streaming**: AI response streams with typing animation
5. **Privacy**: Page content not shown in messages, only sent to AI

### Transport Layer Enhancements
- `sendMessages()` - Standard chat message handling
- `summarizeText()` - Direct text summary (returns full text)
- `streamSummary()` - Streaming summary with callback (for typing animation)

### Message Format
- User message: Shows page title (markdown bold) and URL
- AI response: Streams character-by-character with animation
- No raw page content visible in chat interface

## Configuration

### TypeScript
- `tsconfig.json` - Main TypeScript config
- `tsconfig.app.json` - React app config with strict mode enabled
- `tsconfig.node.json` - Node.js scripts config

### Vite Build
- Input files: `index.html`, `src/background.ts`, `src/content.ts`
- Output: `dist/` with separate `background.js` and `content.js`
- CSS pipeline: Tailwind + PostCSS

### Chrome Manifest
- Version: 3 (Manifest V3)
- Permissions: `storage`, `sidePanel`, `contextMenus`, `activeTab`, `scripting`
- Content scripts: Run on `<all_urls>` at `document_idle`
- CSP: Allows WASM (`wasm-unsafe-eval`)

## Development Workflow

1. **Development**:
   ```bash
   npm run dev    # Vite dev server
   ```

2. **Build**:
   ```bash
   npm run build  # Production build
   ```

3. **Preview**:
   ```bash
   npm run preview  # Preview built app
   ```

4. **Linting**:
   ```bash
   npm run lint   # ESLint check
   ```

5. **Testing in Chrome**:
   - Run `npm run build`
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `dist/` folder
   - To reload: Click reload icon on extension card

## Browser Requirements

### Built-in AI Support
- Chrome 128+ or Edge Dev 138.0.3309.2+
- Enable flag: `chrome://flags/#prompt-api-for-gemini-nano` (Chrome)
- Enable flag: `edge://flags/#prompt-api-for-phi-mini` (Edge)

### WebLLM Fallback
- Any browser with WebGPU or WASM support
- Works offline with manual model management

## Code Style & Conventions

### Components
- Functional components with hooks
- Use function declarations, not arrow functions for top-level components
- Always use explicit types for props and parameters

### Styling
- Tailwind CSS for all styles
- `cn()` utility for conditional classes
- Dark mode supported via CSS variables

### File Naming
- Components: `kebab-case.tsx`
- Hooks: `use-kebab-case.ts`
- Utilities: `kebab-case.ts`

### Commits
- Conventional commit format: `feat(feature): description`
- Examples: `feat(summarize): add page summarization`, `fix(ui): fix link colors`

## Current Status

### ✅ Completed Features
1. **Foundation & Setup** - Project initialized with all dependencies
2. **Chat Interface** - Full UI with message display and input
3. **AI Integration** - Dual-provider system with streaming
4. **Page Summarization** - Right-click → summarize flow complete
5. **Content Extraction** - Using @mozilla/readability
6. **Streaming Responses** - Character-by-character with animation
7. **Link Styling** - URLs visible in white/bright colors
8. **Chat Management** - Auto-clear on new summarization

### 📦 Build Status
- ✅ Vite build configured for multiple entry points
- ✅ CSS and JS bundled correctly
- ✅ Content script and background script separate
- ✅ Total bundle size: ~6.4MB (includes AI models)

### 🎯 Next Steps (Future)
- Voice input (speech-to-text with Whisper)
- Image generation capabilities
- Chat history persistence
- Model cache management UI
- Settings panel for AI parameters
