/**
 * MemoryPanel Component
 * Displays and manages saved memories with search
 */

import { useState } from 'react'
import { X, Trash2, Search } from 'lucide-react'
import { Button } from './button'
import { useMemories } from '../../hooks/use-memories'
import { cn } from '../../lib/utils'

interface MemoryPanelProps {
  onClose?: () => void
  className?: string
}

export function MemoryPanel({ onClose, className }: MemoryPanelProps) {
  const { memories, deleteMemory, searchResults, isSearching, searchMemories, clearSearch } =
    useMemories()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isSearchActive, setIsSearchActive] = useState(false)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    setIsSearchActive(true)
    if (query.trim()) {
      await searchMemories(query)
    } else {
      clearSearch()
      setIsSearchActive(false)
    }
  }

  const displayItems = isSearchActive ? searchResults : memories

  return (
    <div className={cn('flex flex-col h-full bg-background border-l', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold">Memories {displayItems.length > 0 && `(${displayItems.length})`}</h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {isSearchActive && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSearchQuery('')
                setIsSearchActive(false)
                clearSearch()
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Info Message */}
      {isSearchActive && (
        <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50">
          {isSearching ? 'Searching...' : `Found ${displayItems.length} results`}
        </div>
      )}

      {/* Memories List */}
      <div className="flex-1 overflow-y-auto">
        {displayItems.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">
            {memories.length === 0
              ? 'No memories yet. Conversations will be saved as memories!'
              : isSearchActive
                ? 'No memories match your search.'
                : 'Search to find memories.'}
          </div>
        ) : (
          <div className="divide-y">
            {displayItems.map((memory) => (
              <div
                key={memory.id}
                className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setExpandedId(expandedId === memory.id ? null : memory.id)}
              >
                {/* Preview */}
                <div className="flex gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {memory.category || 'Reference'} • {memory.sourceChatTitle || 'Unknown'}
                    </p>
                    <p className="text-sm line-clamp-2">{memory.content}</p>
                    {memory.sourceUrl && (
                      <a
                        href={memory.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-500 hover:text-blue-600 hover:underline mt-1 inline-block truncate max-w-full"
                      >
                        From: {new URL(memory.sourceUrl).hostname}
                      </a>
                    )}
                    {memory.relevanceScore !== undefined && isSearchActive && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {(memory.relevanceScore * 100).toFixed(0)}% relevant
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteMemory(memory.id)
                    }}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {/* Expanded View */}
                {expandedId === memory.id && (
                  <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                    {/* Full Content */}
                    <div>
                      <p className="font-medium mb-1 text-xs">Content:</p>
                      <p className="bg-muted/50 p-2 rounded max-h-32 overflow-y-auto text-xs">
                        {memory.content}
                      </p>
                    </div>

                    {/* Source URL */}
                    {memory.sourceUrl && (
                      <div>
                        <p className="font-medium mb-1 text-xs">Source:</p>
                        <a
                          href={memory.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-blue-500 hover:text-blue-600 hover:underline block break-all"
                        >
                          {memory.sourceUrl}
                        </a>
                      </div>
                    )}

                    {/* Full Context */}
                    {memory.fullContext && (
                      <div>
                        <p className="font-medium mb-1 text-xs">Context:</p>
                        <p className="bg-muted/50 p-2 rounded max-h-32 overflow-y-auto text-xs whitespace-pre-wrap">
                          {memory.fullContext}
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    {memory.tags.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-xs">Tags:</p>
                        <div className="flex flex-wrap gap-1">
                          {memory.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 rounded text-xs bg-muted text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      <p>
                        {new Date(memory.timestamp).toLocaleDateString()} •{' '}
                        {memory.accessCount ? `Used ${memory.accessCount}x` : 'Never used'}
                      </p>
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
