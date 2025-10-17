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

## ClientSideChatTransport Implementation

### Initialization
```typescript
transport = new ClientSideChatTransport('auto')
// 'auto' | 'built-in-ai' | 'web-llm'
```

### Provider Detection Flow
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

### Key Methods

#### sendMessages()
- Handles standard chat messages
- Uses detected provider
- Returns streaming response
- Supports model download progress

#### summarizeText()
- Direct summarization without chat UI
- Returns complete text
- Useful for non-interactive summaries

#### streamSummary()
- Streaming summarization with callback
- Calls `onChunk` for each text delta
- Ideal for typed animation in UI

#### setPreferredProvider()
- Allows user to switch providers
- Resets detection on change
- Clears WebLLM model cache

#### onProviderChange()
- Callback when provider changes
- Used to update UI indicators

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

## Download Progress Tracking

### Built-in AI Download
- Chrome manages the download
- Progress callback: `model.createSessionWithProgress(callback)`
- Callback receives progress (0-1)

### WebLLM Download
- First model use triggers download
- Progress available during download
- Cached locally for future use

## Page Summarization Integration

### Content Flow
1. Page content extracted (max 8000 chars)
2. Prompt created with content embedded
3. `transport.streamSummary()` called with prompt
4. UI receives chunks and updates message
5. Typing animation plays as text arrives

### Prompt Structure for Summarization
```
Please provide a concise summary of the following web page:

Title: {page_title}
URL: {page_url}
Author: {byline if available}
Content:
{page_content_truncated}

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

## Performance Considerations

### Built-in AI
- **Pros**: Fastest, managed by browser, optimal hardware use
- **Cons**: Browser version dependent, may not be available

### WebLLM
- **Pros**: Works offline, user control, open source models
- **Cons**: Slower, larger model sizes, manual cache management

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

## Debugging

### Enable Detailed Logging
All transport methods log to console with `[ClientSideChatTransport]` prefix:
- Provider detection steps
- Stream start/end
- Chunk arrivals
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
