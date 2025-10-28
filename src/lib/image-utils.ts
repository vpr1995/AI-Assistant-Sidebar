/**
 * Utility functions for handling image attachments in multimodal messages
 */

/**
 * Convert a File or Blob to base64 string
 * @param file - The image file to convert
 * @returns Promise resolving to base64 encoded string
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Validate if file is a supported image format
 * @param file - The file to validate
 * @returns true if file is a supported image format
 */
export function isSupportedImageFormat(file: File | Blob): boolean {
  const supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
  const mimeType = file.type
  return supportedFormats.includes(mimeType)
}

/**
 * Create a preview URL for displaying the image
 * @param file - The image file
 * @returns Data URL string for the image
 */
export async function createImagePreview(file: File | Blob): Promise<string> {
  return fileToBase64(file)
}
