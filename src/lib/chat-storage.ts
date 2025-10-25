/**
 * Chat Storage Utility
 * Handles persisting and retrieving chats from Chrome storage
 */

import type { Chat, ChatMessage, ChatListItem } from '@/types/chat'

const STORAGE_KEY = 'chats'
const MAX_PREVIEW_LENGTH = 100

/**
 * Generate a preview text from messages
 */
function generatePreview(messages: ChatMessage[]): string {
  // Find the first user or assistant message
  const firstMessage = messages.find((m) => m.content)
  if (!firstMessage) return 'New chat'

  const preview = firstMessage.content.substring(0, MAX_PREVIEW_LENGTH)
  return preview.length === MAX_PREVIEW_LENGTH ? preview + '...' : preview
}

/**
 * Generate a chat title based on the first user message
 */
export function generateChatTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === 'user')
  if (!firstUserMessage) return 'Untitled Chat'

  // Take the first 50 characters of the first user message, or up to the first newline
  const titleText = firstUserMessage.content.split('\n')[0]?.substring(0, 50) || ''
  return titleText || 'Untitled Chat'
}

/**
 * Save or update a chat
 */
export async function saveChat(chat: Chat): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      try {
        const chats: Chat[] = result[STORAGE_KEY] || []
        const existingIndex = chats.findIndex((c) => c.id === chat.id)

        // Add preview if not present
        const chatWithPreview = {
          ...chat,
          preview: chat.preview || generatePreview(chat.messages),
          updatedAt: Date.now(),
        }

        if (existingIndex >= 0) {
          chats[existingIndex] = chatWithPreview
        } else {
          chats.push(chatWithPreview)
        }

        // Keep only the last 50 chats to avoid storage bloat
        if (chats.length > 50) {
          chats.sort((a, b) => b.updatedAt - a.updatedAt)
          chats.splice(50)
        }

        chrome.storage.local.set({ [STORAGE_KEY]: chats }, () => {
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
 * Get all chats, sorted by most recent first
 */
export async function getChats(): Promise<ChatListItem[]> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      try {
        const chats: Chat[] = result[STORAGE_KEY] || []
        const chatList: ChatListItem[] = chats
          .map((chat) => ({
            id: chat.id,
            title: chat.title,
            preview: chat.preview,
            updatedAt: chat.updatedAt,
          }))
          .sort((a, b) => b.updatedAt - a.updatedAt)
        resolve(chatList)
      } catch (error) {
        reject(error)
      }
    })
  })
}

/**
 * Get a specific chat by ID
 */
export async function getChat(chatId: string): Promise<Chat | null> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      try {
        const chats: Chat[] = result[STORAGE_KEY] || []
        const chat = chats.find((c) => c.id === chatId)
        resolve(chat || null)
      } catch (error) {
        reject(error)
      }
    })
  })
}

/**
 * Delete a chat by ID
 */
export async function deleteChat(chatId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      try {
        const chats: Chat[] = result[STORAGE_KEY] || []
        const filtered = chats.filter((c) => c.id !== chatId)
        chrome.storage.local.set({ [STORAGE_KEY]: filtered }, () => {
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
 * Update only the messages of a chat
 */
export async function updateChatMessages(chatId: string, messages: ChatMessage[]): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      try {
        const chats: Chat[] = result[STORAGE_KEY] || []
        const chatIndex = chats.findIndex((c) => c.id === chatId)

        if (chatIndex === -1) {
          reject(new Error(`Chat with ID ${chatId} not found`))
          return
        }

        // Update messages and preview
        chats[chatIndex] = {
          ...chats[chatIndex],
          messages,
          preview: generatePreview(messages),
          updatedAt: Date.now(),
        } as Chat

        chrome.storage.local.set({ [STORAGE_KEY]: chats }, () => {
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
 * Update only the title of a chat
 */
export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      try {
        const chats: Chat[] = result[STORAGE_KEY] || []
        const chatIndex = chats.findIndex((c) => c.id === chatId)

        if (chatIndex === -1) {
          reject(new Error(`Chat with ID ${chatId} not found`))
          return
        }

        // Update title and timestamp
        chats[chatIndex] = {
          ...chats[chatIndex],
          title,
          updatedAt: Date.now(),
        } as Chat

        chrome.storage.local.set({ [STORAGE_KEY]: chats }, () => {
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
 * Clear all chats
 */
export async function clearAllChats(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEY]: [] }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        resolve()
      }
    })
  })
}
