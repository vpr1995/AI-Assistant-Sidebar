# AI Provider Architecture

This document details the triple-provider AI system used in the extension for chat and the dual-summarizer system for page summarization.

## Triple-Provider System for Chat

The extension uses three AI providers for generating text, ensuring a balance of performance and compatibility, with a clear fallback order.

1.  **Built-in AI (Primary)**: This provider uses Chrome's native AI capabilities (Gemini Nano). It is the fastest and most efficient option, as it is managed by the browser and requires no additional downloads. **Supports multimodal input** (text + image).

2.  **WebLLM (Secondary Fallback)**: If Built-in AI is not available, the extension falls back to WebLLM. This provider is based on the WebLLM project and is optimized for a different set of models. **Text-only** (no image support).

3.  **Transformers.js (Tertiary Fallback)**: If both Built-in AI and WebLLM are unavailable, the final fallback is Transformers.js from Hugging Face. This provides the broadest compatibility, running on nearly any modern browser that supports WebAssembly. **Text-only** (no image support).

## Multimodal Support (Built-in AI Only)

The extension supports image input **exclusively with Chrome's Built-in AI** provider:

-   **Image Format**: Images are converted to base64 data URLs
-   **Message Structure**: Multimodal messages contain both text and file content:
    ```typescript
    {
      type: 'text' | 'file',
      text?: string,              // For text parts
      mediaType?: string,         // For file parts (e.g., 'image/png')
      data?: string               // For file parts (base64 data URL)
    }
    ```
-   **Provider Check**: Image upload button is disabled when WebLLM or Transformers.js is active
-   **Privacy**: Images are not persisted in chat history (intentional design choice)
-   **Supported Formats**: Any browser-supported image format (PNG, JPEG, GIF, WebP, etc.)

## Dual-Summarizer System for Page Summarization

For page summarization, the extension employs a dual-provider strategy:

1.  **Chrome Summarizer API (Primary)**: A native browser API available in Chrome 128+ that provides optimized summarization with configurable options:
    -   **Type**: `'key-points'` | `'tldr'` | `'teaser'` | `'headline'`
    -   **Length**: `'short'` | `'medium'` | `'long'`
    -   **Format**: `'markdown'` | `'plain-text'`
    -   **Streaming**: Supports `summarizeStreaming()` for real-time output
    -   **Download Progress**: Monitors model download via `downloadprogress` events
    -   **Benefits**: ~2-3x faster than LLM-based summarization, lower memory usage

2.  **LLM Fallback (Fallback)**: If the Chrome Summarizer API is not available, the extension uses its text generation models (from the triple-provider system) to perform the summarization.

### Summarizer User Preference

Users can choose their preferred summarizer:
-   `'built-in'` - Force Chrome Summarizer API only
-   `'fallback'` - Force LLM-based summarization

Preference is stored in `chrome.storage.local` and checked via `getSummarizerPreference()`.

## `ClientSideChatTransport`

The `ClientSideChatTransport` is a custom implementation that manages the provider detection and streaming for both chat and summarization.

-   **Provider Detection**: It automatically detects the best available provider, following the priority order: `built-in-ai` → `web-llm` → `transformers-js`.
-   **Streaming**: It handles streaming responses from all providers, allowing for a real-time, character-by-character display of the AI's output.
-   **Download Progress**: It includes a callback-based system for tracking the download progress of AI models, which is displayed in a dedicated dialog.
-   **Multimodal Handling**: Extracts `imageAttachment` from request body and converts to Built-in AI's multimodal message format.
-   **Summarization Methods**:
    -   `streamSummary()` - Streaming text summarization with callback
    -   `summarizeText()` - Non-streaming text summarization (legacy)

## Provider Capabilities Matrix

| Feature | Built-in AI | WebLLM | Transformers.js |
|---------|-------------|--------|-----------------|
| Chat | ✅ | ✅ | ✅ |
| Streaming | ✅ | ✅ | ✅ |
| Multimodal (Images) | ✅ | ❌ | ❌ |
| Page Summarization | ✅ | ✅ | ✅ |
| YouTube Summarization | ✅ | ✅ | ✅ |
| Text Rewriting | ✅ | ✅ | ✅ |
| Download Required | ❌ | ✅ (~360MB) | ✅ (~1GB) |
| Browser Requirement | Chrome 128+ | Modern browsers | Modern browsers |

## Key Files

-   `src/lib/client-side-chat-transport.ts` - Triple-provider implementation with multimodal support
-   `src/lib/summarizer-utils.ts` - Chrome Summarizer API + LLM fallback
-   `src/lib/image-utils.ts` - Image processing for multimodal input
-   `src/App.tsx` - Image upload UI and base64 conversion
-   `src/vite-env.d.ts` - TypeScript types for Chrome Summarizer API
