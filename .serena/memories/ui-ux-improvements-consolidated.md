# UI/UX Improvements

This document covers UI and UX enhancements implemented in the extension, including the theme system, multi-chat sidebar, model selector repositioning, and download progress tracking.

## Theme System

A complete theme system with three modes and smooth animations.

### Features
-   **Three Modes**: Light, Dark, and System (follows OS preference)
-   **Smooth Animations**: Framer Motion-powered transitions
-   **Persistent Preference**: Saved to localStorage
-   **Real-time OS Detection**: Updates when system theme changes
-   **Spring Animations**: Natural, bouncy transitions for UI elements

### Implementation
-   **`src/hooks/use-theme.ts`**: Core theme logic
    -   Manages theme state (light/dark/system)
    -   Persists to localStorage with key `'theme-preference'`
    -   Detects system preference via `matchMedia('(prefers-color-scheme: dark)')`
    -   Listens for OS theme changes
    -   Applies theme by toggling `dark` class on `document.documentElement`

-   **`src/components/ui/theme-provider.tsx`**: Context provider
    -   Wraps application with theme context
    -   Provides theme state to all child components
    -   Integrates `use-theme` hook

-   **`src/components/ui/theme-context.ts`**: Context definition
    -   Defines `ThemeContext` and `ThemeContextType`
    -   Separate file to fix ESLint Fast Refresh rules

-   **`src/hooks/use-theme-context.tsx`**: Context hook
    -   Safe, typed hook to access theme context
    -   Throws error if used outside ThemeProvider

### User Experience
-   **Header Button Group**: Sun ☀️ / Moon 🌙 / Monitor 🖥️ icons
-   **Active Indicator**: Animated background slide between active button
-   **Icon Animation**: Scale effect (1.0 → 1.1) on selection
-   **Color Transition**: Smooth text color fade

## Multi-Chat Sidebar

A comprehensive chat management system with persistent storage.

### Features
-   **Multiple Chats**: Create unlimited chat sessions
-   **Persistent History**: All chats saved to localStorage
-   **Inline Title Editing**: Click to edit chat names
-   **Chat List**: Sidebar showing all chats with timestamps
-   **Active Indicator**: Highlights current chat
-   **Delete Chats**: Remove unwanted conversations
-   **New Chat Dialog**: Modal for creating new chats

### Implementation
-   **`src/hooks/use-chats.ts`**: Chat state management
    -   CRUD operations (create, read, update, delete)
    -   Active chat tracking
    -   Persists to localStorage

-   **`src/lib/chat-storage.ts`**: Storage layer
    -   Save/load chats from localStorage
    -   Key: `'chrome-ai-chats'`
    -   JSON serialization

-   **`src/lib/chat-helpers.ts`**: Utility functions
    -   `createNewChat()` - Generate new chat with timestamp
    -   `generateChatId()` - Unique ID generation
    -   `formatChatTimestamp()` - Human-readable timestamps

-   **`src/components/ui/chat-sidebar.tsx`**: Sidebar UI
    -   Collapsible chat list
    -   New chat button
    -   Chat selection and deletion

-   **`src/components/ui/chat-list-item.tsx`**: Individual chat item
    -   Click to switch chats
    -   Delete button with confirmation
    -   Active state styling

-   **`src/components/ui/chat-header.tsx`**: Chat session header
    -   Displays chat title
    -   Inline editing with double-click
    -   Auto-save on blur

### User Experience
-   **Seamless Switching**: Instant chat switching with state preservation
-   **Auto-save**: All messages automatically saved
-   **Persistent**: Chats survive page reloads and browser restarts
-   **Visual Feedback**: Active chat highlighted in sidebar

## Provider Selector Repositioning

Moved AI provider selector from header to message input area.

### Changes
-   **Before**: Header had `[Status] [Provider ▼] [Settings]` (crowded)
-   **After**: Header has `[Status] [Settings]` (clean)
-   **Provider Selector**: Now in message input controls area

### Benefits
-   **Cleaner Header**: More visual space, less clutter
-   **Contextual Placement**: Provider selection near where you compose messages
-   **Better Flow**: Natural position before sending message
-   **File Attachment Removed**: Simplified interface (paperclip button removed)

