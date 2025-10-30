/**
 * AppHeader Component - Header section of the sidebar with chat controls
 */

import { Plus, ChevronDown, Edit2, Brain, Bookmark } from 'lucide-react'
import { SettingsMenu } from './settings-menu'
import type { Chat } from '@/types/chat'

export interface AppHeaderProps {
  // Chat title state
  currentChat: Chat | null
  isEditingTitle: boolean
  editingTitle: string
  
  // Title edit handlers
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onTitleChange: (title: string) => void
  onTitleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  
  // Chat controls
  onNewChat: () => void
  showChatSidebar: boolean
  onToggleSidebar: () => void
  
  // Memory and bookmarks panel toggles
  onToggleMemoryPanel?: () => void
  onToggleBookmarksPanel?: () => void
}

export function AppHeader({
  currentChat,
  isEditingTitle,
  editingTitle,
  onStartEdit,
  onSaveEdit,
  onTitleChange,
  onTitleKeyDown,
  onNewChat,
  showChatSidebar,
  onToggleSidebar,
  onToggleMemoryPanel,
  onToggleBookmarksPanel,
}: AppHeaderProps) {
  return (
    <header className="sidebar-header">
      {/* Left: Chat Name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isEditingTitle ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={onTitleKeyDown}
            onBlur={onSaveEdit}
            className="font-medium text-sm bg-transparent border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring flex-1 min-w-0"
            autoFocus
            placeholder="Chat title..."
          />
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-medium text-sm truncate flex-1 min-w-0">
              {currentChat?.title || 'New Chat'}
            </span>
            {currentChat && (
              <button
                onClick={onStartEdit}
                className="flex-shrink-0 p-1 rounded-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-offset-background"
                title="Edit chat name"
                aria-label="Edit chat name"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: Chat Controls + Settings */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Memory Panel Button */}
        {onToggleMemoryPanel && (
          <button
            id="memory-panel-button"
            onClick={onToggleMemoryPanel}
            className="p-1.5 rounded-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-offset-background"
            title="Toggle Memory Panel"
            aria-label="Toggle Memory Panel"
          >
            <Brain className="h-4 w-4" />
          </button>
        )}

        {/* Bookmarks Panel Button */}
        {onToggleBookmarksPanel && (
          <button
            id="bookmarks-panel-button"
            onClick={onToggleBookmarksPanel}
            className="p-1.5 rounded-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-offset-background"
            title="Toggle Bookmarks Panel"
            aria-label="Toggle Bookmarks Panel"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        )}

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="p-1.5 rounded-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-offset-background"
          title="New Chat"
          aria-label="New Chat"
        >
          <Plus className="h-4 w-4" />
        </button>

        {/* View Chats Dropdown Button */}
        <button
          id="chat-sidebar-button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-offset-background"
          title="View chats"
          aria-label="View chats"
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showChatSidebar ? 'rotate-180' : ''}`} />
        </button>

        {/* Settings Menu */}
        <SettingsMenu />
      </div>
    </header>
  )
}
