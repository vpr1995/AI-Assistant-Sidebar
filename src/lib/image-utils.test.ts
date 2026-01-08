import { describe, it, expect } from 'vitest'
import { fileToBase64, isSupportedImageFormat } from '../lib/image-utils'

describe('Image Utils', () => {
  describe('fileToBase64', () => {
    it('should convert File to base64', async () => {
      // Create a mock file
      const content = 'test image content'
      const blob = new Blob([content], { type: 'image/png' })
      const file = new File([blob], 'test.png', { type: 'image/png' })

      const result = await fileToBase64(file)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.startsWith('data:')).toBe(true)
    })

    it('should handle JPEG images', async () => {
      const content = 'test jpeg content'
      const blob = new Blob([content], { type: 'image/jpeg' })
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' })

      const result = await fileToBase64(file)

      expect(result.includes('image/jpeg')).toBe(true)
    })

    it('should handle WebP images', async () => {
      const content = 'test webp content'
      const blob = new Blob([content], { type: 'image/webp' })
      const file = new File([blob], 'test.webp', { type: 'image/webp' })

      const result = await fileToBase64(file)

      expect(result.includes('image/webp')).toBe(true)
    })
  })

  describe('isSupportedImageFormat', () => {
    it('should return true for supported formats', () => {
      const pngBlob = new Blob([], { type: 'image/png' })
      expect(isSupportedImageFormat(pngBlob)).toBe(true)

      const jpegBlob = new Blob([], { type: 'image/jpeg' })
      expect(isSupportedImageFormat(jpegBlob)).toBe(true)

      const webpBlob = new Blob([], { type: 'image/webp' })
      expect(isSupportedImageFormat(webpBlob)).toBe(true)
    })

    it('should return false for unsupported formats', () => {
      const pdfBlob = new Blob([], { type: 'application/pdf' })
      expect(isSupportedImageFormat(pdfBlob)).toBe(false)

      const textBlob = new Blob([], { type: 'text/plain' })
      expect(isSupportedImageFormat(textBlob)).toBe(false)
    })
  })
})
