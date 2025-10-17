# AI Provider Architecture

## Dual-Provider System

This Chrome extension uses a **smart dual-provider architecture** to maximize performance, compatibility, and user experience.

## Primary Provider: Chrome Built-in AI

### Package
- `@built-in-ai/core` from https://github.com/jakobhoeg/built-in-ai

### Features
- Uses **Chrome's native Gemini Nano** (Chrome 128+) or **Edge's Phi Mini** (Edge Dev 138.0.3309.2+)
- **Zero downloads after first use** - Chrome manages model caching automatically
- **No model selection needed** - Browser provides the model
- **Fastest inference** - Hardware-optimized by the browser
- **Automatic updates** - Chrome updates the model
- **Multimodal support** - Can handle images and audio

### Usage
```javascript
import { builtInAI, doesBrowserSupportBuiltInAI } from '@built-in-ai/core';

// Check if supported
if (doesBrowserSupportBuiltInAI()) {
  const model = builtInAI();
  const status = await model.availability();
  
  // Status can be: "unavailable", "downloadable", "downloading", "available"
  if (status === "available") {
    // Use immediately
  } else if (status === "downloadable") {
    // Show Chrome's one-time download progress
    await model.createSessionWithProgress((progress) => {
      console.log(`Download: ${Math.round(progress * 100)}%`);
    });
  }
}
```

### Browser Requirements
- **Chrome**: Version 128+ with flag enabled: `chrome://flags/#prompt-api-for-gemini-nano`
- **Edge**: Dev/Canary 138.0.3309.2+ with flag enabled: `edge://flags/#prompt-api-for-phi-mini`
- Must click "Check for Update" in `chrome://components` for Optimization Guide

### UI Implications
- **No model selector dropdown** (Chrome handles model automatically)
- **Header displays**: "● Chrome Built-in AI (Gemini Nano)" or "● Edge Built-in AI (Phi Mini)"
- **Settings show**: "Chrome/Edge manages built-in AI models automatically"
- **No manual cache management** (browser handles lifecycle)

---

## Fallback Provider: WebLLM

### Package
- `@built-in-ai/web-llm` from https://github.com/jakobhoeg/built-in-ai

### When Used
- Built-in AI not supported in browser
- User manually switches to WebLLM mode
- Built-in AI is unavailable or downloading fails

### Features
- **Manual model selection** from multiple options
- **User-managed downloads** via browser Cache API
- **WebGPU acceleration** with WASM fallback
- **Works on any browser** with WebGPU/WASM support
- **Offline after download** - Models cached locally
- **More model variety** - Choose based on needs

### Available Models
- **Llama-3.2-1B-Instruct-q0f16-MLC** (1GB) - Highest quality
- **SmolLM2-360M-Instruct** (360MB) - Balanced
- **SmolLM2-135M-Instruct** (135MB) - Fast, lightweight
- **Qwen2.5-0.5B-Instruct** (500MB) - Better quality
- **SmolVLM-256M-Instruct** (256MB) - Vision/multimodal

### Usage
```javascript
import { webLLM } from '@built-in-ai/web-llm';

const model = webLLM('Llama-3.2-1B-Instruct-q0f16-MLC', {
  worker: new Worker(new URL('./transformers-worker.ts', import.meta.url), { 
    type: 'module' 
  })
});

const availability = await model.availability();
if (availability === 'downloadable') {
  await model.createSessionWithProgress(({ progress }) => {
    console.log(`Download: ${Math.round(progress * 100)}%`);
  });
}
```

### UI Implications
- **Model selector dropdown** appears in input area
- **Header displays**: "● Llama-3.2-1B-Instruct" (or selected model name)
- **Settings provide**: Full cache management (view, delete, clear all)
- **Storage usage shown**: Total size, per-model size, last used dates

---

## Detection & Fallback Logic

### Automatic Provider Detection
```javascript
// On extension startup
if (doesBrowserSupportBuiltInAI()) {
  const model = builtInAI();
  const status = await model.availability();
  
  if (status === 'available' || status === 'downloadable') {
    // Use Chrome Built-in AI
    setProvider('built-in-ai');
  } else {
    // Fall back to WebLLM
    setProvider('web-llm');
  }
} else {
  // Browser doesn't support, use WebLLM
  setProvider('web-llm');
}
```

### User Preference
- Store active provider in Chrome storage
- Allow manual switching in settings
- Remember user's choice across sessions

---

## Vercel AI SDK Integration

Both providers integrate seamlessly with Vercel AI SDK:

```javascript
import { streamText } from 'ai';
import { builtInAI } from '@built-in-ai/core';
import { webLLM } from '@built-in-ai/web-llm';

// Built-in AI
const result = streamText({
  model: builtInAI(),
  messages: [{ role: 'user', content: 'Hello!' }]
});

// WebLLM
const result = streamText({
  model: webLLM('Llama-3.2-1B-Instruct-q0f16-MLC'),
  messages: [{ role: 'user', content: 'Hello!' }]
});

// Same streaming API for both!
for await (const chunk of result.textStream) {
  console.log(chunk);
}
```

---

## Comparison Table

| Feature | Built-in AI | WebLLM |
|---------|-------------|--------|
| **Model Selection** | Automatic (Chrome) | Manual (user chooses) |
| **Download Size** | Managed by Chrome | 135MB - 1GB+ per model |
| **Download Frequency** | Once per browser | Per model, per user |
| **Cache Management** | Automatic (Chrome) | Manual (user controls) |
| **Browser Support** | Chrome 128+, Edge Dev | Any modern browser |
| **Setup Required** | Enable flag, update components | None (works out of box) |
| **Inference Speed** | Fastest (native) | Fast (WebGPU) or Medium (WASM) |
| **Offline** | Yes (after first use) | Yes (after download) |
| **Model Updates** | Automatic (Chrome) | Manual (re-download) |
| **Model Variety** | 1 model (Gemini Nano/Phi Mini) | Many models to choose from |

---

## Implementation Priority

1. **First**: Implement Built-in AI provider (best UX when available)
2. **Second**: Implement WebLLM fallback (compatibility)
3. **Third**: Add manual provider switching in settings
4. **Fourth**: Optimize UI for each provider mode

---

## User Notifications

### First Time Setup

**Built-in AI Available**:
- "This extension uses Chrome's built-in AI (Gemini Nano)"
- "Click 'Start' to download the model (one-time, ~500MB)"
- Show progress bar during Chrome's download

**Built-in AI Unavailable**:
- "Chrome's built-in AI is not available"
- "Using WebLLM instead (local AI models)"
- "Choose a model to download (135MB - 1GB)"

### Status Messages
- Built-in AI: "● Chrome Built-in AI (Ready)"
- WebLLM: "● Llama-3.2-1B-Instruct (Ready)"
- Downloading: "⏳ Downloading model... 45%"
- Error: "⚠️ [Provider] unavailable, switching to fallback"
