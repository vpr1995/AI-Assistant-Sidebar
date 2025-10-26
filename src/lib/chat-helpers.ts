/**
 * Helper functions for chat management
 */

import type { Chat } from '@/types/chat'

/**
 * Ensures a chat exists for the current operation.
 * If no chat is currently selected, creates a new one with the given title.
 * 
 * @param currentChatId - The currently selected chat ID (or null)
 * @param chatTitle - Title for the new chat if one needs to be created
 * @param createChat - Function to create a new chat
 * @param selectChat - Function to select a chat by ID
 * @returns The chat ID to use (either existing or newly created)
 */
export async function ensureChatExists(
  currentChatId: string | null,
  chatTitle: string,
  createChat: (title: string) => Promise<Chat>,
  selectChat: (id: string) => Promise<void>
): Promise<string> {
  if (currentChatId) {
    return currentChatId
  }

  console.log('[ensureChatExists] Creating new chat:', chatTitle)
  const newChat = await createChat(chatTitle)
  await selectChat(newChat.id)
  console.log('[ensureChatExists] Created and selected chat:', newChat.id)
  return newChat.id
}
