/**
 * Memory Search & Retrieval Module
 * Provides semantic search and context-aware memory retrieval
 */

import { Memory, MemorySearchResult, MemoryRetrieverConfig } from '../types/memory'
import * as memoryStorage from './memory-storage'
import * as bookmarkStorage from './bookmark-storage'
import { getEmbedding } from './embeddings'

const DEFAULT_CONFIG: MemoryRetrieverConfig = {
  enabled: true,
  maxResults: 5,
  minRelevanceScore: 0.5,
  includeBookmarks: true,
  includeContext: true,
  relevanceThreshold: 0.6,
}

/**
 * Search memories by semantic similarity using embeddings
 */
export async function searchMemoriesByEmbedding(
  query: string,
  limit: number = 10,
  threshold: number = 0.6
): Promise<MemorySearchResult[]> {
  try {
    console.log('[MemorySearch] Starting semantic search for:', query.substring(0, 50))
    
    // Get embedding for the query
    const queryEmbedding = await getEmbedding(query)
    console.log('[MemorySearch] Query embedding generated:', queryEmbedding.length, 'dimensions')

    // Get all memories with embeddings
    const memories = await memoryStorage.getMemories(500)
    console.log('[MemorySearch] Total memories in database:', memories.length)

    const memoriesWithEmbeddings = memories.filter((m) => m.embedding && m.embedding.length > 0)
    console.log('[MemorySearch] Memories with embeddings:', memoriesWithEmbeddings.length)

    // Calculate similarity scores
    const scored = memoriesWithEmbeddings
      .map((memory) => {
        const similarity = cosineSimilarity(queryEmbedding, memory.embedding || [])
        return {
          ...memory,
          relevanceScore: similarity,
          matchType: 'semantic' as const,
        }
      })
      .filter((m) => m.relevanceScore >= threshold)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)

    console.log('[MemorySearch] Semantic matches above threshold:', scored.length)
    scored.forEach((m, i) => {
      console.log(`  [${i + 1}] Score: ${(m.relevanceScore * 100).toFixed(1)}% - ${m.content.substring(0, 50)}...`)
    })

    return scored
  } catch (error) {
    console.error('[MemorySearch] Failed to search by embedding:', error)
    return []
  }
}

/**
 * Search memories by keyword content
 */
export async function searchMemoriesByKeyword(
  query: string,
  limit: number = 10
): Promise<MemorySearchResult[]> {
  try {
    const memories = await memoryStorage.searchMemoriesByContent(query, limit)

    return memories.map((m) => ({
      ...m,
      relevanceScore: 1, // Keyword matches are treated as high confidence
      matchType: 'keyword' as const,
    }))
  } catch (error) {
    console.error('[MemorySearch] Failed to search by keyword:', error)
    return []
  }
}

/**
 * Search memories by tags
 */
export async function searchMemoriesByTags(
  tags: string[],
  limit: number = 20
): Promise<MemorySearchResult[]> {
  try {
    const memories = await memoryStorage.getMemoriesByTags(tags, limit)

    return memories.map((m) => ({
      ...m,
      relevanceScore: 0.8, // Tag matches are reliable
      matchType: 'tag' as const,
    }))
  } catch (error) {
    console.error('[MemorySearch] Failed to search by tags:', error)
    return []
  }
}

/**
 * Retrieve relevant memories for context-aware chat responses
 * Combines semantic search and keyword search with configurable options
 */
export async function retrieveRelevantMemories(
  query: string,
  config: Partial<MemoryRetrieverConfig> = {}
): Promise<MemorySearchResult[]> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

  if (!mergedConfig.enabled) {
    console.log('[MemorySearch] Memory retrieval disabled')
    return []
  }

  try {
    console.log('[MemorySearch] Starting memory retrieval for query:', query.substring(0, 50))
    
    // Run both semantic and keyword searches in parallel
    const [semanticResults, keywordResults] = await Promise.all([
      searchMemoriesByEmbedding(
        query,
        mergedConfig.maxResults * 2,
        mergedConfig.relevanceThreshold
      ),
      searchMemoriesByKeyword(query, mergedConfig.maxResults),
    ])

    console.log('[MemorySearch] Semantic results:', semanticResults.length)
    console.log('[MemorySearch] Keyword results:', keywordResults.length)

    // Merge and deduplicate results
    const merged = new Map<string, MemorySearchResult>()

    // Add semantic results
    for (const result of semanticResults) {
      merged.set(result.id, result)
    }

    // Add/merge keyword results
    for (const result of keywordResults) {
      const existing = merged.get(result.id)
      if (existing) {
        // Average the scores for duplicate matches
        existing.relevanceScore = (existing.relevanceScore + result.relevanceScore) / 2
      } else {
        merged.set(result.id, result)
      }
    }

    // Filter by minimum relevance score
    const filtered = Array.from(merged.values())
      .filter((m) => m.relevanceScore >= mergedConfig.minRelevanceScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, mergedConfig.maxResults)

    console.log('[MemorySearch] After filtering and dedup:', filtered.length, 'memories')
    if (filtered.length > 0 && filtered[0]) {
      console.log('[MemorySearch] Top result relevance:', (filtered[0].relevanceScore * 100).toFixed(1) + '%')
    }

    return filtered
  } catch (error) {
    console.error('[MemorySearch] Failed to retrieve relevant memories:', error)
    return []
  }
}

