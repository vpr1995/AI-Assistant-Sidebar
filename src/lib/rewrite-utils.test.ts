import { describe, it, expect } from 'vitest'
import { getTonePrompt, AVAILABLE_TONES } from '../lib/rewrite-utils'

describe('Rewrite Utils', () => {
  describe('AVAILABLE_TONES', () => {
    it('should have 8 different tones', () => {
      expect(AVAILABLE_TONES).toHaveLength(8)
    })

    it('should include expected tones', () => {
      const toneNames = AVAILABLE_TONES.map(t => t.name)
      expect(toneNames).toContain('Concise')
      expect(toneNames).toContain('Professional')
      expect(toneNames).toContain('Casual')
      expect(toneNames).toContain('Formal')
      expect(toneNames).toContain('Engaging')
      expect(toneNames).toContain('Simplified')
      expect(toneNames).toContain('Technical')
      expect(toneNames).toContain('Creative')
    })

    it('should have unique tone names', () => {
      const names = AVAILABLE_TONES.map(t => t.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })
  })

  describe('getTonePrompt', () => {
    it('should return correct prompt for Concise tone', () => {
      const prompt = getTonePrompt('Concise', 'This is a test text')
      expect(prompt).toContain('Concise')
      expect(prompt).toContain('This is a test text')
    })

    it('should return correct prompt for Professional tone', () => {
      const prompt = getTonePrompt('Professional', 'Hello world')
      expect(prompt).toContain('Professional')
      expect(prompt).toContain('Hello world')
    })

    it('should return correct prompt for Casual tone', () => {
      const prompt = getTonePrompt('Casual', 'Test message')
      expect(prompt).toContain('Casual')
      expect(prompt).toContain('Test message')
    })

    it('should return correct prompt for Formal tone', () => {
      const prompt = getTonePrompt('Formal', 'Sample text')
      expect(prompt).toContain('Formal')
      expect(prompt).toContain('Sample text')
    })

    it('should handle empty text', () => {
      const prompt = getTonePrompt('Concise', '')
      expect(prompt).toBeDefined()
      expect(typeof prompt).toBe('string')
    })

    it('should handle long text', () => {
      const longText = 'a'.repeat(1000)
      const prompt = getTonePrompt('Simplified', longText)
      expect(prompt).toContain(longText)
    })
  })
})
