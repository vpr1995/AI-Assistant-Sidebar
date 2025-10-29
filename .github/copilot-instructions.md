# Chrome Extension: Local AI Assistant - AI Agent Instructions

## 🎯 Project Overview

**Privacy-first Chrome sidebar extension** running LLM inference **entirely in-browser** (zero API calls). Triple-provider AI architecture with automatic fallback: Chrome Built-in AI (Gemini Nano) → WebLLM (Llama 3.2) → Transformers.js (Hugging Face). Production-ready with advanced features: multi-chat persistence, multimodal vision, voice input, YouTube/page summarization, and text rewriting.

**Tech Stack**: React 19 + Vite 7 + TypeScript + Tailwind CSS + shadcn/ui + Vercel AI SDK + @built-in-ai/core + @built-in-ai/web-llm + @built-in-ai/transformers-js + @mozilla/readability

---

## 🏗️ Critical Architecture Patterns

### 1. Triple-Provider AI System (`src/lib/client-side-chat-transport.ts`)

The core innovation is `ClientSideChatTransport` implementing Vercel AI SDK's `ChatTransport` interface for browser-based inference with automatic fallback:

```typescript
// Provider detection priority: Built-in AI → WebLLM → Transformers.js
async detectAvailableProvider(): 'built-in-ai' | 'web-llm' | 'transformers-js'
  ├─ doesBrowserSupportBuiltInAI() → builtInAI().availability()
  ├─ Falls back to webLLM('Llama-3.2-1B-Instruct-q4f16_1-MLC')
  └─ Final fallback: transformersJS('Llama-3.2-1B')

// sendMessages() handles streaming with download progress:
sendMessages() → createUIMessageStream() → writer.merge(result.toUIMessageStream())

// Summarization methods:
summarizeText() → Full text response (non-streaming)
streamSummary() → Streaming with callback for real-time UI updates

// Progress tracking:
onDownloadProgress() → Callback for download/extraction progress updates

// Multimodal support (Built-in AI only):
Extracts imageAttachment from request body → Converts to multimodal message format
```

**Key implementation details**:
- **Model caching**: `cachedWebLLMModel` and `cachedTransformersModel` prevent re-initialization
- **Progress callback format**: `{ status: 'downloading'|'extracting'|'complete', progress: 0-100, message: string }`
- **Multimodal handling**: Only Built-in AI supports image input; extracts `imageAttachment` from body
- **Provider switching**: `setPreferredProvider()` allows user override

**Provider Capabilities Matrix**:
| Feature | Built-in AI | WebLLM | Transformers.js |
|---------|-------------|--------|-----------------|
| Chat | ✅ | ✅ | ✅ |
| Streaming | ✅ | ✅ | ✅ |
| Multimodal (Images) | ✅ | ❌ | ❌ |
| Download Required | ✅ | ✅ | ✅ |

**When modifying AI integration**:
- All AI calls MUST go through `ClientSideChatTransport`
- Use `writer.merge()` to combine download progress and text streams
- Only enable image upload when `activeProvider === 'built-in-ai'`
- Use `streamSummary()` for page/YouTube/rewrite features

### 1b. Screen Capture Feature (`src/lib/screen-capture-utils.ts`)

Privacy-first screen analysis using Chrome Desktop Capture API with local AI inference. Complete implementation with tab/window/screen picker, frame extraction, and multimodal integration.

```typescript
// Desktop Capture API integration
async captureScreenWithPicker(options): Promise<CaptureResult>
  ├─ chrome.desktopCapture.chooseDesktopMedia(['tab', 'window', 'screen']) → User picker
  ├─ navigator.mediaDevices.getUserMedia(constraints) → MediaStream
  │  └─ CRITICAL: chromeMediaSource MUST always be 'desktop' (even for tab captures)
  ├─ Canvas API to extract frame → Base64 PNG image
  └─ Returns: { imageData, width, height, mimeType }

// Complete User Flow:
Capture → Preview Dialog → Confirm → Attach as Image → Stream to Built-in AI
// All processing local - zero cloud uploads
```

### 2. Chrome Extension Message Flow & Multi-Feature Architecture

**Critical**: `content.ts` runs in page context, `background.ts` in service worker, `App.tsx` in sidebar. Use `chrome.runtime.sendMessage()` for cross-context communication.

