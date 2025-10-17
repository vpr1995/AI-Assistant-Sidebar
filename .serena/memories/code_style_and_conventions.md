# Code Style and Conventions

## Component Patterns

### Functional Components
```typescript
// ✅ Correct: Function declaration at top level
function MyComponent() {
  return <div>Content</div>
}

// ❌ Avoid: Arrow function for top-level component
const MyComponent = () => {
  return <div>Content</div>
}
```

### Props and Types
```typescript
// ✅ Always use explicit types
interface MyComponentProps {
  title: string
  count: number
  onClick: (id: string) => void
}

function MyComponent({ title, count, onClick }: MyComponentProps) {
  return <div>{title}</div>
}

// ❌ Avoid: Implicit any types
function MyComponent(props: any) {
  return <div>{props.title}</div>
}
```

### Hooks Usage
```typescript
// ✅ Standard React hooks
const [state, setState] = useState<string>('')
const [data, setData] = useState<DataType | null>(null)

// ✅ Effect with cleanup
useEffect(() => {
  const handler = () => { /* ... */ }
  element.addEventListener('event', handler)
  return () => element.removeEventListener('event', handler)
}, [dependency])

// ✅ Callback with dependencies
const handleClick = useCallback(() => {
  // Only recreated if dependencies change
}, [dependency])

// ✅ Memoization for expensive computations
const value = useMemo(() => {
  return expensiveCalculation(data)
}, [data])
```

## File Organization

### Imports
Group in this order:
1. React and external libraries
2. UI components
3. Hooks
4. Utilities and types
5. Styles

```typescript
import { useState, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'

import { Chat } from '@/components/ui/chat'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'

import { useAutoScroll } from '@/hooks/use-auto-scroll'
import { cn } from '@/lib/utils'

import './App.css'
```

### File Naming
- **Components**: `kebab-case.tsx`
  - Example: `chat-message.tsx`, `message-list.tsx`
  
- **Hooks**: `use-kebab-case.ts`
  - Example: `use-auto-scroll.ts`, `use-copy-to-clipboard.ts`
  
- **Utilities**: `kebab-case.ts`
  - Example: `utils.ts`, `audio-utils.ts`
  
- **Type definitions**: In same file or `types.ts`

### Component File Structure
```typescript
// Interfaces and types
interface ComponentProps {
  title: string
}

// Helper functions
function helperFunction() { }

// Main component
function Component({ title }: ComponentProps) {
  // Hooks first
  const [state, setState] = useState()
  
  // Effects
  useEffect(() => {}, [])
  
  // Event handlers
  const handleClick = () => {}
  
  // Render
  return <div>{title}</div>
}

export default Component
```

## Styling

### Tailwind Classes
```typescript
// ✅ Use utility classes
<div className="flex items-center gap-2 p-4 rounded-lg bg-muted">

// ✅ Use cn() for conditional classes
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "disabled-classes"
)}>

// ❌ Avoid: Inline style objects
<div style={{ display: 'flex', gap: '8px' }}>

// ❌ Avoid: CSS-in-JS for simple cases
const styles = { container: { display: 'flex' } }
```

### Dark Mode
- Use CSS variables for theme colors
- Tailwind handles dark class application
- Example: `bg-background dark:bg-background`

### Component Styling Pattern
```typescript
// ✅ Use cva (class-variance-authority) for variants
const buttonVariants = cva(
  "px-4 py-2 rounded-md transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary/90",
        secondary: "bg-secondary text-black hover:bg-secondary/90",
      },
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
}
```

## Async/Await Patterns

```typescript
// ✅ Async operations in effects
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch('/api/data')
      const data = await response.json()
      setData(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }
  
  fetchData()
}, [dependency])

// ✅ Async handlers
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
    await submitForm()
  } catch (error) {
    setError(error.message)
  }
}

// ❌ Avoid: Direct async in useEffect return
useEffect(() => {
  return async () => { } // ❌ Don't do this
}, [])
```

## TypeScript Conventions

### Explicit Return Types
```typescript
// ✅ Always type function returns
function getData(): Promise<DataType> {
  return fetch('/api/data').then(r => r.json())
}

function sum(a: number, b: number): number {
  return a + b
}

// ❌ Avoid: Implicit returns
function getData() {
  return fetch('/api/data').then(r => r.json())
}
```

