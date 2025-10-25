/**
 * Type definitions for chat persistence
 */

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface Chat {
  id: string
  title: string
  messages: ChatMessage[]
  preview?: string // First few words of the chat for display
  createdAt: number
  updatedAt: number
}

export interface ChatListItem {
  id: string
  title: string
  preview?: string
  updatedAt: number
}
