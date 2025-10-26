/**
 * Type definitions for chat persistence
 */

import { BuiltInAIUIMessage } from "@built-in-ai/core"
import { TransformersUIMessage } from "@built-in-ai/transformers-js"
import { WebLLMUIMessage } from "@built-in-ai/web-llm"

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

export interface ModelDownloadProgress {
  status: "downloading" | "extracting" | "complete"
  progress: number
  message: string
}

export interface Attachment { url: string; name: string; contentType: string }

// Unified message type supporting all three providers
export type UIMessage = BuiltInAIUIMessage | WebLLMUIMessage | TransformersUIMessage

export type AIProvider = 'built-in-ai' | 'web-llm' | 'transformers-js' | null