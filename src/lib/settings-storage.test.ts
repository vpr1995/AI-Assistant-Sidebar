import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getSettings,
  updateSettings,
  getSummarizerPreference,
  setSummarizerPreference,
} from '../lib/settings-storage'

describe('Settings Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSettings', () => {
    it('should return default settings when no settings stored', async () => {
      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({})
        return Promise.resolve({})
      })

      const settings = await getSettings()

      expect(settings).toBeDefined()
      expect(settings.summarizerPreference).toBe('built-in')
    })

    it('should return stored settings', async () => {
      const mockSettings = {
        summarizerPreference: 'fallback' as const,
      }

      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({ 'user-settings': mockSettings })
        return Promise.resolve({ 'user-settings': mockSettings })
      })

      const settings = await getSettings()

      expect(settings.summarizerPreference).toBe('fallback')
    })

    it('should merge stored settings with defaults', async () => {
      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({ 'user-settings': {} })
        return Promise.resolve({ 'user-settings': {} })
      })

      const settings = await getSettings()

      expect(settings.summarizerPreference).toBeDefined()
    })
  })

  describe('updateSettings', () => {
    it('should update settings in storage', async () => {
      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({})
        return Promise.resolve({})
      })

      chrome.storage.local.set = vi.fn().mockImplementation((data, callback) => {
        callback?.()
        return Promise.resolve()
      })

      await updateSettings({ summarizerPreference: 'fallback' })

      expect(chrome.storage.local.set).toHaveBeenCalled()
      const savedData = (chrome.storage.local.set as any).mock.calls[0][0]
      expect(savedData['user-settings'].summarizerPreference).toBe('fallback')
    })

    it('should merge with existing settings', async () => {
      const existingSettings = {
        summarizerPreference: 'built-in' as const,
      }

      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({ 'user-settings': existingSettings })
        return Promise.resolve({ 'user-settings': existingSettings })
      })

      chrome.storage.local.set = vi.fn().mockImplementation((data, callback) => {
        callback?.()
        return Promise.resolve()
      })

      await updateSettings({ summarizerPreference: 'fallback' })

      const savedData = (chrome.storage.local.set as any).mock.calls[0][0]
      expect(savedData['user-settings'].summarizerPreference).toBe('fallback')
    })
  })

  describe('getSummarizerPreference', () => {
    it('should return summarizer preference', async () => {
      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({
          'user-settings': { summarizerPreference: 'fallback' },
        })
        return Promise.resolve({ 'user-settings': { summarizerPreference: 'fallback' } })
      })

      const preference = await getSummarizerPreference()

      expect(preference).toBe('fallback')
    })

    it('should return default when not set', async () => {
      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({})
        return Promise.resolve({})
      })

      const preference = await getSummarizerPreference()

      expect(preference).toBe('built-in')
    })
  })

  describe('setSummarizerPreference', () => {
    it('should set summarizer preference', async () => {
      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({})
        return Promise.resolve({})
      })

      chrome.storage.local.set = vi.fn().mockImplementation((data, callback) => {
        callback?.()
        return Promise.resolve()
      })

      await setSummarizerPreference('fallback')

      expect(chrome.storage.local.set).toHaveBeenCalled()
      const savedData = (chrome.storage.local.set as any).mock.calls[0][0]
      expect(savedData['user-settings'].summarizerPreference).toBe('fallback')
    })
  })
})
