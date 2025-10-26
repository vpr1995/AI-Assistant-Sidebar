# Advanced Features: Chat Persistence, Multimodal Input, and Chrome Summarizer

This document covers three major advanced features that significantly enhance the extension's capabilities.

## 1. Chat Persistence (Chrome Storage)

The extension uses Chrome's `chrome.storage.local` API to persist all chat sessions across browser restarts.

### Architecture

**Storage Layer**: `src/lib/chat-storage.ts`

All chat operations are centralized in this module:
-   `saveChat()` - Save or update a complete chat
-   `getChats()` - Retrieve all chats, sorted by most recent
-   `getChat(id)` - Get a specific chat by ID
-   `deleteChat(id)` - Remove a chat from storage
-   `updateChatMessages(id, messages)` - Update only messages
-   `updateChatTitle(id, title)` - Update only the title
-   `clearAllChats()` - Delete all chats
-   `generateChatTitle(messages)` - Auto-generate title from first user message

### Storage Details

-   **Storage Key**: `'chats'`
-   **Storage API**: `chrome.storage.local` (per-device persistence)
-   **Max Chats**: 50 (automatically prunes older chats to prevent bloat)
-   **Data Structure**:
    ```typescript
    interface Chat {
      id: string                    // Unique identifier
      title: string                 // User-editable title
      messages: ChatMessage[]       // Full message history
      preview: string               // First message preview (max 100 chars)
      updatedAt: number             // Unix timestamp
    }
    ```

### Auto-Save Hook

**`src/hooks/use-chat-persistence.ts`**