### Implementation
-   **`src/App.tsx`**: Removed ProviderSelector from header, passes props to Chat
-   **`src/components/ui/chat.tsx`**: Receives and forwards provider props
-   **`src/components/ui/message-input.tsx`**: Renders ProviderSelector in controls
    -   Button order: `[Provider ▼] [🎤 Mic] [📤 Send]`

## Download Progress Dialog

Modal popup showing real-time model download progress.

### Features
-   **Progress Bar**: Animated width with percentage (0-100%)
-   **Status Messages**: "Downloading model..." / "Extracting model..." / "Done!"
-   **Spinner Animation**: Rotating loader icon (Lucide `Loader2`)
-   **Auto-dismiss**: Closes 1 second after reaching 100%
-   **Non-blocking**: Semi-transparent overlay with backdrop blur
-   **Framer Motion**: Smooth enter/exit animations

### Implementation
-   **`src/components/ui/download-progress-dialog.tsx`**: Dialog component
    -   Props: `isOpen`, `status`, `progress`, `message`
    -   Animated with Framer Motion
    -   Dark mode support

-   **`src/hooks/use-model-download-progress.ts`**: Progress tracking hook
    -   Registers callback with transport layer
    -   Manages progress state
    -   Triggers auto-dismiss

-   **Callback Architecture**: Transport layer emits progress updates
    -   First call: `{ status: 'downloading', progress: 0, message: '...' }`
    -   Ongoing: `{ status: 'downloading', progress: 45, message: '...' }`
    -   Complete: `{ status: 'complete', progress: 100, message: 'Done!' }`

### User Experience
-   **Automatic**: Appears when model download starts
-   **Informative**: Shows exact progress percentage
-   **Non-intrusive**: Doesn't block UI interaction
-   **Visual Feedback**: Clear indication of download status

## Provider Status Banners

Informational banners that appear in the header to notify users about provider-specific information.

### Features
-   **WebLLM Banner**: Shows when WebLLM is active
    -   Message: "Using WebLLM with local model. First response may take longer..."
    -   Dismissible with X button
    -   Blue info styling

-   **Transformers.js Banner**: Shows when Transformers.js is active
    -   Similar message about potential latency
    -   Dismissible
    -   Session-based (reappears on reload)

### Implementation
-   **`src/components/ui/provider-status-banners.tsx`**: Banner components
-   **`src/App.tsx`**: Manages visibility state
    -   `dismissedWebLLMInfo` state
    -   Conditional rendering based on `activeProvider`

## Voice Input UI

Visual components for speech-to-text functionality.

### Features
-   **Microphone Button**: Click to start/stop recording
-   **Audio Visualizer**: Waveform animation during recording
-   **Permission Handling**: Iframe-based permission request
-   **Visual Feedback**: Button changes color when active

### Implementation
-   **`src/components/ui/audio-visualizer.tsx`**: Waveform visualization
    -   Canvas-based animation
    -   Real-time audio level display

-   **Microphone Button**: In message input controls
    -   Toggles recording state
    -   Shows recording indicator

## Settings Menu

Dropdown menu for user preferences and actions.

### Features
-   **Theme Selector**: Radio buttons for Light/Dark/System
-   **Reset Chat**: Button to clear current chat
-   **Animated Dropdown**: Spring physics animation
-   **Keyboard Navigation**: Arrow keys and Enter support

### Implementation
-   **`src/components/ui/settings-menu.tsx`**: Settings dropdown
    -   Gear icon button
    -   Animated menu with Framer Motion
    -   Theme options with checkmarks
    -   Reset button with confirmation

### User Experience
-   **Accessible**: Keyboard and screen reader support
-   **Visual**: Checkmark shows active theme
-   **Smooth**: Spring animations for natural feel

## Overall UX Principles

-   **Contextual Placement**: Controls near related actions
-   **Visual Feedback**: Animations and indicators for user actions
-   **Persistence**: User preferences saved and restored
-   **Accessibility**: Keyboard navigation and ARIA labels
-   **Performance**: Smooth 60fps animations
-   **Dark Mode**: Full support across all components
-   **Mobile-Ready**: Responsive layouts (though designed for desktop sidebar)
