/**
 * Memory System Types
 * Defines types for persistent memories and bookmarked messages
 */

/**
 * BookmarkedMessage - Quick-save for important messages across chats
 * Stored in chrome.storage.local for fast access
 */
export interface BookmarkedMessage {
  id: string // nanoid()
  content: string // The message text
  role: 'user' | 'assistant' // Who wrote the message
  timestamp: number // When bookmarked (milliseconds)
  sourceUrl?: string // URL if from web/article (optional)
  sourceMessageId: string // Original message ID
  sourceChatId: string // Which chat it came from
  sourceChatTitle: string // Chat title for context
  tags: string[] // User-assigned tags for organization
  note?: string // Optional user note about the bookmark
}

/**
 * Memory - Extracted knowledge/context stored in PGlite with embeddings
 * Used for semantic search and context-aware AI responses
 */
export interface Memory {
  id: string // nanoid()
  content: string // The memory text (extracted snippet)
  fullContext?: string // Optional full conversation context
  embedding?: number[] // Vector embedding for semantic search
  tags: string[] // Auto-extracted or user-assigned tags
  category?: 'fact' | 'instruction' | 'reference' | 'insight' // Type of memory
  timestamp: number // When saved (milliseconds)
  sourceUrl?: string // URL of source article/page (for web/YouTube memories)
  sourceMessageId?: string // Original message ID if from chat
  sourceChatId?: string // Which chat it came from
  sourceChatTitle?: string // Chat title for reference
  relevanceScore?: number // Calculated relevance (0-1)
  lastAccessed?: number // For usage tracking
  accessCount?: number // How many times retrieved
}

/**
 * MemorySearchResult - Result from semantic search
 */
export interface MemorySearchResult extends Memory {
  relevanceScore: number // Search relevance score (0-1)
  matchType: 'semantic' | 'keyword' | 'tag' // How it matched
}

/**
 * BookmarkCategory - Available bookmark categories
 */
export type BookmarkCategory = 'todo' | 'reference' | 'insight' | 'question' | 'answer'

/**
 * MemoryStats - Statistics about stored memories
 */
export interface MemoryStats {
  totalMemories: number
  totalBookmarks: number
  categoryCounts: Record<string, number>
  tagCloud: Array<{ tag: string; count: number }>
  totalMemoriesSize: number // Approximate size in bytes
  lastUpdated: number
}

/**
 * MemoryRetrieverConfig - Configuration for memory retrieval in chat
 */
export interface MemoryRetrieverConfig {
  enabled: boolean
  maxResults: number // Max memories to include in context
  minRelevanceScore: number // Only include memories above this score (0-1)
  includeBookmarks: boolean // Also search bookmarks
  includeContext: boolean // Include full context or just snippets
  relevanceThreshold: number // Semantic similarity threshold
}
