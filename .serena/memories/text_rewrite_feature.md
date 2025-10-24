# Text Rewrite Feature Documentation

## Feature Overview

The "Rewrite text" feature allows users to select any text on a webpage and rewrite it in different tones/styles. After right-clicking on selected text and choosing a rewrite style, the text is rewritten in the sidebar using the local AI and displayed in the chat interface.

## Supported Rewrite Tones

1. **Concise** - Shorter and more direct version
2. **Professional** - Formal business language
3. **Casual** - Friendly and conversational tone
4. **Formal** - Official and structured tone
5. **Engaging** - Captivating and attention-grabbing
6. **Simplified** - Easy to understand plain language
7. **Technical** - More technical and detailed version
8. **Creative** - More creative and imaginative version

## Architecture & Flow

### Context Menu Flow
```
1. User selects text on webpage
2. Right-click → Shows context menu
3. "Rewrite text" menu with submenu items for each tone
4. User clicks desired tone
```

### Message Passing Flow
```
1. User clicks rewrite tone → background.ts contextMenus.onClicked
2. background.ts opens sidebar via chrome.sidePanel.open()
3. background.ts sends chrome.runtime.sendMessage():
   ├─ action: 'rewriteText'
   ├─ data: {
   │  ├─ originalText: (selected text)
   │  └─ tone: (tone ID like 'concise', 'professional', etc.)
   │ }
4. App.tsx chrome.runtime.onMessage listener receives message
5. App.tsx calls transport.streamSummary() with rewrite prompt
```

### Chat Display Flow
```
1. User message shows: "Rewrite: **{ToneName}**\n{originalText}"
   (text truncated to 100 chars if longer)
2. AI message streams the rewritten text character-by-character
3. Typing animation plays as text arrives
4. User can continue chatting or rewrite again
5. Chat clears on new rewrite request (like summarization)
```

## Implementation Files

### 1. src/lib/rewrite-utils.ts (NEW)
**Purpose**: Centralized rewrite prompts and utilities

**Key Exports**:
- `REWRITE_TONES: RewriteOption[]` - Array of all available tones
- `getRewritePrompt(text, tone): string` - Returns AI prompt for given tone
- `formatRewriteUserMessage(text, tone): string` - Formats user message display
- `getToneLabel(tone): string` - Gets human-readable label for tone ID
- `type RewriteTone` - Type union of all tone IDs
- `interface RewriteOption` - Tone definition with label and description

**Prompt Examples**:
```
Concise: "Rewrite the following text to be more concise and direct..."
Professional: "Rewrite the following text in a formal, professional tone..."
Casual: "Rewrite the following text in a friendly, casual, conversational tone..."
Technical: "Rewrite the following text with more technical depth and detail..."
```

### 2. src/background.ts (UPDATED)
**New Content**:
- `REWRITE_TONES` array with all tone definitions
- Context menu creation for "Rewrite text" parent menu
- Submenu items for each tone (rewrite-text-{tone-id})
- Context menu click handler for rewrite-text-* items
- Opens sidebar and sends rewriteText message

**Key Code**:
```typescript
chrome.contextMenus.create({
  id: 'rewrite-text',
  title: 'Rewrite text',
  contexts: ['selection'],
});

REWRITE_TONES.forEach((tone) => {
  chrome.contextMenus.create({
    id: `rewrite-text-${tone.id}`,
    title: tone.label,
    parentId: 'rewrite-text',
    contexts: ['selection'],
  });
});
```

### 3. src/App.tsx (UPDATED)
**New Imports**:
- `getRewritePrompt, formatRewriteUserMessage, type RewriteTone` from `@/lib/rewrite-utils`

**New Message Handler**:
- Added `else if (message.action === 'rewriteText' && message.data)` block
- Extracts `originalText` and `tone` from message data
- Clears existing messages (like summarization)
- Creates user message with formatted original text
- Calls `transport.streamSummary()` with rewrite prompt
- Streams rewritten text to AI message
- Updates messages array with accumulated chunks

