# Chrome Extension AI Assistant - Implementation Tasks

> **Project**: Privacy-first Local AI Assistant Chrome Sidebar Extension  
> **UI Framework**: shadcn.io AI Chatbot Components  
> **AI Provider**: Dual-mode architecture with automatic fallback  
> **Total Tasks**: 30

---

## 🤖 AI Provider Architecture

### Dual-Provider System

This extension uses a **smart dual-provider architecture** to maximize performance and compatibility:

#### **Primary: Chrome Built-in AI** (`@built-in-ai/core`)
- Uses Chrome's native **Gemini Nano** (Chrome) or **Phi Mini** (Edge)
- **Zero download after first use** (Chrome manages caching)
- **No model selection needed** - Chrome handles model automatically
- **Fastest inference** - Hardware-optimized by browser
- **Requires**: Chrome 128+ or Edge Dev 138.0.3309.2+ with experimental flag enabled

#### **Fallback: Transformers.js** (`@built-in-ai/transformers-js`)
- Used when built-in AI is unavailable or not supported
- **Manual model selection** from multiple options:
  - SmolLM2-360M-Instruct (360MB)
  - SmolLM2-135M-Instruct (135MB)
  - Qwen2.5-0.5B-Instruct
  - Llama-3.2-1B-Instruct
- **User manages cache** - download, delete, clear models
- **Works on any browser** with WebGPU/WASM support

### User Experience

**When using Built-in AI**:
- ✅ No model selector dropdown (Chrome manages it)
- ✅ One-time download prompt from Chrome (managed by browser)
- ✅ Header shows: "● Chrome Built-in AI (Gemini Nano)"
- ✅ Settings show: "Chrome manages built-in AI models automatically"

**When using Transformers.js Fallback**:
- 🔽 Model selector dropdown appears in input area
- 📥 User downloads and manages models manually
- 🏷️ Header shows: "● SmolLM2-360M-Instruct" (or selected model)
- ⚙️ Full cache management UI available in settings

### Detection Flow

```javascript
1. Check: doesBrowserSupportBuiltInAI()
   ↓
2. If YES → Try builtInAI()
   ├─ Available → Use immediately ✅
   ├─ Downloadable → Show Chrome download progress, then use
   └─ Unavailable → Fall back to Transformers.js
   ↓
3. If NO → Use transformersJS() with model selection
```

---

## 📦 Phase 1: Foundation & Setup (Tasks 1-5)

### Task 1: Project Setup & Dependencies
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Install and configure all core dependencies for the project.

