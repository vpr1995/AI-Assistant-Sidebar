import { describe, it, expect } from 'vitest'
import { convertImageToBase64 } from '../lib/image-utils'

describe('Image Utils', () => {
  describe('convertImageToBase64', () => {
    it('should convert File to base64', async () => {
      // Create a mock file
      const content = 'test image content'
      const blob = new Blob([content], { type: 'image/png' })
      const file = new File([blob], 'test.png', { type: 'image/png' })

      const result = await convertImageToBase64(file)

      expect(result).toBeDefined()
      expect(result.mimeType).toBe('image/png')
      expect(result.data).toBeDefined()
      expect(typeof result.data).toBe('string')
    })

    it('should handle JPEG images', async () => {
      const content = 'test jpeg content'
      const blob = new Blob([content], { type: 'image/jpeg' })
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' })

      const result = await convertImageToBase64(file)

      expect(result.mimeType).toBe('image/jpeg')
    })

    it('should handle WebP images', async () => {
      const content = 'test webp content'
      const blob = new Blob([content], { type: 'image/webp' })
      const file = new File([blob], 'test.webp', { type: 'image/webp' })

      const result = await convertImageToBase64(file)

      expect(result.mimeType).toBe('image/webp')
    })
  })
})
