import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getSelectedTools,
  saveSelectedTools,
  updateToolSelection,
} from '../lib/tool-storage'
import type { ToolSelection } from '../lib/tools/types'

describe('Tool Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSelectedTools', () => {
    it('should return stored tool selection', async () => {
      const mockSelection: ToolSelection = {
        weather: true,
        'web-search': false,
      }

      chrome.storage.local.get = vi.fn().mockImplementation((keys) => {
        return Promise.resolve({ 'tool-selection': mockSelection })
      })

      const selection = await getSelectedTools()

      expect(selection).toEqual(mockSelection)
    })

    it('should return defaults when no selection stored', async () => {
      chrome.storage.local.get = vi.fn().mockImplementation(() => {
        return Promise.resolve({})
      })

      chrome.storage.local.set = vi.fn().mockImplementation(() => {
        return Promise.resolve()
      })

      const selection = await getSelectedTools()

      expect(selection).toBeDefined()
      expect(typeof selection).toBe('object')
    })

    it('should handle storage errors gracefully', async () => {
      chrome.storage.local.get = vi.fn().mockImplementation(() => {
        return Promise.reject(new Error('Storage error'))
      })

      const selection = await getSelectedTools()

      expect(selection).toBeDefined()
      expect(typeof selection).toBe('object')
    })
  })

  describe('saveSelectedTools', () => {
    it('should save tool selection to storage', async () => {
      const mockSelection: ToolSelection = {
        weather: true,
        'web-search': true,
      }

      chrome.storage.local.set = vi.fn().mockImplementation(() => {
        return Promise.resolve()
      })

      await saveSelectedTools(mockSelection)

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        'tool-selection': mockSelection,
      })
    })

    it('should handle storage errors gracefully', async () => {
      const mockSelection: ToolSelection = {
        weather: true,
      }

      chrome.storage.local.set = vi.fn().mockImplementation(() => {
        return Promise.reject(new Error('Storage error'))
      })

      // Should not throw
      await expect(saveSelectedTools(mockSelection)).resolves.toBeUndefined()
    })
  })

  describe('updateToolSelection', () => {
    it('should update a single tool selection', async () => {
      const existingSelection: ToolSelection = {
        weather: true,
        'web-search': false,
      }

      chrome.storage.local.get = vi.fn().mockImplementation(() => {
        return Promise.resolve({ 'tool-selection': existingSelection })
      })

      chrome.storage.local.set = vi.fn().mockImplementation(() => {
        return Promise.resolve()
      })

      const updated = await updateToolSelection('web-search', true)

      expect(updated).toEqual({
        weather: true,
        'web-search': true,
      })

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        'tool-selection': {
          weather: true,
          'web-search': true,
        },
      })
    })

    it('should add new tool to selection', async () => {
      const existingSelection: ToolSelection = {
        weather: true,
      }

      chrome.storage.local.get = vi.fn().mockImplementation(() => {
        return Promise.resolve({ 'tool-selection': existingSelection })
      })

      chrome.storage.local.set = vi.fn().mockImplementation(() => {
        return Promise.resolve()
      })

      const updated = await updateToolSelection('memory', true)

      expect(updated).toEqual({
        weather: true,
        memory: true,
      })
    })
  })
})
