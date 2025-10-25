/**
 * request-microphone-permission.ts
 * 
 * Injects an iframe to request microphone permission
 * This is a workaround for Chrome Extension sidebar context where
 * getUserMedia doesn't show permission dialog directly
 * 
 * Based on: https://medium.com/@lynchee.owo/how-to-enable-microphone-access-in-chrome-extensions-by-code-924295170080
 */

let permissionIframeInjected = false

/**
 * Injects an iframe that requests microphone permission
 * The iframe loads permission.html which triggers the browser permission dialog
 */
export function injectMicrophonePermissionIframe(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Only inject once
    if (permissionIframeInjected) {
      console.log('[MicrophonePermission] Permission iframe already injected')
      resolve()
      return
    }

    try {
      console.log('[MicrophonePermission] Injecting microphone permission iframe...')

      // Create hidden iframe
      const iframe = document.createElement('iframe')
      iframe.id = 'microphone-permission-iframe'
      iframe.style.display = 'none'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = 'none'
      iframe.style.visibility = 'hidden'

      // Set the allow attribute to request microphone permission
      iframe.setAttribute('allow', 'microphone')

      // Get the permission.html file from extension resources
      iframe.src = chrome.runtime.getURL('permission.html')

      // Set up message listener for responses from iframe
      const messageHandler = (event: MessageEvent) => {
        const { type } = event.data

        if (type === 'PERMISSION_GRANTED') {
          console.log('[MicrophonePermission] Permission granted via iframe')
          permissionIframeInjected = true
          
          // Clean up event listener
          window.removeEventListener('message', messageHandler)
          
          // Remove iframe after a short delay
          setTimeout(() => {
            const iframeToRemove = document.getElementById('microphone-permission-iframe')
            if (iframeToRemove && iframeToRemove.parentNode) {
              iframeToRemove.parentNode.removeChild(iframeToRemove)
            }
          }, 100)
          
          resolve()
        } else if (type === 'PERMISSION_DENIED') {
          console.warn('[MicrophonePermission] Permission denied via iframe:', event.data.error)
          
          // Clean up event listener
          window.removeEventListener('message', messageHandler)
          
          // Remove iframe after a short delay
          setTimeout(() => {
            const iframeToRemove = document.getElementById('microphone-permission-iframe')
            if (iframeToRemove && iframeToRemove.parentNode) {
              iframeToRemove.parentNode.removeChild(iframeToRemove)
            }
          }, 100)
          
          reject(new Error(`Microphone permission denied: ${event.data.error}`))
        }
      }

      window.addEventListener('message', messageHandler)

      // Set a timeout in case permission request doesn't respond
      const timeout = setTimeout(() => {
        console.warn('[MicrophonePermission] Permission request timeout')
        window.removeEventListener('message', messageHandler)
        
        // Remove iframe
        const iframeToRemove = document.getElementById('microphone-permission-iframe')
        if (iframeToRemove && iframeToRemove.parentNode) {
          iframeToRemove.parentNode.removeChild(iframeToRemove)
        }
        
        permissionIframeInjected = true
        // Resolve anyway to allow the app to continue
        resolve()
      }, 3000)

      // Inject iframe into document
      document.body.appendChild(iframe)

      // Clear timeout after a short time if we get a response
      const checkInterval = setInterval(() => {
        if (permissionIframeInjected) {
          clearTimeout(timeout)
          clearInterval(checkInterval)
        }
      }, 100)
    } catch (error) {
      console.error('[MicrophonePermission] Error injecting permission iframe:', error)
      reject(error)
    }
  })
}

/**
 * Check if we're in a context where iframe injection is needed
 * This is typically needed for Chrome Extension sidebars
 */
export function isIframePermissionNeeded(): boolean {
  // Check if we're in a Chrome extension context
  const isChromeExtension = typeof chrome !== 'undefined' && 
                           chrome.runtime && 
                           typeof chrome.runtime.getURL === 'function'
  
  return isChromeExtension
}
