# Chrome Extension React App

This is a React application built with Vite and TypeScript, designed as a starting point for a Chrome extension. It uses modern React 19 with functional components and hooks.

## Architecture

- **Entry Point**: `src/main.tsx` renders the app into `#root` in `index.html`
- **Main Component**: `src/App.tsx` - single-page app with local state
- **Build Tool**: Vite (v7) for fast development and HMR
- **Language**: TypeScript with strict type checking
- **Styling**: CSS modules in `src/App.css` and `src/index.css`, with Tailwind CSS support
- **Assets**: Public assets in `public/` (e.g., `/vite.svg`), component assets in `src/assets/`

Data flows are simple: component-level state with `useState`, no global state management yet.

## Key Workflows

- **Development**: `npm run dev` starts Vite dev server on http://localhost:5173 with HMR
- **Build**: `npm run build` outputs to `dist/` directory
- **Linting**: `npm run lint` checks `**/*.{js,jsx,ts,tsx}` with ESLint (ignores `dist/`)
- **Preview**: `npm run preview` serves the built app locally

For Chrome extension integration, `manifest.json` is in `public/` and `vite.config.ts` builds the background service worker.

## Conventions

- **Modules**: ES modules (`"type": "module"` in `package.json`)
- **Components**: Functional with hooks, export default, written in TypeScript
- **Types**: Explicit types for state, props, and function parameters
- **Imports**: Relative paths for local files (e.g., `import App from './App'`), absolute for public assets (e.g., `import viteLogo from '/vite.svg'`)
- **Linting**: Flat config ESLint with React hooks, refresh plugins, and TypeScript support; `@typescript-eslint/no-unused-vars` ignores uppercase vars
- **File Structure**: `src/` for source (`.tsx`, `.ts`), `public/` for static assets

## TypeScript Configuration

- **Main config**: `tsconfig.json` references `tsconfig.app.json` and `tsconfig.node.json`
- **App config**: `tsconfig.app.json` for React app with `jsx: "react-jsx"`, strict mode enabled
- **Node config**: `tsconfig.node.json` for Vite config and Node.js scripts
- **Strict mode**: Enabled with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`

## Examples

- State management: `const [count, setCount] = useState<number>(0)` in `App.tsx`
- Asset import: `import reactLogo from './assets/react.svg'` for component-scoped assets
- HMR testing: Edit `src/App.tsx` and save to see changes instantly
- Type declarations: `src/vite-env.d.ts` includes Vite client types

Always use TypeScript for new React components and modules. Use proper type annotations for props, state, and event handlers.
