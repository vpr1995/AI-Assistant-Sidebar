# Codebase Structure

## Directory Layout

```
chrome-extension/
├── .eslintrc.js              # ESLint configuration
├── .gitignore                # Git ignore rules
├── components.json           # shadcn/ui config
├── eslint.config.js          # ESLint config (alternative)
├── index.html                # Main HTML (sidebar entry point)
├── jsconfig.json             # JS config
├── package.json              # Dependencies and scripts
├── PRD.md                    # Product requirements document
├── README.md                 # Project readme
├── TASKS.md                  # Task list and timeline
├── tsconfig.json             # TypeScript main config
├── tsconfig.app.json         # TypeScript app config (strict mode)
├── tsconfig.node.json        # TypeScript Node config
├── vite.config.ts            # Vite build configuration
│
├── public/                   # Static files
│   ├── manifest.json         # Chrome extension manifest
│   └── icons/
│       ├── icon16.png        # 16x16 icon
│       ├── icon48.png        # 48x48 icon
│       └── icon128.png       # 128x128 icon
│
├── src/
│   ├── App.tsx               # Main app component with summarization
│   ├── App.css               # Main styles
│   ├── background.ts         # Background service worker
│   ├── content.ts            # Content script (page extraction)
│   ├── main.tsx              # React entry point
│   ├── index.css             # Global styles
│   ├── vite-env.d.ts         # Vite type definitions
│   ├── transformers-worker.ts # Web Worker for transformers.js
│   │
│   ├── assets/               # Images and static assets
│   │
│   ├── components/
│   │   └── ui/               # UI components
│   │       ├── audio-visualizer.tsx       # Audio visualization
│   │       ├── button.tsx                 # Button component
│   │       ├── chat.tsx                   # Chat container
│   │       ├── chat-message.tsx           # Message display
│   │       ├── collapsible.tsx            # Collapsible sections
│   │       ├── copy-button.tsx            # Copy to clipboard
│   │       ├── file-preview.tsx           # File preview
│   │       ├── interrupt-prompt.tsx       # Interrupt UI
│   │       ├── markdown-renderer.tsx      # Markdown to HTML
│   │       ├── message-input.tsx          # Input component
│   │       ├── message-list.tsx           # Message list with scroll
│   │       ├── model-loading-indicator.tsx # Loading states
│   │       ├── prompt-suggestions.tsx    # Prompt suggestions
│   │       ├── provider-selector.tsx      # Provider dropdown
│   │       ├── sonner.tsx                 # Toast notifications
│   │       └── typing-indicator.tsx       # Typing animation
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── use-audio-recording.ts         # Audio recording
│   │   ├── use-auto-scroll.ts             # Auto-scroll chat
│   │   ├── use-autosize-textarea.ts       # Textarea resize
│   │   ├── use-copy-to-clipboard.ts       # Copy handler
│   │   └── use-provider-context.tsx       # Provider context
│   │
│   └── lib/                  # Utility libraries
│       ├── audio-utils.ts                 # Audio utilities
│       ├── client-side-chat-transport.ts  # AI transport with streaming
│       └── utils.ts                       # General utilities (cn, etc)
│
└── dist/                     # Built output (generated)
    ├── index.html
    ├── background.js
    ├── content.js
    └── assets/
```

## Key Files Detail

### src/App.tsx
- **Main Component**: Sidebar container and chat interface
- **Responsibilities**:
  - Provider detection and switching
  - Chat message handling
  - Page summarization request handler
  - Message streaming and display
- **Key Features**:
  - `detectActiveProvider()` - Detect which AI provider to use
  - Chat state management with useChat hook
  - `handleMessage()` - Handles summarization requests from background
  - `transport.streamSummary()` - Gets AI summary with streaming
  - Auto-clear chat on new summarization

### src/background.ts
- **Context Menu Creation**: Creates "Summarize this page" option
- **Message Routing**: Routes between content script and sidebar
- **Responsibilities**:
  - `chrome.runtime.onInstalled` - Create context menu
  - `chrome.contextMenus.onClicked` - Handle menu clicks
  - Content script communication via `chrome.tabs.sendMessage()`
  - Sidebar communication via `chrome.runtime.sendMessage()`

### src/content.ts
- **Page Content Extraction**: Uses @mozilla/readability
- **Responsibilities**:
  - `chrome.runtime.onMessage` listener
  - Parse article content from DOM
  - Fallback extraction if Readability fails
  - Return structured data (title, content, byline, etc)
- **Data Extracted**:
  - `title` - Article title
  - `content` - Main article text
  - `excerpt` - Brief excerpt
  - `byline` - Author name if available
  - `siteName` - Website name
  - `url` - Page URL

### src/lib/client-side-chat-transport.ts
- **Custom AI Transport**: Implements dual-provider streaming
- **Key Methods**:
  - `sendMessages()` - Standard chat message handling
  - `summarizeText()` - Full text summarization (returns complete)
  - `streamSummary()` - Streaming summarization (callback per chunk)
  - `selectProvider()` - Choose Built-in AI or WebLLM
  - `getActiveProvider()` - Get current provider
  - `setPreferredProvider()` - Switch provider
  - `onProviderChange()` - Subscribe to provider changes
- **Implementation**:
  - Uses `streamText()` from Vercel AI SDK
  - Converts to `UIMessageStream` for consumption
  - Handles both Built-in AI and WebLLM