**Page Summarization Flow**:
```
Right-click → background.ts → content.ts (@mozilla/readability) 
→ App.tsx (summarizeWithFallback: Chrome Summarizer API → LLM fallback)
```

**YouTube Summarization Flow**:
```
Right-click on YouTube → content.ts (@danielxceron/youtube-transcript)
→ App.tsx → AI streams summary
```

**Text Rewriting Flow**:
```
Select text → Right-click → Choose tone (8 options)
→ background.ts → App.tsx → AI streams rewritten text
```

**Voice Input Flow**:
```
Mic button → Permission (iframe-based) → getUserMedia() 
→ Web Speech API (continuous=true, interimResults=true)
→ Auto-stops after 2s silence → Transcript to input
```

### 3. Multi-Chat Persistence & State Management

**Architecture** (`src/lib/chat-storage.ts` + `chrome.storage.local`):
- Max 50 chats (auto-prunes oldest)
- Auto-save via `use-chat-persistence` hook
- Images NOT persisted (privacy)
- All operations through `chat-storage.ts` functions

```typescript
interface Chat {
  id: string                // nanoid()
  title: string            // User-editable
  messages: ChatMessage[]  // Full history
  preview: string          // First 100 chars
  updatedAt: number        // For sorting
}
```

**When modifying**:
- Never mutate chat state directly - use `chat-helpers.ts` functions
- Images excluded from persistence (multimodal privacy)
- Enforce 50 chat limit to prevent storage bloat

### 4. Model Download Progress & User Feedback UI

Progress dialog (`src/components/ui/download-progress-dialog.tsx`):
- Animated spinner + progress bar
- Auto-dismisses 1s after 100% complete
- Callback format: `{ status: 'downloading'|'extracting'|'complete', progress: 0-100, message: string }`

**When modifying**:
- Don't manually hide progress dialog before 1s auto-dismiss
- Progress updates emitted by transport, not parsed from messages

### 5. Multi-Entry Build System

Extension requires **multi-entry builds** with custom Vite config:

```typescript
// vite.config.ts
rollupOptions: {
  input: {
    main: './index.html',        // Sidebar UI (React app)
    background: 'src/background.ts', // Service worker
    content: 'src/content.ts',       // Content script
  },
  output: {
    entryFileNames: (chunkInfo) => {
      if (chunkInfo.name === 'background') return 'background.js'
      if (chunkInfo.name === 'content') return 'content.js'
      return 'assets/[name]-[hash].js'
    }
  }
}

// Custom plugin: copyTransformersAssetsPlugin()
// Copies ONNX runtime files to dist/transformers/ for Transformers.js
```

**Transformers.js Chrome Extension Patch**:
- **Vite plugin**: Copies `.wasm` and `.mjs` files from `node_modules` to `dist/transformers/`
- **Worker config**: `src/transformers-worker.ts` sets `env.localModelPath = chrome.runtime.getURL('transformers/')`
- **Manifest**: Exposes `transformers/*.wasm` and `transformers/*.mjs` as `web_accessible_resources`

**Critical**: Don't modify Transformers.js initialization without understanding this patch. Model files MUST be in `dist/transformers/` and web-accessible.

**When adding new scripts**: Add to `input` object and ensure proper output naming to match `manifest.json`.

---

## 🔧 Developer Workflows

### Extension Testing Loop
```bash
npm run build           # Build to dist/
# Load dist/ in chrome://extensions/ (Developer mode → Load unpacked)
# Make changes → npm run build → Click reload icon in chrome://extensions/
```

**Dev mode caveat**: `npm run dev` runs Vite dev server but Chrome extension APIs (`chrome.runtime`, `chrome.storage`) are unavailable. Must test built extension for full functionality.

### Debugging
- **Sidebar UI**: Right-click sidebar → Inspect (opens DevTools)
- **Background script**: chrome://extensions/ → Details → Inspect service worker
- **Content script**: Page DevTools → check Console for `[Content Script] Loaded`

---

## 📐 Code Conventions

