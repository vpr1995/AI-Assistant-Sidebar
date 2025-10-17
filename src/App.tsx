import { useState, useEffect, useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import {
  doesBrowserSupportBuiltInAI,
  builtInAI,
  type BuiltInAIUIMessage,
} from '@built-in-ai/core'
import {
  doesBrowserSupportWebLLM,
  type WebLLMUIMessage,
} from '@built-in-ai/web-llm'
import { ClientSideChatTransport } from '@/lib/client-side-chat-transport'
import { Chat } from '@/components/ui/chat'
import { ProviderSelector } from '@/components/ui/provider-selector'
import type { Message } from '@/components/ui/chat-message'
import './App.css'

// Unified message type supporting both providers
type UIMessage = BuiltInAIUIMessage | WebLLMUIMessage

/**
 * Detects which AI provider is available and configured
 * Priority: Built-in AI > WebLLM
 */
async function detectActiveProvider(): Promise<'built-in-ai' | 'web-llm' | null> {
  console.log('[App] Detecting active provider...')
  
  if (doesBrowserSupportBuiltInAI()) {
    console.log('[App] Browser supports Built-in AI API')
    const model = builtInAI()
    const availability = await model.availability()
    console.log('[App] Built-in AI availability:', availability)
    
    if (availability !== 'unavailable') {
      console.log('[App] ✓ Using Built-in AI provider')
      return 'built-in-ai'
    }
    console.log('[App] Built-in AI is unavailable, falling back to WebLLM')
  } else {
    console.log('[App] Browser does NOT support Built-in AI API')
  }

  if (doesBrowserSupportWebLLM()) {
    console.log('[App] Browser supports WebLLM')
    console.log('[App] ✓ Using WebLLM provider')
    return 'web-llm'
  }
  
  console.log('[App] Browser does NOT support WebLLM')
  console.warn('[App] ✗ No AI providers available!')
  return null
}

// Convert UIMessage to the Message format expected by Chat component
function convertToMessage(uiMessage: UIMessage): Message {
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
  const [activeProvider, setActiveProvider] = useState<
    'built-in-ai' | 'web-llm' | null
  >(null)
  const [preferredProvider, setPreferredProvider] = useState<
    'built-in-ai' | 'web-llm' | 'auto'
  >('auto')
  const [availableProviders, setAvailableProviders] = useState<
    ('built-in-ai' | 'web-llm')[]
  >([])
  const [isClient, setIsClient] = useState(false)
  const [input, setInput] = useState('')
  
  // Initialize transport once using useMemo to ensure it's available during render
  // useMemo prevents the double-initialization issue in React Strict Mode
  const transport = useMemo(
    () => new ClientSideChatTransport('auto'),
    []
  )

  // Detect active provider on client side only
  useEffect(() => {
    console.log('[App] Component mounted, detecting provider...')
    setIsClient(true)
    
    // Set up callback to track provider changes
    transport.onProviderChange((provider) => {
      console.log('[App] Provider changed to:', provider)
      setActiveProvider(provider)
    })
    
    // Initialize available providers
    const checkAvailableProviders = async () => {
      const available: ('built-in-ai' | 'web-llm')[] = []
      
      if (doesBrowserSupportBuiltInAI()) {
        const model = builtInAI()
        const availability = await model.availability()
        if (availability !== 'unavailable') {
          available.push('built-in-ai')
        }
      }
      
      if (doesBrowserSupportWebLLM()) {
        available.push('web-llm')
      }
      
      console.log('[App] Available providers:', available)
      setAvailableProviders(available)
      
      // Default to Built-in AI if available, otherwise auto
      if (available.includes('built-in-ai')) {
        console.log('[App] Defaulting to Built-in AI')
        setPreferredProvider('built-in-ai')
      }
    }
    
    checkAvailableProviders().then(() => {
      detectActiveProvider().then((provider) => {
        console.log('[App] Provider detection complete:', provider)
        setActiveProvider(provider)
      })
    })
  }, [transport])

  // Update transport's preferred provider when it changes
  useEffect(() => {
    console.log('[App] Preferred provider changed to:', preferredProvider)
    transport.setPreferredProvider(preferredProvider)
  }, [preferredProvider, transport])

  const { status, sendMessage, messages: rawMessages, stop, setMessages } = useChat<UIMessage>({
    transport: transport,
    onError(error: Error) {
      console.error('Chat error:', error)
      const providerInfo =
        activeProvider === 'built-in-ai'
          ? 'Chrome Built-in AI'
          : activeProvider === 'web-llm'
            ? 'WebLLM'
            : 'AI'
      alert(
        `${providerInfo} Error: ${error.message}\n\nPlease try again or check the browser console for more details.`
      )
    },
    experimental_throttle: 50,
  })

  // Listen for page summarization requests from background script
  useEffect(() => {
    // Check if chrome.runtime is available (it won't be during local dev with vite dev server)
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) {
      console.log('[App] chrome.runtime not available, skipping message listener (normal in dev mode)');
      return;
    }

    const handleMessage = async (
      message: { action: string; data?: { title: string; content: string; url: string; excerpt: string; byline: string; siteName: string } }
    ) => {
      if (message.action === 'summarizePage' && message.data) {
        console.log('[App] Received summarize page request:', message.data);
        
        try {
          // Clear existing messages when starting a new summarization
          setMessages([]);
          
          // Create user message with title and URL
          const userMessageId = `user-${Date.now()}`;
          const userMessage: UIMessage = {
            id: userMessageId,
            role: 'user',
            parts: [{
              type: 'text',
              text: `Summarize: **${message.data.title}**\n${message.data.url}`
            }]
          };
          
          // Add user message to chat immediately
          setMessages((prevMessages) => [...prevMessages, userMessage]);
          
          // Prepare summarization prompt for AI (this includes the content but won't be visible)
          const summarizationPrompt = `Please provide a concise summary of the following web page:

Title: ${message.data.title}
URL: ${message.data.url}
${message.data.byline ? `Author: ${message.data.byline}\n` : ''}
Content:
${message.data.content.slice(0, 8000)}${message.data.content.length > 8000 ? '\n\n[Content truncated for length]' : ''}

Provide a clear, well-structured summary focusing on the main points and key information.`;

          // Create an AI message that will be updated as streaming happens
          const aiMessageId = `assistant-${Date.now()}`;
          let aiMessage: UIMessage = {
            id: aiMessageId,
            role: 'assistant',
            parts: [{
              type: 'text',
              text: ''
            }]
          };
          
          // Add empty AI message
          setMessages((prevMessages) => [...prevMessages, aiMessage]);
          
          // Stream the response and update the AI message
          await transport.streamSummary(summarizationPrompt, (chunk: string) => {
            // Update the AI message with accumulated text
            aiMessage = {
              ...aiMessage,
              parts: [{
                type: 'text',
                text: (aiMessage.parts[0] as { type: 'text'; text: string }).text + chunk
              }]
            };
            
            // Update messages array
            setMessages((prevMessages) => {
              const messages = [...prevMessages];
              const lastIndex = messages.length - 1;
              if (lastIndex >= 0 && messages[lastIndex] && messages[lastIndex].id === aiMessageId) {
                messages[lastIndex] = aiMessage;
              }
              return messages;
            });
          });
          
        } catch (error) {
          console.error('[App] Error summarizing page:', error);
          alert('Failed to summarize page. Please try again.');
        }
      }
    };

    // Add listener
    chrome.runtime.onMessage.addListener(handleMessage);

    // Cleanup
    return () => {
      if (chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(handleMessage);
      }
    };
  }, [transport, setMessages]);

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

  const getProviderLabel = (): string => {
    if (activeProvider === 'built-in-ai') {
      return 'Chrome Built-in AI'
    }
    if (activeProvider === 'web-llm') {
      return 'WebLLM (Local)'
    }
    return 'AI Not Available'
  }

  const isAIAvailable = activeProvider !== null

  return (
    <div className="sidebar-container">
      {/* Header Section (Fixed Top) */}
      <header className="sidebar-header">
        <div className="flex items-center gap-2 flex-1">
          <div className="status-indicator"></div>
          <span className="font-medium text-sm">{getProviderLabel()}</span>
        </div>
        <ProviderSelector
          value={preferredProvider}
          onChange={(provider) => {
            console.log('[App] User selected provider:', provider)
            setPreferredProvider(provider)
          }}
          availableProviders={availableProviders}
          className="mr-2"
        />
        <button
          className="reset-button"
          onClick={() => window.location.reload()}
        >
          Reset
        </button>
      </header>

      {/* Warning when AI is not available */}
      {!isAIAvailable && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
            ⚠️ No AI providers available
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
            Please ensure your browser supports either Chrome Built-in AI or
            WebLLM.
          </p>
        </div>
      )}

      {/* Info message for WebLLM fallback */}
      {activeProvider === 'web-llm' && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            ℹ️ Using WebLLM with local model. First response may take longer as
            the model downloads.
          </p>
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
          showLoadingStatus={activeProvider === 'web-llm'}
          suggestions={[
            'What is the weather in San Francisco?',
            'Explain step-by-step how to solve this math problem: If x² + 6x + 9 = 25, what is x?',
            'Design a simple algorithm to find the longest palindrome in a string.',
          ]}
        />
      </div>
    </div>
  )
}

export default App
