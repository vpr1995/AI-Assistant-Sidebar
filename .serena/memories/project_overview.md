# Chrome Extension - AI Assistant with Page & Video Summarization

## Project Purpose
A **privacy-first, local AI assistant** as a Chrome sidebar extension with page summarization, text rewriting, and YouTube video summarization features. The extension runs AI models directly in the browser using WebGPU/WebAssembly, providing complete data privacy with zero external API calls.

### Core Features
- **Text Generation**: LLM chat interface with streaming responses
- **Page Summarization**: Right-click context menu to summarize any web page
- **YouTube Video Summarization**: Right-click context menu to summarize YouTube videos (NEW)
- **Text Rewriting**: Right-click to rewrite text in 8 different tones
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
- **@danielxceron/youtube-transcript** - Extracts YouTube video transcripts (NEW)
- **react-markdown** - Renders markdown in messages with syntax highlighting

### Chrome Extension
- **Manifest V3** - Modern extension format
- **Side Panel API** - For the sidebar
- **Content Scripts** - Page content extraction and YouTube transcript extraction
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

### Feature Flows

#### Page Summarization Flow
```
User right-clicks on page → "Summarize this page"
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
App.tsx receives summarizePage message
    ↓
Clears existing messages
    ↓
Shows user message: "Summarize: **Page Title**\n{URL}"
    ↓
Calls transport.streamSummary() with page content
    ↓
AI response streams in with typing animation
```

#### YouTube Video Summarization Flow (NEW)
```
User opens YouTube video → Right-clicks → "Summarize this video"
    ↓
Background service worker receives context menu click
    ↓
Sends message to content script
    ↓
Content script extracts video ID and fetches transcript
    ↓
Uses @danielxceron/youtube-transcript library
    ↓
Extracts video metadata (title, channel, URL)
    ↓
Sends transcript data back to background
    ↓
Background broadcasts to sidebar
    ↓
App.tsx receives summarizeYouTubeVideo message
    ↓
Clears existing messages
    ↓
Shows user message: "YouTube Video Summary: **{title}**\n{url}\nChannel: {channel}"
    ↓
Calls transport.streamSummary() with transcript content
    ↓
AI response streams in with typing animation
```

#### Text Rewriting Flow
```
User selects text anywhere → Right-click → "Rewrite text" → Select tone
    ↓
Background service worker receives context menu click
    ↓
Sends rewriteText message to sidebar with tone
    ↓
App.tsx receives rewriteText message
    ↓
Clears existing messages
    ↓
Shows user message: "Rewrite: **{Tone}**\n{originalText}"
    ↓
Gets tone-specific prompt from rewrite-utils
    ↓
Calls transport.streamSummary() with prompt
    ↓
AI response streams in with typing animation
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
├── App.tsx                 # Main sidebar, chat logic, all message handlers
├── background.ts           # Service worker, all context menus, message routing
├── content.ts              # Content script for page extraction + YouTube transcripts
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
    ├── client-side-chat-transport.ts  # Custom transport with streaming
    ├── summarizer-utils.ts            # Chrome Summarizer API + LLM fallback
    ├── rewrite-utils.ts               # Rewrite tones and prompts
    ├── youtube-utils.ts               # YouTube utilities (NEW)
    ├── audio-utils.ts
    └── utils.ts
```

## Key Implementation Details

### Page Summarization
1. **Content Extraction**: Uses `@mozilla/readability` for clean article extraction
2. **User Message**: Shows title (bold) and URL (white text for visibility)
3. **Chat Reset**: Clears chat on each new summarization for fresh context
4. **Streaming**: AI response streams with typing animation
5. **Privacy**: Page content not shown in messages, only sent to AI

### YouTube Video Summarization (NEW)
1. **Transcript Extraction**: Uses `@danielxceron/youtube-transcript` with dual-fallback
   - Primary: HTML scraping from page
   - Fallback: YouTube InnerTube API
2. **Video Metadata**: Extracts title, channel name, video ID, URL
3. **URL Support**: youtube.com/watch, youtu.be, shorts, embeds all supported
4. **User Message**: Shows "YouTube Video Summary: **{title}**\n{url}\nChannel: {channel}"
5. **Transcript Truncation**: Limits to 15,000 characters for summarization
6. **Error Handling**: Graceful handling for age-gated or transcriptless videos

### Text Rewriting
1. **Tone Selection**: 8 different tones (Concise, Professional, Casual, Formal, Engaging, Simplified, Technical, Creative)
2. **Tone-Specific Prompts**: Each tone has unique, optimized prompt
3. **User Message**: Shows "Rewrite: **{Tone}**\n{originalText}"
4. **Chain Rewrites**: Users can rewrite the rewritten text again
5. **Streaming**: Uses same transport as summarization

### Transport Layer Enhancements
- `sendMessages()` - Standard chat message handling
- `summarizeText()` - Direct text summary (returns full text)
- `streamSummary()` - Streaming summary with callback (for typing animation)

## Configuration

### TypeScript
- `tsconfig.json` - Main TypeScript config
- `tsconfig.app.json` - React app config with strict mode enabled
- `tsconfig.node.json` - Node.js scripts config

### Vite Build
- Input files: `index.html`, `src/background.ts`, `src/content.ts`
- Output: `dist/` with separate `background.js` and `content.js`
- CSS pipeline: Tailwind + PostCSS
- 2673 modules compiled

### Chrome Manifest
- Version: 3 (Manifest V3)
- Permissions: `storage`, `sidePanel`, `contextMenus`, `activeTab`, `scripting`
- Content scripts: Run on `<all_urls>` + YouTube domains at `document_idle`
- Host permissions: YouTube domains
- CSP: Allows WASM (`wasm-unsafe-eval`)

## Development Workflow

1. **Development**:
   ```bash
   npm run dev    # Vite dev server
   ```

2. **Build**:
   ```bash
   npm run build  # Production build (9.61s)
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

### YouTube Transcripts
- Works on any YouTube video with captions/transcripts available
- Supports multiple YouTube URL formats
- Fallback extraction if primary method fails

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
- Examples: `feat(youtube): add video summarization`, `fix(ui): fix link colors`

## Current Status

### ✅ Completed Features
1. **Foundation & Setup** - Project initialized with all dependencies
2. **Chat Interface** - Full UI with message display and input
3. **AI Integration** - Dual-provider system with streaming
4. **Page Summarization** - Right-click → summarize flow complete
5. **Content Extraction** - Using @mozilla/readability
6. **Text Rewriting** - 8 tones with streaming
7. **YouTube Video Summarization** - Transcript extraction + AI summary (NEW)
8. **Streaming Responses** - Character-by-character with animation
9. **Link Styling** - URLs visible in white/bright colors
10. **Chat Management** - Auto-clear on new summarization/rewrite/video summary

### 📦 Build Status
- ✅ Vite build configured for multiple entry points
- ✅ CSS and JS bundled correctly
- ✅ Content script and background script separate
- ✅ YouTube-transcript library integrated
- ✅ Total bundle size: ~6.5MB (includes AI models)
- ✅ Build time: 9.61 seconds
- ✅ Zero TypeScript errors

### 🎯 Next Steps (Future)
- Voice input (speech-to-text with Whisper)
- Image generation capabilities
- Chat history persistence
- Model cache management UI
- Settings panel for AI parameters
- YouTube playlist summarization
- Video chapter extraction
- Export summaries to markdown/PDF
