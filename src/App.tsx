import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { toast } from 'sonner'
import { ClientSideChatTransport } from '@/lib/client-side-chat-transport'
import { Chat } from '@/components/ui/chat'
import { DownloadProgressDialog } from '@/components/ui/download-progress-dialog'
import { ChatSidebar } from '@/components/ui/chat-sidebar'
import { NewChatDialog } from '@/components/ui/new-chat-dialog'
import { AppHeader } from '@/components/ui/app-header'
import { ProviderStatusBanners } from '@/components/ui/provider-status-banners'
import { ScreenCapturePreviewDialog } from '@/components/ui/screen-capture-preview-dialog'
import { MemoryPanel } from '@/components/ui/memory-panel'
import { BookmarksPanel } from '@/components/ui/bookmarks-panel'
import { OnboardingModal } from '@/components/ui/onboarding-modal'
import { Toaster } from '@/components/ui/sonner'
import type { Message } from '@/components/ui/chat-message'
import { useChats } from '@/hooks/use-chats'
import { useAIProvider } from '@/hooks/use-ai-provider'
import { useChatTitleEditor } from '@/hooks/use-chat-title-editor'
import { useModelDownloadProgress } from '@/hooks/use-model-download-progress'
import { useChatPersistence } from '@/hooks/use-chat-persistence'
import { useChromeMessageListener } from '@/hooks/use-chrome-message-listener'
import { useScreenCapture } from '@/hooks/use-screen-capture'
import { useSelectedTools } from '@/hooks/use-selected-tools'
import { useOnboarding } from '@/hooks/use-onboarding'
import type { ToolSelection } from '@/lib/tools'
import type { Attachment, UIMessage } from '@/types/chat'
import { initializeDatabase } from '@/lib/migrations'
import { getChat } from '@/lib/chat-storage'
import './App.css'



// Convert UIMessage to the Message format expected by Chat component
function convertToMessage(uiMessage: UIMessage, attachments?: Map<string, { url: string; name: string; contentType: string }>): Message {
  // Extract text content from parts
  const textContent = uiMessage.parts
    ?.filter((part) => part.type === 'text')
    .map((part) => (part as { type: 'text'; text: string }).text)
    .join('') || ''

  // Check if this message has an attachment
  const attachment = attachments?.get(uiMessage.id)

  // Convert UI parts to Message parts
  const messageParts: unknown[] = []
  const toolInvocations: Array<{
    state: 'call' | 'result' | 'partial-call'
    toolName: string
    result?: unknown
  }> = []

  uiMessage.parts?.forEach((part) => {
    // Handle text parts (ignore state field if present)
    if (part.type === 'text') {
      messageParts.push({
        type: 'text',
        text: (part as { type: 'text'; text: string }).text
      })
    }
    // Handle reasoning parts
    else if (part.type === 'reasoning') {
      messageParts.push(part)
    }
    // Handle step markers (skip them)
    else if (part.type === 'step-start') {
      // Skip step-start markers - they're just structural markers
    }
    // Handle tool parts (type: "tool-{toolName}")
    else if (part.type.startsWith('tool-')) {
      const toolPart = part as {
        type: string
        toolCallId: string
        state: string
        input?: unknown
        output?: unknown
        providerExecuted?: boolean
      }
      
      const toolName = toolPart.type.replace('tool-', '')

      // Convert tool part state to ToolInvocation state
      let invocationState: 'call' | 'result' | 'partial-call' = 'call'
      if (toolPart.state === 'output-available' || toolPart.state === 'output-error') {
        invocationState = 'result'
      } else if (toolPart.state === 'input-streaming') {
        invocationState = 'partial-call'
      }

      const toolInvocation = {
        state: invocationState,
        toolName,
        input: toolPart.input, // Store input data
        isError: toolPart.state === 'output-error', // Add error flag
      } as { state: 'call' | 'result' | 'partial-call'; toolName: string; input?: unknown; result?: unknown; isError?: boolean }

      // Add result data if available
      if (toolPart.output) {
        toolInvocation.result = toolPart.output
      }

      toolInvocations.push(toolInvocation)

      // Also add to parts for component rendering
      messageParts.push({
        type: 'tool-invocation',
        toolInvocation
      })
    }
  })

  // Also check if toolInvocations exist directly on the message
  const messageToolInvocations = (uiMessage as { toolInvocations?: unknown[] }).toolInvocations
  if (messageToolInvocations) {
    console.log('[convertToMessage] Found toolInvocations directly on message:', messageToolInvocations)
    toolInvocations.push(...(messageToolInvocations as Array<{
      state: 'call' | 'result' | 'partial-call'
      toolName: string
      result?: unknown
    }>))
  }

  const result = {
    id: uiMessage.id,
    role: uiMessage.role,
    content: textContent,
    experimental_attachments: attachment ? [attachment] : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toolInvocations: toolInvocations.length > 0 ? (toolInvocations as any) : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parts: messageParts.length > 0 ? (messageParts as any) : undefined,
  }

  return result
}