**Actions**:
- Install Vercel AI SDK (`ai`)
- Install **PRIMARY**: `@built-in-ai/core` (Chrome's built-in Gemini Nano/Phi Mini - no models to download!)
- Install **FALLBACK**: `@built-in-ai/transformers-js` (local Transformers.js models with model selection)
- Install Tailwind CSS and configure for Vite (Please follow steps at https://tailwindcss.com/docs/installation/using-vite)
- Set up TypeScript support (optional but recommended)
- Configure Vite for Chrome extension sidebar builds
- Update `tsconfig.json` or `jsconfig.json` for proper module resolution

**Dependencies**: Package manager, Node.js 18+

**Architecture Notes**:
- **Primary**: Use `@built-in-ai/core` with Chrome's built-in AI (Gemini Nano in Chrome, Phi Mini in Edge)
- **Fallback**: If built-in AI unavailable, use `@built-in-ai/transformers-js` with downloadable models
- **No model selection needed** when using built-in AI (Chrome handles it automatically)
- **Model selection UI** only shown when using Transformers.js fallback

**Acceptance Criteria**:
- [ ] All dependencies installed successfully
- [ ] `package.json` updated with correct versions
- [ ] Vite dev server runs without errors
- [ ] No dependency conflicts

---

### Task 2: Chrome Extension Manifest Configuration
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Create and configure Chrome extension manifest for sidebar panel.

**Actions**:
- Create `public/manifest.json` with Manifest V3
- Configure `side_panel` API for sidebar
- Define required permissions: `storage`, `sidePanel`
- Set up Content Security Policy for WASM/WebGPU (`wasm-unsafe-eval`)
- Add extension icons (16x16, 48x48, 128x128)
- Configure extension metadata (name, description, version)

**Dependencies**: Task 1

**Acceptance Criteria**:
- [ ] Manifest loads in Chrome without errors
- [ ] Sidebar panel opens successfully
- [ ] CSP allows WASM and WebGPU operations
- [ ] Extension icons display correctly

---

### Task 3: Tailwind CSS & shadcn/ui Setup
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Initialize Tailwind CSS and shadcn/ui component system.

**Actions**:
- Run `npx tailwindcss init -p` to create Tailwind config
- Configure `tailwind.config.js` with content paths
- Add Tailwind directives to `src/index.css`
- Run `npx shadcn@latest init` to initialize shadcn/ui
- Configure theme colors, typography, and design tokens
- Set up CSS variables for dark/light mode (optional)

**Dependencies**: Task 1

**Acceptance Criteria**:
- [ ] Tailwind classes work in components
- [ ] shadcn/ui CLI configured successfully
- [ ] Theme colors match shadcn design system
- [ ] No CSS conflicts with existing styles

---

### Task 4: Install shadcn/ui AI Chatbot Components
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Install pre-built AI chatbot components from shadcn/ui registry.

**Actions**:
- Run `npx shadcn@latest add https://www.shadcn.io/registry/ai-chatbot.json`
- Review installed components:
  - `Conversation` - Main chat container
  - `Message` - Individual message display
  - `PromptInput` - Input area with toolbar
  - `Reasoning` - Collapsible reasoning display
  - `Sources` - Expandable source citations
  - `Loader` - Loading indicators
- Test basic component imports
- Verify component styling matches design

**Dependencies**: Task 3

**Acceptance Criteria**:
- [ ] All components installed successfully
- [ ] Components can be imported without errors
- [ ] Basic component rendering works
- [ ] Styling looks correct

---

### Task 5: Sidebar Layout & Container Setup
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Create main sidebar container with proper layout structure.

**Actions**:
- Update `App.jsx` to be the main sidebar container
- Set fixed width (400-500px) for sidebar
- Implement full-height layout (`100vh`)
- Create flex layout structure:
  - Header (fixed top)
  - Conversation area (flex-1, scrollable)
  - Input section (fixed bottom)
- Configure proper z-index stacking
- Add basic styling and borders

**Dependencies**: Task 4

**Acceptance Criteria**:
- [ ] Sidebar has fixed width
- [ ] Layout fills full height
- [ ] Scrolling works in conversation area only
- [ ] Header and input stay fixed

---

## 💬 Phase 2: Chat Interface (Tasks 6-9)

### Task 6: Conversation Component Integration
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Integrate shadcn Conversation component as main chat container.

**Actions**:
- Import and set up `Conversation` component
- Add `ConversationContent` wrapper for messages
- Implement `ConversationScrollButton` for manual scroll
- Configure smart auto-scroll behavior:
  - Auto-scroll to bottom during streaming
  - Allow manual scrolling without fighting back
  - Detect user scroll intent
- Style conversation area with proper padding

**Dependencies**: Task 5

**Acceptance Criteria**:
- [ ] Messages display in scrollable area
- [ ] Auto-scroll works during streaming
- [ ] Manual scroll doesn't conflict with auto-scroll
- [ ] Scroll button appears when needed

---

### Task 7: Message Component Setup
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Configure Message components for user and AI messages.

**Actions**:
- Set up `Message` component for both roles (user/assistant)
- Configure `MessageAvatar`:
  - Triangle icon (▲) for AI assistant
  - User icon (👤) for user messages
- Implement `MessageContent` with proper styling
- Add message timestamp display (optional)
- Style message bubbles with subtle backgrounds
- Test with sample message data

**Dependencies**: Task 6

**Acceptance Criteria**:
- [ ] User and AI messages render differently
- [ ] Avatars display correctly
- [ ] Message content has proper spacing
- [ ] Styling matches shadcn design

---

### Task 8: Prompt Input Component
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Integrate PromptInput component with textarea and submit button.

**Actions**:
- Import `PromptInput` component
- Add `PromptInputTextarea` with auto-resize
- Implement `PromptInputSubmit` button
- Add keyboard shortcuts:
  - Enter to send message
  - Shift+Enter for new line
  - Cmd/Ctrl+K to focus input
- Add input validation and character limit
- Implement disabled states (during generation)
- Style placeholder text

**Dependencies**: Task 7

**Acceptance Criteria**:
- [ ] Textarea auto-resizes with content
- [ ] Enter key sends message
- [ ] Shift+Enter creates new line
- [ ] Submit button has proper states

---

### Task 9: Model Selection Dropdown
**Status**: Not Started  
**Priority**: P1 (Should Have)

**Description**: Create model selector dropdown (only for Transformers.js fallback mode).

**Actions**:
- Add dropdown to `PromptInputToolbar`
- **Only show when using Transformers.js fallback** (hide for built-in AI)
- List available local models when in fallback mode:
  - SmolLM2-360M-Instruct
  - SmolLM2-135M-Instruct
  - Qwen2.5-0.5B-Instruct
  - Llama-3.2-1B-Instruct
- Show current model with checkmark (✓)
- Display model metadata (size, description)
- Implement model switching logic
- Save selected model to Chrome storage
- Add "⚙️ Manage Models" option at bottom
- **When using built-in AI**: Show "Chrome Built-in AI (Gemini Nano)" with no dropdown

**Dependencies**: Task 8

**Architecture Notes**:
- Built-in AI mode: No model selection needed (Chrome manages it)
- Transformers.js fallback mode: Show full model selector
- Auto-detect provider and adjust UI accordingly

**Acceptance Criteria**:
- [ ] No dropdown shown when using built-in AI
- [ ] Dropdown shows all available models in fallback mode
- [ ] Current model indicated with checkmark
- [ ] Model selection persists across sessions
- [ ] UI updates when model changes

---

## 🤖 Phase 3: AI Integration (Tasks 10-14)

### Task 10: Vercel AI SDK + Built-in AI Integration
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Set up Vercel AI SDK with Chrome's built-in AI (primary) and Transformers.js (fallback).

**Actions**:
- Import `streamText` and `generateText` from `ai`
- Import `builtInAI`, `doesBrowserSupportBuiltInAI` from `@built-in-ai/core`
- Import `transformersJS` from `@built-in-ai/transformers-js` (fallback)
- **Primary Provider Setup**:
  - Initialize: `const model = builtInAI()`
  - Check availability: `await model.availability()`
  - Handle states: "unavailable", "downloadable", "downloading", "available"
  - Use `createSessionWithProgress()` for Chrome model download
- **Fallback Provider Setup**:
  - If `!doesBrowserSupportBuiltInAI()`, use `transformersJS(modelId, settings)`
  - Configure WebGPU device detection
  - Implement WASM fallback for Transformers.js
- Implement provider switching logic
- Store active provider preference in Chrome storage

**Browser Requirements** (for built-in AI):
- Chrome 128+ or Edge Dev 138.0.3309.2+
- Enable flag: `chrome://flags/#prompt-api-for-gemini-nano` (Chrome)
- Enable flag: `edge://flags/#prompt-api-for-phi-mini` (Edge)

**Architecture**:
```javascript
// Check built-in AI first
if (doesBrowserSupportBuiltInAI()) {
  const model = builtInAI();
  const status = await model.availability();
  
  if (status === "available") {
    // Use Chrome's built-in Gemini Nano (no download!)
    useBuiltInAI(model);
  } else if (status === "downloadable") {
    // Chrome will download Gemini Nano once
    await model.createSessionWithProgress((progress) => {
      console.log(`Download: ${progress * 100}%`);
    });
    useBuiltInAI(model);
  }
} else {
  // Fallback: Use Transformers.js with model selection
  const model = transformersJS("HuggingFaceTB/SmolLM2-360M-Instruct");
  useTransformersJS(model);
}
```

**Dependencies**: Task 9

**Acceptance Criteria**:
- [ ] Built-in AI initializes when available
- [ ] Transformers.js fallback works when built-in unavailable
- [ ] Provider detection is automatic
- [ ] Progress tracking works for both providers
- [ ] User is notified which provider is active

---

### Task 11: Text Streaming Implementation
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Implement character-by-character text streaming for AI responses.

**Actions**:
- Use Vercel AI SDK's `streamText()` function
- Iterate over `result.textStream` generator
- Update UI with optimized React state (batched updates)
- Add typing indicator with animated dots
- Implement streaming without re-render performance issues
- Add stop generation capability with abort controller
- Handle streaming errors gracefully

**Dependencies**: Task 10

**Acceptance Criteria**:
- [ ] Text appears character-by-character
- [ ] Streaming is smooth (no lag)
- [ ] Stop button works during generation
- [ ] No scroll jumping during streaming

---

### Task 12: Reasoning Component Integration
**Status**: Not Started  
**Priority**: P1 (Should Have)

**Description**: Add Reasoning component for chain-of-thought display.

**Actions**:
- Import `Reasoning`, `ReasoningContent`, `ReasoningTrigger`
- Detect reasoning in AI responses
- Implement collapsible reasoning sections
- Auto-expand when reasoning is complete
- Style with proper indentation and background
- Add animation for expand/collapse
- Make keyboard navigable

**Dependencies**: Task 11

**Acceptance Criteria**:
- [ ] Reasoning sections display correctly
- [ ] Auto-expand when complete
- [ ] Manual toggle works
- [ ] Accessible via keyboard

---

### Task 13: Sources Component Integration
**Status**: Not Started  
**Priority**: P1 (Should Have)

**Description**: Add Sources component for citation display.

**Actions**:
- Import `Sources`, `SourcesContent`, `SourcesTrigger`
- Parse source citations from AI responses
- Implement "Used X sources ˅" trigger
- Create source cards with:
  - Document icon (📄)
  - Source title
  - URL with link icon (🔗)
- Make sources collapsible
- Ensure keyboard navigation works
- Add accessibility labels

**Dependencies**: Task 12

**Acceptance Criteria**:
- [ ] Sources count displays correctly
- [ ] Source cards show all information
- [ ] Links open in new tabs
- [ ] Collapse/expand works smoothly

---

### Task 14: Loading States & Progress Indicators
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Implement comprehensive loading states and progress tracking.

**Actions**:
- Import `Loader` component
- Implement model download progress:
  - Show percentage completed
  - Display file size and download speed
  - Show which file is downloading
- Add generation progress indicators:
  - "Thinking..." animation
  - Token generation speed display
- Implement cancellable operations
- Add progress bar for long operations
- Handle progress updates efficiently

**Dependencies**: Task 10

**Acceptance Criteria**:
- [ ] Download progress shows accurately
- [ ] Loading animations are smooth
- [ ] Cancel button works
- [ ] No UI blocking during operations

---

## ✨ Phase 4: Features & Functionality (Tasks 15-20)

### Task 15: Message Actions (Copy, Regenerate, TTS)
**Status**: Not Started  
**Priority**: P1 (Should Have)

**Description**: Add action buttons below AI messages.

**Actions**:
- Add "Copy to clipboard" button
- Implement copy functionality with success toast
- Add "Regenerate" button to resend prompt
- Implement regenerate logic (resend last user message)
- Add "Read aloud" button (TTS placeholder)
- Prepare TTS integration hooks for future
- Style action buttons consistently
- Add hover states and tooltips

**Dependencies**: Task 11

**Acceptance Criteria**:
- [ ] Copy button copies message text
- [ ] Toast notification shows on copy
- [ ] Regenerate resends message correctly
- [ ] TTS button is ready for integration

---

### Task 16: Chat History State Management
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Implement chat message state with persistence.

**Actions**:
- Create message state with `useState` or `useReducer`
- Define message type/interface (id, role, content, timestamp)
- Store messages in Chrome local storage (`chrome.storage.local`)
- Load conversation history on sidebar open
- Implement message limit (e.g., last 50 messages)
- Add clear chat functionality with confirmation dialog
- Handle storage quota exceeded errors

**Dependencies**: Task 15

**Acceptance Criteria**:
- [ ] Messages persist across browser restarts
- [ ] Chat history loads on open
- [ ] Clear chat works with confirmation
- [ ] Storage limits are respected

---

### Task 17: Model Availability & Cache Management
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Implement model caching and availability checking for both providers.

**Actions**:
- **Built-in AI Provider**:
  - Use `model.availability()` API to check Chrome's model status
  - Statuses: "unavailable", "downloadable", "downloading", "available"
  - Chrome manages caching automatically (no manual cache management needed)
  - Show one-time download progress when first using built-in AI
- **Transformers.js Fallback**:
  - Use `model.availability()` for Transformers.js models
  - Track cached models with metadata (name, size, last used)
  - Use browser Cache API for model files
  - Implement cache storage tracking
  - Add delete cached model functionality
  - Show storage usage warnings
- Display which provider is active (Built-in AI or Transformers.js)
- Show appropriate cache management UI for each provider

**Provider Differences**:
- **Built-in AI**: Chrome handles all caching (user can't manage)
- **Transformers.js**: Full manual cache management available

**Dependencies**: Task 10

**Acceptance Criteria**:
- [ ] Model availability checked correctly for both providers
- [ ] Built-in AI download happens once per browser
- [ ] Transformers.js models tracked with metadata
- [ ] Storage usage displayed for Transformers.js
- [ ] Delete functionality works for Transformers.js models

---

### Task 18: Generation Configuration Settings
**Status**: Not Started  
**Priority**: P1 (Should Have)

**Description**: Create settings panel for AI generation parameters.

**Actions**:
- Create settings modal/panel component
- Add sliders for parameters:
  - Temperature (0.0-2.0)
  - Max tokens (50-2000)
  - Top-p (0.0-1.0)
  - Top-k (1-100)
  - Frequency penalty
  - Presence penalty
- Implement presets:
  - Creative (temp 0.9)
  - Balanced (temp 0.7)
  - Factual (temp 0.3)
- Save configurations to Chrome storage
- Add reset to defaults button

**Dependencies**: Task 16

**Acceptance Criteria**:
- [ ] All parameters adjustable
- [ ] Presets work correctly
- [ ] Settings persist across sessions
- [ ] Reset to defaults works

---

### Task 19: Empty State with Example Prompts
**Status**: Not Started  
**Priority**: P1 (Should Have)

**Description**: Design empty state UI with welcome message and examples.

**Actions**:
- Create empty state component
- Add large AI assistant icon (▲)
- Display welcome message and tagline
- Create example prompt cards:
  - 📝 Text generation example
  - 🖼️ Image generation example
  - 💡 Explain concept example
  - 🎤 Voice input example
- Implement one-click prompt insertion
- Add "Privacy-First • Offline-Ready" tagline
- Make dismissible (show on first launch only)

**Dependencies**: Task 6

**Acceptance Criteria**:
- [ ] Empty state displays on first launch
- [ ] Example prompts clickable
- [ ] Prompts insert into input field
- [ ] Design matches shadcn aesthetic

---

### Task 20: Error Handling & User Feedback
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Implement comprehensive error handling and user notifications.

**Actions**:
- Create error boundary for React errors
- Add user-friendly error messages for:
  - Out of memory (OOM)
  - WebGPU unavailable
  - Model download failures
  - Network errors
  - Generation errors
- Implement toast notifications for actions:
  - Model switched
  - Chat cleared
  - Message copied
- Add automatic WASM fallback on WebGPU failure
- Provide actionable error recovery options
- Log errors for debugging (console.error)

**Dependencies**: All previous tasks

**Acceptance Criteria**:
- [ ] Errors don't crash the app
- [ ] User-friendly error messages shown
- [ ] Toast notifications work
- [ ] Fallback mechanisms function

---

## 🎨 Phase 5: Advanced Features (Tasks 21-27)

### Task 21: Markdown & Code Syntax Highlighting
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Add markdown parsing and code syntax highlighting to messages.

**Actions**:
- Install `marked` or `react-markdown` for parsing
- Install `DOMPurify` for XSS protection
- Add syntax highlighting library (Prism.js or Highlight.js)
- Support markdown features:
  - Inline code, code blocks
  - Headers, lists, links
  - Blockquotes, tables
  - Bold, italic, strikethrough
- Configure code block themes
- Test with various markdown formats

**Dependencies**: Task 7

**Acceptance Criteria**:
- [ ] Markdown renders correctly
- [ ] Code blocks have syntax highlighting
- [ ] XSS protection works
- [ ] Copy code button on code blocks

---

### Task 22: Accessibility Features (ARIA, Keyboard Nav)
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Implement comprehensive accessibility features.

**Actions**:
- Add ARIA live regions for streaming messages (`aria-live="polite"`)
- Implement full keyboard navigation:
  - Tab through interactive elements
  - Enter to activate buttons
  - Escape to close modals
  - Arrow keys for dropdowns
- Add visible focus indicators
- Include screen reader labels (`aria-label`)
- Test with NVDA/JAWS screen readers (if available)
- Support `prefers-reduced-motion` for animations
- Ensure color contrast meets WCAG AA standards

**Dependencies**: All UI tasks

**Acceptance Criteria**:
- [ ] Keyboard navigation works completely
- [ ] Screen readers announce changes
- [ ] Focus indicators visible
- [ ] Reduced motion respected

---

### Task 23: Voice Input (Speech-to-Text) Integration
**Status**: Not Started  
**Priority**: P1 (Should Have)

**Description**: Integrate Whisper model for speech-to-text transcription.

**Actions**:
- Add microphone button (🎤) to `PromptInputToolbar`
- Request microphone permission via browser API
- Implement audio recording with `MediaRecorder` API
- Create `whisper-worker.ts` with `TransformersJSTranscriptionWorkerHandler`
- Initialize Whisper model:
  - `transformersJS.transcription('Xenova/whisper-base')`
- Implement real-time transcription display
- Add waveform visualization (optional)
- Show recording timer
- Implement auto-stop on silence detection
- Insert transcribed text into input field

**Dependencies**: Task 8, Task 27

**Acceptance Criteria**:
- [ ] Microphone permission requested
- [ ] Audio recording works
- [ ] Transcription accurate (>95%)
- [ ] Text inserts into input field

---

### Task 24: Image Generation (/image command)
**Status**: Not Started  
**Priority**: P1 (Should Have)

**Description**: Implement image generation using multimodal vision models.

**Actions**:
- Detect `/image` command in message processing
- Initialize vision model:
  - `transformersJS('HuggingFaceTB/SmolVLM-256M-Instruct', { isVisionModel: true })`
- Implement image generation pipeline
- Display generated images inline in `MessageContent`
- Add image loading placeholder
- Implement download image button
- Show generation progress with estimated time
- Handle image generation errors

**Dependencies**: Task 10, Task 11

**Acceptance Criteria**:
- [ ] `/image` command detected
- [ ] Images generate successfully
- [ ] Images display inline
- [ ] Download button works

---

### Task 25: Header Bar with Model Info & Reset
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Create sticky header bar with provider/model info and controls.

**Actions**:
- Create `ChatHeader` component
- Add green status indicator (● AI Assistant)
- **Display provider information**:
  - Built-in AI mode: "Chrome Built-in AI (Gemini Nano)" or "Edge Built-in AI (Phi Mini)"
  - Transformers.js mode: Show current model name (e.g., "SmolLM2-360M-Instruct")
- Add Reset button (top-right) to clear conversation
- Implement confirmation dialog for reset
- Show extension name/logo
- Make header sticky during scroll
- Style with subtle border and background
- Add provider badge/icon to distinguish between built-in and fallback

**Dependencies**: Task 5

**Acceptance Criteria**:
- [ ] Header stays fixed at top
- [ ] Provider/model name displays correctly
- [ ] Built-in AI shows appropriate model name (Gemini Nano/Phi Mini)
- [ ] Transformers.js shows selected model name
- [ ] Reset button works with confirmation
- [ ] Status indicator shows active state

---

### Task 26: Performance Optimization
**Status**: Not Started  
**Priority**: P1 (Should Have)

**Description**: Optimize React performance for smooth user experience.

**Actions**:
- Wrap Message components in `React.memo`
- Use `useCallback` for event handlers
- Use `useMemo` for expensive computations
- Implement batched state updates for streaming
- Lazy load heavy components:
  - Settings modal
  - Model selector
  - Image generation components
- Profile with React DevTools
- Optimize re-renders during streaming
- Test with long conversations (50+ messages)

**Dependencies**: All component tasks

**Acceptance Criteria**:
- [ ] No unnecessary re-renders
- [ ] Streaming is smooth (60fps)
- [ ] Memory usage stable
- [ ] Lazy loading works

---

### Task 27: Web Worker Setup for Models
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Set up Web Workers for off-main-thread AI inference.

**Actions**:
- Create `src/workers/worker.ts`:
  - Import `TransformersJSWorkerHandler`
  - Set up `onmessage` handler
- Create `src/workers/whisper-worker.ts`:
  - Import `TransformersJSTranscriptionWorkerHandler`
  - Set up `onmessage` handler
- Configure Vite to bundle workers properly
- Pass worker instances to model initialization:
  - `transformersJS(modelId, { worker: new Worker(...) })`
- Test worker communication
- Handle worker errors

**Dependencies**: Task 10

**Acceptance Criteria**:
- [ ] Workers load without errors
- [ ] Models run in workers
- [ ] Main thread remains responsive
- [ ] Worker communication works

---

### Task 28: Storage & Cache Management UI
**Status**: Not Started  
**Priority**: P1 (Should Have)

**Description**: Create UI panel for managing cached models and storage (Transformers.js only).

**Actions**:
- Create storage management panel in settings
- **Built-in AI Mode**:
  - Show "Chrome/Edge manages built-in AI models automatically"
  - Display estimated model size (if available from API)
  - No delete option (Chrome manages lifecycle)
- **Transformers.js Mode**:
  - List all cached models with metadata:
    - Model name
    - File size
    - Last used date
    - Cache status
  - Display total storage usage with progress bar
  - Add delete individual model button
  - Implement clear all cache option with confirmation
  - Show storage warnings when space low
- Display active provider and allow manual switching
- Update UI when cache changes

**Dependencies**: Task 17, Task 18

**Acceptance Criteria**:
- [ ] Built-in AI shows appropriate "no management needed" message
- [ ] Transformers.js models listed with full details
- [ ] Storage usage accurate for Transformers.js
- [ ] Delete buttons work (Transformers.js only)
- [ ] Clear all works with confirmation (Transformers.js only)
- [ ] Provider switch option available

---

## 🚀 Phase 6: Testing & Launch (Tasks 29-30)

### Task 29: Testing & Bug Fixes
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Comprehensive testing of all features and bug fixes.

**Actions**:
- Test all user flows:
  - Text generation
  - Model switching
  - Voice input
  - Image generation
  - Settings configuration
- Verify scroll behavior during streaming
- Test error scenarios:
  - No internet during download
  - Low memory conditions
  - CORS issues
  - Permission denials
- Check accessibility with keyboard-only navigation
- Test on different screen sizes (400px, 500px width)
- Test across browser restarts
- Profile performance with large conversations
- Fix all identified bugs

**Dependencies**: All previous tasks

**Acceptance Criteria**:
- [ ] All features work as expected
- [ ] No critical bugs
- [ ] Accessibility works
- [ ] Performance acceptable

---

### Task 30: Build & Packaging for Chrome Web Store
**Status**: Not Started  
**Priority**: P0 (Must Have)

**Description**: Configure production build and prepare for Chrome Web Store.

**Actions**:
- Configure Vite production build:
  - Set output directory to `dist/`
  - Enable code splitting
  - Minify code
  - Optimize assets
- Generate extension screenshots:
  - 1280x800 (main screenshot)
  - 640x400 (additional screenshots)
- Create promotional materials:
  - Icons: 16x16, 48x48, 128x128
  - Promotional tile: 440x280
  - Marquee tile: 1400x560
- Test installation from unpacked extension
- Verify Manifest V3 compliance
- Package as `.zip` for Chrome Web Store
- Write store listing:
  - Title, description
  - Privacy policy
  - Support email

**Dependencies**: Task 29

**Acceptance Criteria**:
- [ ] Production build succeeds
- [ ] Extension installs successfully
- [ ] All screenshots generated
- [ ] `.zip` file ready for submission

---

## 📊 Summary

| Phase | Tasks | Priority | Estimated Time |
|-------|-------|----------|----------------|
| Phase 1: Foundation | 1-5 | P0 | 8-12 hours |
| Phase 2: Chat Interface | 6-9 | P0 | 6-8 hours |
| Phase 3: AI Integration | 10-14 | P0-P1 | 12-16 hours |
| Phase 4: Features | 15-20 | P0-P1 | 10-14 hours |
| Phase 5: Advanced | 21-27 | P0-P1 | 14-18 hours |
| Phase 6: Testing & Launch | 29-30 | P0 | 6-8 hours |
| **Total** | **30 tasks** | - | **56-76 hours** |

---

## 🎯 Priority Legend

- **P0 (Must Have)**: Critical for MVP, blocking other features
- **P1 (Should Have)**: Important for good UX, but not blocking
- **P2 (Nice to Have)**: Enhancement features, can be added later

---

## 📝 Notes

- Tasks should be completed sequentially within each phase
- Some tasks can be parallelized within phases
- Testing should be done continuously, not just in Task 29
- Documentation should be updated as features are implemented
- Commit frequently with clear commit messages

---

**Last Updated**: October 15, 2025  
**Version**: 1.0
