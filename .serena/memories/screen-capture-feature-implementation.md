# Screen Capture Feature Implementation

## Overview
Implemented a complete screen capture feature for the Chrome extension allowing users to capture tabs, windows, or entire screens and send them to the AI for analysis. Uses Chrome's Desktop Capture API with multimodal Built-in AI (Gemini Nano) support.

## Architecture

### Core Files
1. **`src/lib/screen-capture-utils.ts`** - Desktop Capture API utilities
   - `requestMediaStream(types)` - Shows Chrome picker dialog for user selection
   - `getMediaStream(streamId)` - Converts streamId to MediaStream with proper constraints
   - `extractFrameFromStream(stream, options)` - Converts video frame to base64 PNG
   - `captureCurrentTab/Window/Screen()` - High-level capture functions
   - `captureScreenWithPicker()` - Full picker showing tab/window/screen options
   - `isDesktopCaptureSupported()` - Browser capability check

2. **`src/hooks/use-screen-capture.ts`** - React state management hook
   - Manages capture state (isCapturing, capturedImage, isPreviewOpen, error)
   - Handles entire capture flow with error handling and user feedback
   - Uses `captureScreenWithPicker()` for full picker experience
   - Integrates with Sonner toast notifications

3. **`src/components/ui/screen-capture-preview-dialog.tsx`** - Preview UI
   - Shows captured screenshot with dimensions
   - Buttons: "Send to AI", "Retake", "Cancel"
   - Integrated with existing image attachment flow

4. **`src/components/ui/message-input.tsx`** - Camera button
   - Added camera icon button next to image upload button
   - Only visible when provider === 'built-in-ai'
   - Disabled during capture or message generation

5. **`src/App.tsx`** - Main integration
   - Integrates useScreenCapture hook
   - `handleScreenCaptureConfirm()` converts base64 to File and sets as imageAttachment
   - Passes capture state and handlers to Chat component

## Key Technical Details

### Critical Fix: chromeMediaSource Constraint
- **MUST always use `chromeMediaSource: 'desktop'`** regardless of capture type (tab/window/screen)
- This counter-intuitive constraint is required by Chrome's Desktop Capture API
- Source: https://github.com/BuildChromeExtensions/screenrecorder (verified working implementation)

### MediaStream Constraints Structure
```typescript
const constraints: MediaStreamConstraints = {
  audio: false,
  video: {
    mandatory: {
      chromeMediaSource: 'desktop', // Always this value
      chromeMediaSourceId: streamId, // From desktopCapture.chooseDesktopMedia
    },
  } as unknown as MediaTrackConstraints,
};
```

### Manifest Changes
- Added `"desktopCapture"` permission to `public/manifest.json` permissions array

### Features Implemented
✅ Full picker showing Tab/Window/Screen options
✅ Permission flow with user dialog
✅ Frame extraction and base64 PNG conversion
✅ Preview dialog with confirmation
✅ Error handling with toast notifications
✅ Provider capability check (Built-in AI only)
✅ Proper cleanup of MediaStream resources
✅ No console spam in production

## User Experience Flow
1. User clicks camera button (only visible for Built-in AI)
2. Chrome shows picker dialog with tab/window/screen options
3. User selects source and clicks "Share"
4. Extension shows preview dialog with screenshot
5. User can "Send to AI", "Retake", or "Cancel"
6. On confirmation, image is attached and sent as multimodal input
7. Built-in AI analyzes the captured content

## Provider Support
- **Built-in AI (Gemini Nano)**: ✅ Full support (multimodal capable)
- **WebLLM (Llama 3.2)**: ❌ Not supported (no image input)
- **Transformers.js (Llama 3.2)**: ❌ Not supported (no image input)

## Testing Notes
- Tested with multiple capture sources (tab, window, screen)
- Verified image properly attached to messages
- Tested permission flow (both allow and deny)
- Tested error scenarios (user cancellation, stream errors)
- Verified no console spam during normal usage

## Debugging Tips
- Only errors show in console (console.error calls)
- If capture fails, check browser console for error details
- Ensure `desktopCapture` permission is in manifest.json
- Verify Built-in AI is active provider before attempting capture

## Related Documentation
- Updated `.github/copilot-instructions.md` section 1b with complete architecture
- See "Screen Capture Feature" section for detailed implementation guide
