# Codebase Structure

## Directory Layout

```
chrome-extension/
├── .github/
│   └── copilot-instructions.md  # Development guidelines
├── .serena/                      # Serena project configuration
├── public/                       # Static assets (Vite public dir)
│   └── vite.svg                 # Example static asset
├── src/                         # Source code
│   ├── assets/                  # Component-scoped assets
│   │   └── react.svg
│   ├── App.jsx                  # Main application component
│   ├── App.css                  # App-specific styles
│   ├── main.jsx                 # Entry point (renders App into #root)
│   └── index.css                # Global styles
├── index.html                   # HTML entry point with <div id="root">
├── package.json                 # Dependencies and scripts
├── vite.config.js               # Vite configuration
├── eslint.config.js             # ESLint flat config
├── README.md                    # Basic Vite + React template info
├── PRD.md                       # Product Requirements Document (detailed specs)
└── repomix-output.xml           # Project analysis output
```

## Key Files

### Entry Point
- `index.html` - Contains `<div id="root">` mount point
- `src/main.jsx` - Creates React root and renders `<App />` in StrictMode

### Main Component
- `src/App.jsx` - Currently a simple counter demo, will become the main sidebar UI
- Uses functional components with `useState` hook
- Exports default

### Configuration
- `vite.config.js` - Vite config with React plugin
- `eslint.config.js` - Flat config ESLint setup
- `package.json` - Module type: "module" (ES modules)

## Planned Structure

After implementation, the structure will evolve to:

```
src/
├── components/              # React components
│   ├── Chat.jsx            # Main chat interface
│   ├── ChatMessages.jsx    # Message rendering
│   ├── ChatHeader.jsx      # Header with model info
│   ├── ChatInput.jsx       # Input area with toolbar
│   ├── ModelSelector.jsx   # Model dropdown
│   ├── Settings.jsx        # Settings modal
│   └── ...                 # More shadcn/ui components
├── lib/                    # Utilities and AI logic
│   ├── ai/                 # AI pipeline integrations
│   │   ├── text-generation.js
│   │   ├── image-generation.js
│   │   ├── speech-to-text.js
│   │   └── text-to-speech.js
│   ├── models/             # Model configurations
│   │   ├── model-list.js
│   │   └── model-registry.js
│   └── utils/              # Helper functions
├── workers/                # Web Workers
│   ├── worker.ts           # Main model worker
│   └── whisper-worker.ts   # Transcription worker
├── App.jsx                 # Main sidebar container
└── main.jsx                # Entry point
```

## Asset Management
- **Public assets**: Place in `public/`, reference with absolute path (e.g., `/vite.svg`)
- **Component assets**: Place in `src/assets/`, import with relative path (e.g., `./assets/react.svg`)