### Component Structure
```tsx
// Use function declarations (not arrow functions) for components
function ComponentName({ prop }: Props) {
  // Hooks at top
  const [state, setState] = useState()
  const { data } = useCustomHook()
  
  // Event handlers
  const handleEvent = () => { }
  
  // Render
  return <div className={cn('base-class', conditional && 'conditional-class')}>
}
```

### Type Safety
- All props/state/parameters **must** have explicit types
- Use `interface` for object shapes: `interface Message { id: string; role: 'user' | 'assistant'; content: string }`
- Chrome API types from `@types/chrome`: `chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { })`

### File Naming
- Components: `kebab-case.tsx` (e.g., `chat-message.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-auto-scroll.ts`)
- Utils: `kebab-case.ts` (e.g., `client-side-chat-transport.ts`)

### Styling
- Use Tailwind utility classes: `className="flex flex-col h-screen overflow-hidden"`
- Conditional classes via `cn()`: `cn('base', isActive && 'active-class')`
- Avoid inline styles - use Tailwind or CSS modules

---

## 🔒 Security & Privacy Constraints

1. **Zero external APIs**: All inference runs locally. No `fetch()` to external LLM APIs allowed.
2. **CSP in manifest.json**: `'wasm-unsafe-eval'` required for WebAssembly models. Only allow Hugging Face CDN for model downloads.
3. **Content script isolation**: `@mozilla/readability` must clone DOM (`document.cloneNode(true)`) to avoid modifying page.

---

## 🚨 Common Pitfalls

### 1. React Strict Mode Double Rendering
Use `useMemo` for singleton instances:
```tsx
const transport = useMemo(() => new ClientSideChatTransport('auto'), [])
```

### 2. Chrome API Availability in Dev
Guard with checks since `chrome.runtime` is `undefined` in Vite dev server:
```tsx
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener(...)
}
```

### 3. Provider Detection Race Conditions
Show loading state until `isClient` true and `activeProvider` detected.

---

## 6. Memory System & Semantic Search (`src/lib/memory-*`, `src/lib/db.ts`)

**Architecture**: PGlite (SQLite fork) + pgvector for semantic search with automatic schema migrations.

```typescript
// Dual storage strategy:
// - PGlite database: Semantic memories with 384-dim embeddings
// - chrome.storage.local: Fast bookmark KV storage (500 item limit)

// Memory schema (auto-migrated via V1 + V2):
interface Memory {
  id: string                    // UUID
  content: string              // Full text content
  embedding: number[]          // 384-dimensional vector (gte-small)
  source: 'page' | 'summary' | 'manual'
  sourceUrl?: string           // Page URL if available
  savedAt: number              // Timestamp
  tags?: string[]              // User-added tags
}

// Search pipeline (memory-search.ts):
async search(query: string, limit = 10)
  ├─ Embed query using Supabase/gte-small
  ├─ Vector similarity search: pgvector `<->` operator (cosine distance)
  └─ Hybrid: Combine semantic + keyword (ts_rank) results

// Bookmark schema (lightweight KV):
interface Bookmark {
  id: string                    // UUID
  url: string                   // Page URL
  title: string                // Page title
  excerpt?: string             // Text snippet
  savedAt: number              // Timestamp
}

// Embedding generation (embeddings.ts):
async generateEmbedding(text: string): Promise<number[]>
  ├─ Use Supabase API (requires environment setup)
  ├─ Fallback: Simple TF-IDF approximation if API unavailable
  └─ Cache vectors to prevent re-computation
```

**When modifying memory**:
- All memory operations go through `memory-storage.ts` (not direct DB access)
- Run `initializeDatabase()` on app startup to handle migrations idempotently
- Search results contain `similarity_score` for ranking
- Don't persist images in memory (privacy) - only text content
- Use `toast.loading()` + `toast.success()` pattern for user feedback

**Key functions**:
- `memory-storage.ts`: `saveMemory()`, `deleteMemory()`, `getMemories()`
- `memory-search.ts`: `searchMemories(query)` → hybrid results
- `bookmark-storage.ts`: `saveBookmark()`, `deleteBookmark()`, `getBookmarks()`
- `embeddings.ts`: `generateEmbedding(text)` → 384-dim vector
- `db.ts`: Database initialization, migration orchestration

