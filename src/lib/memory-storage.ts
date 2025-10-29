/**
 * Memory Storage Module
 * Manages persistent storage of memories in PGlite with vector embeddings
 */

import { executeQuery } from './db'
import { Memory, MemoryStats } from '../types/memory'
import { nanoid } from 'nanoid'

const TABLE_NAME = 'memories'

/**
 * Initialize memory table if it doesn't exist
 * Creates table with vector extension for semantic search
 */
export async function initializeMemoryTable() {
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        full_context TEXT,
        embedding vector(384),
        tags TEXT[] DEFAULT '{}',
        category TEXT CHECK (category IN ('fact', 'instruction', 'reference', 'insight')),
        timestamp BIGINT NOT NULL,
        source_url TEXT,
        source_message_id TEXT,
        source_chat_id TEXT,
        source_chat_title TEXT,
        relevance_score FLOAT DEFAULT 0,
        last_accessed BIGINT,
        access_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create indices for faster queries
    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_memories_timestamp 
      ON ${TABLE_NAME}(timestamp DESC)
    `)

    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_memories_category 
      ON ${TABLE_NAME}(category)
    `)

    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_memories_source_chat 
      ON ${TABLE_NAME}(source_chat_id)
    `)

    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_memories_tags 
      ON ${TABLE_NAME} USING GIN(tags)
    `)

    console.log('[Memory] Database table initialized successfully')
  } catch (error) {
    console.error('[Memory] Failed to initialize table:', error)
    throw error
  }
}

/**
 * Save a new memory
 */
