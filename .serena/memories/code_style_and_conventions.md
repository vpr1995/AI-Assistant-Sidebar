# Code Style and Conventions

## TypeScript Standards

### Component Structure
```typescript
// 1. Imports (grouped by category)
import { useState, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { Button } from './components/ui/button'
import { cn } from './lib/utils'

// 2. Type/Interface definitions
interface ComponentProps {
  title: string;
  onAction?: () => void;
}

// 3. Component definition (function declaration, not arrow)
export default function Component({ title, onAction }: ComponentProps) {
  // 4. Hooks at the top
  const [state, setState] = useState<string>('');
  const { messages, append } = useChat();
  
  useEffect(() => {
    // Effects after state hooks
  }, []);
  
  // 5. Event handlers
  const handleClick = () => {
    setState('new value');
  };
  
  // 6. Render helpers (if needed)
  const renderContent = () => {
    return <div>{title}</div>;
  };
  
  // 7. JSX return
  return (
    <div className="container">
      {renderContent()}
    </div>
  );
}
```

### Type Safety Rules
1. **Always define types** for props, state, and function parameters
2. **Use interfaces** for object shapes (not types)
3. **Avoid `any`** - use `unknown` if type is truly unknown
4. **Enable strict mode** in tsconfig.json (already enabled)
5. **Export types** when shared across files

```typescript
// Good
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Bad
const message: any = { ... };
```

## React Conventions

### Component Patterns
- **Functional Components Only**: No class components
- **Hooks for State**: useState, useEffect, custom hooks
- **Default Export**: For page-level components
- **Named Exports**: For utility components

```typescript
// Page-level component (default export)
export default function ChatPage() { ... }

// Utility component (named export)
export function ChatMessage({ message }: { message: Message }) { ... }
```

### Hook Usage
```typescript
// ✅ Good: Hooks at top, consistent order
function Component() {
  const [state, setState] = useState('');
  const { data, isLoading } = useChat();
  
  useEffect(() => {
    // Side effects
  }, [dependency]);
  
  return <div>...</div>;
}

// ❌ Bad: Hooks in conditions or loops
function Component() {
  if (condition) {
    const [state, setState] = useState(''); // WRONG!
  }
}
```

### State Updates
```typescript
// ✅ Good: Functional updates for arrays/objects
setMessages(prev => [...prev, newMessage]);
setUser(prev => ({ ...prev, name: 'New Name' }));

// ❌ Bad: Direct mutation
messages.push(newMessage); // WRONG!
setMessages(messages);
```

## Tailwind CSS Styling

### Class Organization
Use `cn()` utility for conditional classes:

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  // Base classes
  "flex flex-col items-center",
  // Responsive classes
  "md:flex-row md:justify-between",
  // Conditional classes
  isActive && "bg-blue-500",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
```

### Naming Patterns
- **Container**: `container`, `max-w-screen-xl`
- **Spacing**: `p-4`, `px-6`, `py-2`, `m-4`, `space-x-2`
- **Typography**: `text-sm`, `font-medium`, `text-gray-700`
- **Layout**: `flex`, `grid`, `absolute`, `relative`
- **Responsive**: `sm:`, `md:`, `lg:`, `xl:` prefixes

### Dark Mode Support
```typescript
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
```

## File Organization

### Component Files
```
component-name.tsx
├── Imports
├── Types/Interfaces
├── Main Component
└── Helper Components (if small)
```

### Hook Files
```
use-hook-name.ts
├── Imports
├── Types
├── Hook Definition
└── Export
```

### Utility Files
```
utils.ts
├── Type Definitions
├── Helper Functions
└── Exports
```

## Naming Conventions

### Variables & Functions
- **camelCase**: `userName`, `handleClick`, `isLoading`
- **Boolean prefixes**: `is`, `has`, `should`, `can`
- **Event handlers**: `handle` prefix (e.g., `handleSubmit`)
- **Async functions**: Consider `async` suffix for clarity

```typescript
// Good
const isAuthenticated = true;
const hasPermission = checkPermission();
async function fetchUserData() { ... }
const handleButtonClick = () => { ... };

