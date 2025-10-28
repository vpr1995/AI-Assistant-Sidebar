/**
 * Tool storage utility for persisting tool selection to chrome.storage.local
 */

import type { ToolSelection } from '@/lib/tools'
import { getDefaultToolSelection } from '@/lib/tools'

const TOOL_SELECTION_KEY = 'tool-selection'

/**
 * Get selected tools from storage
 */
export async function getSelectedTools(): Promise<ToolSelection> {
  try {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.log('[tool-storage] chrome.storage not available, returning defaults')
      return getDefaultToolSelection()
    }

    const result = await chrome.storage.local.get(TOOL_SELECTION_KEY)
    const stored = result[TOOL_SELECTION_KEY]

    if (stored && typeof stored === 'object') {
      console.log('[tool-storage] Retrieved selected tools from storage:', stored)
      return stored as ToolSelection
    }

    // Initialize with defaults if not found
    console.log('[tool-storage] No tools stored, initializing with defaults')
    const defaults = getDefaultToolSelection()
    await saveSelectedTools(defaults)
    return defaults
  } catch (error) {
    console.error('[tool-storage] Error reading tools from storage:', error)
    return getDefaultToolSelection()
  }
}

/**
 * Save selected tools to storage
 */
export async function saveSelectedTools(selection: ToolSelection): Promise<void> {
  try {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.log('[tool-storage] chrome.storage not available, cannot save')
      return
    }

    await chrome.storage.local.set({ [TOOL_SELECTION_KEY]: selection })
    console.log('[tool-storage] Saved selected tools to storage:', selection)
  } catch (error) {
    console.error('[tool-storage] Error saving tools to storage:', error)
  }
}

/**
 * Update a single tool's selection state
 */
export async function updateToolSelection(toolId: string, enabled: boolean): Promise<ToolSelection> {
  const current = await getSelectedTools()
  const updated = { ...current, [toolId]: enabled }
  await saveSelectedTools(updated)
  return updated
}

/**
 * Subscribe to changes in tool selection
 */
export function onToolSelectionChange(callback: (selection: ToolSelection) => void): () => void {
  if (typeof chrome === 'undefined' || !chrome.storage) {
    console.log('[tool-storage] chrome.storage not available, cannot subscribe to changes')
    return () => {}
  }

  const handleStorageChange = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ) => {
    if (areaName === 'local' && changes[TOOL_SELECTION_KEY]) {
      const newValue = changes[TOOL_SELECTION_KEY].newValue
      console.log('[tool-storage] Tool selection changed:', newValue)
      if (newValue && typeof newValue === 'object') {
        callback(newValue as ToolSelection)
      }
    }
  }

  chrome.storage.onChanged.addListener(handleStorageChange)

  // Return unsubscribe function
  return () => {
    chrome.storage.onChanged.removeListener(handleStorageChange)
  }
}
