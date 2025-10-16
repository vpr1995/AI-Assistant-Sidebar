# Codebase Structure

## Root Directory Layout

```
chrome-extension/
├── public/                    # Static assets
│   ├── manifest.json         # Chrome extension manifest (Manifest V3)
│   └── icons/                # Extension icons (16x16, 48x48, 128x128)
├── src/                      # Source code
│   ├── App.tsx              # Main sidebar container component
│   ├── main.tsx             # React entry point
│   ├── background.ts        # Background service worker
│   ├── index.css            # Global styles (Tailwind directives)
│   ├── App.css              # App-specific styles
│   ├── vite-env.d.ts        # Vite type declarations
│   ├── assets/              # Component-scoped assets
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   └── lib/                 # Utility libraries
├── components.json          # shadcn/ui configuration
├── eslint.config.js         # ESLint flat config
├── jsconfig.json            # JavaScript configuration
├── package.json             # Dependencies and scripts
├── PRD.md                   # Product Requirements Document
├── README.md                # Project documentation
├── TASKS.md                 # Detailed implementation tasks (30 tasks)
├── tsconfig.json            # TypeScript configuration (main)
├── tsconfig.app.json        # TypeScript config for React app
├── tsconfig.node.json       # TypeScript config for Node.js scripts
└── vite.config.ts           # Vite build configuration
```

## Source Code Organization

### `/src` - Main Source Directory

#### Core Files
- **`App.tsx`**: Main sidebar container component
  - Responsive layout (400px - 100% width)
  - Fixed header with status indicator
  - Scrollable chat area
  - Fixed input area
  - Reset button functionality
  - Built-in AI detection and warning messages

- **`main.tsx`**: React entry point
  - Mounts App component to `#root`
  - Imports global styles

- **`background.ts`**: Chrome extension background service worker
  - Handles extension lifecycle
  - Side panel management

### `/src/components/ui` - UI Components

All components follow shadcn/ui patterns with Tailwind CSS styling:

#### Chat Components (✅ Implemented)
- **`chat.tsx`**: Main chat container with provider/children pattern
- **`chat-message.tsx`**: Individual message display (user/AI)
- **`message-list.tsx`**: Scrollable message container
- **`message-input.tsx`**: Auto-resizing textarea with submit button
- **`typing-indicator.tsx`**: Bouncing dots animation for AI responses
- **`markdown-renderer.tsx`**: Markdown parsing with highlight.js syntax highlighting

#### Utility Components
- **`button.tsx`**: Base button component (shadcn/ui)
- **`collapsible.tsx`**: Collapsible sections (for reasoning/sources)
- **`copy-button.tsx`**: Copy to clipboard functionality (exists, needs wiring)
- **`sonner.tsx`**: Toast notification system

#### Future Components (⏳ Exist but not yet used)
- **`audio-visualizer.tsx`**: Waveform display for voice input
- **`file-preview.tsx`**: File attachment preview
- **`interrupt-prompt.tsx`**: Stop generation prompt
- **`prompt-suggestions.tsx`**: Example prompt cards for empty state

### `/src/hooks` - Custom React Hooks

- **`use-auto-scroll.ts`**: Auto-scroll to bottom during streaming (✅ in use)
- **`use-autosize-textarea.ts`**: Auto-resize textarea based on content (✅ in use)
- **`use-copy-to-clipboard.ts`**: Copy text to clipboard helper (✅ in use)
- **`use-audio-recording.ts`**: Audio recording for voice input (⏳ planned)

### `/src/lib` - Utility Libraries

- **`utils.ts`**: Utility functions (className merging with `clsx` and `tailwind-merge`)
- **`client-side-chat-transport.ts`**: Custom transport for useChat hook (✅ implemented)
  - `ClientSideChatTransport` class implementing `ChatTransport<BuiltInAIUIMessage>`
  - `sendMessages()` with download progress tracking
  - Stream merging with `writer.merge(result.toUIMessageStream())`
  - Error handling and user notifications
- **`audio-utils.ts`**: Audio processing utilities (⏳ planned for voice input)

## Configuration Files

### TypeScript Configuration
- **`tsconfig.json`**: Main config, references app and node configs
- **`tsconfig.app.json`**: React app config with `jsx: "react-jsx"`, strict mode
- **`tsconfig.node.json`**: Node.js scripts config (Vite, etc.)
- **`jsconfig.json`**: JavaScript fallback configuration

### Build & Linting
- **`vite.config.ts`**: Vite configuration
  - Multiple entry points: sidebar (`index.html`) + background worker (`background.ts`)
  - Output to `dist/` directory
  - Chrome extension build optimizations
- **`eslint.config.js`**: ESLint flat config
  - TypeScript support
  - React hooks and refresh plugins
  - Ignores dist/ and uppercase unused variables

