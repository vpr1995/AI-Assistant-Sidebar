# Voice-to-Text & Iframe Permission Implementation

Date: 2025-10-24

Summary
-------
This memory documents the implementation of voice-to-text input (Web Speech API) in the sidebar UI and the iframe-based microphone permission workaround required for Chrome extension side panels. It includes the key files changed/created, the behavior and flow, the permission iframe lifecycle, UI adjustments, and testing notes.

Why this change
----------------
- Chrome extension side panels cannot reliably show browser permission prompts when `navigator.mediaDevices.getUserMedia()` is called directly from the sidebar context. The browser may silently deny the request.
- Workaround: inject a hidden iframe into the active page (via the content script) that calls `getUserMedia()` to trigger the browser permission dialog for the extension. The iframe then posts permission results back to the extension.
- Implement a robust voice-to-text solution that:
  - Uses the Web Speech API (preferred) with a MediaRecorder blob fallback
  - Handles interim vs final transcripts correctly (only final results are appended)
  - Auto-stops recognition after a short silence window
  - Prevents UI/UX races and cleanup issues (first-click no-op, recognition "already started")
  - Disables the mic while the model is generating and auto-stops when generation begins

Key files (created/modified)
----------------------------
- src/hooks/use-voice-speech-recognition.ts
  - Web Speech API wrapper (startListening, stopListening, abortListening)
  - Only appends final results to the transcript (no repeated interim accumulation)
  - Adds a silence auto-stop timeout (2s default) and cleans up timeouts on end/stop
  - Calls `abort()` if recognition is started while already active to avoid "recognition already started" errors
  - Exposes: isSupported, isListening, transcript, startListening, stopListening, abortListening, resetTranscript

- src/hooks/use-audio-recording.ts
  - Coordinates getUserMedia, MediaRecorder (recordAudio), and Web Speech API hook
  - Calls permission manager: requestMicrophonePermissionSmart() before getUserMedia
  - Introduced `hasStartedRecordingRef` guard to avoid auto-complete firing before a successful start (fixes first-click no-op)
  - stopRecording handles both speech-transcript and blob-transcription fallback, and properly cleans up streams and flags
  - Exposes: isListening, isRecording, toggleListening, stopRecording, etc.

- src/lib/iframe-permission-manager.ts
  - Manages hidden iframe injection approach as a fallback when direct getUserMedia fails
  - Tries direct `getUserMedia()` first; on permission-like failures, injects `microphone-permission-iframe`
  - Listens for postMessage from iframe
  - 15-second timeout to allow user to interact with permission dialog (was increased from 10s)
  - Proper cleanup of listeners and iframe after response or timeout

- public/permission.html
  - Minimal/hidden iframe page that loads `permission-request.js` and runs in the iframe context

- public/permission-request.js
  - Runs in iframe: calls `navigator.mediaDevices.getUserMedia({ audio: true })`
  - On success: stops tracks and posts `PERMISSION_GRANTED` to parent
  - On failure: posts `PERMISSION_DENIED` with error message

- src/content.ts
  - Injects the permissions iframe into the active web page at document load via `injectMicrophonePermissionIframe()` (so the browser will display the permission dialog when the extension is installed or the page is loaded)

- public/manifest.json
  - Ensures `permission.html` and `permission-request.js` are in `web_accessible_resources` so the iframe can load them

- src/components/ui/message-input.tsx
  - Disables the microphone button while `isGenerating` is true (to prevent conflicts)
  - Adds `useEffect` to auto-stop recording if generation begins while mic was active

Behavior and flow
------------------
1. User clicks the microphone button in the sidebar UI.
2. `useAudioRecording.toggleListening()` starts:
   - Calls `requestMicrophonePermissionSmart()` which attempts a direct `getUserMedia()` and falls back to the iframe method if needed.
   - If iframe fallback: content script injects `permission.html` into the active page and `permission-request.js` calls `getUserMedia()` inside that iframe. The browser shows its permission dialog for the iframe context. The iframe posts back `PERMISSION_GRANTED` or `PERMISSION_DENIED`.
   - Upon grant, `useAudioRecording` obtains the audio stream via `navigator.mediaDevices.getUserMedia()` in the sidebar (it now succeeds) and starts recording/recognition.
3. Web Speech API recognition runs with `interimResults: true` and `continuous: true`, but only final results are appended to the transcript state.
4. Silence detection: after 2 seconds of no new final results, recognition is auto-stopped and `stopRecording()` is called automatically by the hook (UI updates accordingly).
5. When a response generation starts (`isGenerating === true`), the mic is disabled and any active recording is stopped immediately (to avoid conflicts).

Testing notes
--------------
- Build: `npm run build` — dist contains `permission.html` and `permission-request.js`.
- Load unpacked extension from `dist/` in `chrome://extensions/` (Developer mode).
- On first install/load, open any webpage (content script injects iframe) and you should see the permission dialog for the extension when the iframe runs getUserMedia.
- Test scenarios:
  - Allow permission: subsequent mic clicks start recording immediately.
  - Deny permission: stop and show error; user can retry.
  - Speak: speak a phrase and wait 2s silence → recognition auto-stops and sends transcript.
  - Start generation while recording: recording is auto-stopped; mic disabled until generation completes.
  - Rapid start/stop: no duplicated transcripts; no "recognition has already started" errors.

Build/verification
-------------------
- Verified builds succeeded with the current code: `vite build` completed and `dist/permission.html` and `dist/permission-request.js` exist.
- Noted chunk-size warnings (large transformer worker) but unrelated to the voice feature.

Notes / Caveats
----------------
- The iframe workaround is necessary specifically for Chrome side panel contexts; other contexts may allow direct permission prompts.
- The memory records the current default silence timeout (2s) and iframe permission timeout (15s); these are tunable.
- The implementation currently disables mic during generation to avoid conflicting state. We can also choose to disable mic while transcribing if desired.

Files to inspect for future changes
-----------------------------------
- `src/hooks/use-voice-speech-recognition.ts`
- `src/hooks/use-audio-recording.ts`
- `src/lib/iframe-permission-manager.ts`
- `public/permission.html`, `public/permission-request.js`
- `src/content.ts`
- `src/components/ui/message-input.tsx`

---

This memory captures the design, reasoning, and implementation details for the voice input + permission flow. It should make future maintenance and improvements straightforward.
