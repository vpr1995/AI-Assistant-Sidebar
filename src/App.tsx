import { useState, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { doesBrowserSupportBuiltInAI, type BuiltInAIUIMessage } from '@built-in-ai/core'
import { ClientSideChatTransport } from '@/lib/client-side-chat-transport'
import { Chat } from '@/components/ui/chat'
import type { Message } from '@/components/ui/chat-message'
import './App.css'

// Convert BuiltInAIUIMessage to the Message format expected by Chat component
function convertToMessage(uiMessage: BuiltInAIUIMessage): Message {
  // Extract text content from parts
  const textContent = uiMessage.parts
    ?.filter((part) => part.type === 'text')
    .map((part) => (part as { type: 'text'; text: string }).text)
    .join('') || ''

  return {
    id: uiMessage.id,
    role: uiMessage.role,
    content: textContent,
  }
}

function App() {
  const [browserSupportsAI, setBrowserSupportsAI] = useState<boolean | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [input, setInput] = useState('')

  // Check browser support only on client side
  useEffect(() => {
    setIsClient(true)
    setBrowserSupportsAI(doesBrowserSupportBuiltInAI())
  }, [])

  const { status, sendMessage, messages: rawMessages, stop } =
    useChat<BuiltInAIUIMessage>({
      transport: new ClientSideChatTransport(),
      onError(error: Error) {
        console.error('Chat error:', error)
        alert(`Error: ${error.message}\n\nPlease make sure:\n1. You're using Chrome 128+ or Edge Dev 138+\n2. Enable chrome://flags/#prompt-api-for-gemini-nano\n3. Reload the extension`)
      },
      experimental_throttle: 50,
    })

  // Convert messages to the format expected by Chat component
  const messages = rawMessages.map(convertToMessage)

  const isLoading = status === 'submitted' || status === 'streaming'

  const handleSubmit = (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.()
    
    if (!input.trim()) return

    sendMessage({ text: input })
    setInput('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const append = (message: { role: 'user'; content: string }) => {
    sendMessage({ text: message.content })
    setInput('')
  }

  // Show loading state until client-side check completes
  if (!isClient) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="sidebar-container">
      {/* Header Section (Fixed Top) */}
      <header className="sidebar-header">
        <div className="flex items-center gap-2">
          <div className="status-indicator"></div>
          <span className="font-medium">
            {browserSupportsAI ? 'Built-in AI' : 'AI Not Available'}
          </span>
        </div>
        <button 
          className="reset-button" 
          onClick={() => window.location.reload()}
        >
          Reset
        </button>
      </header>

      {/* Warning when AI is not supported */}
      {!browserSupportsAI && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Built-in AI is not available. Please:
          </p>
          <ol className="text-xs text-yellow-700 dark:text-yellow-300 mt-2 ml-4 space-y-1">
            <li>1. Use Chrome 128+ or Edge Dev 138+</li>
            <li>2. Enable <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">chrome://flags/#prompt-api-for-gemini-nano</code></li>
            <li>3. Reload this extension</li>
          </ol>
        </div>
      )}

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
          suggestions={[
            "What is the weather in San Francisco?",
            "Explain step-by-step how to solve this math problem: If x² + 6x + 9 = 25, what is x?",
            "Design a simple algorithm to find the longest palindrome in a string.",
          ]}
        />
      </div>
    </div>
  )
}

export default App
