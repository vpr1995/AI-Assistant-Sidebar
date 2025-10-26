/**
 * ProviderStatusBanners Component - Warning and info banners for AI provider status
 */

import { X } from 'lucide-react'
import type { AIProvider } from '@/types/chat'

export interface ProviderStatusBannersProps {
  activeProvider: AIProvider
  isAIAvailable: boolean
  dismissedWebLLMInfo: boolean
  dismissedTransformersJSInfo: boolean
  onDismissWebLLM: () => void
  onDismissTransformersJS: () => void
}

export function ProviderStatusBanners({
  activeProvider,
  isAIAvailable,
  dismissedWebLLMInfo,
  dismissedTransformersJSInfo,
  onDismissWebLLM,
  onDismissTransformersJS,
}: ProviderStatusBannersProps) {
  return (
    <>
      {/* Warning when AI is not available */}
      {!isAIAvailable && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
            ⚠️ No AI providers available
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
            Please ensure your browser supports Chrome Built-in AI, WebLLM, or TransformersJS.
          </p>
        </div>
      )}

      {/* Info message for WebLLM fallback */}
      {activeProvider === 'web-llm' && !dismissedWebLLMInfo && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between gap-2">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            ℹ️ Using WebLLM with local model. First response may take longer as
            the model downloads.
          </p>
          <button
            onClick={onDismissWebLLM}
            className="flex-shrink-0 p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4 text-blue-700 dark:text-blue-300" />
          </button>
        </div>
      )}

      {/* Info message for TransformersJS fallback */}
      {activeProvider === 'transformers-js' && !dismissedTransformersJSInfo && (
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800 flex items-center justify-between gap-2">
          <p className="text-xs text-purple-700 dark:text-purple-300">
            ℹ️ Using TransformersJS with local model. First response may take longer as
            the model downloads.
          </p>
          <button
            onClick={onDismissTransformersJS}
            className="flex-shrink-0 p-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded transition-colors"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4 text-purple-700 dark:text-purple-300" />
          </button>
        </div>
      )}
    </>
  )
}
