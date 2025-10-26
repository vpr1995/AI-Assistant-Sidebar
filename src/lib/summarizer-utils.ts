/**
 * Utility module for Chrome Summarizer API with fallback support
 * Provides a unified interface for summarization with automatic provider detection
 */

import { getSummarizerPreference } from './settings-storage'

export interface SummarizerOptions {
  type?: 'key-points' | 'tldr' | 'teaser' | 'headline'
  length?: 'short' | 'medium' | 'long'
  format?: 'markdown' | 'plain-text'
  sharedContext?: string
}

export type SummarizerProvider = 'chrome-summarizer' | 'fallback' | null
export type SummarizerPreference = 'built-in' | 'fallback'

/**
 * Check if Chrome Summarizer API is available
 */
export async function checkChromeSummarizerAvailability(): Promise<boolean> {
  try {
    // Check if Summarizer exists in global scope
    if (typeof Summarizer === 'undefined') {
      console.log('[Summarizer] Chrome Summarizer API not available')
      return false
    }

    // Check availability status
    const availability = await Summarizer.availability()
    console.log('[Summarizer] Availability check:', availability)
    return availability !== 'unavailable'
  } catch (error) {
    console.error('[Summarizer] Error checking availability:', error)
    return false
  }
}

/**
 * Stream summary using Chrome Summarizer API
 */
export async function streamChromeSummary(
  text: string,
  onChunk: (chunk: string) => void,
  options: SummarizerOptions = {}
): Promise<void> {
  try {
    if (typeof Summarizer === 'undefined') {
      throw new Error('Chrome Summarizer API not available')
    }

    console.log('[Summarizer] Creating summarizer with options:', options)

    // Check user activation
    if (!navigator.userActivation?.isActive) {
      console.warn('[Summarizer] No user activation, but proceeding anyway')
    }

    // Create summarizer with options
    const summarizer = await Summarizer.create({
      type: options.type || 'key-points',
      length: options.length || 'long',
      format: options.format || 'markdown',
      sharedContext: options.sharedContext,
      monitor(m: ProgressMonitor) {
        m.addEventListener('downloadprogress', (e: ProgressEvent) => {
          const progress = e.loaded ? (e.loaded * 100).toFixed(0) : 0
          console.log(`[Summarizer] Download progress: ${progress}%`)
          // Could emit progress event here if needed
        })
      },
    })

    console.log('[Summarizer] Summarizer created, starting stream...')

    const inputUsage = await summarizer.measureInputUsage(text);
    const totalInputQuota = summarizer.inputQuota;
    console.log('[Summarizer] Input usage:', inputUsage, 'of', totalInputQuota);
    
    // Stream the summary
    const stream = summarizer.summarizeStreaming(text)

    for await (const chunk of stream) {
      console.log('[Summarizer] Received chunk:', chunk)
      onChunk(chunk)
    }

    console.log('[Summarizer] Streaming complete')
  } catch (error) {
    console.error('[Summarizer] Error during Chrome summarization:', error)
    throw error
  }
}

/**
 * Detect which summarizer provider to use based on user preference
 * Priority: User preference > Chrome Summarizer > Fallback
 */
export async function detectSummarizerProvider(preference?: SummarizerPreference): Promise<SummarizerProvider> {
  console.log('[Summarizer] Detecting available summarizer provider...')

  // Get user preference if not provided
  const userPreference = preference || await getSummarizerPreference()
  console.log('[Summarizer] User preference:', userPreference)

  // Check if Chrome Summarizer is available
  const chromeSummarizerAvailable = await checkChromeSummarizerAvailability()

  // Determine provider based on preference
  if (userPreference === 'built-in') {
    // Force built-in: only use Chrome Summarizer
    if (chromeSummarizerAvailable) {
      console.log('[Summarizer] ✓ Using Chrome Summarizer API (forced)')
      return 'chrome-summarizer'
    }
    console.log('[Summarizer] Chrome Summarizer not available, but user prefers built-in only')
    return null // No provider available
  } else if (userPreference === 'fallback') {
    // Force fallback: always use LLM
    console.log('[Summarizer] Using fallback summarization (forced)')
    return 'fallback'
  }

  console.log('[Summarizer] No valid provider found')
  return null
}

/**
 * Main interface for summarization - automatically selects best provider
 */
export async function summarizeWithFallback(
  text: string,
  onChunk: (chunk: string) => void,
  options: SummarizerOptions = {},
  fallbackFn?: (text: string, onChunk: (chunk: string) => void) => Promise<void>,
  preference?: SummarizerPreference
): Promise<SummarizerProvider> {
  const provider = await detectSummarizerProvider(preference)

  try {
    if (provider === 'chrome-summarizer') {
      await streamChromeSummary(text, onChunk, options)
    } else if (provider === 'fallback' && fallbackFn) {
      console.log('[Summarizer] Using fallback summarization')
      await fallbackFn(text, onChunk)
    } else {
      throw new Error('No summarization provider available')
    }
  } catch (error) {
    console.error('[Summarizer] Summarization failed:', error)
    // Try fallback if Chrome Summarizer failed
    if (provider === 'chrome-summarizer' && fallbackFn) {
      console.log('[Summarizer] Chrome Summarizer failed, falling back...')
      try {
        await fallbackFn(text, onChunk)
        return 'fallback'
      } catch (fallbackError) {
        console.error('[Summarizer] Fallback also failed:', fallbackError)
        throw fallbackError
      }
    }
    throw error
  }

  return provider
}