### 7. Bookmarks System & Quick Access (`src/lib/bookmark-storage.ts`, `src/hooks/use-bookmarks.ts`)

**Design**: Lightweight KV storage in `chrome.storage.local` for instant access without DB overhead.

```typescript
// Bookmark operations:
saveBookmark(url, title, excerpt) → UUID + toast notification
deleteBookmark(id) → Toast feedback
convertToMemory(bookmarkId) → Moves to PGlite with embedding + semantic indexing

// UI Integration:
- Message-level bookmark button (msg-options menu)
- Bookmark count badge in header
- Bookmarks panel showing 10 most recent
- Export as CSV for data portability
- Bulk delete with confirmation
```

**When modifying bookmarks**:
- Don't exceed 500 bookmarks (chrome.storage.local hard limit)
- Bookmark→Memory conversion: Extract text, generate embedding, save to PGlite
- Always show toast feedback for save/delete operations
- Sort by `savedAt` descending (newest first)

### 8. Integration Points with AI Features

**Page Summarization → Save to Memory**:
```typescript
// Flow in src/background.ts + src/App.tsx:
Right-click page → Summarize
  → Chrome Summarizer API (or LLM fallback)
  → Show summary in toast (with save option)
  → User clicks save
  → Call saveMemory(summary) → Embedding generated → Indexed
  → Toast: "Saved to memories"
```

**Chat Message → Bookmark/Memory**:
```typescript
// In chat-message.tsx message options:
User right-clicks AI response
  → Options: Bookmark | Add to Memory | Copy
  → Bookmark: Fast save to KV store (chrome.storage.local)
  → Add to Memory: Full save with embedding (PGlite)
```

**Search Memory During Chat**:
```typescript
// Planned tool integration:
Memory tool enables: /search <query>
  → Query executed in PGlite
  → Top-5 results injected as system context
  → AI responds using memory context
  → Enables knowledge-aware conversations
```

---

## 📦 Key Dependencies

- **`@ai-sdk/react`**: Provides `useChat` hook - handles message state, streaming, error handling
- **`@built-in-ai/core`**: Chrome's native Gemini Nano API wrapper https://github.com/jakobhoeg/built-in-ai/blob/main/packages/built-in-ai/README.md
- **`@built-in-ai/web-llm`**: WebLLM wrapper (Llama 3.2) https://github.com/jakobhoeg/built-in-ai/blob/main/packages/web-llm/README.md
- **`@built-in-ai/transformers-js`**: Transformers.js wrapper (Llama 3.2) https://github.com/jakobhoeg/built-in-ai/blob/main/packages/transformers-js/README.md
- **`@mozilla/readability`**: Extracts main article content from web pages
- **`@danielxceron/youtube-transcript`**: Fetches YouTube video transcripts
- **`highlight.js`**: Code syntax highlighting (replaced Shiki to reduce bundle by 330 modules)
- **`react-markdown`**: Markdown rendering in chat messages
- **`Chrome Summarizer API`**: Native browser API for optimized page summaries (built into Chrome 128+)
- **`@electric-sql/pglite`**: SQLite fork with pgvector extension for semantic search
- **`pgvector`**: PostgreSQL vector type for embeddings (runs in SQLite via PGlite)
- **`sonner`**: Toast notification library for user feedback (loading, success, error states)
- **`@supabase/gte-small-js`**: 384-dimensional embedding model for semantic search

---

## 🔍 Where to Find Key Logic

- **AI provider selection**: `src/lib/client-side-chat-transport.ts` → `detectAvailableProvider()`
- **Message streaming**: `src/lib/client-side-chat-transport.ts` → `sendMessages()` → `createUIMessageStream()`
- **Page summarization**: `src/background.ts` + `src/content.ts` + `src/App.tsx` (`chrome.runtime.onMessage`)
- **Summarizer API**: `src/lib/summarizer-utils.ts` → `summarizeWithFallback()` with Chrome Summarizer + LLM fallback
- **YouTube summarization**: `src/lib/youtube-utils.ts` → Transcript extraction and formatting
- **Text rewriting**: `src/lib/rewrite-utils.ts` → 8 tone presets with specific prompts
- **Voice input**: `src/hooks/use-voice-speech-recognition.ts` → Web Speech API wrapper
- **Screen capture**: `src/lib/screen-capture-utils.ts` → Desktop Capture API + frame extraction → `src/hooks/use-screen-capture.ts` hook → `src/App.tsx` integration
- **Chat persistence**: `src/lib/chat-storage.ts` → CRUD operations with chrome.storage.local
- **Multimodal input**: `src/lib/image-utils.ts` → Image to base64 conversion
- **Memory system**: `src/lib/db.ts` → PGlite initialization + migrations
  - `src/lib/memory-storage.ts` → Save/delete/retrieve memories with embeddings
  - `src/lib/memory-search.ts` → Semantic + keyword hybrid search
  - `src/hooks/use-memories.ts` → React hook for memory state management
  - `src/components/ui/memory-panel.tsx` → Memory UI with search interface
