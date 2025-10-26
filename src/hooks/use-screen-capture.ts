/**
 * Hook for managing screen capture state and flow
 * Handles capture, preview dialog, and integration with image attachment
 */

import { useState, useCallback } from 'react'
import { captureScreenWithPicker } from '@/lib/screen-capture-utils'
import { CaptureResult } from '@/lib/screen-capture-utils'
import { toast } from 'sonner'

export interface ScreenCaptureState {
  isCapturing: boolean;
  capturedImage: CaptureResult | null;
  isPreviewOpen: boolean;
  error: string | null;
}

export interface UseScreenCaptureReturn extends ScreenCaptureState {
  capture: () => Promise<void>;
  setPreviewOpen: (open: boolean) => void;
  clearError: () => void;
  closeCaptureFlow: () => void;
}

/**
 * Hook to manage screen capture state and flow
 * @returns Object containing capture state and handlers
 */
export function useScreenCapture(): UseScreenCaptureReturn {
  const [state, setState] = useState<ScreenCaptureState>({
    isCapturing: false,
    capturedImage: null,
    isPreviewOpen: false,
    error: null,
  });

  /**
   * Initiates screen capture with user picker (tab/window/screen options)
   * Shows preview dialog on success, error toast on failure
   */
  const capture = useCallback(async () => {
    setState((prev) => ({ ...prev, isCapturing: true, error: null }));

    try {
      const result = await captureScreenWithPicker({
        maxWidth: 1920,
        maxHeight: 1080,
      });

      setState((prev) => ({
        ...prev,
        capturedImage: result,
        isPreviewOpen: true,
        isCapturing: false,
      }));
      
      toast.success('Screen captured successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture screen';

      // Don't show error for user cancellation
      if (errorMessage.includes('cancelled')) {
        setState((prev) => ({
          ...prev,
          isCapturing: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isCapturing: false,
          error: errorMessage,
        }));
        toast.error(`Screen capture failed: ${errorMessage}`);
      }
    }
  }, []);

  /**
   * Opens or closes the preview dialog
   */
  const setPreviewOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, isPreviewOpen: open }));
  }, []);

  /**
   * Clears any error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Closes entire capture flow (preview and captured image)
   */
  const closeCaptureFlow = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPreviewOpen: false,
      capturedImage: null,
      error: null,
    }));
  }, []);

  return {
    ...state,
    capture,
    setPreviewOpen,
    clearError,
    closeCaptureFlow,
  };
}
