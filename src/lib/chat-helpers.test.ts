import { describe, it, expect } from 'vitest'
import { generateChatPreview, generateChatTitle } from '../lib/chat-helpers'

describe('Chat Helpers', () => {
  describe('generateChatPreview', () => {
    it('should generate preview from user message', () => {
      const messages = [
        { id: '1', role: 'user' as const, content: 'Hello, how are you?', timestamp: Date.now() },
      ]

      const preview = generateChatPreview(messages)

      expect(preview).toBe('Hello, how are you?')
    })

    it('should truncate long messages to 100 characters', () => {
      const longMessage = 'a'.repeat(150)
      const messages = [
        { id: '1', role: 'user' as const, content: longMessage, timestamp: Date.now() },
      ]

      const preview = generateChatPreview(messages)

      expect(preview.length).toBeLessThanOrEqual(103) // 100 + '...'
      expect(preview.endsWith('...')).toBe(true)
    })

    it('should skip assistant messages and find user message', () => {
      const messages = [
        { id: '1', role: 'assistant' as const, content: 'I am an assistant', timestamp: Date.now() },
        { id: '2', role: 'user' as const, content: 'User message', timestamp: Date.now() },
      ]

      const preview = generateChatPreview(messages)

      expect(preview).toBe('User message')
    })

    it('should handle empty messages array', () => {
      const preview = generateChatPreview([])

      expect(preview).toBe('')
    })

    it('should handle messages with no user content', () => {
      const messages = [
        { id: '1', role: 'assistant' as const, content: 'Only assistant messages', timestamp: Date.now() },
      ]

      const preview = generateChatPreview(messages)

      expect(preview).toBe('')
    })
  })

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

      expect(title.length).toBeLessThanOrEqual(53) // 50 + '...'
      expect(title.endsWith('...')).toBe(true)
    })

    it('should return default title for empty messages', () => {
      const title = generateChatTitle([])

      expect(title).toBe('New Chat')
    })

    it('should skip assistant messages', () => {
      const messages = [
        { id: '1', role: 'assistant' as const, content: 'Assistant message', timestamp: Date.now() },
        { id: '2', role: 'user' as const, content: 'User message here', timestamp: Date.now() },
      ]

      const title = generateChatTitle(messages)

      expect(title).toBe('User message here')
    })
  })
})
