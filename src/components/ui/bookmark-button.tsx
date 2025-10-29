/**
 * BookmarkButton Component
 * Button to bookmark a message with visual feedback
 */

import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { Button } from './button'
import { useBookmarks } from '../../hooks/use-bookmarks'
import { cn } from '../../lib/utils'

interface BookmarkButtonProps {
  messageId: string
  chatId: string
  content: string
  role: 'user' | 'assistant'
  chatTitle: string
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'ghost' | 'outline' | 'secondary'
}

export function BookmarkButton({
  messageId,
  chatId,
  content,
  role,
  chatTitle,
  className,
  size = 'sm',
  variant = 'ghost',
}: BookmarkButtonProps) {
  const { bookmarks, bookmarkMessage, removeBookmark, isMessageBookmarked } = useBookmarks()
  const [isLoading, setIsLoading] = useState(false)
  const isBookmarked = isMessageBookmarked(messageId, chatId)

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      setIsLoading(true)

      if (isBookmarked) {
        // Find and remove bookmark
        const bookmark = bookmarks.find(
          (b) => b.sourceMessageId === messageId && b.sourceChatId === chatId
        )
        if (bookmark) {
          await removeBookmark(bookmark.id)
        }
      } else {
        // Create new bookmark
        await bookmarkMessage({
          content,
          role,
          sourceMessageId: messageId,
          sourceChatId: chatId,
          sourceChatTitle: chatTitle,
          tags: [],
        })
      }
    } catch (error) {
      console.error('[BookmarkButton] Failed to toggle bookmark:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleBookmark}
      disabled={isLoading}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this message'}
      className={cn('gap-2', className)}
    >
      {isBookmarked ? (
        <>
          <Bookmark className="h-4 w-4 fill-current" />
          <span className="sr-only">Remove bookmark</span>
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4" />
          <span className="sr-only">Bookmark</span>
        </>
      )}
    </Button>
  )
}