/**
 * Format memories into a context string for AI prompts
 */
export function formatMemoriesForContext(memories: MemorySearchResult[]): string {
  if (memories.length === 0) {
    return ''
  }

  const formatted = memories
    .map((memory) => {
      const score = (memory.relevanceScore * 100).toFixed(0)
      const tags = memory.tags.length > 0 ? ` [${memory.tags.join(', ')}]` : ''
      return `- (${score}% relevant${tags}): ${memory.content}`
    })
    .join('\n')

  return `## Relevant Information from Memory:\n${formatted}`
}

/**
 * Build system prompt that includes relevant memories
 */
export function buildSystemPromptWithMemories(
  baseSystemPrompt: string,
  memories: MemorySearchResult[]
): string {
  if (memories.length === 0) {
    return baseSystemPrompt
  }

  const memoryContext = formatMemoriesForContext(memories)
  return `${baseSystemPrompt}\n\n${memoryContext}`
}

/**
 * Save conversation snippet to memory
 */
export async function saveConversationSnippet(
  userMessage: string,
  assistantResponse: string,
  chatId: string,
  chatTitle: string,
  sourceMessageId?: string,
  category?: 'fact' | 'instruction' | 'reference' | 'insight'
): Promise<Memory> {
  try {
    // Create snippet by combining messages
    const snippet = `User: ${userMessage}\nAssistant: ${assistantResponse}`

    // Get embedding for the snippet
    let embedding: number[] | undefined
    try {
      embedding = await getEmbedding(snippet)
    } catch (e) {
      console.warn('[MemorySearch] Failed to generate embedding:', e)
    }

    // Extract tags from content (simple keyword extraction)
    const tags = extractTags(snippet)

    // Save to memory
    const memory = await memoryStorage.saveMemory({
      content: userMessage, // Store user message as main content
      fullContext: snippet, // Store full exchange as context
      embedding,
      tags,
      category: category || 'reference',
      timestamp: Date.now(),
      sourceChatId: chatId,
      sourceChatTitle: chatTitle,
      sourceMessageId: sourceMessageId,
    })

    return memory
  } catch (error) {
    console.error('[MemorySearch] Failed to save conversation snippet:', error)
    throw error
  }
}

/**
 * Combine bookmark search with memory search
 */
export async function searchAllKnowledge(
  query: string,
  config: Partial<MemoryRetrieverConfig> = {}
): Promise<{
  memories: MemorySearchResult[]
  bookmarkCount: number
}> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

  try {
    const memories = await retrieveRelevantMemories(query, mergedConfig)

    let bookmarkCount = 0
    if (mergedConfig.includeBookmarks) {
      const bookmarks = await bookmarkStorage.searchBookmarks(query)
      bookmarkCount = bookmarks.length
    }

    return {
      memories,
      bookmarkCount,
    }
  } catch (error) {
    console.error('[MemorySearch] Failed to search all knowledge:', error)
    return {
      memories: [],
      bookmarkCount: 0,
    }
  }
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) {
    return 0
  }

  if (a.length !== b.length) {
    console.warn('[MemorySearch] Vector lengths do not match:', a.length, b.length)
    return 0
  }

  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let i = 0; i < a.length; i++) {
    const aVal = a[i] ?? 0
    const bVal = b[i] ?? 0
    dotProduct += aVal * bVal
    magnitudeA += aVal * aVal
    magnitudeB += bVal * bVal
  }

  const magnitudes = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB)
  if (magnitudes === 0) {
    return 0
  }

  return dotProduct / magnitudes
}

/**
 * Simple tag extraction from text (extract common terms)
 */
function extractTags(text: string): string[] {
  const commonWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'is',
    'was',
    'be',
    'are',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'can',
    'this',
    'that',
    'these',
    'those',
    'i',
    'you',
    'he',
    'she',
    'it',
    'we',
    'they',
  ])

  const words = text
    .toLowerCase()
    .match(/\b[a-z]+\b/g)
    ?.filter((word) => word.length > 3 && !commonWords.has(word)) || []

  // Return top 5 unique words as tags
  const tagCounts = new Map<string, number>()
  for (const word of words) {
    tagCounts.set(word, (tagCounts.get(word) || 0) + 1)
  }

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag)
}

/**
 * Get config for memory retrieval from storage
 */
export async function getMemoryRetrieverConfig(): Promise<MemoryRetrieverConfig> {
  try {
    const data = await chrome.storage.local.get('memoryRetrieverConfig')
    return { ...DEFAULT_CONFIG, ...(data.memoryRetrieverConfig as Partial<MemoryRetrieverConfig>) }
  } catch {
    return DEFAULT_CONFIG
  }
}

/**
 * Save config for memory retrieval
 */
export async function saveMemoryRetrieverConfig(
  config: Partial<MemoryRetrieverConfig>
): Promise<void> {
  try {
    const merged = { ...DEFAULT_CONFIG, ...config }
    await chrome.storage.local.set({ memoryRetrieverConfig: merged })
  } catch (error) {
    console.error('[MemorySearch] Failed to save config:', error)
  }
}
