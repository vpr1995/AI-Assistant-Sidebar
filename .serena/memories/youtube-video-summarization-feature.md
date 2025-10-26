# YouTube Video Summarization Feature

This feature enables users to summarize YouTube videos directly from the context menu using the triple-provider AI system.

## Feature Overview

-   **Workflow**:
    1.  The user navigates to any YouTube video page (watch, youtu.be, shorts, embeds).
    2.  Right-clicks anywhere on the page and selects "Summarize this video."
    3.  The extension extracts the video ID and fetches the transcript.
    4.  Video metadata (title, channel, URL) is extracted from the page.
    5.  The sidebar opens with a user message showing video details.
    6.  The AI summarizes the transcript and streams the summary character-by-character.

## Supported YouTube URL Formats

-   Standard videos: `https://www.youtube.com/watch?v=VIDEO_ID`
-   Short URLs: `https://youtu.be/VIDEO_ID`
-   YouTube Shorts: `https://www.youtube.com/shorts/VIDEO_ID`
-   Embedded videos: `https://www.youtube.com/embed/VIDEO_ID`
-   No-cookie embeds: `https://www.youtube-nocookie.com/embed/VIDEO_ID`

## Implementation Details

### Files Involved

-   **`src/lib/youtube-utils.ts`**: YouTube-specific utilities (235 lines)
    -   `extractYouTubeVideoId()` - Extracts video ID from various URL formats
    -   `isYouTubeVideoPage()` - Checks if current page is a YouTube video
    -   `getYouTubeVideoTitle()` - Extracts video title from page DOM
    -   `getYouTubeChannelName()` - Extracts channel name from page DOM
    -   `formatTranscript()` - Formats transcript array into readable text
    -   `createYouTubeTranscriptPrompt()` - Creates AI summarization prompt
    -   `truncateTranscript()` - Truncates transcript to max length (15,000 chars)

-   **`src/content.ts`**: Content script with YouTube support
    -   Listens for `extractYouTubeTranscript` action
    -   Uses `YoutubeTranscript.fetchTranscript()` from `@danielxceron/youtube-transcript`
    -   Extracts video metadata (title, channel, URL, ID)
    -   Returns structured data with transcript content
    -   Handles errors (age-gated, no captions, etc.)

-   **`src/background.ts`**: Context menu and routing
    -   Creates "Summarize this video" context menu
    -   Only shows on YouTube domains via `documentUrlPatterns`
    -   Patterns: `youtube.com/watch*`, `youtu.be/*`, `youtube-nocookie.com/embed/*`
    -   Routes transcript extraction request to content script
    -   Sends `summarizeYouTubeVideo` message to sidebar

-   **`src/App.tsx`**: Request handling and UI
    -   Handles `summarizeYouTubeVideo` messages
    -   Clears chat history on new video summarization
    -   Creates user message: "YouTube Video Summary: **{title}**\n{url}\nChannel: {channel}"
    -   Calls `transport.streamSummary()` with transcript
    -   Streams AI-generated summary with typing animation

-   **`public/manifest.json`**: YouTube permissions
    -   Content scripts match YouTube domains
    -   Host permissions for `*://*.youtube.com/*` and `*://*.youtu.be/*`
    -   Ensures content script runs on all YouTube pages

## Technical Architecture

### Message Flow
```
User on YouTube video → Right-click → "Summarize this video"
    ↓
background.ts: contextMenus.onClicked
    ↓
Sends message to content script: { action: 'extractYouTubeTranscript' }
    ↓
content.ts: Extracts video ID from URL
    ↓
Fetches transcript: YoutubeTranscript.fetchTranscript(videoId)
    ↓
Extracts metadata: title, channel, URL
    ↓
Returns: { title, content (transcript), byline (channel), url, videoId, isYouTubeVideo: true }
    ↓
background.ts: Receives transcript data
    ↓
Opens sidebar: chrome.sidePanel.open()
    ↓
Sends to sidebar: { action: 'summarizeYouTubeVideo', data: {...} }
    ↓
App.tsx: chrome.runtime.onMessage handler
    ↓
Creates user message with video info
    ↓
Streams summary: transport.streamSummary(prompt, onChunk)
    ↓
UI displays with typing animation
```

### Transcript Extraction

The `@danielxceron/youtube-transcript` library uses a dual-fallback approach:
1.  **Primary Method**: HTML scraping from the video page
2.  **Fallback Method**: YouTube InnerTube API

This ensures high reliability even for videos with complex caption configurations.

### AI Provider Support

Works with all three providers in the fallback chain:
-   **Built-in AI**: Fast summarization (if available)
-   **WebLLM**: Quality fallback
-   **Transformers.js**: Universal compatibility

## User Experience Features

-   **Context Menu Visibility**: Only appears on YouTube video pages
-   **Automatic Sidebar**: Opens if not already visible
-   **Video Metadata Display**: Shows title, channel, and clickable URL
-   **Streaming Summary**: Real-time text generation with typing animation
-   **Chat History**: New video summarizations clear previous messages
-   **Error Handling**: User-friendly messages for transcriptless videos

## Transcript Processing

-   **Maximum Length**: 15,000 characters (to fit in AI context window)
-   **Truncation Indicator**: Shows "[Transcript truncated for length]" if needed
-   **Formatting**: Converts transcript array to readable text format
-   **Language Support**: Works with any language that has captions available

## Error Handling

### Graceful Failures
-   **No Video ID**: "Could not extract video ID from URL"
-   **No Transcript**: "No transcript available (age-gated, restricted, or no captions)"
-   **Fetch Error**: "Failed to fetch transcript: [error details]"
-   **AI Error**: Standard AI error handling with user notification

### Edge Cases
-   Age-gated videos: Transcripts may not be accessible
-   Live streams: Usually have auto-generated captions
-   Music videos: May have limited or no captions
-   Foreign language: Works if captions exist, but summary quality varies

## Limitations

1.  **Requires Captions**: Only works if the video has transcripts/captions available
2.  **Transcript Length**: Videos longer than ~2 hours may have truncated transcripts
3.  **Language Quality**: Summary quality best for English, varies for other languages
4.  **First-Time Download**: May require model download for WebLLM/Transformers.js
5.  **Processing Time**: Long videos take longer to summarize (2-10 seconds typical)

## Privacy & Performance

-   **100% Local**: Transcripts processed in-browser, no external API calls
-   **No Logging**: Video data never leaves the device
-   **Efficient Extraction**: Transcript fetch takes ~1-3 seconds
-   **Model Reuse**: No model reloading between video summaries
-   **Offline After First Load**: Models cached locally after initial download
