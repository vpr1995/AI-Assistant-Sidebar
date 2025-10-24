/**
 * YouTube utilities for extracting video information and transcripts
 */

/**
 * Extract video ID from YouTube URL
 * Handles multiple URL formats:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://www.youtube.com/embed/dQw4w9WgXcQ
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    
    // Handle youtube.com and www.youtube.com
    if (urlObj.hostname === 'youtube.com' || urlObj.hostname === 'www.youtube.com') {
      return urlObj.searchParams.get('v')
    }
    
    // Handle youtu.be short links
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1)
    }
    
    // Handle youtube-nocookie.com embeds
    if (urlObj.hostname === 'www.youtube-nocookie.com' || urlObj.hostname === 'youtube-nocookie.com') {
      const pathParts = urlObj.pathname.split('/')
      return pathParts[pathParts.length - 1] || null
    }
    
    // Handle embed URLs
    if (urlObj.pathname.startsWith('/embed/')) {
      const embedId = urlObj.pathname.split('/')[2]
      return embedId || null
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Check if current URL is a YouTube video
 */
export function isYouTubeVideoPage(): boolean {
  const url = window.location.href
  return (
    url.includes('youtube.com/watch') ||
    url.includes('youtu.be/') ||
    url.includes('youtube.com/embed/') ||
    url.includes('youtube-nocookie.com/embed/')
  )
}

/**
 * Get YouTube video title from the page
 */
export function getYouTubeVideoTitle(): string | null {
  // Try to get title from h1 element (main title on watch page)
  const h1 = document.querySelector('h1 yt-formatted-string')
  if (h1) {
    return h1.textContent
  }
  
  // Fallback to page title
  const title = document.querySelector('title')?.textContent
  if (title) {
    // Remove " - YouTube" suffix if present
    return title.replace(' - YouTube', '').trim()
  }
  
  return null
}

/**
 * Get YouTube video duration from the page
 */
export function getYouTubeVideoDuration(): string | null {
  // Try to get duration from video player (HH:MM:SS format)
  const durationElement = document.querySelector('.ytp-time-duration')
  if (durationElement) {
    return durationElement.textContent?.trim() || null
  }
  
  return null
}

/**
 * Get YouTube channel name from the page
 */
export function getYouTubeChannelName(): string | null {
  // Try to get channel name from the channel link/name
  const channelLink = document.querySelector('#channel-name a, ytd-channel-name a')
  if (channelLink) {
    return channelLink.textContent?.trim() || null
  }
  
  // Fallback: try to find it in the header
  const channelName = document.querySelector('yt-formatted-string[role="button"][aria-label*="Channel"]')
  if (channelName) {
    return channelName.textContent?.trim() || null
  }
  
  return null
}

/**
 * Format transcript into readable text
 * @param transcripts - Array of transcript objects from youtube-transcript
 * @returns Formatted transcript text
 */
export function formatTranscript(transcripts: Array<{ text: string }>): string {
  if (!transcripts || transcripts.length === 0) {
    return ''
  }
  
  return transcripts
    .map((item) => item.text)
    .join(' ')
    .replace(/\n+/g, ' ') // Remove newlines
    .trim()
}

/**
 * Create a summary prompt for YouTube transcript
 */
export function createYouTubeTranscriptPrompt(
  videoTitle: string,
  transcript: string,
  channelName?: string | null
): string {
  const channelInfo = channelName ? `\nChannel: ${channelName}` : ''
  
  return `Please provide a concise and well-structured summary of the following YouTube video transcript.

Video Title: ${videoTitle}${channelInfo}

Transcript:
${transcript}

Provide a clear summary that captures the main points and key takeaways from the video.`
}

/**
 * Truncate transcript to a maximum length
 * Keeps full words at the truncation point
 */
export function truncateTranscript(transcript: string, maxLength: number = 15000): string {
  if (transcript.length <= maxLength) {
    return transcript
  }
  
  // Find the last space before maxLength to avoid cutting words
  let truncated = transcript.substring(0, maxLength)
  const lastSpaceIndex = truncated.lastIndexOf(' ')
  
  if (lastSpaceIndex > 0) {
    truncated = transcript.substring(0, lastSpaceIndex)
  }
  
  return truncated + '...'
}
