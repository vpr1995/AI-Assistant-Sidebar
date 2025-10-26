/**
 * Type definitions for Chrome extension runtime messages
 * Provides type safety for message passing between content scripts, background, and sidebar
 */

import type { RewriteTone } from '@/lib/rewrite-utils'

/**
 * Discriminated union of all possible Chrome runtime message actions
 * Use this type for message handlers to ensure type safety
 */
export type ChromeMessageAction =
  | {
      action: 'sidebarReady'
    }
  | {
      action: 'summarizePage'
      data: {
        title: string
        content: string
        url: string
        excerpt?: string
        byline?: string
        siteName?: string
      }
    }
  | {
      action: 'rewriteText'
      data: {
        originalText: string
        tone: RewriteTone
      }
    }
  | {
      action: 'summarizeYouTubeVideo'
      data: {
        title: string
        content: string
        url: string
        byline?: string
      }
    }

/**
 * Type guard to check if a message is a valid ChromeMessageAction
 */
export function isChromeMessageAction(message: unknown): message is ChromeMessageAction {
  if (typeof message !== 'object' || message === null) {
    return false
  }

  const msg = message as { action?: string }
  
  if (typeof msg.action !== 'string') {
    return false
  }

  const validActions = ['sidebarReady', 'summarizePage', 'rewriteText', 'summarizeYouTubeVideo']
  return validActions.includes(msg.action)
}
