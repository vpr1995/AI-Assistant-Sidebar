/**
 * iframe-permission-manager.ts
 * Manages the iframe that requests microphone permissions
 * This workaround is needed because Chrome extension sidebars don't show permission dialogs
 */

interface PermissionResult {
  granted: boolean
  error?: string
}

/**
 * Injects an iframe that requests microphone permissions
 * The iframe will trigger the browser's permission dialog
 * @returns Promise that resolves when permission is granted or rejected
 */
export function requestMicrophonePermissionViaIframe(): Promise<PermissionResult> {
  return new Promise((resolve) => {
    // Check if iframe already exists
    let iframe = document.getElementById('microphone-permission-iframe') as HTMLIFrameElement | null

    // Remove old iframe if it exists
    if (iframe) {
      iframe.remove()
    }

    // Create a new iframe
    iframe = document.createElement('iframe')
    iframe.id = 'microphone-permission-iframe'
    iframe.setAttribute('hidden', 'hidden')
    iframe.setAttribute('allow', 'microphone')

    // Set the src to the permission HTML file
    // This uses chrome.runtime.getURL if available (in extension context)
    // Otherwise falls back to the public path
    try {
      iframe.src = chrome.runtime.getURL('/permission.html')
    } catch {
      // Fallback if chrome.runtime is not available
      iframe.src = '/permission.html'
    }

    // Listen for messages from the iframe
    const messageHandler = (event: MessageEvent) => {
      if (
        event.source === iframe?.contentWindow &&
        (event.data.type === 'PERMISSION_GRANTED' || event.data.type === 'PERMISSION_DENIED')
      ) {
        console.log('[PermissionManager] Received message from iframe:', event.data.type)

        // Remove the message listener
        window.removeEventListener('message', messageHandler)

        // Clear the timeout since we got a response
        clearTimeout(timeout)

        // Remove the iframe after a short delay (allows cleanup)
        setTimeout(() => {
          if (iframe && iframe.parentNode) {
            console.log('[PermissionManager] Removing permission iframe')
            iframe.remove()
          }
        }, 100)

        // Resolve with the result
        resolve({
          granted: event.data.granted,
          error: event.data.error,
        })
      }
    }

    // Add message listener
    window.addEventListener('message', messageHandler)

    // Add timeout in case something goes wrong
    // 15 second timeout allows users time to see and interact with permission dialog
    const timeout = setTimeout(() => {
      console.warn('[PermissionManager] Permission request timed out after 15 seconds')
      window.removeEventListener('message', messageHandler)
      if (iframe && iframe.parentNode) {
        iframe.remove()
      }
      resolve({
        granted: false,
        error: 'Permission request timed out',
      })
    }, 15000) // 15 second timeout for permission dialog interaction

    // Append iframe to document body
    document.body.appendChild(iframe)
    console.log('[PermissionManager] Permission iframe injected - waiting up to 15 seconds for user response')
  })
}

/**
 * Checks if microphone permission has already been granted
 * @returns Promise<boolean> - true if permission is granted, false otherwise
 */
export async function checkMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // If we got here, permission is granted
    // Clean up the stream
    stream.getTracks().forEach((track) => {
      track.stop()
    })
    return true
  } catch {
    // Permission not granted or not available
    return false
  }
}

/**
 * Requests microphone permission with iframe as fallback
 * First tries direct request, then falls back to iframe method if needed
 * @returns Promise<PermissionResult> - result of permission request
 */
export async function requestMicrophonePermissionSmart(): Promise<PermissionResult> {
  try {
    console.log('[PermissionManager] Attempting direct microphone access...')
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    console.log('[PermissionManager] Direct access granted')

    // Clean up the stream
    stream.getTracks().forEach((track) => {
      track.stop()
    })

    return { granted: true }
  } catch (error) {
    // Direct method failed, try iframe method
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Only use iframe method if it looks like a permission error
    if (
      errorMessage.includes('Permission') ||
      errorMessage.includes('NotAllowedError') ||
      errorMessage.includes('permission')
    ) {
      console.log('[PermissionManager] Direct access failed, trying iframe method...')
      return requestMicrophonePermissionViaIframe()
    }

    // Not a permission error, return the actual error
    return {
      granted: false,
      error: errorMessage,
    }
  }
}
