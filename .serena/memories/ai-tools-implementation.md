# AI Tools Implementation - Complete Feature Documentation

This document covers the comprehensive AI tools system that enables the extension to call external functions during chat conversations.

## Overview

The AI Tools feature allows the Built-in AI provider (Gemini Nano) to call registered tools/functions during conversations, enabling capabilities like weather lookups, API calls, and other external data retrieval. This is implemented using the Vercel AI SDK's tools API integrated with Chrome's Built-in AI.

**Key Capabilities:**
- **Tool Registry**: Centralized management of all available tools
- **Tool Picker UI**: User interface for selecting which tools are enabled
- **Tool Persistence**: User tool preferences saved to chrome.storage.local
- **Provider Integration**: Tools only work with Built-in AI (Gemini Nano)
- **Message Format**: Tool invocations displayed in chat with collapsible UI
- **Parts Preservation**: Tool call/result data persisted in chat history

## Architecture Overview

```
Tool Flow:
User enables tools via ToolPicker
    ↓
Selection stored in chrome.storage.local
    ↓
ClientSideChatTransport.setSelectedTools() called
    ↓
buildEnabledTools() creates tools object for AI SDK
    ↓
streamText({ tools, stopWhen: stepCountIs(5) }) sent to Built-in AI
    ↓
AI decides to call tool → Tool part emitted
    ↓
Tool executed locally → Result returned
    ↓
Result displayed in chat message with collapsible UI
    ↓
Full parts array persisted to chat storage
```

## Core Components

### 1. Tool Registry (`src/lib/tools/registry.ts`)

Centralized management of all available tools.

**Key Functions:**
- `buildEnabledTools(enabledToolIds: string[])` - Build tools object for AI SDK
- `getDefaultToolSelection()` - Get default enabled/disabled state for all tools
- `getSelectedToolIds(selection: ToolSelection)` - Extract enabled tool IDs

**Tool Definition Structure:**
```typescript
interface ToolDefinition {
  id: string              // Unique identifier (e.g., 'getWeather')
  label: string          // Display name in UI
  description: string    // What the tool does
  inputSchema: z.ZodSchema  // Input validation schema
  enabledByDefault: boolean // Default enabled state
  execute: (input: unknown) => Promise<unknown>  // Tool execution
}
```

**Current Tools:**
- `weatherTool` - Get weather information for a location (mock implementation)

**Adding New Tools:**
1. Create tool definition file in `src/lib/tools/` (e.g., `new-tool.ts`)
2. Define tool using `ToolDefinition` interface
3. Add to `ALL_TOOLS` array in `registry.ts`
4. Tool automatically appears in ToolPicker UI

### 2. Tool Storage (`src/lib/tool-storage.ts`)

Persistence layer for user tool preferences.

**Storage Key**: `'tool-selection'`

**Functions:**
- `getSelectedTools()` - Load tool selection from storage
- `saveSelectedTools(selection: ToolSelection)` - Save to storage
- `updateToolSelection(toolId, enabled)` - Toggle single tool
- `onToolSelectionChange(callback)` - Subscribe to storage changes

**Storage Format:**
```typescript
{
  'tool-selection': {
    'getWeather': true,
    'getRegistry': false,
    // ... other tools
  }
}
```

### 3. Tool Selection Hook (`src/hooks/use-selected-tools.ts`)

React hook for managing tool selection state.

**Features:**
- Auto-loads from storage on mount
- Subscribes to storage changes (cross-tab sync)
- Provides toggle function for UI
- Returns enabled tool IDs array

**API:**
```typescript
const {
  tools,              // ToolSelection object
  isLoading,          // Boolean
  toggleTool,         // (toolId, enabled) => Promise<void>
  getEnabledToolIds,  // () => string[]
  isToolEnabled,      // (toolId) => boolean
} = useSelectedTools()
```

### 4. Tool Picker UI (`src/components/ui/tool-picker.tsx`)

Popover interface for selecting enabled tools.

**Features:**
- Fixed-position popover above message input
- Checkbox list of all available tools
- Tool descriptions shown inline
- Yellow indicator when not all tools selected
- Smooth animations with Framer Motion

**Props:**
```typescript
interface ToolPickerProps {
  selectedTools: ToolSelection
  onToolChange: (toolId: string, enabled: boolean) => void
  className?: string
}
```

**Usage:**
```tsx
<ToolPicker
  selectedTools={messageTools}
  onToolChange={handleToolChange}
/>
```

## Integration with Chat System

### App.tsx Integration

**State Management:**
```typescript
// Global tool selection (persisted)
const { toggleTool: toggleGlobalTool } = useSelectedTools()

// Per-message tool selection (resets each message)
const [messageTools, setMessageTools] = useState<ToolSelection>({})

// Handle tool toggle
const handleToolChange = useCallback((toolId: string, enabled: boolean) => {
  setMessageTools(prev => ({ ...prev, [toolId]: enabled }))
  toggleGlobalTool(toolId, enabled) // Also update global state
}, [toggleGlobalTool])

// Update transport with selected tools
useEffect(() => {
  const toolIds = Object.entries(messageTools)
    .filter(([, isSelected]) => isSelected)
    .map(([id]) => id)
  transport.setSelectedTools(toolIds)
}, [messageTools, transport])

// Reset tools when input cleared
useEffect(() => {
  if (!input.trim()) {
    setMessageTools({})
  }
}, [input])
```

