# Download Progress Dialog & WebLLM Info Banner Implementation

## Overview
Implemented two complementary UX features for handling model downloads and WebLLM provider information:
1. **Download Progress Dialog** - Modal popup showing real-time download progress
2. **WebLLM Info Banner** - Dismissible header banner informing users about first-response latency

## Architecture

### Download Progress Dialog (`src/components/ui/download-progress-dialog.tsx`)
- **Purpose**: Display model download progress as a centered modal overlay
- **Trigger**: Automatic when `ClientSideChatTransport` starts downloading models
- **Visual Elements**:
  - Animated spinner (Lucide `Loader2`)
  - Progress bar with smooth width animation
  - Percentage text (25%, 50%, 75%, 100%)
  - Status labels: "Downloading model..." or "Extracting model..."
  - Indeterminate progress bar during extraction phase
- **Behavior**:
  - Auto-dismisses 1 second after reaching 100% completion
  - Non-blocking modal (semi-transparent overlay with blur)
  - Smooth Framer Motion enter/exit animations
- **Implementation Pattern**:
  ```tsx
  // In App.tsx
  const [modelDownloadProgress, setModelDownloadProgress] = useState<{...} | null>(null)
  
  // Setup callback on mount
  useEffect(() => {
    transport.onDownloadProgress((progress) => {
      setModelDownloadProgress({
        status: progress.status,
        progress: progress.progress,
        message: progress.message
      })
      if (progress.status === 'complete') {
        setTimeout(() => setModelDownloadProgress(null), 1000)
      }
    })
  }, [transport])
  
  // Render dialog
  <DownloadProgressDialog
    isOpen={modelDownloadProgress !== null}
    status={modelDownloadProgress?.status || "downloading"}
    progress={modelDownloadProgress?.progress || 0}
    message={modelDownloadProgress?.message || ""}
  />
  ```

### WebLLM Info Banner (`src/App.tsx` lines ~407-421)
- **Purpose**: Inform users that WebLLM is being used and first response may be slower
- **Location**: Header section below error message (if any)
- **Visual Elements**:
  - Blue info box (blue-50 background, blue-200 border)
  - Info icon emoji (ℹ️)
  - Dismiss X button (Lucide `X` icon)
  - Smooth hover effect on button
- **Behavior**:
  - Only shows when `activeProvider === 'web-llm'`
  - User can dismiss with X button
  - State `dismissedWebLLMInfo` controls visibility (session-based)
  - Resets on page reload
- **Implementation Pattern**:
  ```tsx
  const [dismissedWebLLMInfo, setDismissedWebLLMInfo] = useState(false)
  
  {activeProvider === 'web-llm' && !dismissedWebLLMInfo && (
    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between gap-2">
      <p className="text-xs text-blue-700 dark:text-blue-300">
        ℹ️ Using WebLLM with local model. First response may take longer as
        the model downloads.
      </p>
      <button
        onClick={() => setDismissedWebLLMInfo(true)}
        className="flex-shrink-0 p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
        aria-label="Dismiss message"
      >
        <X className="h-4 w-4 text-blue-700 dark:text-blue-300" />
      </button>
    </div>
  )}
  ```

## Progress Tracking Mechanism

### Callback-Based Architecture
Instead of trying to extract progress from message parts (unreliable), the implementation uses a callback:

1. **Transport Setup**: `ClientSideChatTransport` exposes `onDownloadProgress()` method
2. **Progress Emissions**: Called from `handleBuiltInAI()` and `handleWebLLM()` at three points:
   - First update (initialize progress)
   - Ongoing updates (0%, 25%, 50%, 75%, 90%, 99%)
   - Completion (100%)
3. **Callback Format**: 
   ```typescript
   interface ProgressUpdate {
     status: 'downloading' | 'extracting' | 'complete'
     progress: number  // 0-100
     message: string   // e.g., "Downloading model..." or "Done!"
   }
   ```

### Why Callback Instead of Message Extraction
- **Reliability**: Vercel AI SDK's `useChat` doesn't reliably capture custom data chunks
- **Simplicity**: Direct callback is cleaner than parsing message structure
- **Accuracy**: No loss of precision from data transformation
- **Separation of Concerns**: Progress UI isolated from chat message stream

## Key Implementation Details

### Files Modified
1. **`src/App.tsx`**:
   - Added `dismissedWebLLMInfo` state
   - Added `modelDownloadProgress` state
   - Setup `transport.onDownloadProgress()` callback
   - Render `DownloadProgressDialog` component
   - Render WebLLM info banner with dismiss button
   - Removed `showLoadingStatus` prop (redundant with popup)

2. **`src/lib/client-side-chat-transport.ts`**:
   - Added `private progressCallback` field
   - Added `onDownloadProgress()` method to register callback
   - Call callback from `handleBuiltInAI()` at progress events
   - Call callback from `handleWebLLM()` at progress events

3. **`src/components/ui/download-progress-dialog.tsx`**:
   - New file with modal component
   - Framer Motion animations for enter/exit
   - Determinate/indeterminate progress bar logic
   - Dark mode support

### Styling Patterns
- **Dark Mode**: Full `dark:` prefix support for all UI elements
- **Tailwind Classes**: No inline styles, only utility classes
- **Animations**: Framer Motion for smooth transitions, CSS for progress bar

## Testing Checklist
- [ ] WebLLM provider: First message triggers download dialog
- [ ] Dialog shows 0-100% progress accurately
- [ ] Dialog auto-dismisses 1 second after 100%
- [ ] WebLLM info banner appears only when provider is 'web-llm'
- [ ] Clicking X on banner dismisses it for session
- [ ] Info banner reappears on page reload
- [ ] No "Loading model..." duplicate text in chat
- [ ] Built-in AI provider: Dialog doesn't show (no download needed)
- [ ] Dark mode: Both dialog and banner render correctly

## Future Improvements
- Persist dismiss preference to localStorage (currently session-only)
- Add model size display in progress dialog
- Support canceling download (requires transport changes)
- Show estimated time remaining for large models