function App() {
  // ====================
  // STATE & REFS
  // ====================
  const [input, setInput] = useState('')
  const [isSummarizeOrRewriteLoading, setIsSummarizeOrRewriteLoading] = useState(false)
  const [attachedImage, setAttachedImage] = useState<{ file: File; preview: string } | null>(null)
  const [messageAttachments, setMessageAttachments] = useState<Map<string, Attachment>>(new Map())
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null)
  const [dismissedWebLLMInfo, setDismissedWebLLMInfo] = useState(false)
  const [dismissedTransformersJSInfo, setDismissedTransformersJSInfo] = useState(false)

  // Chat UI state
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [showChatSidebar, setShowChatSidebar] = useState(false)

  // Memory and bookmarks panel state
  const [showMemoryPanel, setShowMemoryPanel] = useState(false)
  const [showBookmarksPanel, setShowBookmarksPanel] = useState(false)

  // Track if we've already auto-created a chat for current session
  const autoCreatedRef = useRef(false)

  // Screen capture state
  const screenCapture = useScreenCapture()

  // Onboarding state
  const onboarding = useOnboarding()

  // ====================
  // HOOKS & TRANSPORT
  // ====================
  // Initialize transport once (prevents double-init in React Strict Mode)
  const transport = useMemo(() => new ClientSideChatTransport('auto'), [])

  // Tool selection management - global state for persistence
  const { tools: globalTools, toggleTool: toggleGlobalTool } = useSelectedTools()

  // Per-message tool selection - resets for each new message
  const [messageTools, setMessageTools] = useState<ToolSelection>({})

  // Initialize messageTools from global tools on mount
  useEffect(() => {
    setMessageTools(globalTools)
  }, [globalTools])

  // Load global tool selection on mount (don't reset tools on input changes)
  // Tools persist across messages unless explicitly toggled by user
  // Also initialize the database
  useEffect(() => {
    // Initialize database on app startup
    initializeDatabase().catch((error) => {
      console.error('[App] Failed to initialize database:', error)
    })
  }, [])

  // Update transport with message-specific tools
  useEffect(() => {
    const toolIds = Object.entries(messageTools)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => id)
    transport.setSelectedTools(toolIds)
    console.log('[App] Message tools updated:', toolIds)
  }, [messageTools, transport])

  // Handle tool toggle for current message
  const handleToolChange = useCallback((toolId: string, enabled: boolean) => {
    setMessageTools((prev: ToolSelection) => ({
      ...prev,
      [toolId]: enabled
    }))
    // Also update global state for persistence
    toggleGlobalTool(toolId, enabled)
  }, [toggleGlobalTool])

  // Chat management
  const { chats, currentChat, isLoading: isChatsLoading, createChat, selectChat, updateCurrentChatMessages, updateCurrentChatTitle, deleteChatById } = useChats(currentChatId, setCurrentChatId)

  // AI Provider detection & management
  const { activeProvider, preferredProvider, availableProviders, setPreferredProvider, isClient } = useAIProvider(transport)

  // Model download progress tracking
  const { modelDownloadProgress } = useModelDownloadProgress(transport)

  // Chat title editing
  const {
    isEditingTitle,
    editingTitle,
    setEditingTitle,
    handleStartTitleEdit,
    handleSaveTitleEdit,
    handleCancelTitleEdit,
    handleTitleKeyDown
  } = useChatTitleEditor(currentChat, updateCurrentChatTitle)

  // useChat hook from Vercel AI SDK
  const { status, sendMessage, messages: rawMessages, stop, setMessages } = useChat<UIMessage>({
    transport: transport,
    onError(error: Error) {
      console.error('Chat error:', error)
      alert(`${activeProvider} Error: ${error.message}\n\nPlease try again or check the browser console for more details.`)
    },
    experimental_throttle: 50,
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Convert messages to the format expected by Chat component (memoized for performance)
  const messages = useMemo(
    () => rawMessages.map((msg) => convertToMessage(msg, messageAttachments)),
    [rawMessages, messageAttachments]
  )

  // Chat persistence (auto-save, load, auto-create)
  const { saveCurrentMessages } = useChatPersistence({
    currentChatId,
    currentChat,
    rawMessages,
    status,
    updateCurrentChatMessages,
    setMessages,
    createChat,
    selectChat
  })

  // Chrome messaging listener (summarizePage, rewriteText, summarizeYouTubeVideo)
  useChromeMessageListener({
    transport,
    setMessages,
    setIsSummarizeOrRewriteLoading,
    clearAttachedImage: () => setAttachedImage(null),
    createChat,
    selectChat,
    currentChatId,
    saveCurrentMessages,
    rawMessages
  })

  // Handle saving bookmark to memories
  const handleSaveBookmarkToMemories = useCallback(async (content: string, sourceUrl?: string) => {
    try {
      const { saveMemory } = await import('@/lib/memory-storage')
      const { getEmbedding } = await import('@/lib/embeddings')

      // Generate embedding for the content
      let embedding: number[] | undefined
      try {
        embedding = await getEmbedding(content)
        console.log('[App] Generated embedding for memory:', embedding.length, 'dimensions')
      } catch (embeddingError) {
        console.warn('[App] Failed to generate embedding, memory will be searchable by keyword only:', embeddingError)
        // Continue without embedding
      }

      // Save the bookmark as a memory
      await saveMemory({
        content,
        embedding,
        category: 'reference',
        tags: ['bookmarked-message', 'user-saved'],
        sourceUrl,
        sourceChatId: currentChatId || undefined,
        sourceChatTitle: currentChat?.title || 'Web Selection',
        timestamp: Date.now(),
      })

      toast.success('Bookmark saved to memories!')
    } catch (error) {
      console.error('[App] Error saving bookmark to memories:', error)
      toast.error('Failed to save to memories. Please try again.')
      throw error
    }
  }, [currentChatId, currentChat?.title])

  // Associate pending attachment with the latest user message
  useEffect(() => {
    if (pendingAttachment && rawMessages.length > 0) {
      // Find the latest user message
      const latestUserMessage = [...rawMessages].reverse().find(msg => msg.role === 'user')

      if (latestUserMessage && !messageAttachments.has(latestUserMessage.id)) {
        console.log('[App] Associating attachment with message:', latestUserMessage.id)
        setMessageAttachments(prev => {
          const newMap = new Map(prev)
          newMap.set(latestUserMessage.id, pendingAttachment)
          return newMap
        })
        setPendingAttachment(null)
      }
    }
  }, [rawMessages, pendingAttachment, messageAttachments])


  const handleSubmit = useCallback(async (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.()

    if (!input.trim() && !attachedImage) return

    const messageText = input.trim()
      ? input
      : (attachedImage ? '[Image attached for analysis]' : '')

    // If we have an image and built-in-ai is active, read it and pass with message
    if (attachedImage && activeProvider === 'built-in-ai') {
      try {
        // Read image as base64
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error('Failed to read image'))
          reader.readAsDataURL(attachedImage.file)
        })

        // Extract mediaType and base64
        const parts = dataUrl.split(',')
        const header = parts[0] || ''
        const base64Data = parts[1] || ''
        const mediaType = header.match(/data:([^;]+)/)?.[1] || 'image/png'

        // Store attachment for the next user message
        setPendingAttachment({
          url: dataUrl,
          name: attachedImage.file.name,
          contentType: mediaType
        })

        // Pass image data with the message via body option
        sendMessage({
          text: messageText
        }, {
          body: {
            imageAttachment: {
              mediaType,
              data: base64Data
            }
          }
        })
      } catch (error) {
        console.error('[App] Error reading image:', error)
        // Send without image on error
        sendMessage({ text: messageText })
      }
    } else {
      sendMessage({ text: messageText })
    }

    setInput('')
    // Clear image after sending
    setAttachedImage(null)
  }, [input, attachedImage, activeProvider, sendMessage])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }, [])

  // Handle screen capture confirmation - convert to image and set as attachment
  const handleScreenCaptureConfirm = useCallback(async () => {
    console.log('[App] Screen capture confirmed');
    if (!screenCapture.capturedImage) return

    try {
      // Convert base64 image to File object
      const base64Data = screenCapture.capturedImage.imageData.split(',')[1] || ''
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })

      const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' })

      // Set as attached image
      console.log('[App] Setting attached image');
      setAttachedImage({
        file,
        preview: screenCapture.capturedImage.imageData
      })

      // Close the preview dialog
      screenCapture.closeCaptureFlow()
      toast.success('Screenshot attached and ready to analyze');
    } catch (error) {
      console.error('[App] Error processing captured image:', error)
      toast.error('Failed to process screenshot')
      screenCapture.closeCaptureFlow()
    }
  }, [screenCapture])

  const append = useCallback((message: { role: 'user'; content: string }) => {
    sendMessage({ text: message.content })
    setInput('')
  }, [sendMessage])

  // Auto-create a new chat when user sends first message if no chat exists
  useEffect(() => {
    // Skip if we already auto-created or if a chat is selected
    if (autoCreatedRef.current || currentChatId) {
      return
    }

    // Check if user has sent a message but no chat exists
    const hasUserMessage = rawMessages.some(msg => msg.role === 'user')
    if (hasUserMessage && rawMessages.length > 0) {
      // Mark that we're auto-creating to prevent multiple creates
      autoCreatedRef.current = true

      // Auto-create a chat for this message
      const firstUserMessage = rawMessages.find(msg => msg.role === 'user')
      if (firstUserMessage) {
        const runAutoCreate = async () => {
          try {
            // Generate title from first user message (first 50 chars)
            const firstMessageText = firstUserMessage.parts
              ?.filter((p) => p.type === 'text')
              .map((p) => (p as { type: 'text'; text: string }).text)
              .join('')
              .substring(0, 50) || 'New Chat'

            const newChat = await createChat(firstMessageText)
            await selectChat(newChat.id)
            console.log('[App] Auto-created chat:', newChat.id)
          } catch (error) {
            console.error('[App] Error auto-creating chat:', error)
            autoCreatedRef.current = false // Reset on error to allow retry
          }
        }

        runAutoCreate()
      }
    }
  }, [rawMessages, currentChatId, createChat, selectChat])

  // Reset auto-create flag when manually selecting a different chat
  useEffect(() => {
    if (currentChatId) {
      autoCreatedRef.current = false
    }
  }, [currentChatId])

  // Show loading state until client-side check completes
  if (!isClient) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  const isAIAvailable = activeProvider !== null

  // Export a specific chat by ID
  const handleExportChatById = async (chatId: string) => {
    try {
      const chat = await getChat(chatId)
      if (!chat) {
        toast.error('Chat not found')
        return
      }
      exportChat(chat)
    } catch (error) {
      console.error('[App] Error exporting chat by ID:', error)
      toast.error('Failed to export conversation')
    }
  }

  // Helper function to export a chat
  const exportChat = (chat: Chat) => {
    try {
      const base = (chat.title || `chat-${chat.id}`)
        .replace(/[/\\?%*:|"<>]/g, '-')
        .trim()
        .replace(/\s+/g, ' ')

      const filename = `${base || `chat-${chat.id}`}.json`

      const payload = {
        exportedAt: Date.now(),
        chat: chat,
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success(`Exported conversation: ${filename}`)
    } catch (error) {
      console.error('[App] Error exporting chat:', error)
      toast.error('Failed to export conversation')
    }
  }

  return (
    <div className="sidebar-container flex flex-col h-screen">
      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={onboarding.isOnboarding}
        currentStep={onboarding.currentStep}
        currentStepIndex={onboarding.currentStepIndex}
        totalSteps={onboarding.totalSteps}
        onNext={onboarding.nextStep}
        onPrevious={onboarding.previousStep}
        onComplete={onboarding.completeOnboarding}
        onSkip={onboarding.skipOnboarding}
      />

      {/* Header Component */}
      <AppHeader
        currentChat={currentChat}
        isEditingTitle={isEditingTitle}
        editingTitle={editingTitle}
        onStartEdit={handleStartTitleEdit}
        onSaveEdit={handleSaveTitleEdit}
        onCancelEdit={handleCancelTitleEdit}
        onTitleChange={setEditingTitle}
        onTitleKeyDown={handleTitleKeyDown}
        onNewChat={() => setShowNewChatDialog(true)}
        showChatSidebar={showChatSidebar}
        onToggleSidebar={() => setShowChatSidebar(!showChatSidebar)}
        onToggleMemoryPanel={() => setShowMemoryPanel(!showMemoryPanel)}
        onToggleBookmarksPanel={() => setShowBookmarksPanel(!showBookmarksPanel)}
      />

      {/* Provider Status Banners */}
      <ProviderStatusBanners
        activeProvider={activeProvider}
        isAIAvailable={isAIAvailable}
        dismissedWebLLMInfo={dismissedWebLLMInfo}
        dismissedTransformersJSInfo={dismissedTransformersJSInfo}
        onDismissWebLLM={() => setDismissedWebLLMInfo(true)}
        onDismissTransformersJS={() => setDismissedTransformersJSInfo(true)}
      />

      {/* Model Download Progress Dialog */}
      <DownloadProgressDialog
        isOpen={modelDownloadProgress !== null}
        status={modelDownloadProgress?.status || "downloading"}
        progress={modelDownloadProgress?.progress || 0}
        message={modelDownloadProgress?.message || ""}
      />

      {/* Chat Container (Flex-1, Scrollable) */}
      <div className="sidebar-content">
        <Chat
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isGenerating={isLoading}
          stop={stop}
          append={append}
          showLoadingStatus={false}
          isSummarizeOrRewriteLoading={isSummarizeOrRewriteLoading}
          preferredProvider={preferredProvider}
          onProviderChange={(provider) => {
            console.log('[App] User selected provider:', provider)
            setPreferredProvider(provider)
          }}
          availableProviders={availableProviders}
          attachedImage={attachedImage}
          onAttachImage={setAttachedImage}
          onScreenCapture={screenCapture.capture}
          isCapturingScreen={screenCapture.isCapturing}
          selectedTools={messageTools}
          onToolChange={handleToolChange}
          messageOptions={(message) => ({
            messageId: message.id,
            chatId: currentChatId || '',
            chatTitle: currentChat?.title || 'Unknown Chat',
          })}
          suggestions={[
            'What is the weather in San Francisco?',
            'Explain step-by-step how to solve this math problem: If x² + 6x + 9 = 25, what is x?',
            'Design a simple algorithm to find the longest palindrome in a string.',
          ]}
        />
      </div>

      {/* Chat Sidebar Overlay */}
      {showChatSidebar && (
        <div className="absolute inset-0 bg-black/50 z-40" onClick={() => setShowChatSidebar(false)}>
          <ChatSidebar
            chats={chats}
            selectedChatId={currentChatId}
            isLoading={isChatsLoading}
            onNewChat={() => {
              setShowNewChatDialog(true)
              setShowChatSidebar(false)
            }}
            onSelectChat={async (chatId) => {
              await selectChat(chatId)
              setShowChatSidebar(false)
            }}
            onDeleteChat={(chatId) => deleteChatById(chatId)}
            onExportChat={handleExportChatById}
          />
        </div>
      )}

      {/* Memory Panel Overlay */}
      {showMemoryPanel && (
        <div
          className="absolute inset-0 bg-black/50 z-40"
          onClick={(e) => {
            // Only close if clicking on background, not on panel
            if (e.target === e.currentTarget) {
              setShowMemoryPanel(false)
            }
          }}
        >
          <MemoryPanel
            onClose={() => setShowMemoryPanel(false)}
          />
        </div>
      )}

      {/* Bookmarks Panel Overlay */}
      {showBookmarksPanel && (
        <div
          className="absolute inset-0 bg-black/50 z-40"
          onClick={(e) => {
            // Only close if clicking on background, not on panel
            if (e.target === e.currentTarget) {
              setShowBookmarksPanel(false)
            }
          }}
        >
          <BookmarksPanel
            chatId={currentChatId || ''}
            onClose={() => setShowBookmarksPanel(false)}
            onSaveToMemories={handleSaveBookmarkToMemories}
          />
        </div>
      )}

      {/* New Chat Dialog */}
      <NewChatDialog
        isOpen={showNewChatDialog}
        onClose={() => setShowNewChatDialog(false)}
        onCreate={async (title) => {
          try {
            // Clear messages immediately to prevent old messages from showing
            setMessages([])
            const newChat = await createChat(title)
            await selectChat(newChat.id)
            setShowNewChatDialog(false)
          } catch (error) {
            console.error('[App] Error creating new chat:', error)
          }
        }}
      />

      {/* Screen Capture Preview Dialog */}
      <ScreenCapturePreviewDialog
        isOpen={screenCapture.isPreviewOpen}
        capturedImage={screenCapture.capturedImage}
        onConfirm={handleScreenCaptureConfirm}
        onRetake={screenCapture.capture}
        onCancel={screenCapture.closeCaptureFlow}
      />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}

export default App