### ClientSideChatTransport Integration

**Tool Management:**
```typescript
class ClientSideChatTransport {
  private selectedTools: Set<string> = new Set(['getWeather'])
  
  setSelectedTools(toolIds: string[]): void {
    this.selectedTools = new Set(toolIds)
  }
  
  isToolEnabled(toolId: string): boolean {
    return this.selectedTools.has(toolId)
  }
  
  private getEnabledTools() {
    const enabledToolIds = Array.from(this.selectedTools)
    return buildEnabledTools(enabledToolIds)
  }
}
```

**Sending Messages with Tools:**
```typescript
const result = streamText({
  model,
  messages: prompt,
  abortSignal,
  tools: provider === 'built-in-ai' ? this.getEnabledTools() : undefined,
  stopWhen: stepCountIs(5), // Max 5 tool calls per message
})
```

## Message Format & Rendering

### Tool Parts in Messages

Tool invocations create special message parts:

**Part Types:**
- `tool-{toolName}` - Generic tool part from AI SDK
- `tool-invocation` - Custom part for rendering

**Tool Part Structure:**
```typescript
interface ToolPart {
  type: `tool-${string}`
  toolCallId: string
  state: 'input-streaming' | 'output-available' | 'output-error' | 'streaming' | 'complete'
  input?: unknown
  output?: unknown
  providerExecuted?: boolean
}
```

**ToolInvocation Structure:**
```typescript
interface ToolInvocation {
  state: 'call' | 'result' | 'partial-call'
  toolName: string
  input?: unknown
  result?: unknown
  isError?: boolean
}
```

### Message Conversion (`App.tsx`)

**convertToMessage() function** extracts tool data from UIMessage:

```typescript
// Extract tool parts
uiMessage.parts?.forEach((part) => {
  if (part.type.startsWith('tool-')) {
    const toolPart = part as ToolPart
    const toolName = toolPart.type.replace('tool-', '')
    
    let invocationState: 'call' | 'result' | 'partial-call' = 'call'
    if (toolPart.state === 'output-available' || toolPart.state === 'output-error') {
      invocationState = 'result'
    } else if (toolPart.state === 'input-streaming') {
      invocationState = 'partial-call'
    }
    
    toolInvocations.push({
      state: invocationState,
      toolName,
      input: toolPart.input,
      result: toolPart.output,
      isError: toolPart.state === 'output-error'
    })
  }
})
```

### Chat Message Rendering (`chat-message.tsx`)

**Tool Call Component:**
- Collapsible blocks for each tool invocation
- Shows tool name and state (calling/result/error)
- Displays input parameters and output result
- Syntax-highlighted JSON output
- Error state with red highlighting

**States:**
- `input-streaming` - Shows loading spinner, "Calling {tool}..."
- `output-available` - Collapsible block with input/output
- `output-error` - Red alert icon, error message displayed

**ToolPartRenderer Component:**
```tsx
function ToolPartRenderer({ part }: { part: ToolPart }) {
  const [isOpen, setIsOpen] = useState(false)
  const toolName = part.type.replace("tool-", "")
  
  switch (part.state) {
    case "input-streaming":
      return <LoadingState />
    case "output-available":
    case "output-error":
      return <CollapsibleResult />
  }
}
```

## Chat Persistence

### Storing Tool Invocations

**Updated in `use-chat-persistence.ts`:**
```typescript
const chatMessages = messagesToSave.map((msg) => {
  const content = msg.parts?.filter((p) => p.type === 'text')
    .map((p) => p.text).join('') || ''
  
  return {
    id: msg.id,
    role: msg.role,
    content: content,
    timestamp: Date.now(),
    parts: msg.parts, // ⚠️ CRITICAL: Store full parts array
  }
})
```

**Loading from Storage:**
```typescript
const convertedMessages = currentChat.messages.map((msg) => {
  // Restore parts if available, otherwise fallback to text part
  const parts = msg.parts && Array.isArray(msg.parts) && msg.parts.length > 0
    ? msg.parts
    : [{ type: 'text' as const, text: msg.content }]
  
  return {
    id: msg.id,
    role: msg.role,
    parts: parts,
  }
})
```

**ChatMessage Type Updated:**
```typescript
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string  // Text-only fallback
  timestamp: number
  parts?: unknown[]  // Full parts array with tool invocations
}
```

## Provider Compatibility

### Tool Support by Provider

| Provider | Tools Supported | Notes |
|----------|----------------|-------|
| **Built-in AI** | ✅ Yes | Full tool support via Vercel AI SDK |
| **WebLLM** | ❌ No | Tools parameter not passed |
| **Transformers.js** | ❌ No | Tools parameter not passed |