### src/components/ui/chat.tsx
- **Main Chat Component**: Container for messages and input
- **Props**:
  - `messages` - Array of chat messages
  - `input` - Current input text
  - `handleInputChange` - Input change handler
  - `handleSubmit` - Submit message handler
  - `isGenerating` - Loading state
  - `stop` - Abort generation
  - `append` - Add message directly

### src/components/ui/chat-message.tsx
- **Message Display**: Renders user and assistant messages
- **Features**:
  - Markdown rendering with syntax highlighting
  - Code copy buttons
  - Different styling for user/assistant
  - Animations on message appear

### src/components/ui/markdown-renderer.tsx
- **Markdown to HTML**: Converts markdown content
- **Features**:
  - Syntax highlighting with highlight.js
  - Code block styling
  - Link handling
  - Table support (GitHub flavored markdown)
- **Languages Supported**:
  - JavaScript, TypeScript
  - Python, Bash
  - JSON

### src/components/ui/typing-indicator.tsx
- **Animated Typing**: Shows AI is generating
- **Animation**: Bouncing dots with smooth motion

### public/manifest.json
- **Chrome Extension Manifest**:
  - `version` - Current version
  - `permissions` - Requested permissions:
    - `storage` - Local storage
    - `sidePanel` - Sidebar panel
    - `contextMenus` - Right-click menu
    - `activeTab` - Current tab info
    - `scripting` - Inject scripts
  - `content_scripts` - Load content.ts on all pages
  - `background` - Load background.ts

### vite.config.ts
- **Build Configuration**:
  - Multiple entry points:
    - `main` → `index.html` (React app)
    - `background` → `src/background.ts`
    - `content` → `src/content.ts`
  - Output configuration:
    - Main app → `assets/main-*.js`
    - Background → `background.js`
    - Content → `content.js`

## Component Tree

```
<App>
  ├── Header (status, provider selector, reset)
  ├── <Chat>
  │   ├── <MessageList>
  │   │   ├── <ChatMessage> (user)
  │   │   │   └── <MarkdownRenderer>
  │   │   ├── <ChatMessage> (assistant)
  │   │   │   ├── <MarkdownRenderer>
  │   │   │   ├── <CopyButton>
  │   │   │   └── <TypingIndicator> (while streaming)
  │   │   └── ... more messages
  │   │
  │   ├── <MessageInput>
  │   │   ├── textarea with auto-resize
  │   │   ├── model selector (WebLLM only)
  │   │   └── submit button
  │   │
  │   └── Suggestions (empty state)
  │
  └── Modals
      └── Various dialogs (error, settings, etc)
```

## Data Flow

### Chat Message Flow
```
User types and submits
    ↓
App.handleSubmit()
    ↓
setInput('') - Clear input
    ↓
sendMessage({ text: input })
    ↓
transport.sendMessages()
    ↓
AI Provider (Built-in AI or WebLLM)
    ↓
streamText() → toUIMessageStream()
    ↓
Chunks received → Update UI
    ↓
Message rendered with markdown
```

### Page Summarization Flow
```
Background context menu click
    ↓
background.ts: chrome.contextMenus.onClicked
    ↓
Send message to content script
    ↓
content.ts: Extract page with @mozilla/readability
    ↓
Return structured data to background
    ↓
background.ts: Send to sidebar via chrome.runtime.sendMessage()
    ↓
App.tsx: handleMessage() receives data
    ↓
Clear existing messages
    ↓
Show user message with title and URL
    ↓
transport.streamSummary(prompt)
    ↓
Callback receives chunks
    ↓
Update AI message with accumulated text
    ↓
Typing animation plays as text arrives
```

## Type Definitions

### Message Type
```typescript
type UIMessage = BuiltInAIUIMessage | WebLLMUIMessage

interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  parts: Array<{ type: 'text'; text: string }>
}
```

### Chat Message (Component)
```typescript
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}
```

### Page Content (from content.ts)
```typescript
interface PageContent {
  title: string
  content: string
  excerpt: string
  byline: string
  siteName: string
  url: string
}
```

## Build Output Structure

```
dist/
├── index.html (380 bytes)
│   └── Loads main-*.js and main-*.css
│
├── background.js (990 bytes)
│   └── Background service worker (minimal)
│
├── content.js (35KB gzipped)
│   └── Content script with @mozilla/readability
│
└── assets/
    ├── main-*.js (2.2MB gzipped)
    │   └── React app with all UI
    │
    ├── main-*.css (8.5KB gzipped)
    │   └── All styles (Tailwind + custom)
    │
    └── transformers-worker-*.js (5.5MB)
        └── AI models and transformers.js
```

## Module Count Breakdown

- **Main app**: ~2,663 modules
- Largest modules:
  - AI SDK and providers
  - React and dependencies
  - Markdown rendering
  - @mozilla/readability (~330 modules saved by switching from shiki)

## Key Configuration Files

### tsconfig.app.json
- `jsx: "react-jsx"` - JSX transform
- `strict: true` - Strict type checking
- `moduleResolution: "bundler"`

### vite.config.ts
- Plugin: React, Tailwind
- Build optimization for multiple outputs
- CSS processing with PostCSS

### tailwind.config.js
- Custom theme variables
- Component classes
- Extend with custom utilities
