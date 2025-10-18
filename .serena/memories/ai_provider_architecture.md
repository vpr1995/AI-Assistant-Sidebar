# AI Provider Architecture

## Dual-Provider System

### Provider Selection Priority
1. **Built-in AI** (Primary) - Chrome's native AI
   - Fastest performance
   - No additional downloads needed
   - Automatically managed by browser

2. **WebLLM** (Fallback) - Transformers.js based
   - Used when Built-in AI unavailable
   - Manual model management
   - Works on any browser with WebGPU/WASM

## Dual-Summarizer System (New)

### For Page Summarization
1. **Chrome Summarizer API** (Primary) - Native browser API
   - Available in Chrome 128+ (when feature ships)
   - Optimized summarization with configurable options
   - Faster, lower memory usage
   - Managed by browser automatically

2. **LLM Fallback** (Fallback) - Uses text generation models
   - Built-in AI (Gemini Nano/Phi Mini)
   - WebLLM (Llama 3.2, SmolLM2, Qwen2.5)
   - Works on all modern browsers

## Built-in AI Provider

### Detection
```typescript
doesBrowserSupportBuiltInAI() → true/false
builtInAI() → model instance
await model.availability() → "available" | "downloadable" | "after-download" | "unavailable"
```

### Models Available
- **Chrome**: Gemini Nano (optimized for browser)
- **Edge**: Phi Mini (Microsoft's model)

### Requirements
- Chrome 128+ or Edge Dev 138.0.3309.2+
- Enable feature flag:
  - Chrome: `chrome://flags/#prompt-api-for-gemini-nano`
  - Edge: `edge://flags/#prompt-api-for-phi-mini`

### Usage in Transport
```typescript
const model = builtInAI()
const result = streamText({
  model,
  messages: [{ role: 'user', content: prompt }]
})
```

## WebLLM Provider

### Detection
```typescript
doesBrowserSupportWebLLM() → true/false
webLLM(modelId) → model instance
```

### Available Models
- `Llama-3.2-1B-Instruct-q4f16_1-MLC` (1GB)
- `SmolLM2-360M-Instruct` (360MB)
- `SmolLM2-135M-Instruct` (135MB)
- `Qwen2.5-0.5B-Instruct` (500MB)

### Current Model Used
`Llama-3.2-1B-Instruct-q4f16_1-MLC` - Best performance/size tradeoff

### Requirements
- WebGPU or WASM support
- Browser local storage for caching
- No external internet connection after first download

### Usage in Transport
```typescript
const model = webLLM('Llama-3.2-1B-Instruct-q4f16_1-MLC', {
  worker: new Worker('./transformers-worker.ts')
})
const result = streamText({
  model,
  messages: [{ role: 'user', content: prompt }]
})
```

## Chrome Summarizer API Provider

### Detection
```typescript
checkChromeSummarizerAvailability() → Promise<boolean>
// Checks if Summarizer exists in global scope and is available
```

### Availability Status
- "unavailable" - API not supported or not available
- "available" - Can be used immediately

### Configuration Options
```typescript
interface SummarizerOptions {
  type?: 'key-points' | 'tldr' | 'teaser' | 'headline'
  length?: 'short' | 'medium' | 'long'
  format?: 'markdown' | 'plain-text'
  sharedContext?: string
}
```

### Usage in Transport
```typescript
const summarizer = await Summarizer.create({
  type: 'key-points',
  length: 'long',
  format: 'markdown'
})
const stream = summarizer.summarizeStreaming(text)
for await (const chunk of stream) {
  onChunk(chunk) // Receive streamed summary chunks
}
```

### Requirements
- Chrome 128+ with `chrome://flags/#prompt-api-for-summarizer-api` enabled
- User activation required (click event)
- Monitor for download progress via ProgressMonitor

### When Not Available
- Automatically falls back to LLM-based summarization
- Uses same streaming interface for consistent UX

## ClientSideChatTransport Implementation

### Initialization
```typescript
transport = new ClientSideChatTransport('auto')
// 'auto' | 'built-in-ai' | 'web-llm'
```

### Provider Detection Flow for Chat
```
1. Check if user has preference set
   ├─ Yes: Use preferred provider if available, fallback to detect
   └─ No: Auto-detect

2. Auto-detection:
   ├─ Check Built-in AI availability
   │  ├─ Available → Use Built-in AI
   │  └─ Unavailable → Check WebLLM
   ├─ Check WebLLM availability
   │  ├─ Available → Use WebLLM
   │  └─ Not available → Error
```

### Provider Detection Flow for Summarization
```
1. Check Chrome Summarizer availability
   ├─ Available → Use Chrome Summarizer API
   └─ Unavailable → Use LLM fallback

2. LLM Fallback:
   ├─ Check Built-in AI availability
   │  ├─ Available → Use Built-in AI
   │  └─ Unavailable → Check WebLLM
   ├─ Check WebLLM availability
   │  ├─ Available → Use WebLLM
   │  └─ Not available → Error
```

## Key Methods

### For Chat Messages
#### sendMessages()
- Handles standard chat messages
- Uses detected provider (Built-in AI or WebLLM)
- Returns streaming response
- Supports model download progress

### For Summarization
#### summarizeText()
- Direct summarization without chat UI
- Returns complete text in one response
- Useful for non-interactive summaries

#### streamSummary()
- Streaming summarization with callback
- Calls `onChunk` for each text delta
- Ideal for typed animation in UI
- Works with both Chrome Summarizer and LLM fallback

### For Provider Management
#### setPreferredProvider()
- Allows user to switch providers
- Resets detection on change
- Clears WebLLM model cache

#### onProviderChange()
- Callback when provider changes
- Used to update UI indicators

#### getActiveProvider()
- Returns currently active provider
- Returns: 'built-in-ai' | 'web-llm' | null

## Streaming Mechanism

### Built-in AI Streaming
```typescript
const result = streamText({ model, messages })
const stream = result.toUIMessageStream()
const reader = stream.getReader()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  if (value.type === 'text-delta') {
    console.log(value.delta) // Character chunk
  }
}
```

### WebLLM Streaming
- Same interface as Built-in AI
- Runs in Web Worker via transformers.js
- Slightly slower but works offline

### Chrome Summarizer Streaming
```typescript
const summarizer = await Summarizer.create({ /* options */ })
const stream = summarizer.summarizeStreaming(text)
for await (const chunk of stream) {
  onChunk(chunk) // Receive streamed chunks
}
```

## Download Progress Tracking

### Built-in AI Download
- Chrome manages the download
- Progress callback: `model.createSessionWithProgress(callback)`
- Callback receives progress (0-1)

### WebLLM Download
- First model use triggers download
- Progress available during download
- Cached locally for future use

### Chrome Summarizer Download
- Monitored via ProgressMonitor callback
- Shows download progress and speed
- Browser manages caching

## Page Summarization Integration

### Complete Flow
1. Page content extracted (max 15,000 chars)
2. Prompt created with content embedded
3. `summarizeWithFallback()` called with prompt and options
4. Chrome Summarizer API attempts summarization (if available)
5. On failure or unavailability, falls back to `transport.streamSummary()`
6. Chunks streamed via callback
7. UI receives chunks and updates message
8. Typing animation plays as text arrives

### Prompt Structure for Summarization
```
Please provide a concise summary of the following web page:

Title: {page_title}
URL: {page_url}
Author: {byline if available}
Content:
{page_content_truncated_to_15000_chars}

Provide a clear, well-structured summary...
```

### Response Streaming
- Each text chunk triggers callback
- UI accumulates chunks into message
- Animation continues until stream ends
- User can see generation in real-time

## Error Handling

### Detection Errors
- No provider available → Show warning
- User alerted via modal dialog
- Console errors logged

### Runtime Errors
- Stream errors caught and logged
- User-friendly error message shown
- Original message preserved

### Provider Switching Errors
- If preferred provider fails → Fall back to other
- Reset and re-detect on next message

### Summarizer Errors
- Chrome Summarizer fails → Auto-fallback to LLM
- LLM also fails → Show error to user
- Provides actionable error messages

## Performance Considerations

### For Chat
- **Built-in AI**: Fastest, managed by browser, optimal hardware use
- **WebLLM**: Works offline, user control, open source models

### For Summarization
- **Chrome Summarizer API**: Fastest, optimized, lower memory
- **LLM Fallback**: Works everywhere, customizable, full control

### Streaming Benefits
- Real-time feedback to user
- Typing animation appears smooth
- No waiting for full response
- Better perceived performance

## Type System

### UIMessage Union Type
```typescript
type UIMessage = BuiltInAIUIMessage | WebLLMUIMessage

// Both have:
// - id: string
// - role: 'user' | 'assistant'
// - parts: Array<{ type: 'text'; text: string }>
```

### ModelMessage Format
```typescript
type ModelMessage = {
  role: 'user' | 'assistant'
  content: string
}
```

### Summarizer Options Type
```typescript
interface SummarizerOptions {
  type?: 'key-points' | 'tldr' | 'teaser' | 'headline'
  length?: 'short' | 'medium' | 'long'
  format?: 'markdown' | 'plain-text'
  sharedContext?: string
}

type SummarizerProvider = 'chrome-summarizer' | 'fallback' | null
```

## Debugging

### Enable Detailed Logging
All transport methods log to console with `[ClientSideChatTransport]` prefix:
- Provider detection steps
- Stream start/end
- Chunk arrivals
- Error details

All summarizer methods log with `[Summarizer]` prefix:
- API availability checks
- Chrome Summarizer initialization
- Stream progress
- Fallback activation
- Error details

### Monitor Provider Changes
```typescript
transport.onProviderChange((provider) => {
  console.log('Now using:', provider)
})
```

### Check Active Provider
```typescript
const current = transport.getActiveProvider()
// Returns: 'built-in-ai' | 'web-llm' | null
```

### Check Summarizer Provider
```typescript
const provider = await detectSummarizerProvider()
// Returns: 'chrome-summarizer' | 'fallback'
```
