/**
 * Hook: useBookmarks
 * Manages bookmarks state and operations
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { BookmarkedMessage } from '../types/memory'
import * as bookmarkStorage from '../lib/bookmark-storage'

interface UseBookmarksReturn {
  bookmarks: BookmarkedMessage[]
  loading: boolean
  error: Error | null
  bookmarkMessage: (
    message: Omit<BookmarkedMessage, 'id' | 'timestamp'>,
    note?: string
  ) => Promise<BookmarkedMessage>
  removeBookmark: (bookmarkId: string) => Promise<void>
  updateBookmark: (
    bookmarkId: string,
    updates: Partial<BookmarkedMessage>
  ) => Promise<BookmarkedMessage | null>
  addTag: (bookmarkId: string, tag: string) => Promise<boolean>
  removeTag: (bookmarkId: string, tag: string) => Promise<boolean>
  searchBookmarks: (query: string) => Promise<BookmarkedMessage[]>
  getBookmarksByChat: (chatId: string) => Promise<BookmarkedMessage[]>
  getBookmarksByTag: (tag: string) => Promise<BookmarkedMessage[]>
  isMessageBookmarked: (messageId: string, chatId: string) => boolean
  stats: {
    total: number
    tagCloud: Array<{ tag: string; count: number }>
  }
}

export function useBookmarks(): UseBookmarksReturn {
  const [bookmarks, setBookmarks] = useState<BookmarkedMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [stats, setStats] = useState<{ total: number; tagCloud: Array<{ tag: string; count: number }> }>({ total: 0, tagCloud: [] })
  const initializeOnce = useRef(false)

  // Load bookmarks on mount
  useEffect(() => {
    if (initializeOnce.current) return
    initializeOnce.current = true

    const loadBookmarks = async () => {
      try {
        setLoading(true)
        const loaded = await bookmarkStorage.getBookmarks()
        setBookmarks(loaded)

        const bookmarkStats = await bookmarkStorage.getBookmarkStats()
        setStats({
          total: bookmarkStats.total,
          tagCloud: bookmarkStats.tagCloud,
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load bookmarks'))
      } finally {
        setLoading(false)
      }
    }

    loadBookmarks()
  }, [])

  const bookmarkMessage = useCallback(
    async (message: Omit<BookmarkedMessage, 'id' | 'timestamp'>, note?: string) => {
      try {
        const bookmark = await bookmarkStorage.bookmarkMessage(message, note)
        setBookmarks((prev) => [bookmark, ...prev.filter((b) => b.id !== bookmark.id)])
        return bookmark
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to bookmark message')
        setError(error)
        throw error
      }
    },
    []
  )

  const removeBookmark = useCallback(async (bookmarkId: string) => {
    try {
      await bookmarkStorage.removeBookmark(bookmarkId)
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId))
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove bookmark')
      setError(error)
      throw error
    }
  }, [])

  const updateBookmark = useCallback(
    async (bookmarkId: string, updates: Partial<BookmarkedMessage>) => {
      try {
        const updated = await bookmarkStorage.updateBookmark(bookmarkId, updates)
        if (updated) {
          setBookmarks((prev) => prev.map((b) => (b.id === bookmarkId ? updated : b)))
        }
        return updated
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update bookmark')
        setError(error)
        throw error
      }
    },
    []
  )

  const addTag = useCallback(async (bookmarkId: string, tag: string) => {
    try {
      const success = await bookmarkStorage.addTagToBookmark(bookmarkId, tag)
      if (success) {
        // Update local state
        setBookmarks((prev) =>
          prev.map((b) =>
            b.id === bookmarkId && !b.tags.includes(tag) ? { ...b, tags: [...b.tags, tag] } : b
          )
        )
      }
      return success
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add tag')
      setError(error)
      return false
    }
  }, [])

  const removeTag = useCallback(async (bookmarkId: string, tag: string) => {
    try {
      const success = await bookmarkStorage.removeTagFromBookmark(bookmarkId, tag)
      if (success) {
        setBookmarks((prev) =>
          prev.map((b) =>
            b.id === bookmarkId ? { ...b, tags: b.tags.filter((t) => t !== tag) } : b
          )
        )
      }
      return success
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove tag')
      setError(error)
      return false
    }
  }, [])

  const searchBookmarks = useCallback(async (query: string) => {
    try {
      return await bookmarkStorage.searchBookmarks(query)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Search failed')
      setError(error)
      return []
    }
  }, [])

  const getBookmarksByChat = useCallback(async (chatId: string) => {
    try {
      return await bookmarkStorage.getBookmarksByChat(chatId)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get bookmarks')
      setError(error)
      return []
    }
  }, [])

  const getBookmarksByTag = useCallback(async (tag: string) => {
    try {
      return await bookmarkStorage.getBookmarksByTag(tag)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get bookmarks by tag')
      setError(error)
      return []
    }
  }, [])

  const isMessageBookmarked = useCallback(
    (messageId: string, chatId: string) => {
      return bookmarks.some((b) => b.sourceMessageId === messageId && b.sourceChatId === chatId)
    },
    [bookmarks]
  )

  return {
    bookmarks,
    loading,
    error,
    bookmarkMessage,
    removeBookmark,
    updateBookmark,
    addTag,
    removeTag,
    searchBookmarks,
    getBookmarksByChat,
    getBookmarksByTag,
    isMessageBookmarked,
    stats,
  }
}
