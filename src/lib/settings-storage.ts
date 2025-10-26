/**
 * Settings Storage Utility
 * Handles persisting and retrieving user settings from Chrome storage
 */

export type SummarizerPreference = 'built-in' | 'fallback'

interface UserSettings {
  summarizerPreference: SummarizerPreference
}

const SETTINGS_KEY = 'user-settings'
const DEFAULT_SETTINGS: UserSettings = {
  summarizerPreference: 'built-in', // Default to built-in when available
}

/**
 * Get all user settings
 */
export async function getSettings(): Promise<UserSettings> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([SETTINGS_KEY], (result) => {
      try {
        const settings: UserSettings = result[SETTINGS_KEY] || DEFAULT_SETTINGS
        // Ensure all default keys are present
        resolve({ ...DEFAULT_SETTINGS, ...settings })
      } catch (error) {
        reject(error)
      }
    })
  })
}

/**
 * Update user settings (merges with existing settings)
 */
export async function updateSettings(updates: Partial<UserSettings>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([SETTINGS_KEY], (result) => {
      try {
        const currentSettings: UserSettings = result[SETTINGS_KEY] || DEFAULT_SETTINGS
        const newSettings = { ...currentSettings, ...updates }
        chrome.storage.local.set({ [SETTINGS_KEY]: newSettings }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            resolve()
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  })
}

/**
 * Get summarizer preference
 */
export async function getSummarizerPreference(): Promise<SummarizerPreference> {
  const settings = await getSettings()
  return settings.summarizerPreference
}

/**
 * Set summarizer preference
 */
export async function setSummarizerPreference(preference: SummarizerPreference): Promise<void> {
  await updateSettings({ summarizerPreference: preference })
}