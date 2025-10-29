/**
 * Custom hook for listening to Chrome extension runtime messages
 * Handles summarizePage, rewriteText, and summarizeYouTubeVideo actions
 */

import { useEffect } from 'react'
import { toast } from 'sonner'
import { ensureChatExists } from '@/lib/chat-helpers'
import { handleStreamingAction } from '@/lib/streaming-action-handler'
import { summarizeWithFallback } from '@/lib/summarizer-utils'
import { getSummarizerPreference } from '@/lib/settings-storage'
import { getRewritePrompt, formatRewriteUserMessage } from '@/lib/rewrite-utils'
import { bookmarkMessage } from '@/lib/bookmark-storage'
import { saveMemory } from '@/lib/memory-storage'
import { getEmbedding } from '@/lib/embeddings'
import type { ChromeMessageAction } from '@/types/chrome-messages'
import type { UIMessage, Chat } from '@/types/chat'
import type { ClientSideChatTransport } from '@/lib/client-side-chat-transport'

export interface UseChromeMessageListenerConfig {
  transport: ClientSideChatTransport
  currentChatId: string | null
  rawMessages: UIMessage[]
  setMessages: (msgs: UIMessage[]) => void
  setIsSummarizeOrRewriteLoading: (loading: boolean) => void
  clearAttachedImage: () => void
  saveCurrentMessages: (msgs?: UIMessage[], chatId?: string) => Promise<void>
  createChat: (title: string) => Promise<Chat>
  selectChat: (id: string) => Promise<void>
}

/**
 * Listens for Chrome runtime messages and handles actions from background script
 * Supports page summarization, text rewriting, and YouTube video summarization
 */
