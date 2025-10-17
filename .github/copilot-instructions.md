# Chrome Extension: Local AI Assistant - AI Agent Instructions

## 🎯 Project Overview

Privacy-first Chrome sidebar extension running LLM inference **entirely in-browser** (zero API calls). Dual-provider AI architecture with Chrome Built-in AI (Gemini Nano) as primary, WebLLM (Llama 3.2/SmolLM2) as fallback. Includes page summarization via right-click context menu.

**Tech Stack**: React 19 + Vite 7 + TypeScript + Tailwind CSS + shadcn/ui + Vercel AI SDK + @built-in-ai/core + @mozilla/readability

---

## 🏗️ Critical Architecture Patterns

### 1. Dual-Provider AI System (`src/lib/client-side-chat-transport.ts`)

The core innovation is `ClientSideChatTransport` implementing Vercel AI SDK's `ChatTransport` interface for browser-based inference:

```typescript
// Provider detection priority: Built-in AI → WebLLM
async detectAvailableProvider(): 'built-in-ai' | 'web-llm'
  ├─ doesBrowserSupportBuiltInAI() → builtInAI().availability()
  └─ Falls back to webLLM('Llama-3.2-1B-Instruct-q4f16_1-MLC')

// sendMessages() handles streaming with download progress:
sendMessages() → createUIMessageStream() → writer.merge(result.toUIMessageStream())
```

**Key implementation details**:
- **Model caching**: `cachedWebLLMModel` prevents re-initialization across messages
- **Progress tracking**: Uses `createSessionWithProgress()` for download UI during first load
- **Provider switching**: `setPreferredProvider()` resets detection to allow user override
- **Message conversion**: Converts between `BuiltInAIUIMessage`/`WebLLMUIMessage` and UI `Message` types

**When modifying AI integration**:
- Never bypass `ClientSideChatTransport` - all AI calls must go through it
- Use `writer.merge()` to combine download progress and text streams
- Check `model.availability()` before streaming to show proper UI states

### 2. Chrome Extension Message Flow

**Page Summarization** (right-click → AI summary):

```
1. User right-clicks → background.ts contextMenus.onClicked
2. background.ts → chrome.tabs.sendMessage('extractPageContent') to content.ts
3. content.ts → @mozilla/readability.parse() extracts article
4. background.ts → chrome.runtime.sendMessage('summarizePage', data)
5. App.tsx chrome.runtime.onMessage → setMessages() + transport.streamSummary()
6. AI streams response character-by-character to chat UI
```

**Critical**: `content.ts` runs in page context, `background.ts` in service worker context, `App.tsx` in sidebar context. Use `chrome.runtime.sendMessage()` for cross-context communication.

### 3. Vite Build Configuration (`vite.config.ts`)

Extension requires **multi-entry builds**:

```typescript
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
```

**When adding new scripts**: Add to `input` and ensure proper output naming to match `manifest.json`.

---

## 🔧 Developer Workflows

### Extension Testing Loop
```bash
npm run build           # Build to dist/
# Load dist/ in chrome://extensions/ (Developer mode → Load unpacked)
# Make changes → npm run build → Click reload icon in chrome://extensions/
```

**Dev mode caveat**: `npm run dev` runs Vite dev server but Chrome extension APIs (`chrome.runtime`, `chrome.storage`) are unavailable. Must test built extension for full functionality.

### Testing AI Providers
- **Built-in AI**: Enable `chrome://flags/#prompt-api-for-gemini-nano`, restart Chrome
- **WebLLM fallback**: Works in any modern browser, downloads models on first use (~360MB-1GB)
- **Check provider**: Open DevTools in sidebar → Console shows `[App] Provider detection complete: built-in-ai`

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
In dev mode, components mount twice. **Solution**: Use `useMemo` for singleton instances:
```tsx
const transport = useMemo(() => new ClientSideChatTransport('auto'), [])
```

### 2. Chrome API Availability in Dev
`chrome.runtime` is `undefined` in Vite dev server. **Solution**: Guard with checks:
```tsx
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener(...)
}
```

### 3. Horizontal Scrollbar in Sidebar
Fixed-width content causes scrollbars. **Solution**: Use `overflow-x-hidden` on root container and `max-w-full` on children.

### 4. Provider Detection Race Conditions
`detectActiveProvider()` is async but UI renders immediately. **Solution**: Show loading state until `isClient` true and `activeProvider` detected.

---

## 📦 Key Dependencies

- **`@ai-sdk/react`**: Provides `useChat` hook - handles message state, streaming, error handling
- **`@built-in-ai/core`**: Chrome's native Gemini Nano API wrapper
- **`@built-in-ai/web-llm`**: WebLLM wrapper (Llama 3.2, SmolLM2, Qwen2.5 models)
- **`@mozilla/readability`**: Extracts main article content from web pages
- **`highlight.js`**: Code syntax highlighting (replaced Shiki to reduce bundle by 330 modules)
- **`react-markdown`**: Markdown rendering in chat messages

---

## 🔍 Where to Find Key Logic

- **AI provider selection**: `src/lib/client-side-chat-transport.ts` → `selectProvider()`
- **Message streaming**: `src/lib/client-side-chat-transport.ts` → `sendMessages()` → `createUIMessageStream()`
- **Page summarization**: `src/background.ts` + `src/content.ts` + `src/App.tsx` (`chrome.runtime.onMessage`)
- **Chat UI state**: `src/App.tsx` → `useChat` hook from `@ai-sdk/react`
- **Build config**: `vite.config.ts` → `rollupOptions.input` for multi-entry builds
- **Extension manifest**: `public/manifest.json` → permissions, CSP, content scripts

---

## 🎨 UI Component Guidelines

Components follow **shadcn/ui** patterns. When adding new UI:
1. Check if shadcn component exists: `npx shadcn@latest add <component>`
2. Use `components/ui/` for base components
3. Compose in parent components (e.g., `Chat` composes `ChatMessage`, `MessageInput`)
4. Leverage `framer-motion` for animations (e.g., typing indicator bouncing dots)

Example: `components/ui/typing-indicator.tsx` uses `motion.div` with `animate` prop for smooth animations.

---

## 🛠️ Making Changes

### Adding New AI Provider
1. Create provider check function in `client-side-chat-transport.ts`
2. Add to `detectAvailableProvider()` logic
3. Implement `handle{Provider}()` method with progress tracking
4. Update UI to show provider status in `App.tsx`

### Adding New Chrome Extension Feature
1. Add permission to `public/manifest.json`
2. Implement logic in `src/background.ts` (for background tasks) or `src/content.ts` (for page interaction)
3. Use `chrome.runtime.sendMessage()` to communicate with sidebar
4. Handle message in `App.tsx` `useEffect` → `chrome.runtime.onMessage.addListener`

### Optimizing Bundle Size
- Check bundle: `npm run build` → inspect `dist/assets/` sizes
- Use dynamic imports for large dependencies: `const module = await import('heavy-lib')`
- For markdown highlighting, only import specific languages in `highlight.js`

---

**Last Updated**: October 2025 | **Status**: Active development | **Build**: Production-ready MVP

