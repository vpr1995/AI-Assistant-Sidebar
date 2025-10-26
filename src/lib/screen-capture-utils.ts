/**
 * Screen capture utilities for Chrome extension
 * Provides functions to capture current tab or full screen and convert to base64 images
 */

export type CaptureType = 'tab' | 'window' | 'screen';

export interface CaptureOptions {
  type?: CaptureType;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, default 0.8
}

export interface CaptureResult {
  imageData: string; // base64 encoded PNG
  width: number;
  height: number;
  mimeType: string;
}

/**
 * Requests desktop media from user via Chrome's media picker dialog
 * @param types - Array of capture types to allow user to choose from
 * @returns Promise resolving to streamId or empty string if user cancels
 */
export async function requestMediaStream(types: CaptureType[]): Promise<string> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.desktopCapture) {
      console.error('[ScreenCapture] Desktop Capture API not available');
      resolve('');
      return;
    }

    chrome.desktopCapture.chooseDesktopMedia(
      types as Parameters<typeof chrome.desktopCapture.chooseDesktopMedia>[0],
      (streamId) => {
        resolve(streamId || '');
      }
    );
  });
}

/**
 * Converts a streamId (from desktopCapture) into a MediaStream
 * Note: chromeMediaSource should always be 'desktop' regardless of capture type
 */
async function getMediaStream(streamId: string): Promise<MediaStream> {
  // Always use 'desktop' for chromeMediaSource - this is correct even for tab captures
  const constraints: MediaStreamConstraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: streamId,
      },
    } as unknown as MediaTrackConstraints,
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    console.error('[ScreenCapture] getUserMedia failed:', error);
    throw error;
  }
}

/**
 * Extracts a single frame from MediaStream and converts to base64 image
 * @param stream - MediaStream from getMediaStream
 * @param options - Capture options (width, height, quality)
 * @returns Promise resolving to CaptureResult with image data and dimensions
 */
export async function extractFrameFromStream(
  stream: MediaStream,
  options: CaptureOptions = {}
): Promise<CaptureResult> {
  const { maxWidth = 1920, maxHeight = 1080 } = options;

  return new Promise((resolve, reject) => {
    try {
      // Create video element to play the stream
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for video to be ready and get dimensions
      const onLoadedMetadata = () => {
        try {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);

          // Get video dimensions
          let { videoWidth, videoHeight } = video;

          // Scale down if necessary
          if (videoWidth > maxWidth || videoHeight > maxHeight) {
            const aspectRatio = videoWidth / videoHeight;
            if (videoWidth > maxWidth) {
              videoWidth = maxWidth;
              videoHeight = Math.round(maxWidth / aspectRatio);
            }
            if (videoHeight > maxHeight) {
              videoHeight = maxHeight;
              videoWidth = Math.round(maxHeight * aspectRatio);
            }
          }

          // Create canvas and draw frame
          const canvas = document.createElement('canvas');
          canvas.width = videoWidth;
          canvas.height = videoHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }

          ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

          // Convert to base64 PNG
          const imageData = canvas.toDataURL('image/png');

          // Cleanup
          stream.getTracks().forEach((track) => track.stop());
          video.pause();
          video.srcObject = null;

          resolve({
            imageData,
            width: videoWidth,
            height: videoHeight,
            mimeType: 'image/png',
          });
        } catch (error) {
          console.error('[ScreenCapture] Error in onLoadedMetadata:', error);
          reject(error);
        }
      };

      video.addEventListener('loadedmetadata', onLoadedMetadata);

      // Timeout in case video never loads
      const timeoutId = setTimeout(() => {
        console.error('[ScreenCapture] Video metadata load timeout');
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        stream.getTracks().forEach((track) => track.stop());
        reject(new Error('Screen capture timed out. Please try again or check if the screen source is accessible.'));
      }, 5000);

      // Clear timeout if loaded
      const originalOnLoadedMetadata = onLoadedMetadata;
      video.addEventListener('loadedmetadata', () => {
        clearTimeout(timeoutId);
        originalOnLoadedMetadata();
      });
    } catch (error) {
      console.error('[ScreenCapture] Error in extractFrameFromStream:', error);
      reject(error);
    }
  });
}

/**
 * Captures current active tab
 * @param options - Capture options
 * @returns Promise resolving to CaptureResult
 */
export async function captureCurrentTab(options: CaptureOptions = {}): Promise<CaptureResult> {
  const streamId = await requestMediaStream(['tab']);
  if (!streamId) {
    throw new Error('User cancelled screen capture');
  }

  const stream = await getMediaStream(streamId);
  const result = await extractFrameFromStream(stream, { type: 'tab', ...options });

  return result;
}

/**
 * Captures current window
 * @param options - Capture options
 * @returns Promise resolving to CaptureResult
 */
export async function captureCurrentWindow(options: CaptureOptions = {}): Promise<CaptureResult> {
  const streamId = await requestMediaStream(['window']);
  if (!streamId) {
    throw new Error('User cancelled screen capture');
  }

  const stream = await getMediaStream(streamId);
  const result = await extractFrameFromStream(stream, { type: 'window', ...options });

  return result;
}

/**
 * Captures entire screen
 * @param options - Capture options
 * @returns Promise resolving to CaptureResult
 */
export async function captureScreen(options: CaptureOptions = {}): Promise<CaptureResult> {
  const streamId = await requestMediaStream(['screen']);
  if (!streamId) {
    throw new Error('User cancelled screen capture');
  }

  const stream = await getMediaStream(streamId);
  const result = await extractFrameFromStream(stream, { type: 'screen', ...options });

  return result;
}

/**
 * High-level function to capture with user choice (tab/window/screen)
 * @param options - Capture options
 * @returns Promise resolving to CaptureResult
 */
export async function captureScreenWithPicker(options: CaptureOptions = {}): Promise<CaptureResult> {
  const streamId = await requestMediaStream(['tab', 'window', 'screen']);
  if (!streamId) {
    throw new Error('User cancelled screen capture');
  }

  // Always use 'desktop' source when picker is used (Chrome treats tab/window/screen as desktop)
  const stream = await getMediaStream(streamId);
  const result = await extractFrameFromStream(stream, options);

  return result;
}

/**
 * Validates if browser supports Desktop Capture API
 * @returns boolean indicating support
 */
export function isDesktopCaptureSupported(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.desktopCapture;
}
