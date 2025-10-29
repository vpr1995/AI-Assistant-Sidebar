/**
 * Bookmark Storage Module
 * Manages bookmarks using chrome.storage.local for fast, lightweight access
 */

import { BookmarkedMessage } from '../types/memory'
import { nanoid } from 'nanoid'

const STORAGE_KEY = 'bookmarks'
const MAX_BOOKMARKS = 500

/**
 * Bookmark a message
 */
export async function bookmarkMessage(
  message: Omit<BookmarkedMessage, 'id' | 'timestamp'>,
  note?: string
): Promise<BookmarkedMessage> {
  const bookmarks = await getBookmarks()

  // Check if already bookmarked
  const existing = bookmarks.find(
    (b) => b.sourceMessageId === message.sourceMessageId && b.sourceChatId === message.sourceChatId
  )
  if (existing) {
    return existing
  }

  const bookmark: BookmarkedMessage = {
    id: nanoid(),
    timestamp: Date.now(),
    note: note,
    ...message,
  }

  // Add to beginning of array (most recent first)
  bookmarks.unshift(bookmark)

  // Keep only the most recent bookmarks
  if (bookmarks.length > MAX_BOOKMARKS) {
    bookmarks.pop()
  }

  await saveBookmarks(bookmarks)
  console.log(`[Bookmark] Bookmarked message: ${bookmark.id}`)
  return bookmark
}

/**
 * Remove a bookmark
 */
export async function removeBookmark(bookmarkId: string): Promise<void> {
  const bookmarks = await getBookmarks()
  const filtered = bookmarks.filter((b) => b.id !== bookmarkId)

  if (filtered.length === bookmarks.length) {
    console.warn(`[Bookmark] Bookmark not found: ${bookmarkId}`)
    return
  }

  await saveBookmarks(filtered)
  console.log(`[Bookmark] Removed bookmark: ${bookmarkId}`)
}

/**
 * Get all bookmarks (most recent first)
 */
export async function getBookmarks(): Promise<BookmarkedMessage[]> {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEY)
    const bookmarks = (data[STORAGE_KEY] as BookmarkedMessage[]) || []
    return bookmarks.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('[Bookmark] Failed to get bookmarks:', error)
    return []
  }
}

/**
 * Get bookmarks by tag
 */
export async function getBookmarksByTag(tag: string): Promise<BookmarkedMessage[]> {
  const bookmarks = await getBookmarks()
  return bookmarks.filter((b) => b.tags.includes(tag))
}

/**
 * Get bookmarks from a specific chat
 */
export async function getBookmarksByChat(chatId: string): Promise<BookmarkedMessage[]> {
  const bookmarks = await getBookmarks()
  return bookmarks.filter((b) => b.sourceChatId === chatId)
}

/**
 * Get bookmarks by tags (match any tag)
 */
export async function getBookmarksByTags(tags: string[]): Promise<BookmarkedMessage[]> {
  const bookmarks = await getBookmarks()
  return bookmarks.filter((b) => b.tags.some((tag) => tags.includes(tag)))
}

/**
 * Update a bookmark
 */
export async function updateBookmark(
  bookmarkId: string,
  updates: Partial<BookmarkedMessage>
): Promise<BookmarkedMessage | null> {
  const bookmarks = await getBookmarks()
  const index = bookmarks.findIndex((b) => b.id === bookmarkId)

  if (index === -1) {
    console.warn(`[Bookmark] Bookmark not found: ${bookmarkId}`)
    return null
  }

  // Filter out undefined values from updates
  const safeUpdates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      safeUpdates[key] = value
    }
  }

  bookmarks[index] = {
    ...bookmarks[index],
    ...safeUpdates,
    id: bookmarkId, // Prevent ID modification
  } as BookmarkedMessage

  await saveBookmarks(bookmarks)
  console.log(`[Bookmark] Updated bookmark: ${bookmarkId}`)
  return bookmarks[index]
}

/**
 * Add tag to a bookmark
 */
export async function addTagToBookmark(bookmarkId: string, tag: string): Promise<boolean> {
  const bookmarks = await getBookmarks()
  const bookmark = bookmarks.find((b) => b.id === bookmarkId)

  if (!bookmark) {
    return false
  }

  if (!bookmark.tags.includes(tag)) {
    bookmark.tags.push(tag)
    await saveBookmarks(bookmarks)
  }

  return true
}

/**
 * Remove tag from a bookmark
 */
export async function removeTagFromBookmark(bookmarkId: string, tag: string): Promise<boolean> {
  const bookmarks = await getBookmarks()
  const bookmark = bookmarks.find((b) => b.id === bookmarkId)

  if (!bookmark) {
    return false
  }

  const index = bookmark.tags.indexOf(tag)
  if (index > -1) {
    bookmark.tags.splice(index, 1)
    await saveBookmarks(bookmarks)
  }

  return true
}

/**
 * Search bookmarks by content
 */
export async function searchBookmarks(query: string): Promise<BookmarkedMessage[]> {
  const bookmarks = await getBookmarks()
  const lowerQuery = query.toLowerCase()

  return bookmarks.filter((b) => {
    return (
      b.content.toLowerCase().includes(lowerQuery) ||
      (b.note && b.note.toLowerCase().includes(lowerQuery)) ||
      b.sourceChatTitle.toLowerCase().includes(lowerQuery)
    )
  })
}

/**
 * Get bookmark statistics
 */
export async function getBookmarkStats(): Promise<{
  total: number
  byChat: Record<string, number>
  tagCloud: Array<{ tag: string; count: number }>
}> {
  const bookmarks = await getBookmarks()

  const byChat: Record<string, number> = {}
  const tagCounts: Record<string, number> = {}

  for (const bookmark of bookmarks) {
    // Count by chat
    byChat[bookmark.sourceChatId] = (byChat[bookmark.sourceChatId] || 0) + 1

    // Count by tag
    for (const tag of bookmark.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    }
  }

  const tagCloud = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  return {
    total: bookmarks.length,
    byChat,
    tagCloud,
  }
}

/**
 * Clear all bookmarks
 */
export async function clearAllBookmarks(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: [] })
  console.log('[Bookmark] Cleared all bookmarks')
}

/**
 * Export bookmarks to JSON
 */
export async function exportBookmarks(): Promise<string> {
  const bookmarks = await getBookmarks()
  return JSON.stringify(bookmarks, null, 2)
}

/**
 * Import bookmarks from JSON
 */
export async function importBookmarks(jsonData: string): Promise<number> {
  try {
    const imported = JSON.parse(jsonData) as BookmarkedMessage[]
    const existing = await getBookmarks()

    // Merge, avoiding duplicates
    const merged = [...existing]
    for (const bookmark of imported) {
      const exists = merged.find((b) => b.id === bookmark.id)
      if (!exists) {
        merged.push(bookmark)
      }
    }

    // Keep only the most recent
    if (merged.length > MAX_BOOKMARKS) {
      merged.sort((a, b) => b.timestamp - a.timestamp)
      merged.splice(MAX_BOOKMARKS)
    }

    await saveBookmarks(merged)
    console.log(`[Bookmark] Imported ${imported.length} bookmarks`)
    return imported.length
  } catch (error) {
    console.error('[Bookmark] Failed to import bookmarks:', error)
    throw error
  }
}

/**
 * Helper: Save bookmarks to storage
 */
async function saveBookmarks(bookmarks: BookmarkedMessage[]): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: bookmarks })
  } catch (error) {
    console.error('[Bookmark] Failed to save bookmarks:', error)
    throw error
  }
}
