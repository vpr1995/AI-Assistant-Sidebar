import { describe, it, expect } from 'vitest'
import { getRewritePrompt, REWRITE_TONES } from '../lib/rewrite-utils'

describe('Rewrite Utils', () => {
  describe('REWRITE_TONES', () => {
    it('should have 8 different tones', () => {
      expect(REWRITE_TONES).toHaveLength(8)
    })

    it('should include expected tones', () => {
      const toneIds = REWRITE_TONES.map(t => t.id)
      expect(toneIds).toContain('concise')
      expect(toneIds).toContain('professional')
      expect(toneIds).toContain('casual')
      expect(toneIds).toContain('formal')
      expect(toneIds).toContain('engaging')
      expect(toneIds).toContain('simplified')
      expect(toneIds).toContain('technical')
      expect(toneIds).toContain('creative')
    })

    it('should have unique tone names', () => {
      const names = REWRITE_TONES.map(t => t.id)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })
  })

  describe('getRewritePrompt', () => {
    it('should return correct prompt for concise tone', () => {
      const prompt = getRewritePrompt('This is a test text', 'concise')
      expect(prompt).toContain('concise')
      expect(prompt).toContain('This is a test text')
    })

    it('should return correct prompt for professional tone', () => {
      const prompt = getRewritePrompt('Hello world', 'professional')
      expect(prompt).toContain('professional')
      expect(prompt).toContain('Hello world')
    })

    it('should return correct prompt for casual tone', () => {
      const prompt = getRewritePrompt('Test message', 'casual')
      expect(prompt).toContain('casual')
      expect(prompt).toContain('Test message')
    })

    it('should return correct prompt for formal tone', () => {
      const prompt = getRewritePrompt('Sample text', 'formal')
      expect(prompt).toContain('formal')
      expect(prompt).toContain('Sample text')
    })

    it('should handle empty text', () => {
      const prompt = getRewritePrompt('', 'concise')
      expect(prompt).toBeDefined()
      expect(typeof prompt).toBe('string')
    })

    it('should handle long text', () => {
      const longText = 'a'.repeat(1000)
      const prompt = getRewritePrompt(longText, 'simplified')
      expect(prompt).toContain(longText)
    })
  })
})