### Type Unions and Guards
```typescript
// ✅ Discriminated unions
type Response = 
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

// ✅ Type guards
function isSuccess(response: Response): response is { status: 'success'; data: T } {
  return response.status === 'success'
}

if (isSuccess(response)) {
  console.log(response.data)
}

// ✅ Exhaustive checks with never
type Direction = 'up' | 'down' | 'left' | 'right'

function handle(dir: Direction) {
  switch (dir) {
    case 'up': break
    case 'down': break
    case 'left': break
    case 'right': break
    default: const _exhaustive: never = dir
  }
}
```

### Generics
```typescript
// ✅ Generic components
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>
}

// ✅ Generic utility functions
function createMap<K, V>(keys: K[], values: V[]): Map<K, V> {
  return new Map(keys.map((k, i) => [k, values[i]]))
}
```

## Naming Conventions

### Variables and Functions
```typescript
// ✅ Clear, descriptive names
const isLoading = true
const handleSubmit = () => {}
const messageCount = 5
const getActiveProvider = () => {}

// ❌ Avoid: Single letters or abbreviations
const l = true
const h = () => {}
const cnt = 5
const getAProv = () => {}
```

### Constants
```typescript
// ✅ UPPER_CASE for true constants
const MAX_MESSAGE_LENGTH = 1000
const STORAGE_KEY = 'chat_history'

// ✅ camelCase for static values
const defaultTimeout = 5000
const supportedProviders = ['built-in-ai', 'web-llm']
```

### Booleans
```typescript
// ✅ Use is/has/can prefixes
const isLoading = false
const hasError = true
const canSubmit = true
const isVisible = false

// ❌ Avoid unclear names
const loading = false
const error = true
const submit = true
```

## Error Handling

```typescript
// ✅ Specific error handling
try {
  await aiProvider.generateText(prompt)
} catch (error) {
  if (error instanceof ValidationError) {
    handleValidationError(error)
  } else if (error instanceof TimeoutError) {
    handleTimeoutError(error)
  } else {
    console.error('Unknown error:', error)
  }
}

// ✅ Type-safe error handling
const result = await operation().catch(error => {
  console.error('Operation failed:', error)
  return null
})

// ❌ Avoid: Generic catches
try {
  await operation()
} catch (e) {
  console.error('Error:', e) // ❌ e is unknown
}
```

## Logging

```typescript
// ✅ Use consistent log prefixes
console.log('[App] Component mounted')
console.log('[Chat] Message sent')
console.error('[Transport] Provider error:', error)

// ✅ Log with context
console.log('[API] GET /data', { status: 200, duration: 45 })

// ❌ Avoid: Vague logs
console.log('test')
console.log('error in something')
```

## Comments and Documentation

```typescript
// ✅ Comment why, not what
// Use setTimeout to ensure layout has painted before scroll
setTimeout(() => scrollToBottom(), 0)

// ✅ Document complex functions
/**
 * Streams summary text with callback for each chunk
 * Allows UI to update in real-time as text is generated
 * 
 * @param prompt - The summarization prompt with page content
 * @param onChunk - Callback called with each text delta
 * @returns Promise that resolves when streaming completes
 */
async streamSummary(prompt: string, onChunk: (chunk: string) => void): Promise<void>

// ✅ Mark TODO items
// TODO: Add retry logic for failed API calls
// FIXME: Handle edge case when model is not available
```

## Git Commit Messages

Follow conventional commits:
```
feat(feature-name): description of feature
fix(component): description of fix
docs(readme): update documentation
style(css): fix formatting
refactor(hooks): improve code structure
perf(transport): optimize streaming
test(chat): add new test cases
chore(deps): update dependencies
```

Examples:
```
feat(summarize): add page summarization with context menu
fix(ui): fix link colors visibility in messages
docs(project): update readme with summarization feature
refactor(transport): extract streaming logic into helper method
```

## Performance Optimization

### Memoization
```typescript
// ✅ Memo for expensive renders
const Message = React.memo(function Message({ content }) {
  return <div>{content}</div>
})

// ✅ useMemo for expensive computations
const summary = useMemo(() => {
  return messages.reduce((sum, m) => sum + m.length, 0)
}, [messages])

// ✅ useCallback for event handlers
const handleClick = useCallback(() => {
  dispatch(action)
}, [dispatch])
```

### Lazy Loading
```typescript
// ✅ Code splitting with lazy
const SettingsModal = lazy(() => import('./SettingsModal'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsModal />
    </Suspense>
  )
}
```

## Accessibility

```typescript
// ✅ Semantic HTML
<button onClick={handleClick} aria-label="Send message">
  Send
</button>

// ✅ ARIA labels for context
<div role="status" aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// ✅ Keyboard navigation
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    handleSubmit()
  }
}
```
