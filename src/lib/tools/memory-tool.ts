/**
 * Memory Search Tool
 * Search user's saved memories and bookmarked content
 */

import { z } from 'zod'
import type { ToolDefinition } from './types'
import { retrieveRelevantMemories } from '../memory-search'

export interface MemoryResult {
  id: string
  content: string
  category?: string
  tags: string[]
  timestamp: number
  relevanceScore: number
  sourceChatTitle?: string
}

/**
 * Search memories using semantic and keyword search
 */
async function searchMemories(query: string, maxResults: number = 5): Promise<MemoryResult[]> {
  try {
    console.log('[MemoryTool] Searching memories for:', query)

    const results = await retrieveRelevantMemories(query, {
      enabled: true,
      maxResults,
      minRelevanceScore: 0.3, // Lower threshold to get more results
    })

    console.log('[MemoryTool] Found', results.length, 'memories')

    return results as unknown as MemoryResult[]
  } catch (error) {
    console.error('[MemoryTool] Search error:', error)
    return []
  }
}

/**
 * Format memory results for AI consumption
 */
function formatMemoryResults(results: MemoryResult[]): string {
  if (results.length === 0) {
    return 'No relevant memories found. The user has not saved any memories about this topic yet.'
  }

  return results
    .map((result, index) => {
      const relevance = (result.relevanceScore * 100).toFixed(0)
      const date = new Date(result.timestamp).toLocaleDateString()
      const tags = result.tags.length > 0 ? ` [Tags: ${result.tags.join(', ')}]` : ''
      return `${index + 1}. (${relevance}% relevant) - ${result.content}${tags}\n   Date: ${date}`
    })
    .join('\n\n')
}

export const memoryTool: ToolDefinition = {
  id: 'searchMemories',
  label: 'Search Memories',
  description:
    'Search the user\'s saved memories and bookmarked content. Use this when the user asks about their past memories, saved information, or previous learnings.',
  inputSchema: z.object({
    query: z.string().describe('The search query for memories'),
    maxResults: z.number().optional().default(5).describe('Maximum number of memories to return (default: 5)'),
  }),
  execute: async (input: unknown) => {
    const { query, maxResults = 5 } = input as { query: string; maxResults?: number }

    console.log('[MemoryTool] Executing memory search:', query)

    try {
      const results = await searchMemories(query, maxResults)

      return {
        query,
        formatted: formatMemoryResults(results),
        count: results.length,
      }
    } catch (error) {
      console.error('[MemoryTool] Error:', error)
      return {
        query,
        error: error instanceof Error ? error.message : 'Memory search failed',
        formatted: 'Memory search failed. Please try again.',
        count: 0,
      }
    }
  },

  enabledByDefault: true,
}
