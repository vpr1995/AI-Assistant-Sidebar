/**
 * useChats Hook
 * Manages chat state and operations for the application
 */

import { useState, useCallback, useEffect } from 'react'
import type { Chat, ChatMessage, ChatListItem } from '@/types/chat'
import {
  saveChat,
  getChats,
  getChat,
  deleteChat,
  updateChatMessages,
  updateChatTitle,
  generateChatTitle,
} from '@/lib/chat-storage'

/**
 * Simple UUID v4 generator
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

interface UseChatsReturn {
  chats: ChatListItem[]
  currentChat: Chat | null
  isLoading: boolean
  createChat: (title?: string, initialMessages?: ChatMessage[]) => Promise<Chat>
  selectChat: (chatId: string) => Promise<void>
  updateCurrentChatMessages: (messages: ChatMessage[]) => Promise<void>
  updateCurrentChatTitle: (title: string) => Promise<void>
  deleteCurrentChat: () => Promise<void>
  deleteChatById: (chatId: string) => Promise<void>
  loadChats: () => Promise<void>
}

export function useChats(currentChatId: string | null, onChatChange?: (chatId: string | null) => void): UseChatsReturn {
  const [chats, setChats] = useState<ChatListItem[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Load all available chats from storage
   */
  const loadChats = useCallback(async () => {
    try {
      setIsLoading(true)
      const chatsList = await getChats()
      setChats(chatsList)
    } catch (error) {
      console.error('[useChats] Error loading chats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Load current chat from storage when currentChatId changes
   */
  useEffect(() => {
    if (!currentChatId) {
      setCurrentChat(null)
      return
    }

    const loadCurrentChat = async () => {
      try {
        const chat = await getChat(currentChatId)
        setCurrentChat(chat)
      } catch (error) {
        console.error('[useChats] Error loading current chat:', error)
        setCurrentChat(null)
      }
    }

    loadCurrentChat()
  }, [currentChatId])

  /**
   * Create a new chat
   */
  const createChat = useCallback(
    async (title?: string, initialMessages: ChatMessage[] = []): Promise<Chat> => {
      const chatId = generateUUID()
      const now = Date.now()

      // Generate title from initial messages if not provided
      const finalTitle = title || generateChatTitle(initialMessages)

      const newChat: Chat = {
        id: chatId,
        title: finalTitle,
        messages: initialMessages,
        createdAt: now,
        updatedAt: now,
      }

      try {
        await saveChat(newChat)
        await loadChats()
        return newChat
      } catch (error) {
        console.error('[useChats] Error creating chat:', error)
        throw error
      }
    },
    [loadChats]
  )

  /**
   * Select and load a chat
   */
  const selectChat = useCallback(
    async (chatId: string) => {
      try {
        // Just trigger the chat change, let the effect handle loading
        onChatChange?.(chatId)
      } catch (error) {
        console.error('[useChats] Error selecting chat:', error)
        throw error
      }
    },
    [onChatChange]
  )

  /**
   * Update messages of the current chat
   */
  const updateCurrentChatMessages = useCallback(
    async (messages: ChatMessage[]) => {
      if (!currentChat) {
        console.warn('[useChats] No current chat to update')
        return
      }

      try {
        await updateChatMessages(currentChat.id, messages)
        setCurrentChat({
          ...currentChat,
          messages,
          updatedAt: Date.now(),
        })
        // Refresh the chat list to update timestamps
        await loadChats()
      } catch (error) {
        console.error('[useChats] Error updating chat messages:', error)
        throw error
      }
    },
    [currentChat, loadChats]
  )

  /**
   * Update title of the current chat
   */
  const updateCurrentChatTitle = useCallback(
    async (title: string) => {
      if (!currentChat) {
        console.warn('[useChats] No current chat to update')
        return
      }

      try {
        await updateChatTitle(currentChat.id, title)
        setCurrentChat({
          ...currentChat,
          title,
          updatedAt: Date.now(),
        })
        // Refresh the chat list to update the title in the sidebar
        await loadChats()
      } catch (error) {
        console.error('[useChats] Error updating chat title:', error)
        throw error
      }
    },
    [currentChat, loadChats]
  )

  /**
   * Delete the current chat
   */
  const deleteCurrentChat = useCallback(async () => {
    if (!currentChat) {
      console.warn('[useChats] No current chat to delete')
      return
    }

    try {
      await deleteChat(currentChat.id)
      setCurrentChat(null)
      onChatChange?.(null)
      await loadChats()
    } catch (error) {
      console.error('[useChats] Error deleting chat:', error)
      throw error
    }
  }, [currentChat, onChatChange, loadChats])

  /**
   * Delete any chat by ID
   */
  const deleteChatById = useCallback(async (chatId: string) => {
    try {
      await deleteChat(chatId)
      // If we're deleting the currently selected chat, clear it
      if (currentChat?.id === chatId) {
        setCurrentChat(null)
        onChatChange?.(null)
      }
      await loadChats()
    } catch (error) {
      console.error('[useChats] Error deleting chat:', error)
      throw error
    }
  }, [currentChat, onChatChange, loadChats])

  // Load chats on mount
  useEffect(() => {
    loadChats()
  }, [loadChats])

  return {
    chats,
    currentChat,
    isLoading,
    createChat,
    selectChat,
    updateCurrentChatMessages,
    updateCurrentChatTitle,
    deleteCurrentChat,
    deleteChatById,
    loadChats,
  }
}