**Why only Built-in AI?**
- Built-in AI uses Gemini Nano which has native tool calling support
- WebLLM and Transformers.js models (Llama 3.2 1B) don't support tool calling in this setup
- Future: Could add tool support via custom prompting for other providers

### Code Guard

```typescript
tools: provider === 'built-in-ai' ? this.getEnabledTools() : undefined
```

This ensures tools are only passed to Built-in AI, preventing errors with other providers.

## Package Updates

### @built-in-ai Packages Upgraded

**Previous Versions:**
- `@built-in-ai/core`: 2.0.0 → **3.0.0-beta.0**
- `@built-in-ai/web-llm`: 0.2.2 → **0.3.1**
- `@built-in-ai/transformers-js`: 0.2.0 → **0.3.2**

**Reason for Upgrade:**
- Beta versions add improved tool support
- Better streaming integration
- Enhanced message part handling
- Required for proper tool invocation flow

**Breaking Changes:**
- None observed in current codebase
- Tool invocation format standardized
- Parts array structure more consistent

## UI/UX Considerations

### When to Show Tool Picker

**Conditions:**
- Message input must have `selectedTools` and `onToolChange` props
- Only visible when both props provided (feature flag-like behavior)

**Visual Indicators:**
- Settings icon with yellow dot when not all tools selected
- Tooltip: "Select AI tools"
- Opens above input (fixed positioning to avoid scroll issues)

### Tool Selection Behavior

**Per-Message Tools:**
- Tools selection resets when input is cleared
- Allows different tool sets for different messages
- Persisted globally but applied per-message

**Global Persistence:**
- User selections saved across browser restarts
- Synced across extension instances (same profile)
- Default tools loaded on first use

### Future Enhancements

**Potential Improvements:**
1. **Real Tool Implementations**:
   - Weather API integration
   - Web search tool
   - Calculator tool
   - Registry lookup tool (stubbed)

2. **Tool Categories**:
   - Group tools by category (Data, Utility, Web, etc.)
   - Collapsible sections in picker

3. **Tool Chaining**:
   - Allow multi-step tool workflows
   - Increase `stopWhen: stepCountIs(5)` limit

4. **Tool Analytics**:
   - Track tool usage frequency
   - Show tool call count per message

5. **Tool Parameters UI**:
   - Pre-fill common parameters
   - Show parameter hints in picker

## Debugging & Troubleshooting

### Console Logging

**Tool Selection:**
```
[App] Message tools updated: ['getWeather']
[ClientSideChatTransport] Selected tools updated: ['getWeather']
```

**Tool Execution:**
```
[Weather Tool] Fetching weather for location: San Francisco
[convertToMessage] Found tool part: { toolName: 'getWeather', state: 'output-available' }
[useChatPersistence] Saving message: parts count: 3
```

**Storage:**
```
[tool-storage] Retrieved selected tools from storage: { getWeather: true }
[tool-storage] Saved selected tools to storage: { getWeather: true }
[tool-storage] Tool selection changed: { getWeather: false }
```

### Common Issues

**Tools Not Being Called:**
- Check provider is Built-in AI (tools only work there)
- Verify tool is enabled in ToolPicker
- Check console for "Selected tools updated" log
- Ensure `getEnabledTools()` returns non-empty object

**Tool Results Not Displaying:**
- Check message parts array contains tool parts
- Verify `convertToMessage()` extracting tool invocations
- Check `ToolPartRenderer` in `chat-message.tsx`
- Ensure collapsible state working

**Persistence Not Working:**
- Verify `parts` field saved to chat storage
- Check chrome.storage.local permissions in manifest
- Confirm `use-chat-persistence.ts` includes parts in save
- Check load function restores parts array

## Best Practices

### When Creating New Tools

1. **Keep execute() Fast**: Tool calls block AI response
2. **Return Structured Data**: JSON objects better than plain text
3. **Handle Errors Gracefully**: Return error objects, don't throw
4. **Add Input Validation**: Use Zod schema for type safety
5. **Descriptive Names**: Both `id` and `description` should be clear
6. **Default State**: Set `enabledByDefault` thoughtfully

### When Modifying Tool System

1. **Don't Break Persistence**: Always include parts in saved messages
2. **Test All Providers**: Ensure non-Built-in-AI providers still work
3. **UI Consistency**: Tool picker should match app design system
4. **Error States**: Handle tool execution failures gracefully
5. **Performance**: Avoid re-rendering on every tool toggle

## Summary

The AI Tools implementation provides:
- **Extensible Architecture**: Easy to add new tools via registry
- **User Control**: UI for enabling/disabling tools per message
- **Persistence**: Tool selections and results saved
- **Provider Safety**: Only enabled for compatible providers
- **Rich UI**: Collapsible tool call/result display
- **Type Safety**: Full TypeScript coverage

All components work together to enable function calling capabilities in the Chrome extension's local AI system, currently supporting Built-in AI (Gemini Nano) with potential for future expansion.
