import { describe, it, expect } from 'vitest'
import {
  extractYouTubeVideoId,
  formatTranscript,
  createYouTubeTranscriptPrompt,
  truncateTranscript,
} from '../lib/youtube-utils'

describe('YouTube Utils', () => {
  describe('extractYouTubeVideoId', () => {
    it('should extract video ID from standard watch URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      const id = extractYouTubeVideoId(url)
      expect(id).toBe('dQw4w9WgXcQ')
    })

    it('should extract video ID from short youtu.be URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ'
      const id = extractYouTubeVideoId(url)
      expect(id).toBe('dQw4w9WgXcQ')
    })

    it('should extract video ID from embed URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      const id = extractYouTubeVideoId(url)
      expect(id).toBe('dQw4w9WgXcQ')
    })

    it('should extract video ID from youtube-nocookie.com', () => {
      const url = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
      const id = extractYouTubeVideoId(url)
      expect(id).toBe('dQw4w9WgXcQ')
    })

    it('should handle URL with additional parameters', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s&list=PLtest'
      const id = extractYouTubeVideoId(url)
      expect(id).toBe('dQw4w9WgXcQ')
    })

    it('should return null for invalid URL', () => {
      const url = 'https://example.com/video'
      const id = extractYouTubeVideoId(url)
      expect(id).toBeNull()
    })

    it('should return null for malformed URL', () => {
      const url = 'not-a-valid-url'
      const id = extractYouTubeVideoId(url)
      expect(id).toBeNull()
    })

    it('should return null for YouTube URL without video ID', () => {
      const url = 'https://www.youtube.com/'
      const id = extractYouTubeVideoId(url)
      expect(id).toBeNull()
    })
  })

  describe('formatTranscript', () => {
    it('should format transcript array into text', () => {
      const transcripts = [
        { text: 'Hello' },
        { text: 'World' },
        { text: 'Test' },
      ]

      const result = formatTranscript(transcripts)

      expect(result).toBe('Hello World Test')
    })

    it('should remove newlines', () => {
      const transcripts = [
        { text: 'Line 1\n' },
        { text: 'Line 2\n\n' },
        { text: 'Line 3' },
      ]

      const result = formatTranscript(transcripts)

      expect(result).not.toContain('\n')
      expect(result).toBe('Line 1 Line 2 Line 3')
    })

    it('should handle empty array', () => {
      const result = formatTranscript([])
      expect(result).toBe('')
    })

    it('should trim whitespace', () => {
      const transcripts = [
        { text: '  Hello  ' },
        { text: '  World  ' },
      ]

      const result = formatTranscript(transcripts)

      expect(result).toBe('Hello   World')
    })
  })

  describe('createYouTubeTranscriptPrompt', () => {
    it('should create prompt with title and transcript', () => {
      const title = 'Test Video'
      const transcript = 'This is a test transcript'

      const prompt = createYouTubeTranscriptPrompt(title, transcript)

      expect(prompt).toContain('Test Video')
      expect(prompt).toContain('This is a test transcript')
      expect(prompt).toContain('summary')
    })

    it('should include channel name when provided', () => {
      const title = 'Test Video'
      const transcript = 'Test transcript'
      const channel = 'Test Channel'

      const prompt = createYouTubeTranscriptPrompt(title, transcript, channel)

      expect(prompt).toContain('Channel: Test Channel')
    })

    it('should work without channel name', () => {
      const title = 'Test Video'
      const transcript = 'Test transcript'

      const prompt = createYouTubeTranscriptPrompt(title, transcript)

      expect(prompt).not.toContain('Channel:')
      expect(prompt).toContain('Test Video')
    })

    it('should handle null channel name', () => {
      const title = 'Test Video'
      const transcript = 'Test transcript'

      const prompt = createYouTubeTranscriptPrompt(title, transcript, null)

      expect(prompt).not.toContain('Channel:')
    })
  })

  describe('truncateTranscript', () => {
    it('should not truncate short transcripts', () => {
      const transcript = 'Short transcript'
      const result = truncateTranscript(transcript)
      expect(result).toBe('Short transcript')
    })

    it('should truncate long transcripts', () => {
      const longTranscript = 'a'.repeat(20000)
      const result = truncateTranscript(longTranscript)
      
      expect(result.length).toBeLessThan(longTranscript.length)
      expect(result.endsWith('...')).toBe(true)
    })

    it('should respect custom max length', () => {
      const transcript = 'a'.repeat(200)
      const result = truncateTranscript(transcript, 100)
      
      expect(result.length).toBeLessThanOrEqual(103) // 100 + '...'
    })

    it('should break at word boundaries', () => {
      const transcript = 'hello world this is a test message with many words'
      const result = truncateTranscript(transcript, 20)
      
      expect(result.endsWith('...')).toBe(true)
      // Should not end with a partial word before the ellipsis
      const withoutEllipsis = result.replace('...', '').trim()
      expect(withoutEllipsis).not.toMatch(/\w$/)
    })

    it('should handle transcript with no spaces at truncation point', () => {
      const transcript = 'a'.repeat(100)
      const result = truncateTranscript(transcript, 50)
      
      expect(result.length).toBeLessThanOrEqual(53)
      expect(result.endsWith('...')).toBe(true)
    })

    it('should use default max length of 15000', () => {
      const longTranscript = 'a'.repeat(20000)
      const result = truncateTranscript(longTranscript)
      
      // Should be truncated to around 15000 characters
      expect(result.length).toBeLessThan(15100)
      expect(result.length).toBeGreaterThan(14000)
    })
  })
})
