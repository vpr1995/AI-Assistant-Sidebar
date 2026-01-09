import { describe, it, expect } from 'vitest'
import { cn } from '../lib/utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'hidden')
      expect(result).toContain('base')
      expect(result).toContain('conditional')
      expect(result).not.toContain('hidden')
    })

    it('should handle undefined and null', () => {
      const result = cn('base', undefined, null, 'end')
      expect(result).toBe('base end')
    })

    it('should merge Tailwind conflicting classes', () => {
      // tailwind-merge should keep the last conflicting class
      const result = cn('p-4', 'p-8')
      expect(result).toBe('p-8')
    })

    it('should handle arrays', () => {
      const result = cn(['class1', 'class2'])
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('should handle objects', () => {
      const result = cn({ 'class1': true, 'class2': false, 'class3': true })
      expect(result).toContain('class1')
      expect(result).toContain('class3')
      expect(result).not.toContain('class2')
    })

    it('should handle empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle complex nested conditions', () => {
      const isActive = true
      const isDisabled = false
      const result = cn(
        'base-class',
        isActive && 'active',
        isDisabled && 'disabled',
        !isDisabled && 'enabled'
      )
      expect(result).toContain('base-class')
      expect(result).toContain('active')
      expect(result).toContain('enabled')
      expect(result).not.toContain('disabled')
    })
  })
})
