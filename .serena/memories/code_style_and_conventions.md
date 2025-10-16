# Code Style and Conventions

## Language & Module System
- **Language**: JavaScript (JSX) - No TypeScript currently
- **Module Type**: ES modules (`"type": "module"` in package.json)
- **Syntax**: ES2020+ features, JSX for React components

## React Conventions

### Component Style
- **Functional components only** with hooks
- **Default exports** for components
- **PascalCase** for component names
- **camelCase** for variables and functions

### Example Component Structure
```jsx
import { useState } from 'react'
import './Component.css'
import icon from './assets/icon.svg'

function MyComponent() {
  const [state, setState] = useState(initialValue)
  
  return (
    <div>
      {/* JSX content */}
    </div>
  )
}

export default MyComponent
```

### Hooks Usage
- Use `useState` for local component state
- Use `useEffect` for side effects
- Custom hooks should start with `use` prefix
- Currently no global state management (will be added later)

## Import Conventions

### Local Files (Relative Paths)
```jsx
import App from './App.jsx'              // Same directory
import Component from './components/Component.jsx'  // Subdirectory
import './App.css'                       // CSS imports
import icon from './assets/icon.svg'     // Component-scoped assets
```

### Public Assets (Absolute Paths)
```jsx
import viteLogo from '/vite.svg'         // From public/ directory
```

### External Packages
```jsx
import { useState } from 'react'         // Named imports
import ReactDOM from 'react-dom/client'  // Default imports
```

## File Naming
- **Components**: `PascalCase.jsx` (e.g., `App.jsx`, `ChatMessage.jsx`)
- **Utilities**: `kebab-case.js` or `camelCase.js` (e.g., `model-registry.js`, `utils.js`)
- **Styles**: Match component name (e.g., `App.css` for `App.jsx`)
- **Workers**: `kebab-case.ts` or `camelCase.ts` (e.g., `worker.ts`, `whisper-worker.ts`)

## ESLint Rules

### Configured Rules
- **no-unused-vars**: Error, but ignores uppercase variables (React imports)
  - Pattern: `^[A-Z_]` allows unused `React` or `_CONSTANTS`
- **React Hooks**: Follows `recommended-latest` rules
- **React Refresh**: Enabled for Vite HMR

### Ignored Patterns
- `dist/` directory (build output)

## Code Organization

### Component Structure
```jsx
// 1. Imports (React, libraries, components, styles, assets)
import { useState } from 'react'
import SomeLibrary from 'some-library'
import ChildComponent from './ChildComponent.jsx'
import './Component.css'

// 2. Component definition
function Component() {
  // State declarations
  const [value, setValue] = useState(0)
  
  // Event handlers
  const handleClick = () => {
    setValue(value + 1)
  }
  
  // Render
  return (
    <div>
      <ChildComponent onClick={handleClick} />
    </div>
  )
}

// 3. Export
export default Component
```

### Folder Organization
- Keep related files together (component + styles + assets)
- Use `index.js` for cleaner imports from folders
- Group by feature, not by type (when project grows)

## Styling Conventions
- **CSS files** per component (e.g., `App.css`)
- **Global styles** in `src/index.css`
- **Class naming**: Currently freestyle, will use Tailwind utility classes
- Avoid inline styles unless necessary

## Best Practices
- **StrictMode**: Always wrap root component in `<StrictMode>`
- **Keys in lists**: Always provide unique `key` prop for mapped elements
- **Prop validation**: Not enforced (no PropTypes or TypeScript), but be consistent
- **Comments**: Use `//` for single-line, `/* */` for multi-line
- **JSX comments**: Use `{/* comment */}` inside JSX

## Future Conventions (When Adding Features)
- **TypeScript**: If added, update ESLint for `typescript-eslint`
- **Tailwind**: Use utility classes, avoid custom CSS when possible
- **shadcn/ui**: Follow their component patterns and conventions
- **API calls**: Wrap in try-catch with proper error handling
- **Web Workers**: Use provided handler classes from `@built-in-ai/transformers-js`
