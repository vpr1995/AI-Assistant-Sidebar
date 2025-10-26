# Voice Input Feature (Speech-to-Text)

This document details the voice input implementation using the Web Speech API with an iframe-based microphone permission workaround for Chrome extension side panels.

## Overview

The voice input feature allows users to speak instead of typing messages. It uses the browser's native Speech Recognition API with automatic silence detection and proper permission handling for Chrome extension contexts.

## The Permission Challenge

Chrome extension side panels cannot reliably show browser permission prompts when `navigator.mediaDevices.getUserMedia()` is called directly. The browser may silently deny the request without showing a permission dialog.

**Solution**: Use an iframe injected into the active page to trigger the permission dialog, then use the granted permission in the sidebar.

## Architecture

### Key Components

1.  **Speech Recognition Hook** (`src/hooks/use-voice-speech-recognition.ts`)
    -   Wraps Web Speech API
    -   Only appends **final** results (no interim accumulation)
    -   Auto-stops after 2 seconds of silence
    -   Prevents "already started" errors with abort handling
    -   Exposes: `isSupported`, `isListening`, `transcript`, `startListening`, `stopListening`, `abortListening`, `resetTranscript`

2.  **Audio Recording Hook** (`src/hooks/use-audio-recording.ts`)
    -   Coordinates `getUserMedia`, MediaRecorder, and Speech API
    -   Calls permission manager before accessing microphone
    -   Guards against first-click no-op with `hasStartedRecordingRef`
    -   Handles cleanup of streams and flags
    -   Fallback to MediaRecorder blob transcription (if Speech API unavailable)
    -   Exposes: `isListening`, `isRecording`, `toggleListening`, `stopRecording`

3.  **Iframe Permission Manager** (`src/lib/iframe-permission-manager.ts`)
    -   Tries direct `getUserMedia()` first
    -   Falls back to iframe injection on permission-like failures
    -   Injects `microphone-permission-iframe` into active page
    -   Listens for postMessage from iframe
    -   15-second timeout for user interaction with permission dialog
    -   Cleans up listeners and iframe after response or timeout

4.  **Permission Page** (`public/permission.html` & `public/permission-request.js`)
    -   Minimal iframe page that loads in the page context
    -   `permission-request.js` calls `getUserMedia({ audio: true })`
    -   On success: Stops tracks and posts `PERMISSION_GRANTED` to parent
    -   On failure: Posts `PERMISSION_DENIED` with error message

5.  **Content Script Integration** (`src/content.ts`)
    -   Injects permissions iframe into active web page at document load
    -   Called via `injectMicrophonePermissionIframe()`
    -   Ensures iframe is ready when user first clicks microphone

6.  **UI Integration** (`src/components/ui/message-input.tsx`)
    -   Microphone button in message input controls
    -   Disabled while `isGenerating` is true (prevents conflicts)
    -   Auto-stops recording if generation begins while mic is active
    -   Visual indicator when recording (button color change)

7.  **Audio Visualizer** (`src/components/ui/audio-visualizer.tsx`)
    -   Canvas-based waveform animation
    -   Shows real-time audio levels during recording
    -   Provides visual feedback to user

## Permission Flow

```
User clicks microphone button
    ↓
toggleListening() → requestMicrophonePermissionSmart()
    ↓
Try direct getUserMedia() in sidebar context
    ↓
If fails (permission denied/not available)
    ↓
Content script injects permission.html iframe into page
    ↓
iframe's permission-request.js calls getUserMedia()
    ↓
Browser shows permission dialog (iframe context)
    ↓
User allows/denies permission
    ↓
iframe posts PERMISSION_GRANTED or PERMISSION_DENIED to parent
    ↓
Permission manager receives message (15s timeout)
    ↓
If granted: sidebar calls getUserMedia() (now succeeds)
    ↓
Start audio stream and Speech Recognition
```

## Speech Recognition Flow

```
Microphone button clicked
    ↓
Permission obtained (via flow above)
    ↓
getUserMedia({ audio: true }) obtains audio stream
    ↓
Web Speech API recognition starts
    ↓
User speaks → interim results (ignored)
    ↓
User finishes phrase → final result
    ↓
Final transcript appended to input
    ↓
Silence detected (2 seconds with no final results)
    ↓
Recognition auto-stops
    ↓
stopRecording() cleanup: stop tracks, reset flags
    ↓
Transcript ready in message input
```

