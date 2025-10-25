/**
 * requestPermission.js
 * Requests user permission for microphone access.
 * This runs in an iframe injected by the content script.
 */

/**
 * Request microphone permission from the user
 * @returns {Promise<void>} A Promise that resolves when permission is granted or rejects with an error
 */
async function getUserPermission() {
  return new Promise((resolve, reject) => {
    console.log('[PermissionRequest] Requesting microphone access...')
    
    // Using navigator.mediaDevices.getUserMedia to request microphone access
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        // Permission granted, handle the stream if needed
        console.log('[PermissionRequest] Microphone access granted')
        
        // Stop the tracks to prevent the recording indicator from being shown
        stream.getTracks().forEach(function (track) {
          track.stop()
        })
        
        // Send message to parent window indicating success
        window.parent.postMessage(
          {
            type: 'PERMISSION_GRANTED',
            granted: true
          },
          '*'
        )
        
        console.log('[PermissionRequest] Success message sent to parent')
        resolve()
      })
      .catch((error) => {
        console.error('[PermissionRequest] Error requesting microphone permission:', error)
        
        const errorMsg = error instanceof Error ? error.message : String(error)
        
        // Send message to parent window indicating failure
        window.parent.postMessage(
          {
            type: 'PERMISSION_DENIED',
            granted: false,
            error: errorMsg
          },
          '*'
        )
        
        console.log('[PermissionRequest] Error message sent to parent:', errorMsg)
        reject(error)
      })
  })
}

// Call the function to request microphone permission when this script loads
getUserPermission()