### UI Framework
- **`components.json`**: shadcn/ui configuration
  - Component installation paths
  - Style configuration
  - Alias paths

### Chrome Extension
- **`public/manifest.json`**: Manifest V3 configuration
  - Side panel API
  - Permissions: `storage`, `sidePanel`
  - Content Security Policy: `wasm-unsafe-eval` for WebGPU
  - Background service worker reference

## Import Patterns

### Relative Imports (Local Files)
```typescript
import App from './App'
import { Chat } from './components/ui/chat'
import { useAutoScroll } from './hooks/use-auto-scroll'
import { cn } from './lib/utils'
```

### Absolute Imports (Public Assets)
```typescript
import viteLogo from '/vite.svg'
```

### External Packages
```typescript
import { useChat } from '@ai-sdk/react'
import { builtInAI, doesBrowserSupportBuiltInAI } from '@built-in-ai/core'
import { transformersJS } from '@built-in-ai/transformers-js'
```

## Component Conventions

All React components follow these patterns:

1. **Functional Components**: Use function declarations (not arrow functions)
2. **Hooks**: useState, useEffect, custom hooks at top of component
3. **Default Export**: Always export default for page-level components
4. **Named Exports**: For utility components and types
5. **TypeScript**: Explicit types for props, state, and function parameters
6. **File Extension**: `.tsx` for components, `.ts` for utilities

Example:
```typescript
interface ChatProps {
  messages: Message[];
  onSend: (message: string) => void;
}

export default function Chat({ messages, onSend }: ChatProps) {
  const [input, setInput] = useState<string>('');
  
  return (
    <div className="flex flex-col h-full">
      {/* Component JSX */}
    </div>
  );
}
```

## Styling Approach

- **Tailwind CSS**: Utility-first classes for all styling
- **CSS Modules**: `App.css` for app-specific styles
- **Global Styles**: `index.css` contains Tailwind directives
- **Dark Mode**: Supported via Tailwind's dark mode classes
- **Component Variants**: Using `class-variance-authority` (cva) for component variations

## Data Flow

### Current Architecture (Client-Side Only)
```
User Input → ClientSideChatTransport → Built-in AI Model → Stream → UI Update
```

### State Management
- **Local State**: useState for component-level state
- **Chrome Storage**: For persistence (chat history, settings)
- **No Global State**: No Redux/Zustand yet (not needed for MVP)

### Message Flow
1. User types in MessageInput
2. Submit triggers useChat's append() or sendMessage()
3. ClientSideChatTransport.sendMessages() is called
4. Built-in AI processes and streams response
5. result.toUIMessageStream() merged into writer
6. UI updates reactively via useChat state
7. TypeScript types ensure type safety throughout

## Build Output

```
dist/
├── index.html           # Sidebar HTML
├── background.js        # Background service worker
├── assets/              # Bundled JS/CSS
│   ├── index-[hash].js
│   └── index-[hash].css
└── icons/               # Extension icons (copied from public/)
```

## Dependencies Overview

### Core Dependencies
- `react@^19`, `react-dom@^19`
- `ai@^4.1.10` (Vercel AI SDK)
- `@ai-sdk/react@^1.0.19` (useChat hook)
- `@built-in-ai/core@^0.1.21` (Chrome Built-in AI)
- `@built-in-ai/transformers-js@^0.1.21` (Transformers.js fallback)

### UI Dependencies
- `tailwindcss@^4.1.5`
- `tailwind-merge@^2.7.2`, `clsx@^2.1.1`
- `class-variance-authority@^0.7.1`
- `lucide-react@^0.468.0` (icons)
- `sonner@^1.7.2` (toast notifications)

### Development Dependencies
- `vite@^7.0.4`
- `typescript@~5.6.2`
- `@types/react@^19.0.11`, `@types/react-dom@^19.0.3`
- `eslint@^9.17.0`
- `@vitejs/plugin-react@^4.3.4`

## File Naming Conventions

- **Components**: `kebab-case.tsx` (e.g., `chat-message.tsx`)
- **Hooks**: `use-kebab-case.ts` (e.g., `use-auto-scroll.ts`)
- **Utilities**: `kebab-case.ts` (e.g., `audio-utils.ts`)
- **Types**: Co-located with components or in `.d.ts` files
- **Config**: `kebab-case.js/ts` (e.g., `vite.config.ts`)

## Git Ignore Patterns

```
node_modules/
dist/
*.log
.DS_Store
.env
.vscode/ (except settings.json if shared)
```

## Development Workflow

1. **Start Dev Server**: `npm run dev` (Vite dev server on port 5173)
2. **Build**: `npm run build` (outputs to dist/)
3. **Preview Build**: `npm run preview`
4. **Lint**: `npm run lint`
5. **Load Extension**: Chrome → Extensions → Load unpacked → select `dist/` folder
