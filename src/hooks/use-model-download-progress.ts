/**
 * Custom hook for managing model download progress state
 * Handles progress tracking and auto-dismiss functionality
 */

import { useState, useEffect } from 'react'
import type { ModelDownloadProgress } from '@/types/chat'
import type { ClientSideChatTransport } from '@/lib/client-side-chat-transport'

export interface UseModelDownloadProgressReturn {
  modelDownloadProgress: ModelDownloadProgress | null
}

/**
 * Manages model download progress state and registers callback with transport
 * Auto-dismisses progress dialog 1 second after completion
 */
export function useModelDownloadProgress(
  transport: ClientSideChatTransport
): UseModelDownloadProgressReturn {
  const [modelDownloadProgress, setModelDownloadProgress] = useState<ModelDownloadProgress | null>(null)

  // Set up download progress callback on transport
  useEffect(() => {
    transport.onDownloadProgress((progress) => {
      console.log('[useModelDownloadProgress] Download progress:', progress)
      setModelDownloadProgress({
        status: progress.status as "downloading" | "extracting" | "complete",
        progress: progress.progress,
        message: progress.message,
      })

      // Auto-dismiss after 1 second when complete
      if (progress.status === 'complete') {
        setTimeout(() => {
          setModelDownloadProgress(null)
        }, 1000)
      }
    })
  }, [transport])

  return {
    modelDownloadProgress,
  }
}
