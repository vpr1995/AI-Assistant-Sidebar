/**
 * Custom hook for managing AI provider state and detection
 * Handles provider availability checking, active provider tracking, and user preferences
 */

import { useState, useEffect } from 'react'
import {
  doesBrowserSupportBuiltInAI
} from '@built-in-ai/core'
import {
  doesBrowserSupportWebLLM
} from '@built-in-ai/web-llm'
import {
  doesBrowserSupportTransformersJS
} from '@built-in-ai/transformers-js'
import { detectActiveProvider } from '@/lib/utils'
import type { AIProvider } from '@/types/chat'
import type { ClientSideChatTransport } from '@/lib/client-side-chat-transport'

export interface UseAIProviderReturn {
  activeProvider: AIProvider
  preferredProvider: 'built-in-ai' | 'web-llm' | 'transformers-js' | 'auto'
  availableProviders: ('built-in-ai' | 'web-llm' | 'transformers-js')[]
  setPreferredProvider: (provider: 'built-in-ai' | 'web-llm' | 'transformers-js' | 'auto') => void
  isClient: boolean
}

/**
 * Detects available AI providers and manages provider state
 * Sets up provider change callbacks and handles provider switching
 */
export function useAIProvider(
  transport: ClientSideChatTransport
): UseAIProviderReturn {
  const [activeProvider, setActiveProvider] = useState<AIProvider>(null)
  const [preferredProvider, setPreferredProvider] = useState<
    'built-in-ai' | 'web-llm' | 'transformers-js' | 'auto'
  >('auto')
  const [availableProviders, setAvailableProviders] = useState<
    ('built-in-ai' | 'web-llm' | 'transformers-js')[]
  >([])
  const [isClient, setIsClient] = useState(false)

  // Detect active provider on client side only
  useEffect(() => {
    console.log('[useAIProvider] Component mounted, detecting provider...')
    setIsClient(true)

    // Set up callback to track provider changes
    transport.onProviderChange((provider) => {
      console.log('[useAIProvider] Provider changed to:', provider)
      setActiveProvider(provider)
    })

    // Initialize available providers
    const checkAvailableProviders = async () => {
      const available: ('built-in-ai' | 'web-llm' | 'transformers-js')[] = []

      if (doesBrowserSupportBuiltInAI()) {
        available.push('built-in-ai')
        // Default to Built-in AI if available, otherwise auto
        setPreferredProvider('built-in-ai')
      }

      if (doesBrowserSupportWebLLM()) {
        available.push('web-llm')
      }

      if (doesBrowserSupportTransformersJS()) {
        available.push('transformers-js')
      }

      console.log('[useAIProvider] Available providers:', available)
      setAvailableProviders(available)
    }

    checkAvailableProviders().then(() => {
      detectActiveProvider().then((provider) => {
        console.log('[useAIProvider] Provider detection complete:', provider)
        setActiveProvider(provider)
      })
    })
  }, [transport])

  // Update transport's preferred provider when it changes
  useEffect(() => {
    console.log('[useAIProvider] Preferred provider changed to:', preferredProvider)
    transport.setPreferredProvider(preferredProvider)
  }, [preferredProvider, transport])

  return {
    activeProvider,
    preferredProvider,
    availableProviders,
    setPreferredProvider,
    isClient,
  }
}
