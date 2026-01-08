import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  saveChat,
  loadChat,
  loadAllChats,
  deleteChat,
  getChatList,
  updateChatTitle,
  MAX_CHATS,
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

      // Mock chrome.storage.local.set to resolve successfully
      chrome.storage.local.set = vi.fn().mockImplementation((data, callback) => {
        callback?.()
        return Promise.resolve()
      })

      await saveChat(mockChat)

      expect(chrome.storage.local.set).toHaveBeenCalled()
    })

    it('should generate preview from first message', async () => {
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

      chrome.storage.local.set = vi.fn().mockImplementation((data, callback) => {
        callback?.()
        return Promise.resolve()
      })

      await saveChat(mockChat)

      expect(chrome.storage.local.set).toHaveBeenCalled()
      const savedData = (chrome.storage.local.set as any).mock.calls[0][0]
      const chatKey = Object.keys(savedData).find(k => k.startsWith('chat:'))
      if (chatKey) {
        const savedChat = savedData[chatKey]
        expect(savedChat.preview).toBeDefined()
        expect(savedChat.preview.length).toBeLessThanOrEqual(100)
      }
    })
  })

  describe('loadChat', () => {
    it('should load a chat from storage', async () => {
      const mockChat: Chat = {
        id: 'test-chat-1',
        title: 'Test Chat',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        const result = { 'chat:test-chat-1': mockChat }
        callback?.(result)
        return Promise.resolve(result)
      })

      const chat = await loadChat('test-chat-1')

      expect(chrome.storage.local.get).toHaveBeenCalledWith(['chat:test-chat-1'], expect.any(Function))
      expect(chat).toEqual(mockChat)
    })

    it('should return null for non-existent chat', async () => {
      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        const result = {}
        callback?.(result)
        return Promise.resolve(result)
      })

      const chat = await loadChat('non-existent')

      expect(chat).toBeNull()
    })
  })

  describe('deleteChat', () => {
    it('should delete a chat from storage', async () => {
      chrome.storage.local.remove = vi.fn().mockImplementation((keys, callback) => {
        callback?.()
        return Promise.resolve()
      })

      await deleteChat('test-chat-1')

      expect(chrome.storage.local.remove).toHaveBeenCalledWith('chat:test-chat-1', expect.any(Function))
    })
  })

  describe('loadAllChats', () => {
    it('should load all chats from storage', async () => {
      const mockChats = {
        'chat:1': { id: '1', title: 'Chat 1', messages: [], createdAt: 1, updatedAt: 1 },
        'chat:2': { id: '2', title: 'Chat 2', messages: [], createdAt: 2, updatedAt: 2 },
        'other-key': 'should be ignored',
      }

      chrome.storage.local.get = vi.fn().mockImplementation((callback) => {
        callback?.(mockChats)
        return Promise.resolve(mockChats)
      })

      const chats = await loadAllChats()

      expect(chats).toHaveLength(2)
      expect(chats[0].id).toBe('2') // Sorted by updatedAt desc
      expect(chats[1].id).toBe('1')
    })

    it('should handle empty storage', async () => {
      chrome.storage.local.get = vi.fn().mockImplementation((callback) => {
        callback?.({})
        return Promise.resolve({})
      })

      const chats = await loadAllChats()

      expect(chats).toHaveLength(0)
    })
  })

  describe('getChatList', () => {
    it('should return a list of chat metadata', async () => {
      const mockChats = {
        'chat:1': {
          id: '1',
          title: 'Chat 1',
          messages: [{ id: 'm1', role: 'user', content: 'Hello', timestamp: 1 }],
          preview: 'Hello',
          createdAt: 1,
          updatedAt: 1,
        },
      }

      chrome.storage.local.get = vi.fn().mockImplementation((callback) => {
        callback?.(mockChats)
        return Promise.resolve(mockChats)
      })

      const chatList = await getChatList()

      expect(chatList).toHaveLength(1)
      expect(chatList[0]).toEqual({
        id: '1',
        title: 'Chat 1',
        preview: 'Hello',
        updatedAt: 1,
      })
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
        const result = { 'chat:test-chat-1': mockChat }
        callback?.(result)
        return Promise.resolve(result)
      })

      chrome.storage.local.set = vi.fn().mockImplementation((data, callback) => {
        callback?.()
        return Promise.resolve()
      })

      await updateChatTitle('test-chat-1', 'New Title')

      expect(chrome.storage.local.set).toHaveBeenCalled()
      const savedData = (chrome.storage.local.set as any).mock.calls[0][0]
      const savedChat = savedData['chat:test-chat-1']
      expect(savedChat.title).toBe('New Title')
    })
  })

  describe('MAX_CHATS enforcement', () => {
    it('should enforce maximum chat limit', () => {
      expect(MAX_CHATS).toBe(50)
    })
  })
})
