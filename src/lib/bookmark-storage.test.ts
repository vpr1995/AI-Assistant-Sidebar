import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  saveBookmark,
  deleteBookmark,
  getBookmarks,
  convertBookmarkToMemory,
} from '../lib/bookmark-storage'
import type { BookmarkedMessage } from '../types/memory'

describe('Bookmark Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('saveBookmark', () => {
    it('should save a bookmark', async () => {
      const mockBookmark: Omit<BookmarkedMessage, 'id' | 'timestamp'> = {
        content: 'Test bookmark content',
        role: 'assistant',
        sourceMessageId: 'msg-1',
        sourceChatId: 'chat-1',
        sourceChatTitle: 'Test Chat',
        tags: ['important'],
      }

      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({ bookmarks: [] })
        return Promise.resolve({ bookmarks: [] })
      })

      chrome.storage.local.set = vi.fn().mockImplementation((data, callback) => {
        callback?.()
        return Promise.resolve()
      })

      const bookmarkId = await saveBookmark(mockBookmark)

      expect(bookmarkId).toBeDefined()
      expect(chrome.storage.local.set).toHaveBeenCalled()
    })

    it('should enforce 500 bookmark limit', async () => {
      const existingBookmarks = Array.from({ length: 500 }, (_, i) => ({
        id: `bookmark-${i}`,
        content: `Bookmark ${i}`,
        role: 'assistant' as const,
        timestamp: Date.now() - i,
        sourceMessageId: `msg-${i}`,
        sourceChatId: `chat-${i}`,
        sourceChatTitle: `Chat ${i}`,
        tags: [],
      }))

      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({ bookmarks: existingBookmarks })
        return Promise.resolve({ bookmarks: existingBookmarks })
      })

      chrome.storage.local.set = vi.fn().mockImplementation((data, callback) => {
        callback?.()
        return Promise.resolve()
      })

      const newBookmark: Omit<BookmarkedMessage, 'id' | 'timestamp'> = {
        content: 'New bookmark',
        role: 'assistant',
        sourceMessageId: 'msg-new',
        sourceChatId: 'chat-new',
        sourceChatTitle: 'New Chat',
        tags: [],
      }

      await saveBookmark(newBookmark)

      const savedData = (chrome.storage.local.set as any).mock.calls[0][0]
      expect(savedData.bookmarks).toHaveLength(500) // Should still be at limit
    })
  })

  describe('deleteBookmark', () => {
    it('should delete a bookmark', async () => {
      const existingBookmarks = [
        {
          id: 'bookmark-1',
          content: 'Bookmark 1',
          role: 'assistant' as const,
          timestamp: Date.now(),
          sourceMessageId: 'msg-1',
          sourceChatId: 'chat-1',
          sourceChatTitle: 'Chat 1',
          tags: [],
        },
        {
          id: 'bookmark-2',
          content: 'Bookmark 2',
          role: 'assistant' as const,
          timestamp: Date.now(),
          sourceMessageId: 'msg-2',
          sourceChatId: 'chat-2',
          sourceChatTitle: 'Chat 2',
          tags: [],
        },
      ]

      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({ bookmarks: existingBookmarks })
        return Promise.resolve({ bookmarks: existingBookmarks })
      })

      chrome.storage.local.set = vi.fn().mockImplementation((data, callback) => {
        callback?.()
        return Promise.resolve()
      })

      await deleteBookmark('bookmark-1')

      const savedData = (chrome.storage.local.set as any).mock.calls[0][0]
      expect(savedData.bookmarks).toHaveLength(1)
      expect(savedData.bookmarks[0].id).toBe('bookmark-2')
    })
  })

  describe('getBookmarks', () => {
    it('should retrieve all bookmarks', async () => {
      const mockBookmarks = [
        {
          id: 'bookmark-1',
          content: 'Bookmark 1',
          role: 'assistant' as const,
          timestamp: Date.now(),
          sourceMessageId: 'msg-1',
          sourceChatId: 'chat-1',
          sourceChatTitle: 'Chat 1',
          tags: [],
        },
      ]

      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({ bookmarks: mockBookmarks })
        return Promise.resolve({ bookmarks: mockBookmarks })
      })

      const bookmarks = await getBookmarks()

      expect(bookmarks).toEqual(mockBookmarks)
    })

    it('should return empty array when no bookmarks exist', async () => {
      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({})
        return Promise.resolve({})
      })

      const bookmarks = await getBookmarks()

      expect(bookmarks).toEqual([])
    })

    it('should sort bookmarks by timestamp descending', async () => {
      const mockBookmarks = [
        {
          id: 'bookmark-1',
          content: 'Old',
          role: 'assistant' as const,
          timestamp: 1000,
          sourceMessageId: 'msg-1',
          sourceChatId: 'chat-1',
          sourceChatTitle: 'Chat 1',
          tags: [],
        },
        {
          id: 'bookmark-2',
          content: 'New',
          role: 'assistant' as const,
          timestamp: 2000,
          sourceMessageId: 'msg-2',
          sourceChatId: 'chat-2',
          sourceChatTitle: 'Chat 2',
          tags: [],
        },
      ]

      chrome.storage.local.get = vi.fn().mockImplementation((keys, callback) => {
        callback?.({ bookmarks: mockBookmarks })
        return Promise.resolve({ bookmarks: mockBookmarks })
      })

      const bookmarks = await getBookmarks()

      expect(bookmarks[0].timestamp).toBe(2000)
      expect(bookmarks[1].timestamp).toBe(1000)
    })
  })
})
