import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  saveChat,
  getChat,
  getChats,
  deleteChat,
  updateChatTitle,
  generateChatTitle,
} from '../lib/chat-storage'
import type { Chat } from '../types/chat'

describe('Chat Storage', () => {
  beforeEach(() => {
    // Reset chrome.storage.local mock before each test
    vi.clearAllMocks()
  })

  describe('saveChat', () => {
    it('should save a chat to storage', async () => {
      const mockChat: Chat = {
        id: 'test-chat-1',
        title: 'Test Chat',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            timestamp: Date.now(),
          },
        ],
        preview: 'Hello',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({ chats: [] })
        return Promise.resolve()
      })

      chrome.storage.local.set = vi.fn().mockImplementation((data, callback) => {
        callback?.()
        return Promise.resolve()
      })

      await saveChat(mockChat)

      expect(chrome.storage.local.set).toHaveBeenCalled()
    })

    it('should generate preview from messages', async () => {
      const mockChat: Chat = {
        id: 'test-chat-2',
        title: 'Test Chat 2',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'This is a long message that should be truncated to 100 characters for the preview section',
            timestamp: Date.now(),
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({ chats: [] })
        return Promise.resolve()
      })

      chrome.storage.local.set = vi.fn().mockImplementation((data, callback) => {
        callback?.()
        return Promise.resolve()
      })

      await saveChat(mockChat)

      expect(chrome.storage.local.set).toHaveBeenCalled()
    })
  })

  describe('getChat', () => {
    it('should load a chat from storage', async () => {
      const mockChat: Chat = {
        id: 'test-chat-1',
        title: 'Test Chat',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({ chats: [mockChat] })
        return Promise.resolve()
      })

      const chat = await getChat('test-chat-1')

      expect(chat).toEqual(mockChat)
    })

    it('should return null for non-existent chat', async () => {
      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({ chats: [] })
        return Promise.resolve()
      })

      const chat = await getChat('non-existent')

      expect(chat).toBeNull()
    })
  })

  describe('deleteChat', () => {
    it('should delete a chat from storage', async () => {
      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({ chats: [{ id: 'test-chat-1', title: 'Test' }] })
        return Promise.resolve()
      })

      chrome.storage.local.set = vi.fn().mockImplementation((data, callback) => {
        callback?.()
        return Promise.resolve()
      })

      await deleteChat('test-chat-1')

      expect(chrome.storage.local.set).toHaveBeenCalled()
    })
  })

  describe('getChats', () => {
    it('should load all chats from storage', async () => {
      const mockChats = [
        { id: '1', title: 'Chat 1', messages: [], createdAt: 1, updatedAt: 1, preview: '' },
        { id: '2', title: 'Chat 2', messages: [], createdAt: 2, updatedAt: 2, preview: '' },
      ]

      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({ chats: mockChats })
        return Promise.resolve()
      })

      const chats = await getChats()

      expect(chats).toHaveLength(2)
      expect(chats[0].id).toBe('2') // Sorted by updatedAt desc
      expect(chats[1].id).toBe('1')
    })

    it('should handle empty storage', async () => {
      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({ chats: [] })
        return Promise.resolve()
      })

      const chats = await getChats()

      expect(chats).toHaveLength(0)
    })
  })

  describe('updateChatTitle', () => {
    it('should update chat title', async () => {
      const mockChat: Chat = {
        id: 'test-chat-1',
        title: 'Old Title',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({ chats: [mockChat] })
        return Promise.resolve()
      })

      chrome.storage.local.set = vi.fn().mockImplementation((data, callback) => {
        callback?.()
        return Promise.resolve()
      })

      await updateChatTitle('test-chat-1', 'New Title')

      expect(chrome.storage.local.set).toHaveBeenCalled()
    })
  })

  describe('generateChatTitle', () => {
    it('should generate appropriate title', () => {
      const messages = [
        { id: '1', role: 'user' as const, content: 'Test message', timestamp: Date.now() },
      ]
      
      const title = generateChatTitle(messages)
      
      expect(title).toBe('Test message')
    })
  })
})
