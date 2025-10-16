# Codebase Structure

## Directory Layout

```
chrome-extension/
├── .github/
│   └── copilot-instructions.md  # Development guidelines (TypeScript updated)
├── .serena/                      # Serena project configuration
├── public/                       # Static assets (Vite public dir)
│   ├── vite.svg                 # Example static asset
│   ├── manifest.json            # Chrome extension manifest (MV3)
│   ├── background.js            # Chrome background script (legacy)
│   └── icons/                   # Extension icons
├── src/                         # TypeScript/React source code
│   ├── assets/                  # Component-scoped assets
│   │   └── react.svg
│   ├── components/              # React components (to be added)
│   │   └── ui/                  # shadcn/ui components (to be added)
│   ├── lib/                     # Utilities and helpers (to be added)
│   ├── App.tsx                  # Main application component (TypeScript)
│   ├── App.css                  # App-specific styles
│   ├── main.tsx                 # Entry point (TypeScript)
│   ├── background.ts            # Background service worker (TypeScript)
│   ├── vite-env.d.ts           # Vite type declarations
│   └── index.css                # Global styles (with Tailwind)
├── index.html                   # HTML entry point with <div id="root">
├── package.json                 # Dependencies and scripts
├── vite.config.ts              # Vite configuration (TypeScript)
├── eslint.config.js            # ESLint flat config with TypeScript support
├── tsconfig.json               # Root TypeScript config (project references)
├── tsconfig.app.json           # App TypeScript config (src/)
├── tsconfig.node.json          # Node/Vite TypeScript config
├── jsconfig.json               # JavaScript config (legacy, can be removed)
├── README.md                   # Basic template info
├── PRD.md                      # Product Requirements Document
└── TASKS.md                    # Task tracking
```

## Key Files

### Entry Point
- `index.html` - Contains `<div id="root">` mount point, references `/src/main.tsx`
- `src/main.tsx` - Creates React root and renders `<App />` in StrictMode
  - Uses `getElementById('root')!` with non-null assertion
  - Imports from `'./App'` (no extension)

### Main Component
- `src/App.tsx` - Main sidebar UI component (currently simple counter demo)
- Uses functional components with typed `useState<number>` hook
- Exports default

### TypeScript Configuration
- `tsconfig.json` - Root config with project references to app and node configs
- `tsconfig.app.json` - Strict mode for React app code in `src/`
  - Target: ES2020, JSX: react-jsx
  - Includes: `["src"]`
- `tsconfig.node.json` - Config for Node.js/Vite files
  - Includes: `["vite.config.ts"]`
- `src/vite-env.d.ts` - Vite client type declarations

### Build Configuration
- `vite.config.ts` - TypeScript Vite config with:
  - React plugin
  - Tailwind CSS plugin (`@tailwindcss/vite`)
  - Multi-entry build (main app + background worker)
- `eslint.config.js` - Flat config with TypeScript ESLint support
  - Handles `.ts`, `.tsx`, `.js`, `.jsx` files
  - TypeScript recommended rules
  - Web extensions globals
- `package.json` - Module type: "module" (ES modules)

### Chrome Extension Files
- `public/manifest.json` - Manifest V3 configuration
- `src/background.ts` - Background service worker (TypeScript)
  - Compiled by Vite to `dist/background.js`
- `public/background.js` - Legacy background script (for public/)

## Build Output

After `npm run build`, the `dist/` directory contains:
```
dist/
├── index.html                   # Entry HTML
├── assets/
│   ├── main-[hash].js          # Bundled React app
│   ├── main-[hash].css         # Bundled styles
│   ├── background-[hash].js    # Background worker
│   └── react-[hash].svg        # Assets
└── manifest.json               # Copied from public/
```

## Planned Structure

After full implementation, the structure will include:

```
src/
├── components/              # React TypeScript components
│   ├── ui/                 # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── Chat.tsx            # Main chat interface
│   ├── ChatMessages.tsx    # Message rendering
│   ├── ChatHeader.tsx      # Header with model info
│   ├── ChatInput.tsx       # Input area with toolbar
│   ├── ModelSelector.tsx   # Model dropdown
│   ├── Settings.tsx        # Settings modal
│   └── ...
├── lib/                    # TypeScript utilities and AI logic
│   ├── ai/                 # AI pipeline integrations
│   │   ├── text-generation.ts
│   │   ├── image-generation.ts
│   │   ├── speech-to-text.ts
│   │   └── text-to-speech.ts
│   ├── models/             # Model configurations
│   │   ├── model-list.ts
│   │   └── model-registry.ts
│   └── utils/              # Helper functions
│       └── cn.ts           # Tailwind class name utility
├── workers/                # Web Workers
│   ├── worker.ts           # Main model worker
│   └── whisper-worker.ts   # Transcription worker
├── types/                  # TypeScript type definitions
│   ├── models.d.ts
│   └── chrome.d.ts
├── App.tsx                 # Main sidebar container
├── main.tsx                # Entry point
└── background.ts           # Background service worker
```

## Asset Management
- **Public assets**: Place in `public/`, reference with absolute path (e.g., `/vite.svg`)
- **Component assets**: Place in `src/assets/`, import with relative path (e.g., `./assets/react.svg`)
- **Type declarations**: Vite provides types for SVG, CSS imports via `vite-env.d.ts`

## Import Patterns

### TypeScript Imports (No Extensions)
```tsx
import App from './App'                  // Resolves to App.tsx
import { utils } from './lib/utils'      // Resolves to utils.ts
```

### Asset Imports (With Extensions)
```tsx
import logo from './assets/logo.svg'     // SVG import
import './styles.css'                    // CSS import
```

## Type Safety
- All React components are `.tsx` files
- Utility modules are `.ts` files
- Strict type checking enabled across the codebase
- Chrome API types available via `@types/chrome`
- Vite client types via `vite/client` reference