## Implementation Details

### Speech Recognition Configuration

-   **`interimResults: true`**: Receive partial results while speaking
-   **`continuous: true`**: Don't stop after single phrase
-   **Final Results Only**: Only final results appended to transcript (prevents duplication)
-   **Silence Detection**: 2-second timeout after last final result
-   **Auto-cleanup**: Timeouts cleared on end/stop/error

### Key Behaviors

1.  **First-Click Guard**: `hasStartedRecordingRef` prevents auto-completion firing before successful start
2.  **Generation Conflict Prevention**: Mic disabled while `isGenerating === true`
3.  **Auto-stop on Generation**: If user speaks while AI generates, recording stops automatically
4.  **Error Handling**: Graceful fallback and user-friendly error messages
5.  **Stream Cleanup**: All audio tracks stopped and removed on completion

### Manifest Configuration

**`public/manifest.json`** includes:
-   `permission.html` and `permission-request.js` in `web_accessible_resources`
-   Allows iframe to load these files from extension bundle

## User Experience

### Visual Feedback
-   Microphone button changes color when active (red/blue)
-   Audio visualizer shows waveform during recording
-   Button disabled during AI generation
-   Clear indication of recording state

### Interaction Flow
1.  Click microphone → Permission dialog (first time only)
2.  Allow permission → Recording starts immediately
3.  Speak naturally → Text appears in input as you speak
4.  Pause for 2 seconds → Recording auto-stops
5.  Edit text if needed → Send message

### Edge Cases Handled
-   **Rapid start/stop**: No "already started" errors due to abort handling
-   **Permission denied**: Clear error message, can retry later
-   **Generation conflict**: Mic auto-stops if AI starts generating
-   **Multiple clicks**: Proper state management prevents race conditions
-   **Stream cleanup**: All resources properly released

## Configuration

### Tunable Parameters

-   **Silence Timeout**: 2 seconds (in `use-voice-speech-recognition.ts`)
-   **Permission Timeout**: 15 seconds (in `iframe-permission-manager.ts`)
-   **Recognition Language**: Browser default (typically user's OS language)

### Future Enhancements

-   Language selector for recognition
-   Adjustable silence timeout
-   Push-to-talk mode (hold button instead of toggle)
-   Visual feedback for interim results
-   Offline speech recognition (when available)

## Browser Compatibility

-   **Chrome/Edge**: Full support with Web Speech API
-   **Firefox**: Limited Speech API support, falls back to MediaRecorder
-   **Safari**: Requires webkit prefix, partial support
-   **Requirements**: HTTPS or localhost (for getUserMedia)

## Testing Checklist

-   ✅ Permission dialog shows on first use
-   ✅ Recording starts after permission granted
-   ✅ Speech recognition captures spoken words
-   ✅ Auto-stops after 2 seconds of silence
-   ✅ Mic disabled during AI generation
-   ✅ Recording stops if generation starts
-   ✅ No "already started" errors on rapid clicks
-   ✅ Stream cleanup on stop/abort
-   ✅ Visual feedback (button color, waveform)
-   ✅ Error handling for permission denied

## Files Reference

### Hooks
-   `src/hooks/use-voice-speech-recognition.ts` - Speech API wrapper
-   `src/hooks/use-audio-recording.ts` - Audio coordination

### Libraries
-   `src/lib/iframe-permission-manager.ts` - Permission iframe handler
-   `src/lib/request-microphone-permission.ts` - Permission request helper

### Components
-   `src/components/ui/message-input.tsx` - Mic button integration
-   `src/components/ui/audio-visualizer.tsx` - Waveform visualization

### Extension Files
-   `public/permission.html` - Permission iframe page
-   `public/permission-request.js` - Permission request script
-   `src/content.ts` - Iframe injection

### Configuration
-   `public/manifest.json` - Web accessible resources

## Status

✅ **Fully Implemented and Tested** (October 24, 2025)
-   Permission flow working reliably
-   Speech recognition accurate
-   Auto-stop functioning correctly
-   No race conditions or state conflicts
-   Production-ready
