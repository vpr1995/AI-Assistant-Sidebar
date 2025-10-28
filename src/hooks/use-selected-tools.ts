/**
 * Hook for managing selected tools state
 * Persists to chrome.storage.local and subscribes to changes
 */

import { useEffect, useState, useCallback } from 'react'
import type { ToolSelection } from '@/lib/tools'
import { getDefaultToolSelection } from '@/lib/tools'
import { getSelectedTools, updateToolSelection, onToolSelectionChange } from '@/lib/tool-storage'

export function useSelectedTools() {
  const [tools, setTools] = useState<ToolSelection>(getDefaultToolSelection())
  const [isLoading, setIsLoading] = useState(true)

  // Load initial tool selection from storage
  useEffect(() => {
    let mounted = true

    const loadTools = async () => {
      try {
        const stored = await getSelectedTools()
        if (mounted) {
          setTools(stored)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('[useSelectedTools] Error loading tools:', error)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadTools()

    return () => {
      mounted = false
    }
  }, [])

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = onToolSelectionChange((newSelection) => {
      setTools(newSelection)
    })

    return unsubscribe
  }, [])

  // Toggle tool enabled state
  const toggleTool = useCallback(
    async (toolId: string, enabled: boolean) => {
      const updated = await updateToolSelection(toolId, enabled)
      setTools(updated)
    },
    []
  )

  // Get list of enabled tool IDs
  const getEnabledToolIds = useCallback((): string[] => {
    return Object.entries(tools)
      .filter(([, isEnabled]) => isEnabled)
      .map(([id]) => id)
  }, [tools])

  // Check if a specific tool is enabled
  const isToolEnabled = useCallback(
    (toolId: string): boolean => {
      return tools[toolId] ?? false
    },
    [tools]
  )

  return {
    tools,
    isLoading,
    toggleTool,
    getEnabledToolIds,
    isToolEnabled,
  }
}