**Key Logic**:
```typescript
const rewritePrompt = getRewritePrompt(originalText, tone);
await transport.streamSummary(rewritePrompt, (chunk: string) => {
  // Update AI message with accumulated text
  aiMessage.parts[0].text += chunk;
  setMessages(prevMessages => {
    messages[lastIndex] = aiMessage;
    return messages;
  });
});
```

## User Flow Walkthrough

1. **Selection**: User highlights text on any webpage
   - Example: "The quick brown fox jumps over the lazy dog"

2. **Right-click**: User right-clicks on selected text
   - Context menu appears with options

3. **Choose Tone**: User selects "Rewrite text" → "Professional"
   - Sidebar opens automatically

4. **Processing**: 
   - Sidebar shows: "Rewrite: **Professional**\n'The quick brown fox...'"
   - AI processes: "Rewrite in formal business tone..."
   - Sidebar streams: "The swift auburn fox leaps across the sluggish canine..."

5. **Continue Chat**: User can:
   - Ask follow-up questions about the rewrite
   - Rewrite again with different tone
   - Chat normally with AI

## Technical Details

### Transport Layer
- Uses same `transport.streamSummary()` as page summarization
- Works with both Built-in AI and WebLLM providers
- Streams text character-by-character via callback
- No external API calls (fully local)

### Type Safety
- `RewriteTone` type union ensures only valid tones are used
- Full TypeScript support with no `any` types
- Type-safe message passing with `data?: { originalText?: string; tone?: RewriteTone }`

### Performance
- No model reloading (reuses existing AI session)
- Streaming provides real-time feedback
- Text streamed at ~50 tokens/second (configurable via `experimental_throttle`)

### Privacy
- Selected text never leaves the device
- No external API calls
- Text only processed locally by browser AI

## Browser Support

- **Chrome/Edge**: Built-in AI (Gemini Nano/Phi Mini) + WebLLM fallback
- **Firefox/Safari/Others**: WebLLM fallback (Llama 3.2, SmolLM2, etc.)

## Future Enhancements

1. **Custom Prompts**: Allow users to create custom rewrite styles
2. **Tone Intensity**: Sliders for rewrite intensity (subtle → aggressive)
3. **Compare Versions**: Show side-by-side original vs. rewritten
4. **Favorite Tones**: Quick access to most-used tones
5. **Keyboard Shortcut**: Right-click → numbered shortcut for quick rewrite
6. **Batch Rewrite**: Rewrite multiple selected passages at once
7. **Tone Descriptions**: Tooltips explaining each tone option

## Testing Checklist

✅ Context menu appears on text selection
✅ All 8 tone options visible in submenu
✅ Clicking tone opens sidebar
✅ Chat shows correct user message format
✅ Rewritten text streams correctly
✅ Works with both Built-in AI and WebLLM
✅ Can rewrite the rewritten text (chain rewrites)
✅ Chat clears on new rewrite (like summarization)
✅ No console errors
✅ Proper TypeScript types throughout

## Known Limitations

1. **Text Length**: Works best with selections up to ~2000 characters
2. **Long Processing**: Very long texts may take longer to rewrite
3. **Tone Quality**: Output quality depends on selected AI model
4. **Memory**: Very large chat histories may impact performance

## Dependencies Added

No new npm packages required. Uses existing:
- `@built-in-ai/core` - Chrome Built-in AI
- `@built-in-ai/web-llm` - WebLLM fallback
- `@ai-sdk/react` - AI SDK streaming
- `chrome` - Browser extension APIs

## Debugging

### Console Logs
- `[Background] Rewrite text clicked with tone: {tone}`
- `[App] Received rewrite text request: {data}`
- `[App] Rewrite text complete`

### Common Issues
- **Context menu not appearing**: Check manifest permissions for contextMenus
- **Sidebar not opening**: Verify chrome.sidePanel.open() support
- **No rewrite response**: Check AI provider availability and browser console
- **Text not streaming**: Verify transport.streamSummary() is working