-   Automatically saves chat messages whenever they change
-   Debounced to prevent excessive storage writes
-   Updates both messages and preview text
-   Silent failures (logs errors but doesn't interrupt UX)

### User Experience

-   **Automatic**: All chats saved without user action
-   **Persistent**: Survives browser restarts and extension reloads
-   **Organized**: Chats sorted by most recent activity
-   **Manageable**: Users can delete individual chats
-   **Editable Titles**: Double-click to rename chats

## 2. Multimodal Input (Image Upload for Built-in AI)

The extension supports image input **exclusively with Chrome's Built-in AI** provider, enabling vision-based queries.

### Feature Availability

-   ✅ **Built-in AI (Gemini Nano)**: Full multimodal support
-   ❌ **WebLLM**: Text-only (no image support)
-   ❌ **Transformers.js**: Text-only (no image support)

### Implementation

**Image State Management** (`src/App.tsx`):
```typescript
const [attachedImage, setAttachedImage] = useState<{ file: File; preview: string } | null>(null)
```

**Image Upload Flow**:
1.  User clicks image button in message input
2.  File picker opens (accepts image/*)
3.  Selected image stored in state with preview URL
4.  Image thumbnail displayed in input area
5.  User types message describing what to analyze
6.  On submit: Image converted to base64 data URL
7.  Message sent with `imageAttachment` in request body

**Transport Layer** (`src/lib/client-side-chat-transport.ts`):
```typescript
// Extract image from body option
const imageAttachment = (body as Record<string, unknown> | undefined)?.imageAttachment as 
  { mediaType: string; data: string } | undefined

// If Built-in AI and image present, add to last message
if (imageAttachment && this.provider === 'built-in-ai') {
  lastMessage.content = [
    { type: 'text', text: userText },
    { type: 'file', mediaType: imageAttachment.mediaType, data: imageAttachment.data }
  ]
}
```

### Image Processing

**Utility**: `src/lib/image-utils.ts`

-   Reads image files as base64 data URLs
-   Extracts media type from data URL header
-   Validates image file types
-   Handles read errors gracefully

### User Experience

-   **Upload Button**: Paperclip/image icon in message input
-   **Preview**: Thumbnail shows attached image
-   **Remove**: X button to clear attachment before sending
-   **Provider Check**: Button disabled if not using Built-in AI
-   **Auto-clear**: Image removed after message sent
-   **Error Handling**: Falls back to text-only on read errors

### Limitations

-   **Provider-Specific**: Only works with Built-in AI (Gemini Nano)
-   **Single Image**: One image per message
-   **No History**: Images not persisted in chat storage (privacy consideration)
-   **Format Support**: Browser-supported image formats (PNG, JPEG, GIF, WebP)

## 3. Chrome Summarizer API Integration

The extension leverages Chrome's native **Summarizer API** (experimental) for optimized, hardware-accelerated summarization.

### Architecture

**Dual-Summarizer System** with user preference:

1.  **Primary**: Chrome Summarizer API (native, fast, efficient)
2.  **Fallback**: LLM-based summarization (Built-in AI → WebLLM → Transformers.js)

### Implementation

**Summarizer Utilities**: `src/lib/summarizer-utils.ts`

**Key Functions**:
-   `checkChromeSummarizerAvailability()` - Check if API is available
-   `streamChromeSummary()` - Use Chrome Summarizer with streaming
-   `detectSummarizerProvider()` - Determine which provider to use
-   `summarizeWithFallback()` - Main interface with automatic fallback

**User Preference System**: `src/lib/settings-storage.ts`

Users can choose their preferred summarizer:
-   `'built-in'` - Force Chrome Summarizer API only
-   `'fallback'` - Force LLM-based summarization

### Chrome Summarizer API Features

**Configuration Options**:
```typescript
interface SummarizerOptions {
  type?: 'key-points' | 'tldr' | 'teaser' | 'headline'  // Summary style
  length?: 'short' | 'medium' | 'long'                   // Output length
  format?: 'markdown' | 'plain-text'                     // Output format
  sharedContext?: string                                  // Additional context
}
```

**Default Settings**:
-   Type: `'key-points'` (bullet-point style)
-   Length: `'long'` (comprehensive)
-   Format: `'markdown'` (for rich rendering)

### Availability States

The API reports four states:
-   `'readily'` - Available immediately
-   `'after-download'` - Available after downloading model
-   `'downloadable'` - Can be downloaded
-   `'unavailable'` - Not supported

### Usage Flow

```
User triggers summarization (page/YouTube/rewrite)
    ↓
getSummarizerPreference() → User's preference
    ↓
detectSummarizerProvider() → Check availability
    ↓
If Chrome Summarizer available AND preferred:
    ↓
Summarizer.create({ type, length, format }) → Create instance
    ↓
summarizer.summarizeStreaming(text) → Stream chunks
    ↓
for await (chunk of stream) → Send to UI via onChunk callback
    ↓
Display in chat with typing animation

If unavailable OR fallback preferred:
    ↓
Use transport.streamSummary() → LLM-based summarization
```

### Monitoring & Metrics

**Download Progress**:
```typescript
monitor(m: ProgressMonitor) {
  m.addEventListener('downloadprogress', (e: ProgressEvent) => {
    const progress = (e.loaded * 100).toFixed(0)
    console.log(`Download progress: ${progress}%`)
  })
}
```

**Input Quota**:
```typescript
const inputUsage = await summarizer.measureInputUsage(text)
const totalInputQuota = summarizer.inputQuota
console.log('Input usage:', inputUsage, 'of', totalInputQuota)
```

### Type Definitions

**`src/vite-env.d.ts`** includes complete TypeScript types for the Chrome Summarizer API:
-   `SummarizerOptions` interface
-   `SummarizerAvailability` type
-   `Summarizer` interface (with methods)
-   `SummarizerStatic` interface (with static methods)
-   Global `Summarizer` declaration

### Integration Points

**Used For**:
-   Page summarization (right-click context menu)
-   YouTube video summarization
-   Text rewriting (indirectly, via same streaming mechanism)

**Hook Integration**: `src/hooks/use-chrome-message-listener.ts`

Handles streaming actions with Chrome Summarizer:
```typescript
const userPreference = await getSummarizerPreference()
await summarizeWithFallback(
  content,
  onChunk,
  { type: 'key-points', length: 'long', format: 'markdown' },
  fallbackFn,
  userPreference
)
```

### Benefits Over LLM Fallback

-   **Speed**: ~2-3x faster than LLM-based summarization
-   **Efficiency**: Lower memory usage, hardware-optimized
-   **Quality**: Purpose-built for summarization
-   **Consistency**: Predictable output format
-   **No Download**: No model download needed (if Chrome manages it)

### Browser Requirements

-   **Chrome 128+**: Required for Summarizer API
-   **Flag**: May require `chrome://flags/#summarization-api-for-gemini-nano`
-   **User Activation**: Some operations may require user gesture
-   **Experimental**: API is still in early preview

### Fallback Behavior

If Chrome Summarizer fails or is unavailable:
1.  Logs error to console
2.  Automatically falls back to LLM-based summarization
3.  Uses same streaming interface for consistency
4.  User sees no interruption (seamless fallback)

## Summary

These three features work together to provide:
-   **Persistence**: All conversations saved and restorable
-   **Multimodality**: Vision capabilities with image input (Built-in AI only)
-   **Optimization**: Native summarization API for best performance

All features are production-ready and integrate seamlessly with the existing triple-provider AI system.
