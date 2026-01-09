import { describe, it, expect } from 'vitest'
import { generateChatTitle } from '../lib/chat-storage'

describe('Chat Helpers', () => {
  describe('generateChatTitle', () => {
    it('should generate title from first user message', () => {
      const messages = [
        { id: '1', role: 'user' as const, content: 'What is the weather today?', timestamp: Date.now() },
      ]

      const title = generateChatTitle(messages)

      expect(title).toBe('What is the weather today?')
    })

    it('should truncate long titles to 50 characters', () => {
      const longMessage = 'This is a very long message that should be truncated to 50 characters maximum'
      const messages = [
        { id: '1', role: 'user' as const, content: longMessage, timestamp: Date.now() },
      ]

      const title = generateChatTitle(messages)

      expect(title.length).toBeLessThanOrEqual(50)
    })

    it('should return default title for empty messages', () => {
      const title = generateChatTitle([])

      expect(title).toBe('Untitled Chat')
    })

    it('should skip assistant messages', () => {
      const messages = [
        { id: '1', role: 'assistant' as const, content: 'Assistant message', timestamp: Date.now() },
        { id: '2', role: 'user' as const, content: 'User message here', timestamp: Date.now() },
      ]

      const title = generateChatTitle(messages)

      expect(title).toBe('User message here')
    })

    it('should handle messages with only first line', () => {
      const messages = [
        { id: '1', role: 'user' as const, content: 'First line\nSecond line\nThird line', timestamp: Date.now() },
      ]

      const title = generateChatTitle(messages)

      expect(title).toBe('First line')
      expect(title).not.toContain('\n')
    })
  })
})
