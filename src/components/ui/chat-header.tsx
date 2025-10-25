/**
 * Chat Header Component
 * Displays current chat info and new chat button in the header
 */

import { Plus, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ChatHeaderProps {
  currentChatTitle: string | null
  onNewChat: () => void
  onShowChats: () => void
}

export function ChatHeader({
  currentChatTitle,
  onNewChat,
  onShowChats,
}: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-background">
      {/* Title Section */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {currentChatTitle || 'New Chat'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className={cn(
            'p-1.5 rounded-md transition-all duration-200',
            'hover:bg-accent hover:text-accent-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'dark:focus:ring-offset-background'
          )}
          title="New Chat"
          aria-label="New Chat"
        >
          <Plus className="h-4 w-4" />
        </button>

        {/* Chat List Dropdown Trigger */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={cn(
            'p-1.5 rounded-md transition-all duration-200',
            'hover:bg-accent hover:text-accent-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'dark:focus:ring-offset-background',
            showMenu && 'bg-accent text-accent-foreground'
          )}
          title="Show chats"
          aria-label="Show chats"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', showMenu && 'rotate-180')} />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              className={cn(
                'absolute top-full right-4 mt-2 bg-popover border border-border rounded-md',
                'shadow-md z-50 min-w-[200px]'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  onShowChats()
                  setShowMenu(false)
                }}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors duration-200',
                  'rounded-md m-1'
                )}
              >
                View all chats
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
