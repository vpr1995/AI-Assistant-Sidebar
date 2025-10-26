/**
 * Custom hook for managing chat title editing state and handlers
 * Extracted from App.tsx to reduce complexity
 */

import { useState, useCallback } from 'react'
import type { Chat } from '@/types/chat'

export interface UseChatTitleEditorReturn {
  isEditingTitle: boolean
  editingTitle: string
  setEditingTitle: (title: string) => void
  handleStartTitleEdit: () => void
  handleSaveTitleEdit: () => Promise<void>
  handleCancelTitleEdit: () => void
  handleTitleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export function useChatTitleEditor(
  currentChat: Chat | null,
  updateCurrentChatTitle: (title: string) => Promise<void>
): UseChatTitleEditorReturn {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState('')

  // Handle starting title edit
  const handleStartTitleEdit = useCallback(() => {
    if (currentChat) {
      setEditingTitle(currentChat.title)
      setIsEditingTitle(true)
    }
  }, [currentChat])

  // Handle saving title edit
  const handleSaveTitleEdit = useCallback(async () => {
    const trimmedTitle = editingTitle.trim()
    if (trimmedTitle && trimmedTitle !== currentChat?.title) {
      try {
        await updateCurrentChatTitle(trimmedTitle)
      } catch (error) {
        console.error('[useChatTitleEditor] Error updating chat title:', error)
      }
    }
    setIsEditingTitle(false)
    setEditingTitle('')
  }, [editingTitle, currentChat?.title, updateCurrentChatTitle])

  // Handle canceling title edit
  const handleCancelTitleEdit = useCallback(() => {
    setIsEditingTitle(false)
    setEditingTitle('')
  }, [])

  // Handle title input key down
  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveTitleEdit()
    } else if (e.key === 'Escape') {
      handleCancelTitleEdit()
    }
  }, [handleSaveTitleEdit, handleCancelTitleEdit])

  return {
    isEditingTitle,
    editingTitle,
    setEditingTitle,
    handleStartTitleEdit,
    handleSaveTitleEdit,
    handleCancelTitleEdit,
    handleTitleKeyDown,
  }
}
