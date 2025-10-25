/**
 * New Chat Dialog Component
 * Dialog for creating a new chat with title input
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewChatDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (title?: string) => Promise<void>
  isLoading?: boolean
}

export function NewChatDialog({ isOpen, onClose, onCreate, isLoading = false }: NewChatDialogProps) {
  const [title, setTitle] = useState('')

  const handleCreate = async () => {
    await onCreate(title || undefined)
    setTitle('')
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleCreate()
    }
  }

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  }

  const dialogVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: { opacity: 0, scale: 0.95, y: -20 },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            variants={dialogVariants}
            className={cn(
              'bg-background border border-border rounded-lg shadow-lg',
              'w-full max-w-sm mx-4',
              'p-6'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Start a New Chat</h2>
              <button
                onClick={onClose}
                className={cn(
                  'p-1 rounded-md transition-colors duration-200',
                  'hover:bg-accent',
                  'focus:outline-none focus:ring-2 focus:ring-ring'
                )}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Input */}
            <div className="mb-6">
              <label htmlFor="chat-title" className="block text-sm font-medium mb-2">
                Chat Title (optional)
              </label>
              <input
                id="chat-title"
                type="text"
                placeholder="e.g., Project Planning"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className={cn(
                  'w-full px-3 py-2 rounded-md border border-input',
                  'bg-background text-foreground placeholder-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'dark:focus:ring-offset-background',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all duration-200'
                )}
              />
              <p className="text-xs text-muted-foreground mt-1">
                If not provided, the first message will be used as title
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                disabled={isLoading}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium',
                  'border border-input hover:bg-accent',
                  'transition-colors duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isLoading}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium',
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                  'transition-colors duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center gap-2'
                )}
              >
                {isLoading && (
                  <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                )}
                {isLoading ? 'Creating...' : 'Create Chat'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
