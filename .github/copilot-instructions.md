# Chrome Extension React App

This is a React application built with Vite, designed as a starting point for a Chrome extension. It uses modern React 19 with functional components and hooks.

## Architecture

- **Entry Point**: `src/main.jsx` renders the app into `#root` in `index.html`
- **Main Component**: `src/App.jsx` - single-page app with local state
- **Build Tool**: Vite (v7) for fast development and HMR
- **Styling**: CSS modules in `src/App.css` and `src/index.css`
- **Assets**: Public assets in `public/` (e.g., `/vite.svg`), component assets in `src/assets/`

Data flows are simple: component-level state with `useState`, no global state management yet.

## Key Workflows

- **Development**: `npm run dev` starts Vite dev server on http://localhost:5173 with HMR
- **Build**: `npm run build` outputs to `dist/` directory
- **Linting**: `npm run lint` checks `**/*.{js,jsx}` with ESLint (ignores `dist/`)
- **Preview**: `npm run preview` serves the built app locally

For Chrome extension integration, add `manifest.json` to `public/` and modify `vite.config.js` for extension builds.

## Conventions

- **Modules**: ES modules (`"type": "module"` in `package.json`)
- **Components**: Functional with hooks, export default
- **Imports**: Relative paths for local files (e.g., `import App from './App.jsx'`), absolute for public assets (e.g., `import viteLogo from '/vite.svg'`)
- **Linting**: Flat config ESLint with React hooks and refresh plugins; `no-unused-vars` ignores uppercase vars (for unused React imports)
- **File Structure**: `src/` for source, `public/` for static assets

## Examples

- State management: `const [count, setCount] = useState(0)` in `App.jsx`
- Asset import: `import reactLogo from './assets/react.svg'` for component-scoped assets
- HMR testing: Edit `src/App.jsx` and save to see changes instantly

Avoid adding TypeScript without updating ESLint config for `typescript-eslint`.