- **Bookmarks system**: `src/lib/bookmark-storage.ts` → KV operations with chrome.storage.local
  - `src/hooks/use-bookmarks.ts` → React hook for bookmark state
  - `src/components/ui/bookmarks-panel.tsx` → Bookmark list UI
  - `src/components/ui/bookmark-button.tsx` → Message-level bookmark action
- **Embeddings**: `src/lib/embeddings.ts` → Vector generation using Supabase/gte-small
- **Build config**: `vite.config.ts` → `rollupOptions.input` for multi-entry builds
- **Extension manifest**: `public/manifest.json` → permissions (including `desktopCapture`), CSP, content scripts

---

## 🎨 UI Component Guidelines

Components follow **shadcn/ui** patterns. When adding new UI:
1. Check if shadcn component exists: `npx shadcn@latest add <component>`
2. Use `components/ui/` for base components
3. Compose in parent components (e.g., `Chat` composes `ChatMessage`, `MessageInput`)
4. Leverage `framer-motion` for animations (e.g., typing indicator bouncing dots)

---

## 🛠️ Making Changes

### Adding New AI Provider
1. Create provider check function in `client-side-chat-transport.ts`
2. Add to `detectAvailableProvider()` logic with proper priority order
3. Implement `handle{Provider}()` method with progress tracking
4. Update `PROVIDER_CONFIGS` with model name and capabilities
5. Update UI to show provider status in `App.tsx`

### Adding New Chrome Extension Feature
1. Add permission to `public/manifest.json`
2. Implement logic in `src/background.ts` (for background tasks) or `src/content.ts` (for page interaction)
3. Use `chrome.runtime.sendMessage()` to communicate with sidebar
4. Handle message in `App.tsx` `useEffect` → `chrome.runtime.onMessage.addListener`
5. For streaming responses, use `transport.streamSummary()` with callback

### Adding New Chat Feature
1. Define data structure in `src/types/chat.ts`
2. Add storage operations to `src/lib/chat-storage.ts`
3. Create helper functions in `src/lib/chat-helpers.ts`
4. Add UI component to `src/components/ui/`
5. Integrate with `useChats` hook for state management
6. Ensure auto-save via `use-chat-persistence` hook

### Adding New Memory/Knowledge Feature
1. Define data interface in `src/types/chat.ts` (e.g., `Memory`, `Bookmark`)
2. Implement storage operations in `src/lib/memory-storage.ts` or `src/lib/bookmark-storage.ts`
3. Create custom hook in `src/hooks/use-memories.ts` or `src/hooks/use-bookmarks.ts`
4. Add UI components:
   - Panel view: `src/components/ui/memory-panel.tsx`
   - Action buttons: Message options menu integration
5. For semantic search: Call `searchMemories()` from `src/lib/memory-search.ts`
6. For embeddings: Call `generateEmbedding()` from `src/lib/embeddings.ts` (requires Supabase API)
7. Always show toast feedback for save/delete/search operations (using `sonner`)
8. Handle migrations idempotently via `src/lib/db.ts` (add new version if schema changes)

### Adding Memory-Aware AI Features
1. After generating memory embedding, inject into system context before chat
2. Use memory search results to augment AI context: `searchMemories(query) → top-5 results`
3. Format memory results as system message or in prompt template
4. Ensure privacy: Never send memory content to external APIs (local-only)
5. Test with offline mode to verify zero external calls
6. Show memory source attribution in UI (e.g., "From saved memory: [title]")