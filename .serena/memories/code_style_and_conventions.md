# Code Style and Conventions

## Language & Module System
- **Language**: TypeScript (`.tsx` for React components, `.ts` for modules)
- **Module Type**: ES modules (`"type": "module"` in package.json)
- **Syntax**: ES2020+ features, JSX for React components
- **Type System**: Strict mode enabled with comprehensive linting

## TypeScript Configuration

### Compiler Options
- **Target**: ES2020
- **JSX**: react-jsx (automatic React import)
- **Module Resolution**: bundler mode
- **Strict Mode**: Enabled
- **Additional Checks**: 
  - `noUnusedLocals`
  - `noUnusedParameters`
  - `noFallthroughCasesInSwitch`
  - `noUncheckedIndexedAccess`

### Config Files
- `tsconfig.json` - Root config with project references
- `tsconfig.app.json` - App-specific config for `src/`
- `tsconfig.node.json` - Node.js/Vite config files
- `src/vite-env.d.ts` - Vite type declarations

## React Conventions

### Component Style
- **Functional components only** with hooks
- **Default exports** for components
- **PascalCase** for component names
- **camelCase** for variables and functions
- **Explicit type annotations** for state and props

### Example Component Structure
```tsx
import { useState } from 'react'
import './Component.css'
import icon from './assets/icon.svg'

interface ComponentProps {
  title: string
  onAction?: () => void
}

function MyComponent({ title, onAction }: ComponentProps) {
  const [count, setCount] = useState<number>(0)
  
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  )
}

export default MyComponent
```

### Hooks Usage
- **Type annotations**: `useState<Type>(initialValue)`
- Use `useEffect` for side effects
- Custom hooks should start with `use` prefix
- Type return values and parameters of custom hooks
- Currently no global state management (will be added later)

### Type Safety Best Practices
- Always type `useState` explicitly: `useState<number>(0)`
- Use non-null assertion for DOM elements: `getElementById('root')!`
- Type event handlers: `(e: React.MouseEvent<HTMLButtonElement>) => void`
- Define interfaces for component props
- Use `React.FC<Props>` sparingly (prefer direct typing)

## Import Conventions

### Local Files (Relative Paths)
```tsx
import App from './App'                          // No extension needed
import Component from './components/Component'   // TypeScript resolves .tsx
import './App.css'                              // CSS imports
import icon from './assets/icon.svg'            // Component-scoped assets
```

### Public Assets (Absolute Paths)
```tsx
import viteLogo from '/vite.svg'                // From public/ directory
```

### External Packages
```tsx
import { useState } from 'react'                // Named imports
import ReactDOM from 'react-dom/client'         // Default imports
```

## File Naming
- **Components**: `PascalCase.tsx` (e.g., `App.tsx`, `ChatMessage.tsx`)
- **Utilities**: `kebab-case.ts` or `camelCase.ts` (e.g., `model-registry.ts`, `utils.ts`)
- **Styles**: Match component name (e.g., `App.css` for `App.tsx`)
- **Workers**: `kebab-case.ts` or `camelCase.ts` (e.g., `worker.ts`, `whisper-worker.ts`)
- **Type Declarations**: `*.d.ts` (e.g., `vite-env.d.ts`)

## ESLint Rules

### Configured Rules
- **@typescript-eslint/no-unused-vars**: Error, but ignores uppercase variables
  - Pattern: `^[A-Z_]` allows unused constants
- **React Hooks**: Follows `recommended-latest` rules
- **React Refresh**: Enabled for Vite HMR
- **TypeScript**: Recommended TypeScript ESLint rules enabled

### Ignored Patterns
- `dist/` directory (build output)

### Globals
- `browser` - Standard browser globals
- `webextensions` - Chrome extension APIs (chrome.*)

## Code Organization

### Component Structure
```tsx
// 1. Imports (React, types, libraries, components, styles, assets)
import { useState } from 'react'
import type { ReactNode } from 'react'
import SomeLibrary from 'some-library'
import ChildComponent from './ChildComponent'
import './Component.css'

// 2. Type definitions
interface ComponentProps {
  title: string
  children?: ReactNode
}

// 3. Component definition
function Component({ title, children }: ComponentProps) {
  // State declarations with types
  const [value, setValue] = useState<number>(0)
  
  // Event handlers with types
  const handleClick = (): void => {
    setValue(value + 1)
  }
  
  // Render
  return (
    <div>
      <h1>{title}</h1>
      <ChildComponent onClick={handleClick} />
      {children}
    </div>
  )
}

// 4. Export
export default Component
```

### Folder Organization
- Keep related files together (component + styles + assets)
- Use `index.ts` for cleaner imports from folders
- Group by feature, not by type (when project grows)

## Styling Conventions
- **CSS files** per component (e.g., `App.css`)
- **Global styles** in `src/index.css`
- **Tailwind CSS** - Use utility classes where possible
- **Class naming**: Tailwind utilities + BEM for custom classes
- Avoid inline styles unless necessary

## Best Practices
- **StrictMode**: Always wrap root component in `<StrictMode>`
- **Keys in lists**: Always provide unique `key` prop for mapped elements
- **Type safety**: Prefer interfaces over types for object shapes
- **Null checks**: Use optional chaining (`?.`) and nullish coalescing (`??`)
- **Comments**: Use `//` for single-line, `/* */` for multi-line
- **JSX comments**: Use `{/* comment */}` inside JSX
- **Non-null assertions**: Use `!` sparingly and only when certain

## Chrome Extension Specifics
- Use `@types/chrome` for Chrome API types
- Background scripts can be `.ts` (compiled by Vite)
- Content scripts should also be TypeScript
- Type chrome.* API calls properly

## Future Conventions (When Adding Features)
- **Tailwind**: Use utility classes, avoid custom CSS when possible
- **shadcn/ui**: Follow their component patterns and conventions
- **API calls**: Wrap in try-catch with proper error handling and type guards
- **Web Workers**: Use provided handler classes from `@built-in-ai/transformers-js`
- **Async operations**: Always type Promise return values
