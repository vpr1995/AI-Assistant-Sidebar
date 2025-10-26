/**
 * Custom hook for managing chat persistence logic
 * Handles auto-save, auto-load, and auto-create functionality
 */

import { useEffect, useRef, useCallback } from 'react'
import { updateChatMessages } from '@/lib/chat-storage'
import type { UIMessage } from '@/types/chat'
import type { ChatMessage, Chat } from '@/types/chat'

export interface UseChatPersistenceConfig {
  currentChatId: string | null
  currentChat: Chat | null
  rawMessages: UIMessage[]
  status: string
  setMessages: (messages: UIMessage[]) => void
  updateCurrentChatMessages: (messages: ChatMessage[]) => Promise<void>
  createChat: (title: string) => Promise<Chat>
  selectChat: (id: string) => Promise<void>
}

export interface UseChatPersistenceReturn {
  saveCurrentMessages: (uiMessagesToSave?: UIMessage[], chatIdOverride?: string) => Promise<void>
}

/**
 * Manages chat persistence including:
 * - Auto-save when streaming completes
 * - Auto-load messages when chat changes
 * - Auto-create chat on first message
 */
export function useChatPersistence(config: UseChatPersistenceConfig): UseChatPersistenceReturn {
  const {
    currentChatId,
    currentChat,
    rawMessages,
    status,
    setMessages,
    updateCurrentChatMessages,
    createChat,
    selectChat,
  } = config

  // Track previous status to detect when streaming completes
  const prevStatusRef = useRef<string | null>(null)

  // Track if we've already auto-created a chat for current session
  const autoCreatedRef = useRef(false)

  // Helper function to save current messages to chat
  const saveCurrentMessages = useCallback(async (uiMessagesToSave?: UIMessage[], chatIdOverride?: string) => {
    const messagesToSave = uiMessagesToSave || rawMessages
    const chatIdToUse = chatIdOverride || currentChatId

    if (!chatIdToUse || messagesToSave.length === 0) {
      console.log('[useChatPersistence] Cannot save: chatId=', chatIdToUse, 'messageCount=', messagesToSave.length)
      return
    }

    try {
      // Convert messages to ChatMessage format - extract content from parts
      const chatMessages = messagesToSave.map((msg) => {
        const content = msg.parts?.filter((p) => p.type === 'text').map((p) => (p as { type: 'text'; text: string }).text).join('') || ''
        console.log('[useChatPersistence] Saving message:', msg.id, 'role:', msg.role, 'content length:', content.length)
        return {
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: content,
          timestamp: Date.now(),
        }
      })

      console.log('[useChatPersistence] Saving', chatMessages.length, 'messages to chat', chatIdToUse)
      // Use storage function directly to avoid currentChat dependency
      await updateChatMessages(chatIdToUse, chatMessages)
      console.log('[useChatPersistence] Chat saved successfully')
    } catch (error) {
      console.error('[useChatPersistence] Error saving chat:', error)
    }
  }, [currentChatId, rawMessages])

  // Save chat only when a message is completely streamed (not on every change)
  // This prevents the infinite loop between auto-save and load effects
  useEffect(() => {
    if (!currentChatId) {
      prevStatusRef.current = status
      return
    }

    // Detect when streaming completes (status goes from 'streaming' to not-streaming)
    const wasStreaming = prevStatusRef.current === 'streaming'
    const isNowComplete = status !== 'streaming'

    if (wasStreaming && isNowComplete) {
      // Streaming just completed, save the messages
      // Only read rawMessages when we actually need to save
      if (rawMessages.length === 0) {
        prevStatusRef.current = status
        return
      }

      (async () => {
        try {
          // Convert rawMessages to ChatMessage format
          const chatMessages = rawMessages.map((msg) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.parts?.filter((p) => p.type === 'text').map((p) => (p as { type: 'text'; text: string }).text).join('') || '',
            timestamp: Date.now(),
          }))

          await updateCurrentChatMessages(chatMessages)
          console.log('[useChatPersistence] Chat saved (streaming complete)')
        } catch (error) {
          console.error('[useChatPersistence] Error saving chat:', error)
        }
      })()
    }

    // Track current status for next effect run
    prevStatusRef.current = status
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, currentChatId, updateCurrentChatMessages]) // rawMessages intentionally excluded to prevent effect running during streaming

  // Load messages from current chat when it changes
  useEffect(() => {
    console.log('[useChatPersistence] Load effect running:', { currentChatId, chatId: currentChat?.id, messageCount: currentChat?.messages.length })

    // No chat selected, clear all messages
    if (!currentChatId) {
      console.log('[useChatPersistence] No currentChatId, clearing messages')
      setMessages([])
      return
    }

    // Chat loaded from storage
    if (currentChat && currentChat.id === currentChatId) {
      console.log('[useChatPersistence] Chat matched:', currentChat.id, 'Messages in storage:', currentChat.messages.length)

      // Always clear first to ensure clean state when switching chats
      if (currentChat.messages.length > 0) {
        // Convert stored ChatMessage to UIMessage format
        const convertedMessages = currentChat.messages.map((msg) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          parts: [{ type: 'text' as const, text: msg.content }],
        })) as UIMessage[]

        console.log('[useChatPersistence] Setting messages:', convertedMessages.length)
        setMessages(convertedMessages)
        console.log('[useChatPersistence] Loaded messages from chat:', currentChat.id)
      } else {
        console.log('[useChatPersistence] Chat has no messages yet, not clearing to preserve active conversation')
      }
    } else {
      console.log('[useChatPersistence] Chat not loaded yet:', { currentChatId, chatId: currentChat?.id })
    }
  }, [currentChat, currentChatId, setMessages])

  // Reset auto-create flag when manually selecting a chat so it can trigger again for empty chats
  useEffect(() => {
    if (currentChatId) {
      autoCreatedRef.current = false
    }
  }, [currentChatId])

  // Auto-create a new chat when user sends first message if no chat exists
  useEffect(() => {
    // Skip if we already auto-created or if a chat is selected
    if (autoCreatedRef.current || currentChatId) {
      return
    }

    // Check if user has sent a message but no chat exists
    const hasUserMessage = rawMessages.some(msg => msg.role === 'user')
    if (hasUserMessage && rawMessages.length > 0) {
      // Mark that we're auto-creating to prevent multiple creates
      autoCreatedRef.current = true

      // Auto-create a chat for this message
      const firstUserMessage = rawMessages.find(msg => msg.role === 'user')
      if (firstUserMessage) {
        const runAutoCreate = async () => {
          try {
            // Generate title from first user message (first 50 chars)
            const firstMessageText = firstUserMessage.parts
              ?.filter((p) => p.type === 'text')
              .map((p) => (p as { type: 'text'; text: string }).text)
              .join('')
              .substring(0, 50) || 'New Chat'

            const newChat = await createChat(firstMessageText)
            await selectChat(newChat.id)
            console.log('[useChatPersistence] Auto-created chat:', newChat.id)
          } catch (error) {
            console.error('[useChatPersistence] Error auto-creating chat:', error)
            autoCreatedRef.current = false // Reset on error to allow retry
          }
        }

        runAutoCreate()
      }
    }
  }, [rawMessages, currentChatId, createChat, selectChat])

  return {
    saveCurrentMessages,
  }
}
