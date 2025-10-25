/**
 * ChatListItem Component
 * Displays a single chat in the sidebar with preview and actions
 */

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ChatListItem } from '@/types/chat'

interface ChatListItemProps {
  chat: ChatListItem
  isSelected: boolean
  onSelect: (chatId: string) => void
  onDelete: (chatId: string) => void
}

/**
 * Format timestamp to readable format
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

export function ChatListItemComponent({ chat, isSelected, onSelect, onDelete }: ChatListItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleDelete = () => {
    onDelete(chat.id)
    setShowDeleteConfirm(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={cn(
          'group relative p-3 mx-2 rounded-lg cursor-pointer transition-all duration-200',
          'hover:bg-accent hover:text-accent-foreground',
          isSelected && 'bg-primary text-primary-foreground',
          !isSelected && 'hover:bg-muted'
        )}
        onClick={() => !showDeleteConfirm && onSelect(chat.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium truncate">{chat.title}</h3>
            {chat.preview && (
              <p className="text-xs text-muted-foreground truncate mt-1">{chat.preview}</p>
            )}
            <p className="text-xs text-muted-foreground/70 mt-1">
              {formatTime(chat.updatedAt)}
            </p>
          </div>

          {/* Delete Button - Show on hover */}
          {isHovered && !showDeleteConfirm && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteConfirm(true)
              }}
              className={cn(
                'p-1 rounded hover:bg-destructive/20 hover:text-destructive',
                'transition-colors duration-200',
                'flex-shrink-0'
              )}
              aria-label="Delete chat"
            >
              <Trash2 className="h-4 w-4" />
            </motion.button>
          )}
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute inset-0 bg-destructive/10 rounded-lg flex items-center justify-end px-3 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteConfirm(false)
                }}
                className={cn(
                  'px-2 py-1 text-xs rounded',
                  'bg-muted hover:bg-muted/80',
                  'transition-colors duration-200'
                )}
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete()
                }}
                className={cn(
                  'px-2 py-1 text-xs rounded',
                  'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                  'transition-colors duration-200'
                )}
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