export async function saveMemory(memory: Omit<Memory, 'id'>): Promise<Memory> {
  const id = nanoid()
  const now = Date.now()

  const newMemory: Memory = {
    id,
    ...memory,
    timestamp: memory.timestamp || now,
    tags: memory.tags || [],
  }

  try {
    console.log(`[Memory] Saving memory: ${newMemory.content.substring(0, 50)}...`)
    console.log(`[Memory] Embedding present: ${newMemory.embedding ? 'YES (' + newMemory.embedding.length + 'd)' : 'NO'}`)
    console.log(`[Memory] Source URL: ${newMemory.sourceUrl || 'none'}`)
    
    await executeQuery(
      `INSERT INTO ${TABLE_NAME} (
        id, content, full_context, embedding, tags, category, 
        timestamp, source_url, source_message_id, source_chat_id, source_chat_title, 
        relevance_score, access_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        newMemory.id,
        newMemory.content,
        newMemory.fullContext || null,
        newMemory.embedding ? JSON.stringify(newMemory.embedding) : null,
        newMemory.tags,
        newMemory.category || null,
        newMemory.timestamp,
        newMemory.sourceUrl || null,
        newMemory.sourceMessageId || null,
        newMemory.sourceChatId || null,
        newMemory.sourceChatTitle || null,
        newMemory.relevanceScore || 0,
        newMemory.accessCount || 0,
      ]
    )

    console.log(`[Memory] ✅ Saved memory: ${id}`)
    return newMemory
  } catch (error) {
    console.error('[Memory] Failed to save memory:', error)
    throw error
  }
}

/**
 * Get all memories with optional filtering
 */
export async function getMemories(
  limit: number = 100,
  offset: number = 0,
  category?: string
): Promise<Memory[]> {
  try {
    let query = `SELECT * FROM ${TABLE_NAME}`
    const params: unknown[] = []

    if (category) {
      query += ` WHERE category = $1`
      params.push(category)
    }

    query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1} OFFSET $${
      params.length + 2
    }`
    params.push(limit, offset)

    const result = await executeQuery(query, params)
    const memories = mapDbRowsToMemories((result.rows as Record<string, unknown>[]) || [])
    
    console.log(`[Memory] Retrieved ${memories.length} memories`)
    memories.forEach((m, i) => {
      console.log(`  [${i + 1}] Has embedding: ${m.embedding ? m.embedding.length + 'd' : 'NO'} - ${m.content.substring(0, 50)}...`)
    })
    
    return memories
  } catch (error) {
    console.error('[Memory] Failed to get memories:', error)
    throw error
  }
}

/**
 * Get memory by ID
 */
export async function getMemoryById(id: string): Promise<Memory | null> {
  try {
    const result = await executeQuery(
      `SELECT * FROM ${TABLE_NAME} WHERE id = $1`,
      [id]
    )

    if (!result.rows || result.rows.length === 0) {
      return null
    }

    // Update access count and last accessed
    await executeQuery(
      `UPDATE ${TABLE_NAME} SET access_count = access_count + 1, last_accessed = $1 WHERE id = $2`,
      [Date.now(), id]
    )

    return mapDbRowToMemory(result.rows[0] as Record<string, unknown>)
  } catch (error) {
    console.error('[Memory] Failed to get memory:', error)
    throw error
  }
}

/**
 * Update memory
 */
export async function updateMemory(
  id: string,
  updates: Partial<Memory>
): Promise<Memory> {
  try {
    const fields: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (updates.content !== undefined) {
      fields.push(`content = $${paramIndex++}`)
      values.push(updates.content)
    }

    if (updates.tags !== undefined) {
      fields.push(`tags = $${paramIndex++}`)
      values.push(updates.tags)
    }

    if (updates.category !== undefined) {
      fields.push(`category = $${paramIndex++}`)
      values.push(updates.category)
    }

    if (updates.embedding !== undefined) {
      fields.push(`embedding = $${paramIndex++}`)
      values.push(updates.embedding ? JSON.stringify(updates.embedding) : null)
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)

    values.push(id)

    const result = await executeQuery(
      `UPDATE ${TABLE_NAME} SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    if (!result.rows || result.rows.length === 0) {
      throw new Error(`Memory not found: ${id}`)
    }

    console.log(`[Memory] Updated memory: ${id}`)
    return mapDbRowToMemory(result.rows[0] as Record<string, unknown>)
  } catch (error) {
    console.error('[Memory] Failed to update memory:', error)
    throw error
  }
}

/**
 * Delete memory by ID
 */
export async function deleteMemory(id: string): Promise<void> {
  try {
    await executeQuery(`DELETE FROM ${TABLE_NAME} WHERE id = $1`, [id])
    console.log(`[Memory] Deleted memory: ${id}`)
  } catch (error) {
    console.error('[Memory] Failed to delete memory:', error)
    throw error
  }
}

/**
 * Get memories by tags
 */
export async function getMemoriesByTags(
  tags: string[],
  limit: number = 50
): Promise<Memory[]> {
  try {
    const result = await executeQuery(
      `SELECT * FROM ${TABLE_NAME} 
       WHERE tags && $1::TEXT[] 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [tags, limit]
    )

    return mapDbRowsToMemories((result.rows as Record<string, unknown>[]) || [])
  } catch (error) {
    console.error('[Memory] Failed to get memories by tags:', error)
    throw error
  }
}

/**
 * Get memories from a specific chat
 */
export async function getMemoriesByChat(
  chatId: string,
  limit: number = 50
): Promise<Memory[]> {
  try {
    const result = await executeQuery(
      `SELECT * FROM ${TABLE_NAME} 
       WHERE source_chat_id = $1 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [chatId, limit]
    )

    return mapDbRowsToMemories((result.rows as Record<string, unknown>[]) || [])
  } catch (error) {
    console.error('[Memory] Failed to get memories by chat:', error)
    throw error
  }
}

/**
 * Search memories by content (keyword search)
 */
export async function searchMemoriesByContent(
  query: string,
  limit: number = 20
): Promise<Memory[]> {
  try {
    // Simple text search using ILIKE (case-insensitive)
    const result = await executeQuery(
      `SELECT * FROM ${TABLE_NAME} 
       WHERE content ILIKE $1 OR full_context ILIKE $1
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [`%${query}%`, limit]
    )

    return mapDbRowsToMemories((result.rows as Record<string, unknown>[]) || [])
  } catch (error) {
    console.error('[Memory] Failed to search memories:', error)
    throw error
  }
}

/**
 * Get memory statistics
 */
export async function getMemoryStats(): Promise<MemoryStats> {
  try {
    const countResult = await executeQuery(
      `SELECT 
        COUNT(*) as total,
        SUM(pg_column_size(content)) + SUM(pg_column_size(full_context)) as size
       FROM ${TABLE_NAME}`
    )

    const categoryResult = await executeQuery(
      `SELECT category, COUNT(*) as count 
       FROM ${TABLE_NAME} 
       WHERE category IS NOT NULL
       GROUP BY category`
    )

    const tagsResult = await executeQuery(
      `SELECT unnest(tags) as tag, COUNT(*) as count 
       FROM ${TABLE_NAME} 
       WHERE array_length(tags, 1) > 0
       GROUP BY tag 
       ORDER BY count DESC 
       LIMIT 20`
    )

    const countRow = countResult.rows?.[0] as Record<string, unknown> | undefined
    const stats: MemoryStats = {
      totalMemories: parseInt(String(countRow?.total || '0'), 10),
      totalBookmarks: 0, // Will be added when bookmark stats are needed
      categoryCounts: {},
      tagCloud: [],
      totalMemoriesSize: parseInt(String(countRow?.size || '0'), 10),
      lastUpdated: Date.now(),
    }

    // Process category counts
    if (categoryResult.rows) {
      for (const row of categoryResult.rows as Array<Record<string, unknown>>) {
        stats.categoryCounts[String(row.category)] = parseInt(String(row.count), 10)
      }
    }

    // Process tag cloud
    if (tagsResult.rows) {
      stats.tagCloud = (tagsResult.rows as Array<Record<string, unknown>>).map((row) => ({
        tag: String(row.tag),
        count: parseInt(String(row.count), 10),
      }))
    }

    return stats
  } catch (error) {
    console.error('[Memory] Failed to get stats:', error)
    throw error
  }
}

/**
 * Clear all memories
 */
export async function clearAllMemories(): Promise<void> {
  try {
    await executeQuery(`TRUNCATE TABLE ${TABLE_NAME}`)
    console.log('[Memory] Cleared all memories')
  } catch (error) {
    console.error('[Memory] Failed to clear memories:', error)
    throw error
  }
}

/**
 * Helper: Map database rows to Memory objects
 */
function mapDbRowsToMemories(rows: Record<string, unknown>[]): Memory[] {
  return rows.map(mapDbRowToMemory)
}

/**
 * Helper: Map single database row to Memory object
 */
function mapDbRowToMemory(row: Record<string, unknown>): Memory {
  return {
    id: String(row.id),
    content: String(row.content),
    fullContext: row.full_context ? String(row.full_context) : undefined,
    embedding: row.embedding ? parseEmbedding(row.embedding) : undefined,
    tags: (row.tags as string[]) || [],
    category: row.category ? (String(row.category) as 'fact' | 'instruction' | 'reference' | 'insight') : undefined,
    timestamp: Number(row.timestamp),
    sourceUrl: row.source_url ? String(row.source_url) : undefined,
    sourceMessageId: row.source_message_id ? String(row.source_message_id) : undefined,
    sourceChatId: row.source_chat_id ? String(row.source_chat_id) : undefined,
    sourceChatTitle: row.source_chat_title ? String(row.source_chat_title) : undefined,
    relevanceScore: row.relevance_score ? Number(row.relevance_score) : undefined,
    lastAccessed: row.last_accessed ? Number(row.last_accessed) : undefined,
    accessCount: row.access_count ? Number(row.access_count) : undefined,
  }
}

/**
 * Helper: Parse embedding from database format
 */
function parseEmbedding(embedding: unknown): number[] {
  if (typeof embedding === 'string') {
    try {
      const parsed = JSON.parse(embedding) as number[]
      console.log('[Memory] Parsed embedding from string:', parsed.length, 'dimensions')
      return parsed
    } catch (e) {
      console.warn('[Memory] Failed to parse embedding string:', e)
      return []
    }
  }
  if (Array.isArray(embedding)) {
    console.log('[Memory] Embedding already array:', (embedding as number[]).length, 'dimensions')
    return embedding as number[]
  }
  console.warn('[Memory] Unknown embedding type:', typeof embedding)
  return []
}
