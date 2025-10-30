/**
 * ChatSidebar Component
 * Displays the list of chats and new chat button
 */

import { Plus } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChatListItemComponent } from '@/components/ui/chat-list-item'
import type { ChatListItem } from '@/types/chat'

interface ChatSidebarProps {
  chats: ChatListItem[]
  selectedChatId: string | null
  isLoading: boolean
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onExportChat?: (chatId: string) => void
}

export function ChatSidebar({
  chats,
  selectedChatId,
  isLoading,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onExportChat,
}: ChatSidebarProps) {
  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Button
          onClick={onNewChat}
          className="w-full gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading chats...
          </div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No chats yet. Start a new one!
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="py-2">
              {chats.map((chat) => (
                <ChatListItemComponent
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChatId === chat.id}
                  onSelect={onSelectChat}
                  onDelete={onDeleteChat}
                  onExport={onExportChat}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