// Bad
const authenticated = true; // unclear if boolean
const click = () => { ... }; // unclear what it does
```

### Components
- **PascalCase**: `ChatMessage`, `UserProfile`, `MessageList`
- **Descriptive names**: Avoid generic names like `Component`, `Item`
- **Composite names**: Combine purpose + type (e.g., `ChatInput`, `UserAvatar`)

### Types & Interfaces
- **PascalCase**: `Message`, `UserProfile`, `ChatState`
- **Interface suffix**: Optional, use for clarity (e.g., `IMessage` if preferred)
- **Props suffix**: Always use for component props (e.g., `ChatMessageProps`)

```typescript
interface ChatMessageProps {
  message: Message;
  onDelete?: () => void;
}
```

### Files
- **kebab-case**: `chat-message.tsx`, `use-auto-scroll.ts`
- **Match component name**: `ChatMessage` → `chat-message.tsx`
- **Descriptive**: `audio-utils.ts`, not `utils.ts` in subdirectory

## Import Organization

### Order
1. React and core libraries
2. External packages
3. Internal components
4. Internal hooks
5. Internal utilities
6. Types (if separate file)
7. Styles

```typescript
// 1. React
import { useState, useEffect } from 'react'

// 2. External packages
import { useChat } from '@ai-sdk/react'
import { builtInAI } from '@built-in-ai/core'

// 3. Components
import { Button } from './components/ui/button'
import { Chat } from './components/ui/chat'

// 4. Hooks
import { useAutoScroll } from './hooks/use-auto-scroll'

// 5. Utils
import { cn } from './lib/utils'

// 6. Types
import type { Message } from './types'

// 7. Styles
import './App.css'
```

## Error Handling

### Try-Catch Pattern
```typescript
async function fetchData() {
  try {
    const data = await api.fetch();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    // User-friendly error handling
    toast.error('Failed to load data. Please try again.');
    return null;
  }
}
```

### Error Boundaries (React)
```typescript
// Create error boundary for critical sections
<ErrorBoundary fallback={<ErrorMessage />}>
  <ChatInterface />
</ErrorBoundary>
```

## Comments & Documentation

### When to Comment
- **Complex logic**: Explain why, not what
- **Workarounds**: Document temporary fixes
- **Non-obvious code**: Clarify intent
- **Public APIs**: JSDoc for exported functions

```typescript
// ✅ Good: Explains why
// Delay is needed to avoid race condition with Chrome's side panel API
await new Promise(resolve => setTimeout(resolve, 100));

// ❌ Bad: States the obvious
// Set loading to true
setLoading(true);
```

### JSDoc for Functions
```typescript
/**
 * Sends a message to the AI model and streams the response
 * @param message - The user's message text
 * @param onChunk - Callback for each streamed chunk
 * @returns Promise that resolves when streaming is complete
 */
async function streamMessage(
  message: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  // Implementation
}
```

## Performance Best Practices

### Memoization
```typescript
// Memoize expensive computations
const sortedMessages = useMemo(() => {
  return messages.sort((a, b) => a.timestamp - b.timestamp);
}, [messages]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Memoize components
const MemoizedComponent = React.memo(ExpensiveComponent);
```

### Lazy Loading
```typescript
// Lazy load heavy components
const SettingsModal = lazy(() => import('./components/SettingsModal'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <SettingsModal />
</Suspense>
```

## Testing Patterns (Future)

### Component Tests
```typescript
import { render, screen } from '@testing-library/react';
import ChatMessage from './ChatMessage';

test('renders user message', () => {
  render(<ChatMessage message={{ role: 'user', content: 'Hello' }} />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Hook Tests
```typescript
import { renderHook, act } from '@testing-library/react';
import { useAutoScroll } from './use-auto-scroll';

test('scrolls to bottom on new message', () => {
  const { result } = renderHook(() => useAutoScroll());
  act(() => {
    result.current.scrollToBottom();
  });
  // Assert scroll position
});
```

## Git Commit Messages

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **refactor**: Code refactoring
- **style**: Formatting changes
- **docs**: Documentation changes
- **chore**: Maintenance tasks
- **test**: Adding tests

### Examples
```
feat(chat): add markdown rendering with syntax highlighting

- Replaced shiki with highlight.js for smaller bundle
- Added support for 5 languages (JS, TS, Python, Bash, JSON)
- Reduced bundle size by 330 modules

Closes #12
```

## Code Review Checklist

Before submitting code:
- [ ] TypeScript compilation succeeds (no errors)
- [ ] ESLint passes (no errors, minimal warnings)
- [ ] All functions have proper types
- [ ] Components follow naming conventions
- [ ] Imports are organized properly
- [ ] No console.logs (unless intentional)
- [ ] Error handling implemented
- [ ] Performance considerations addressed
- [ ] Accessibility attributes added (ARIA)
- [ ] Responsive design tested
- [ ] Git commit message follows convention
