# Text Rewrite Feature

The "Rewrite text" feature allows users to select text on any webpage and rewrite it in one of eight different tones using the triple-provider AI system.

## Feature Overview

-   **Supported Tones**: Concise, Professional, Casual, Formal, Engaging, Simplified, Technical, and Creative.
-   **Workflow**:
    1.  The user selects text on a webpage and right-clicks to open the context menu.
    2.  They choose a rewrite tone from the "Rewrite text" submenu (8 options).
    3.  The sidebar opens automatically if not already open.
    4.  The selected text and tone are sent to the AI via the triple-provider system.
    5.  The rewritten text is streamed character-by-character into the chat interface.
    6.  Users can chain rewrites (rewrite the rewritten text again).

## Supported Tones with Descriptions

1.  **Concise** - Shorter and more direct version, removes unnecessary words
2.  **Professional** - Formal business language suitable for professional contexts
3.  **Casual** - Friendly and conversational tone for informal communication
4.  **Formal** - Official and structured tone for formal documents
5.  **Engaging** - Captivating and attention-grabbing version to hook readers
6.  **Simplified** - Easy to understand plain language, great for clarity
7.  **Technical** - More technical and detailed version with industry terminology
8.  **Creative** - More creative and imaginative version with artistic flair

## Implementation Details

### Files Involved

-   **`src/lib/rewrite-utils.ts`**: Core rewrite logic
    -   `REWRITE_TONES` - Array of all available tones with metadata
    -   `getRewritePrompt()` - Returns AI prompt for each tone
    -   `formatRewriteUserMessage()` - Formats the user message display
    -   `getToneLabel()` - Gets human-readable tone label
    -   Type definitions: `RewriteTone`, `RewriteOption`

-   **`src/background.ts`**: Context menu and message routing
    -   Creates parent "Rewrite text" context menu
    -   Creates 8 submenu items (one per tone)
    -   Handles context menu clicks
    -   Opens sidebar and queues messages with ready signal handshake
    -   Routes rewrite requests to sidebar

-   **`src/App.tsx`**: Request handling and UI integration
    -   Listens for `rewriteText` messages from background script
    -   Clears chat history on new rewrite
    -   Creates user message showing tone and original text
    -   Calls `transport.streamSummary()` with tone-specific prompt
    -   Displays streaming response with typing animation

## Technical Architecture

### Message Flow
```
User selects text → Right-click → Choose tone
    ↓
background.ts: contextMenus.onClicked
    ↓
Opens sidebar: chrome.sidePanel.open()
    ↓
Queues message until sidebar ready
    ↓
Sidebar sends ready signal
    ↓
background.ts: Sends { action: 'rewriteText', data: { originalText, tone } }
    ↓
App.tsx: chrome.runtime.onMessage handler
    ↓
Clears messages: setMessages([])
    ↓
Creates user message: "Rewrite: **{ToneName}**\n{originalText}"
    ↓
Gets prompt: getRewritePrompt(originalText, tone)
    ↓
Streams response: transport.streamSummary(prompt, onChunk)
    ↓
UI updates with each chunk → Typing animation
```

### Provider Support

The rewrite feature works with all three AI providers:
-   **Built-in AI**: Fast, no download needed (if available)
-   **WebLLM**: Fallback with quality results
-   **Transformers.js**: Universal fallback for maximum compatibility

### Prompt Engineering

Each tone has a carefully crafted prompt that instructs the AI on:
-   The desired tone/style
-   Specific characteristics to emphasize
-   What to preserve from the original text
-   Output format requirements

Example prompt structure:
```
Rewrite the following text to be [tone description]...

Key requirements:
- [Specific instruction 1]
- [Specific instruction 2]
- [Specific instruction 3]

Original text:
{originalText}

Rewritten version:
```

## User Experience Features

-   **Context Menu Availability**: Only appears when text is selected
-   **Automatic Sidebar**: Opens sidebar if not already visible
-   **Message Queuing**: Uses ready signal to prevent "connection failed" errors
-   **Chat Reset**: Clears previous messages for clean context
-   **Streaming Display**: Shows text as it's generated for immediate feedback
-   **Chain Rewrites**: Can rewrite the AI's output in a different tone
-   **Markdown Support**: Formatted output is properly rendered

## Privacy & Performance

-   **100% Local**: All rewriting happens in-browser, no external API calls
-   **No Text Logging**: Selected text never leaves the device
-   **Model Reuse**: No model reloading between rewrites
-   **Fast Streaming**: ~50 tokens/second with Built-in AI
-   **Efficient**: Uses existing AI session, minimal overhead

## Limitations

-   **Text Length**: Works best with selections up to ~2000 characters
-   **Context Preservation**: AI may occasionally change meaning while adapting tone
-   **Model Dependency**: Quality varies by active provider
-   **First Use**: May require model download for WebLLM/Transformers.js
