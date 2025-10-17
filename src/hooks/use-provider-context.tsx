import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  doesBrowserSupportBuiltInAI,
  builtInAI,
} from '@built-in-ai/core'
import { doesBrowserSupportWebLLM } from '@built-in-ai/web-llm'

export type AIProvider = 'built-in-ai' | 'web-llm'

interface ProviderContextType {
  activeProvider: AIProvider | null
  setActiveProvider: (provider: AIProvider) => void
  availableProviders: AIProvider[]
  isLoading: boolean
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined)

/**
 * Get the list of available providers in the current browser
 */
function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = []

  if (doesBrowserSupportBuiltInAI()) {
    providers.push('built-in-ai')
  }

  if (doesBrowserSupportWebLLM()) {
    providers.push('web-llm')
  }

  return providers
}

/**
 * Detect which provider is available and should be used as default
 */
async function detectDefaultProvider(): Promise<AIProvider | null> {
  if (doesBrowserSupportBuiltInAI()) {
    const model = builtInAI()
    const availability = await model.availability()
    if (availability !== 'unavailable') {
      return 'built-in-ai'
    }
  }

  if (doesBrowserSupportWebLLM()) {
    return 'web-llm'
  }

  return null
}

interface ProviderProviderProps {
  children: ReactNode
}

export function ProviderProvider({ children }: ProviderProviderProps) {
  const [activeProvider, setActiveProviderState] = useState<AIProvider | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize provider on mount
  useEffect(() => {
    const initializeProvider = async () => {
      // Try to load saved preference from Chrome storage
      try {
        const result = await chrome.storage.local.get('preferredProvider')
        const savedProvider = result.preferredProvider as AIProvider | undefined

        if (savedProvider) {
          const available = getAvailableProviders()
          if (available.includes(savedProvider)) {
            setActiveProviderState(savedProvider)
            setIsLoading(false)
            return
          }
        }
      } catch {
        console.log('Chrome storage not available, using fallback')
      }

      // Detect default provider
      const defaultProvider = await detectDefaultProvider()
      setActiveProviderState(defaultProvider)
      setIsLoading(false)
    }

    initializeProvider()
  }, [])

  const setActiveProvider = (provider: AIProvider) => {
    setActiveProviderState(provider)
    // Save to Chrome storage for persistence
    try {
      chrome.storage.local.set({ preferredProvider: provider })
    } catch {
      console.log('Could not save provider preference to Chrome storage')
    }
  }

  return (
    <ProviderContext.Provider
      value={{
        activeProvider,
        setActiveProvider,
        availableProviders: getAvailableProviders(),
        isLoading,
      }}
    >
      {children}
    </ProviderContext.Provider>
  )
}

/**
 * Hook to access the provider context
 */
export function useProvider() {
  const context = useContext(ProviderContext)
  if (!context) {
    throw new Error('useProvider must be used within a ProviderProvider')
  }
  return context
}