export function useChromeMessageListener(config: UseChromeMessageListenerConfig): void {
  const {
    transport,
    currentChatId,
    rawMessages,
    setMessages,
    setIsSummarizeOrRewriteLoading,
    clearAttachedImage,
    saveCurrentMessages,
    createChat,
    selectChat,
  } = config

  // Signal to background script that sidebar is ready
  useEffect(() => {
    // Check if chrome.runtime is available
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      console.log('[useChromeMessageListener] chrome.runtime not available, skipping ready signal (normal in dev mode)')
      return
    }

    // Establish a port connection to signal sidebar lifecycle
    const port = chrome.runtime.connect({ name: 'sidebar' })
    console.log('[useChromeMessageListener] Established port connection to background')

    // Send a ready signal to the background script
    try {
      chrome.runtime.sendMessage({ action: 'sidebarReady' })
      console.log('[useChromeMessageListener] Sent ready signal to background script')
    } catch {
      console.log('[useChromeMessageListener] Could not send ready signal (normal if background script not listening)')
    }

    // Cleanup: disconnect port when component unmounts
    return () => {
      port.disconnect()
      console.log('[useChromeMessageListener] Disconnected port connection')
    }
  }, [])

  // Listen for messages from background script
  useEffect(() => {
    // Check if chrome.runtime is available
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) {
      console.log('[useChromeMessageListener] chrome.runtime not available, skipping message listener (normal in dev mode)')
      return
    }

    const handleMessage = async (message: ChromeMessageAction) => {
      if (message.action === 'summarizePage' && message.data) {
        console.log('[useChromeMessageListener] Received summarize page request:', message.data)

        try {
          const { title = '', content = '', url = '', byline = '' } = message.data

          // Prepare chat title and prompts
          const chatTitle = `Summary: ${title.substring(0, 50)}${title.length > 50 ? '...' : ''}`
          const userMessageText = `Summarize: **${title}**\n${url}`
          const summarizationPrompt = `Please provide a concise summary of the following web page:

Title: ${title}
URL: ${url}
${byline ? `Author: ${byline}\n` : ''}
Content:
${content.slice(0, 15000)}${content.length > 15000 ? '\n\n[Content truncated for length]' : ''}

Provide a clear, well-structured summary focusing on the main points and key information.`

          // Use handleStreamingAction with custom streaming function for summarizer
          await handleStreamingAction({
            chatTitle,
            currentChatId,
            currentRawMessages: rawMessages,
            userMessageText,
            setMessages,
            setLoading: setIsSummarizeOrRewriteLoading,
            clearAttachedImage,
            streamFn: async (onChunk) => {
              // Use Chrome Summarizer API with fallback to LLM transport
              const userPreference = await getSummarizerPreference()
              await summarizeWithFallback(
                summarizationPrompt,
                onChunk,
                {
                  type: 'key-points',
                  length: 'long',
                  format: 'markdown',
                },
                // Fallback function using the transport
                async (text: string, onChunkFallback: (chunk: string) => void) => {
                  await transport.streamSummary(text, onChunkFallback)
                },
                userPreference
              )
            },
            saveMessages: saveCurrentMessages,
            ensureChatFn: (title) => ensureChatExists(currentChatId, title, createChat, selectChat),
          })

          console.log('[useChromeMessageListener] Summarization complete')
        } catch (error) {
          console.error('[useChromeMessageListener] Error summarizing page:', error)
          setIsSummarizeOrRewriteLoading(false)
          alert('Failed to summarize page. Please try again.')
        }
      } else if (message.action === 'rewriteText' && message.data) {
        console.log('[useChromeMessageListener] Received rewrite text request:', message.data)

        try {
          const { originalText, tone } = message.data

          // Prepare chat title and prompts
          const chatTitle = `Rewrite: ${tone.charAt(0).toUpperCase() + tone.slice(1)}`
          const userMessageText = formatRewriteUserMessage(originalText, tone)
          const rewritePrompt = getRewritePrompt(originalText, tone)

          // Use handleStreamingAction with transport streaming
          await handleStreamingAction({
            chatTitle,
            currentChatId,
            currentRawMessages: rawMessages,
            userMessageText,
            setMessages,
            setLoading: setIsSummarizeOrRewriteLoading,
            clearAttachedImage,
            streamFn: async (onChunk) => {
              await transport.streamSummary(rewritePrompt, onChunk)
            },
            saveMessages: saveCurrentMessages,
            ensureChatFn: (title) => ensureChatExists(currentChatId, title, createChat, selectChat),
          })

          console.log('[useChromeMessageListener] Rewrite complete')
        } catch (error) {
          console.error('[useChromeMessageListener] Error rewriting text:', error)
          setIsSummarizeOrRewriteLoading(false)
          alert('Failed to rewrite text. Please try again.')
        }
      } else if (message.action === 'summarizeYouTubeVideo' && message.data) {
        console.log('[useChromeMessageListener] Received summarize YouTube request:', message.data)

        try {
          const { title = '', content = '', url = '', byline = '' } = message.data

          // Prepare chat title and prompts
          const chatTitle = `YouTube Summary: ${title.substring(0, 40)}${title.length > 40 ? '...' : ''}`
          const userMessageText = `YouTube Video Summary: **${title}**\n${url}${byline ? `\nChannel: ${byline}` : ''}`
          const summarizationPrompt = `Please provide a concise and well-structured summary of the following YouTube video transcript.

Video Title: ${title}
${byline ? `Channel: ${byline}\n` : ''}URL: ${url}
Transcript:
${content.slice(0, 15000)}${content.length > 15000 ? '\n\n[Transcript truncated for length]' : ''}

Provide a clear summary that captures the main points and key takeaways from the video.`

          // Use handleStreamingAction with transport streaming
          await handleStreamingAction({
            chatTitle,
            currentChatId,
            currentRawMessages: rawMessages,
            userMessageText,
            setMessages,
            setLoading: setIsSummarizeOrRewriteLoading,
            clearAttachedImage,
            streamFn: async (onChunk) => {
              await transport.streamSummary(summarizationPrompt, onChunk)
            },
            saveMessages: saveCurrentMessages,
            ensureChatFn: (title) => ensureChatExists(currentChatId, title, createChat, selectChat),
          })

          console.log('[useChromeMessageListener] YouTube video summarization complete')
        } catch (error) {
          console.error('[useChromeMessageListener] Error summarizing YouTube video:', error)
          setIsSummarizeOrRewriteLoading(false)
          alert('Failed to summarize video. Please try again.')
        }
      } else if (message.action === 'bookmarkMessage' && message.data) {
        console.log('[useChromeMessageListener] Received bookmark message request:', message.data)

        try {
          const { content } = message.data

          // Bookmark the selected text
          await bookmarkMessage({
            content,
            sourceMessageId: '',
            role: 'user',
            sourceChatId: currentChatId || 'web-selection',
            sourceChatTitle: 'Web Selection',
            tags: ['web-selection'],
          })

          console.log('[useChromeMessageListener] Message bookmarked successfully')
          alert('Message bookmarked successfully!')
        } catch (error) {
          console.error('[useChromeMessageListener] Error bookmarking message:', error)
          alert('Failed to bookmark message. Please try again.')
        }
      } else if (message.action === 'saveToMemories' && message.data) {
        console.log('[useChromeMessageListener] Received save to memories request:', message.data)

        try {
          const { content, url } = message.data

          // Generate embedding for the content
          let embedding: number[] | undefined
          try {
            embedding = await getEmbedding(content)
            console.log('[useChromeMessageListener] Generated embedding for memory:', embedding.length, 'dimensions')
          } catch (embeddingError) {
            console.warn('[useChromeMessageListener] Failed to generate embedding, memory will be searchable by keyword only:', embeddingError)
            // Continue without embedding - memory will still be searchable by keyword
          }

          // Save the selected text to memories
          await saveMemory({
            content,
            embedding,
            category: 'reference',
            tags: ['web-selection', 'user-saved'],
            sourceUrl: url,
            sourceChatId: currentChatId || undefined,
            sourceChatTitle: 'Web Selection',
            timestamp: Date.now(),
          })

          console.log('[useChromeMessageListener] Content saved to memories successfully')
          alert('Content saved to memories successfully!')
        } catch (error) {
          console.error('[useChromeMessageListener] Error saving to memories:', error)
          alert('Failed to save to memories. Please try again.')
        }
      } else if (message.action === 'savePageSummaryToMemories' && message.data) {
        console.log('[useChromeMessageListener] Received save page summary to memories request:', message.data)

        const toastId = 'summary-' + Date.now()
        
        try {
          const { title = '', content = '', url = '' } = message.data
          
          console.log('[useChromeMessageListener] Starting page summarization for:', title)

          // Show initial loading toast
          const truncatedTitle = title.substring(0, 40) + (title.length > 40 ? '...' : '')
          toast.loading(`Summarizing "${truncatedTitle}"...`, {
            id: toastId,
            duration: Infinity,
          })
          console.log('[useChromeMessageListener] Summarization toast shown')

          // Create summarization prompt
          const summarizationPrompt = `Please provide a concise and well-structured summary of the following web page. Focus on the main points and key takeaways.

Title: ${title}
URL: ${url}
Content:
${content.slice(0, 15000)}${content.length > 15000 ? '\n\n[Content truncated for length]' : ''}

Provide a clear summary focusing on the main points and key information.`

          // Collect summary text from streaming
          let summary = ''
          
          console.log('[useChromeMessageListener] Summarizing page content...')

          // Get user's summarizer preference
          const userPreference = await getSummarizerPreference()

          // Summarize using Chrome Summarizer API with LLM fallback
          await summarizeWithFallback(
            summarizationPrompt,
            (chunk) => {
              summary += chunk
            },
            {
              type: 'key-points',
              length: 'long',
              format: 'markdown',
            },
            // Fallback function using the transport
            async (text: string, onChunkFallback: (chunk: string) => void) => {
              await transport.streamSummary(text, onChunkFallback)
            },
            userPreference
          )

          console.log('[useChromeMessageListener] Summary generated, length:', summary.length, 'characters')

          // Update toast to show we're saving
          toast.loading(`Saving summary to memories...`, {
            id: toastId,
            duration: Infinity,
          })
          console.log('[useChromeMessageListener] Saving progress toast shown')

          // Generate embedding for the summary
          let embedding: number[] | undefined
          try {
            embedding = await getEmbedding(summary)
            console.log('[useChromeMessageListener] Generated embedding for page summary:', embedding.length, 'dimensions')
          } catch (embeddingError) {
            console.warn('[useChromeMessageListener] Failed to generate embedding for summary, memory will be searchable by keyword only:', embeddingError)
            // Continue without embedding
          }

          // Save the page summary to memories
          await saveMemory({
            content: summary,
            embedding,
            category: 'reference',
            tags: ['page-summary', 'auto-saved'],
            sourceUrl: url,
            sourceChatId: currentChatId || undefined,
            sourceChatTitle: `Summary: ${title}`,
            timestamp: Date.now(),
          })

          console.log('[useChromeMessageListener] Page summary saved to memories successfully')
          
          // Dismiss loading and show success message using toast
          toast.dismiss(toastId)
          toast.success(`Summary of "${truncatedTitle}" saved to memories!`, {
            duration: 5000
          })
          console.log('[useChromeMessageListener] Success toast shown')
        } catch (error) {
          console.error('[useChromeMessageListener] Error saving page summary to memories:', error)
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          
          // Dismiss loading and show error
          toast.dismiss(toastId)
          toast.error(`Failed to save page summary: ${errorMsg}`, {
            duration: 5000
          })
          console.log('[useChromeMessageListener] Error toast shown')
        }
      }
    }

    // Add listener
    chrome.runtime.onMessage.addListener(handleMessage)

    // Cleanup
    return () => {
      if (chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(handleMessage)
      }
    }
  }, [transport, currentChatId, rawMessages, setMessages, setIsSummarizeOrRewriteLoading, clearAttachedImage, saveCurrentMessages, createChat, selectChat])
}
