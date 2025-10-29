/**
 * Hook: useMemories
 * Manages memory state and operations
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Memory, MemorySearchResult } from '../types/memory'
import * as memoryStorage from '../lib/memory-storage'
import * as memorySearch from '../lib/memory-search'

interface UseMemoriesReturn {
  memories: Memory[]
  loading: boolean
  error: Error | null
  searchResults: MemorySearchResult[]
  isSearching: boolean
  saveMemory: (memory: Omit<Memory, 'id'>) => Promise<Memory>
  deleteMemory: (id: string) => Promise<void>
  updateMemory: (id: string, updates: Partial<Memory>) => Promise<Memory>
  searchMemories: (query: string) => Promise<void>
  getMemoriesByChat: (chatId: string) => Promise<Memory[]>
  getMemoriesByTags: (tags: string[]) => Promise<Memory[]>
  clearSearch: () => void
  stats: {
    total: number
    tagCloud: Array<{ tag: string; count: number }>
  }
}

export function useMemories(): UseMemoriesReturn {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [searchResults, setSearchResults] = useState<MemorySearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [stats, setStats] = useState<{ total: number; tagCloud: Array<{ tag: string; count: number }> }>({ total: 0, tagCloud: [] })
  const initializeOnce = useRef(false)

  // Initialize memories on mount
  useEffect(() => {
    if (initializeOnce.current) return
    initializeOnce.current = true

    const loadMemories = async () => {
      try {
        setLoading(true)
        await memoryStorage.initializeMemoryTable()
        const loaded = await memoryStorage.getMemories(100)
        setMemories(loaded)

        const memoryStats = await memoryStorage.getMemoryStats()
        setStats({
          total: memoryStats.totalMemories,
          tagCloud: memoryStats.tagCloud,
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load memories'))
      } finally {
        setLoading(false)
      }
    }

    loadMemories()
  }, [])

  const saveMemory = useCallback(async (memory: Omit<Memory, 'id'>) => {
    try {
      const newMemory = await memoryStorage.saveMemory(memory)
      setMemories((prev) => [newMemory, ...prev])
      return newMemory
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save memory')
      setError(error)
      throw error
    }
  }, [])

  const deleteMemory = useCallback(async (id: string) => {
    try {
      await memoryStorage.deleteMemory(id)
      setMemories((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete memory')
      setError(error)
      throw error
    }
  }, [])

  const updateMemory = useCallback(async (id: string, updates: Partial<Memory>) => {
    try {
      const updated = await memoryStorage.updateMemory(id, updates)
      setMemories((prev) => prev.map((m) => (m.id === id ? updated : m)))
      return updated
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update memory')
      setError(error)
      throw error
    }
  }, [])

  const searchMemories = useCallback(async (query: string) => {
    try {
      setIsSearching(true)
      const results = await memorySearch.retrieveRelevantMemories(query)
      setSearchResults(results)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Search failed')
      setError(error)
    } finally {
      setIsSearching(false)
    }
  }, [])

  const getMemoriesByChat = useCallback(async (chatId: string) => {
    try {
      return await memoryStorage.getMemoriesByChat(chatId)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get memories by chat')
      setError(error)
      throw error
    }
  }, [])

  const getMemoriesByTags = useCallback(async (tags: string[]) => {
    try {
      return await memoryStorage.getMemoriesByTags(tags)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get memories by tags')
      setError(error)
      throw error
    }
  }, [])

  const clearSearch = useCallback(() => {
    setSearchResults([])
  }, [])

  return {
    memories,
    loading,
    error,
    searchResults,
    isSearching,
    saveMemory,
    deleteMemory,
    updateMemory,
    searchMemories,
    getMemoriesByChat,
    getMemoriesByTags,
    clearSearch,
    stats,
  }
}
