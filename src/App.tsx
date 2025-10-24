import { useState, useEffect, useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { X } from 'lucide-react'
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
import { SettingsMenu } from '@/components/ui/settings-menu'
import { DownloadProgressDialog } from '@/components/ui/download-progress-dialog'
import type { Message } from '@/components/ui/chat-message'
import { summarizeWithFallback } from '@/lib/summarizer-utils'
import { getRewritePrompt, formatRewriteUserMessage, type RewriteTone } from '@/lib/rewrite-utils'
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
  const [modelDownloadProgress, setModelDownloadProgress] = useState<{
    status: "downloading" | "extracting" | "complete"
    progress: number
    message: string
  } | null>(null)
  const [dismissedWebLLMInfo, setDismissedWebLLMInfo] = useState(false)
  const [isSummarizeOrRewriteLoading, setIsSummarizeOrRewriteLoading] = useState(false)
  
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

  // Set up download progress callback on transport
  useEffect(() => {
    transport.onDownloadProgress((progress) => {
      console.log('[App] Download progress:', progress)
      setModelDownloadProgress({
        status: progress.status as "downloading" | "extracting" | "complete",
        progress: progress.progress,
        message: progress.message,
      })
      
      // Auto-dismiss after 1 second when complete
      if (progress.status === 'complete') {
        setTimeout(() => {
          setModelDownloadProgress(null)
        }, 1000)
      }
    })
  }, [transport])

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

  const isLoading = status === 'submitted' || status === 'streaming'

  // Convert messages to the format expected by Chat component
  const messages = rawMessages.map(convertToMessage)

  // Signal to background script that sidebar is ready to receive messages
  useEffect(() => {
    // Check if chrome.runtime is available
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      console.log('[App] chrome.runtime not available, skipping ready signal (normal in dev mode)');
      return;
    }

    // Send a ready signal to the background script
    // This ensures background.ts knows the sidebar is ready to receive messages
    try {
      chrome.runtime.sendMessage({ action: 'sidebarReady' });
      console.log('[App] Sent ready signal to background script');
    } catch {
      console.log('[App] Could not send ready signal (normal if background script not listening)');
    }
  }, []);

  // Listen for page summarization requests from background script
  useEffect(() => {
    // Check if chrome.runtime is available (it won't be during local dev with vite dev server)
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) {
      console.log('[App] chrome.runtime not available, skipping message listener (normal in dev mode)');
      return;
    }

    const handleMessage = async (
      message: { 
        action: string
        data?: { 
          title?: string
          content?: string
          url?: string
          excerpt?: string
          byline?: string
          siteName?: string
          originalText?: string
          tone?: RewriteTone
        }
      }
    ) => {
      if (message.action === 'summarizePage' && message.data) {
        console.log('[App] Received summarize page request:', message.data);
        
        try {
          const { title = '', content = '', url = '', byline = '' } = message.data;
          
          // Clear existing messages when starting a new summarization
          setMessages([]);
          
          // Set loading state to show typing indicator
          setIsSummarizeOrRewriteLoading(true);
          
          // Create user message with title and URL
          const userMessageId = `user-${Date.now()}`;
          const userMessage: UIMessage = {
            id: userMessageId,
            role: 'user',
            parts: [{
              type: 'text',
              text: `Summarize: **${title}**\n${url}`
            }]
          };
          
          // Add user message to chat immediately
          setMessages((prevMessages) => [...prevMessages, userMessage]);
          
          // Prepare summarization prompt for AI (this includes the content but won't be visible)
          const summarizationPrompt = `Please provide a concise summary of the following web page:

Title: ${title}
URL: ${url}
${byline ? `Author: ${byline}\n` : ''}
Content:
${content.slice(0, 15000)}${content.length > 15000 ? '\n\n[Content truncated for length]' : ''}

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
          
          // Use Chrome Summarizer API with fallback to LLM transport
          const summarizerProvider = await summarizeWithFallback(
            summarizationPrompt,
            (chunk: string) => {
              // Hide typing indicator on first chunk
              setIsSummarizeOrRewriteLoading(false);
              
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
            },
            { 
              type: 'key-points',
              length: 'long',
              format: 'markdown'
            },
            // Fallback function using the transport
            async (text: string, onChunk: (chunk: string) => void) => {
              await transport.streamSummary(text, onChunk);
            }
          );
          
          console.log('[App] Summarization complete with provider:', summarizerProvider);
          
        } catch (error) {
          console.error('[App] Error summarizing page:', error);
          setIsSummarizeOrRewriteLoading(false);
          alert('Failed to summarize page. Please try again.');
        }
      } else if (message.action === 'rewriteText' && message.data) {
        console.log('[App] Received rewrite text request:', message.data);
        
        try {
          const { originalText, tone } = message.data as { originalText: string; tone: RewriteTone };
          
          // Clear existing messages when starting a new rewrite
          setMessages([]);
          
          // Set loading state to show typing indicator
          setIsSummarizeOrRewriteLoading(true);
          
          // Create user message with the original text and tone
          const userMessageId = `user-${Date.now()}`;
          const userMessage: UIMessage = {
            id: userMessageId,
            role: 'user',
            parts: [{
              type: 'text',
              text: formatRewriteUserMessage(originalText, tone)
            }]
          };
          
          // Add user message to chat immediately
          setMessages((prevMessages) => [...prevMessages, userMessage]);
          
          // Get the rewrite prompt based on tone
          const rewritePrompt = getRewritePrompt(originalText, tone);
          
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
          
          // Stream the rewritten text using transport
          await transport.streamSummary(rewritePrompt, (chunk: string) => {
            // Hide typing indicator on first chunk
            setIsSummarizeOrRewriteLoading(false);
            
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
          
          console.log('[App] Rewrite text complete');
          
        } catch (error) {
          console.error('[App] Error rewriting text:', error);
          setIsSummarizeOrRewriteLoading(false);
          alert('Failed to rewrite text. Please try again.');
        }
      } else if (message.action === 'summarizeYouTubeVideo' && message.data) {
        console.log('[App] Received YouTube video summarization request:', message.data);
        
        try {
          const { title = '', content = '', url = '', byline = '' } = message.data;
          
          // Clear existing messages when starting a new summarization
          setMessages([]);
          
          // Set loading state to show typing indicator
          setIsSummarizeOrRewriteLoading(true);
          
          // Create user message with video title and URL
          const userMessageId = `user-${Date.now()}`;
          const userMessage: UIMessage = {
            id: userMessageId,
            role: 'user',
            parts: [{
              type: 'text',
              text: `YouTube Video Summary: **${title}**\n${url}${byline ? `\nChannel: ${byline}` : ''}`
            }]
          };
          
          // Add user message to chat immediately
          setMessages((prevMessages) => [...prevMessages, userMessage]);
          
          // Prepare summarization prompt for AI with transcript
          const summarizationPrompt = `Please provide a concise and well-structured summary of the following YouTube video transcript.

Video Title: ${title}
${byline ? `Channel: ${byline}\n` : ''}URL: ${url}
Transcript:
${content.slice(0, 15000)}${content.length > 15000 ? '\n\n[Transcript truncated for length]' : ''}

Provide a clear summary that captures the main points and key takeaways from the video.`;

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
          
          // Stream the summary using transport
          await transport.streamSummary(summarizationPrompt, (chunk: string) => {
            // Hide typing indicator on first chunk
            setIsSummarizeOrRewriteLoading(false);
            
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
          
          console.log('[App] YouTube video summarization complete');
          
        } catch (error) {
          console.error('[App] Error summarizing YouTube video:', error);
          setIsSummarizeOrRewriteLoading(false);
          alert('Failed to summarize video. Please try again.');
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

  // Extract download progress from messages
  useEffect(() => {
    // Look for download progress data in the last message's parts
    const lastMessage = rawMessages[rawMessages.length - 1]
    if (lastMessage && lastMessage.parts && Array.isArray(lastMessage.parts)) {
      for (const part of lastMessage.parts) {
        const dataType = (part as unknown as { type: string }).type
        const partData = (part as unknown as { data: unknown }).data
        if (dataType === 'data' && partData && (partData as { status?: string }).status) {
          const data = partData as { status: string; progress: number; message: string }
          setModelDownloadProgress({
            status: data.status as "downloading" | "extracting" | "complete",
            progress: data.progress || 0,
            message: data.message || 'Downloading model...',
          })
          return
        }
      }
    }
    // If no progress data found and not loading, clear the progress display
    if (!isLoading) {
      setModelDownloadProgress(null)
    }
  }, [rawMessages, isLoading])

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
        <div className="flex items-center gap-2">
          <ProviderSelector
            value={preferredProvider}
            onChange={(provider) => {
              console.log('[App] User selected provider:', provider)
              setPreferredProvider(provider)
            }}
            availableProviders={availableProviders}
          />
          <SettingsMenu
            onReset={() => window.location.reload()}
          />
        </div>
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
      {activeProvider === 'web-llm' && !dismissedWebLLMInfo && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between gap-2">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            ℹ️ Using WebLLM with local model. First response may take longer as
            the model downloads.
          </p>
          <button
            onClick={() => setDismissedWebLLMInfo(true)}
            className="flex-shrink-0 p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4 text-blue-700 dark:text-blue-300" />
          </button>
        </div>
      )}

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
