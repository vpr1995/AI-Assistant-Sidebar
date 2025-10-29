/**
 * BookmarksPanel Component
 * Displays and manages all bookmarked messages
 */

import { useState, useMemo } from 'react'
import { X, Trash2, Tag } from 'lucide-react'
import { Button } from './button'
import { useBookmarks } from '../../hooks/use-bookmarks'
import { cn } from '../../lib/utils'

interface BookmarksPanelProps {
  onClose?: () => void
  className?: string
  chatId?: string // If provided, only show bookmarks from this chat
  onSaveToMemories?: (content: string, sourceUrl?: string) => Promise<void>
}

export function BookmarksPanel({ onClose, className, chatId, onSaveToMemories }: BookmarksPanelProps) {
  const { bookmarks, removeBookmark, removeTag } = useBookmarks()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState<string | null>(null)

  // Filter bookmarks
  const filteredBookmarks = useMemo(() => {
    let filtered = chatId ? bookmarks.filter((b) => b.sourceChatId === chatId) : bookmarks

    if (selectedTag) {
      filtered = filtered.filter((b) => b.tags.includes(selectedTag))
    }

    if (searchQuery) {
      const lower = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.content.toLowerCase().includes(lower) ||
          b.note?.toLowerCase().includes(lower) ||
          b.sourceChatTitle.toLowerCase().includes(lower)
      )
    }

    return filtered
  }, [bookmarks, searchQuery, selectedTag, chatId])

  // Get unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const bookmark of bookmarks) {
      for (const tag of bookmark.tags) {
        tags.add(tag)
      }
    }
    return Array.from(tags).sort()
  }, [bookmarks])

  const handleRemove = async (id: string) => {
    await removeBookmark(id)
  }

  const handleRemoveTag = async (bookmarkId: string, tag: string) => {
    await removeTag(bookmarkId, tag)
  }

  const handleSaveToMemories = async (bookmark: typeof bookmarks[0]) => {
    if (!onSaveToMemories) {
      alert('Save to memories is not available')
      return
    }
    try {
      setIsSaving(bookmark.id)
      await onSaveToMemories(bookmark.content, bookmark.sourceUrl)
      alert('Bookmark saved to memories!')
      setExpandedId(null)
    } catch (error) {
      console.error('Error saving to memories:', error)
      alert('Failed to save to memories. Please try again.')
    } finally {
      setIsSaving(null)
    }
  }

  return (
    <div className={cn('flex flex-col h-full bg-background border-l', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold">
          Bookmarks {filteredBookmarks.length > 0 && `(${filteredBookmarks.length})`}
        </h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <input
          type="text"
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="p-3 border-b overflow-x-auto">
          <div className="flex gap-2">
            {allTags.slice(0, 10).map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={cn(
                  'px-2 py-1 rounded text-xs whitespace-nowrap transition-colors',
                  selectedTag === tag
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto">
        {filteredBookmarks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">
            {bookmarks.length === 0
              ? 'No bookmarks yet. Bookmark messages to save them!'
              : 'No bookmarks match your search or filter.'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setExpandedId(expandedId === bookmark.id ? null : bookmark.id)}
              >
                {/* Content Preview */}
                <div className="flex gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {bookmark.role === 'user' ? 'You' : 'Assistant'} • {bookmark.sourceChatTitle}
                    </p>
                    <p className="text-sm line-clamp-2">{bookmark.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(bookmark.id)
                    }}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {/* Expanded View */}
                {expandedId === bookmark.id && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    {/* Full Content */}
                    <div className="text-sm bg-muted/50 p-2 rounded max-h-32 overflow-y-auto">
                      {bookmark.content}
                    </div>

                    {/* Note */}
                    {bookmark.note && (
                      <div className="text-sm">
                        <p className="font-medium mb-1 text-xs">Note:</p>
                        <p className="text-muted-foreground">{bookmark.note}</p>
                      </div>
                    )}

                    {/* Save to Memories Button */}
                    {onSaveToMemories && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSaveToMemories(bookmark)
                        }}
                        disabled={isSaving === bookmark.id}
                        className="w-full"
                      >
                        {isSaving === bookmark.id ? 'Saving...' : '✨ Save to Memories'}
                      </Button>
                    )}

                    {/* Tags */}
                    <div>
                      <p className="font-medium mb-2 text-xs flex items-center gap-1">
                        <Tag className="h-3 w-3" /> Tags
                      </p>
                      {bookmark.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {bookmark.tags.map((tag) => (
                            <button
                              key={tag}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveTag(bookmark.id, tag)
                              }}
                              className="px-2 py-1 rounded text-xs bg-muted hover:bg-muted/80 transition-colors"
                            >
                              {tag} ×
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No tags</p>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground">
                      {new Date(bookmark.timestamp).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
