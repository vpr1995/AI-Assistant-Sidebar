/**
 * Unified handler for streaming actions (summarization, rewrite, etc.)
 * Reduces code duplication across different message handlers
 */

import type { UIMessage } from '@/types/chat'

export interface StreamingActionConfig {
  // Chat setup
  chatTitle: string
  currentChatId: string | null
  
  // Messages
  currentRawMessages: UIMessage[]
  userMessageText: string
  
  // UI updates
  setMessages: (msgs: UIMessage[]) => void
  setLoading: (loading: boolean) => void
  clearAttachedImage?: () => void
  
  // Streaming function that performs the actual AI call
  streamFn: (onChunk: (chunk: string) => void) => Promise<void>
  
  // Persistence
  saveMessages: (msgs: UIMessage[], chatId: string) => Promise<void>
  
  // Chat management
  ensureChatFn: (title: string) => Promise<string>
}

/**
 * Handles the common pattern for streaming actions:
 * 1. Ensure a chat exists (create if needed)
 * 2. Set up message tracking
 * 3. Create user message
 * 4. Create AI message placeholder
 * 5. Stream response with real-time updates
 * 6. Save final messages
 */
export async function handleStreamingAction(config: StreamingActionConfig): Promise<void> {
  const {
    chatTitle,
    currentChatId,
    currentRawMessages,
    userMessageText,
    setMessages,
    setLoading,
    clearAttachedImage,
    streamFn,
    saveMessages,
    ensureChatFn,
  } = config

  try {
    // Ensure a chat exists for this action and get the chat ID
    const wasChatCreated = !currentChatId
    const chatId = await ensureChatFn(chatTitle)

    // Track messages locally during streaming to ensure we save the final state
    let currentMessages: UIMessage[] = []

    // Only clear existing messages if we just created a new chat
    // If appending to existing chat, keep the existing messages
    if (wasChatCreated) {
      setMessages([])
      currentMessages = []
    } else {
      // For existing chats, start with the current raw messages (UIMessage format)
      currentMessages = [...currentRawMessages]
    }

    // Clear any attached image
    clearAttachedImage?.()

    // Set loading state to show typing indicator
    setLoading(true)

    // Create user message
    const userMessageId = `user-${Date.now()}`
    const userMessage: UIMessage = {
      id: userMessageId,
      role: 'user',
      parts: [{
        type: 'text',
        text: userMessageText
      }]
    }

    // Add user message to chat immediately
    currentMessages = [...currentMessages, userMessage]
    setMessages(currentMessages)

    // Create an AI message that will be updated as streaming happens
    const aiMessageId = `assistant-${Date.now()}`
    let aiMessage: UIMessage = {
      id: aiMessageId,
      role: 'assistant',
      parts: [{
        type: 'text',
        text: ''
      }]
    }

    // Add empty AI message
    currentMessages = [...currentMessages, aiMessage]
    setMessages(currentMessages)

    // Stream the response
    await streamFn((chunk: string) => {
      // Hide typing indicator on first chunk
      setLoading(false)

      // Update the AI message with accumulated text
      aiMessage = {
        ...aiMessage,
        parts: [{
          type: 'text',
          text: (aiMessage.parts[0] as { type: 'text'; text: string }).text + chunk
        }]
      }

      // Update messages array
      currentMessages = [...currentMessages]
      const lastIndex = currentMessages.length - 1
      if (lastIndex >= 0 && currentMessages[lastIndex] && currentMessages[lastIndex].id === aiMessageId) {
        currentMessages[lastIndex] = aiMessage
      }
      setMessages(currentMessages)
    })

    console.log('[handleStreamingAction] Streaming complete')

    // Save the final messages to chat using the chat ID we got
    await saveMessages(currentMessages, chatId)

  } catch (error) {
    console.error('[handleStreamingAction] Error during streaming action:', error)
    setLoading(false)
    throw error
  }
}
