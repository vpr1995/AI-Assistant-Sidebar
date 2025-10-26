import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { X, Plus, ChevronDown, Edit2 } from 'lucide-react'
import {
  doesBrowserSupportBuiltInAI,
  builtInAI,
  type BuiltInAIUIMessage,
} from '@built-in-ai/core'
import {
  doesBrowserSupportWebLLM,
  type WebLLMUIMessage,
} from '@built-in-ai/web-llm'
import {
  doesBrowserSupportTransformersJS,
  type TransformersUIMessage,
} from '@built-in-ai/transformers-js'
import { ClientSideChatTransport } from '@/lib/client-side-chat-transport'
import { Chat } from '@/components/ui/chat'
import { SettingsMenu } from '@/components/ui/settings-menu'
import { DownloadProgressDialog } from '@/components/ui/download-progress-dialog'
import { ChatSidebar } from '@/components/ui/chat-sidebar'
import { NewChatDialog } from '@/components/ui/new-chat-dialog'
import type { Message } from '@/components/ui/chat-message'
import { summarizeWithFallback } from '@/lib/summarizer-utils'
import { getSummarizerPreference, type SummarizerPreference } from '@/lib/settings-storage'
import { getRewritePrompt, formatRewriteUserMessage, type RewriteTone } from '@/lib/rewrite-utils'
import { updateChatMessages } from '@/lib/chat-storage'
import { useChats } from '@/hooks/use-chats'
import './App.css'

// Unified message type supporting all three providers
type UIMessage = BuiltInAIUIMessage | WebLLMUIMessage | TransformersUIMessage

/**
 * Detects which AI provider is available and configured
 * Priority: Built-in AI > WebLLM > TransformersJS
 */
async function detectActiveProvider(): Promise<'built-in-ai' | 'web-llm' | 'transformers-js' | null> {
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
  
  console.log('[App] Browser does NOT support WebLLM, checking TransformersJS')

  if (doesBrowserSupportTransformersJS()) {
    console.log('[App] Browser supports TransformersJS')
    console.log('[App] ✓ Using TransformersJS provider')
    return 'transformers-js'
  }

  console.log('[App] Browser does NOT support TransformersJS')
  console.warn('[App] ✗ No AI providers available!')
  return null
}

// Convert UIMessage to the Message format expected by Chat component
function convertToMessage(uiMessage: UIMessage, attachments?: Map<string, { url: string; name: string; contentType: string }>): Message {
  // Extract text content from parts
  const textContent = uiMessage.parts
    ?.filter((part) => part.type === 'text')
    .map((part) => (part as { type: 'text'; text: string }).text)
    .join('') || ''

  // Check if this message has an attachment
  const attachment = attachments?.get(uiMessage.id)
  
  return {
    id: uiMessage.id,
    role: uiMessage.role,
    content: textContent,
    experimental_attachments: attachment ? [attachment] : undefined,
  }
}

function App() {
  const [activeProvider, setActiveProvider] = useState<
    'built-in-ai' | 'web-llm' | 'transformers-js' | null
  >(null)
  const [preferredProvider, setPreferredProvider] = useState<
    'built-in-ai' | 'web-llm' | 'transformers-js' | 'auto'
  >('auto')
  const [availableProviders, setAvailableProviders] = useState<
    ('built-in-ai' | 'web-llm' | 'transformers-js')[]
  >([])
  const [isClient, setIsClient] = useState(false)
  const [input, setInput] = useState('')
  const [modelDownloadProgress, setModelDownloadProgress] = useState<{
    status: "downloading" | "extracting" | "complete"
    progress: number
    message: string
  } | null>(null)
  const [dismissedWebLLMInfo, setDismissedWebLLMInfo] = useState(false)
  const [dismissedTransformersJSInfo, setDismissedTransformersJSInfo] = useState(false)
  const [isSummarizeOrRewriteLoading, setIsSummarizeOrRewriteLoading] = useState(false)
  const [attachedImage, setAttachedImage] = useState<{ file: File; preview: string } | null>(null)
  const [messageAttachments, setMessageAttachments] = useState<Map<string, { url: string; name: string; contentType: string }>>(new Map())
  const [pendingAttachment, setPendingAttachment] = useState<{ url: string; name: string; contentType: string } | null>(null)
  
  // Chat title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState('')
  
  // Chat persistence state
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [showChatSidebar, setShowChatSidebar] = useState(false)
  const { chats, currentChat, isLoading: isChatsLoading, createChat, selectChat, updateCurrentChatMessages, updateCurrentChatTitle, deleteChatById } = useChats(currentChatId, setCurrentChatId)
  
  // Track previous status to detect when streaming completes
  const prevStatusRef = useRef<string | null>(null)
  
  // Track if we've already auto-created a chat for current session
  const autoCreatedRef = useRef(false)  // Initialize transport once using useMemo to ensure it's available during render
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
      const available: ('built-in-ai' | 'web-llm' | 'transformers-js')[] = []
      
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

      if (doesBrowserSupportTransformersJS()) {
        available.push('transformers-js')
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
            : activeProvider === 'transformers-js'
              ? 'TransformersJS'
              : 'AI'
      alert(
        `${providerInfo} Error: ${error.message}\n\nPlease try again or check the browser console for more details.`
      )
    },
    experimental_throttle: 50,
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Convert messages to the format expected by Chat component
  const messages = rawMessages.map((msg) => convertToMessage(msg, messageAttachments))

  // Helper function to save current messages to chat
  const saveCurrentMessages = useCallback(async (uiMessagesToSave?: UIMessage[], chatIdOverride?: string) => {
    const messagesToSave = uiMessagesToSave || rawMessages
    const chatIdToUse = chatIdOverride || currentChatId
    
    if (!chatIdToUse || messagesToSave.length === 0) {
      console.log('[App] Cannot save: chatId=', chatIdToUse, 'messageCount=', messagesToSave.length)
      return
    }

    try {
      // Convert messages to ChatMessage format - extract content from parts
      const chatMessages = messagesToSave.map((msg) => {
        const content = msg.parts?.filter((p) => p.type === 'text').map((p) => (p as { type: 'text'; text: string }).text).join('') || ''
        console.log('[App] Saving message:', msg.id, 'role:', msg.role, 'content length:', content.length)
        return {
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: content,
          timestamp: Date.now(),
        }
      })

      console.log('[App] Saving', chatMessages.length, 'messages to chat', chatIdToUse, ':', chatMessages.map(m => ({ id: m.id, role: m.role, contentLen: m.content.length })))
      // Use storage function directly to avoid currentChat dependency
      await updateChatMessages(chatIdToUse, chatMessages)
      console.log('[App] Chat saved successfully')
    } catch (error) {
      console.error('[App] Error saving chat:', error)
    }
  }, [currentChatId, rawMessages])

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

  // Save chat only when a message is completely streamed (not on every change)
  // This prevents the infinite loop between auto-save and load effects
  useEffect(() => {
    if (!currentChatId) {
      prevStatusRef.current = status
      return
    }

    // Detect when streaming completes (status goes from 'streaming' to not-streaming)
    const wasStreaming = prevStatusRef.current === 'streaming'
    const isNowComplete = status !== 'streaming'
    
    if (wasStreaming && isNowComplete) {
      // Streaming just completed, save the messages
      // Only read rawMessages when we actually need to save
      if (rawMessages.length === 0) {
        prevStatusRef.current = status
        return
      }
      
      (async () => {
        try {
          // Convert rawMessages to ChatMessage format
          const chatMessages = rawMessages.map((msg) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.parts?.filter((p) => p.type === 'text').map((p) => (p as { type: 'text'; text: string }).text).join('') || '',
            timestamp: Date.now(),
          }))
          
          await updateCurrentChatMessages(chatMessages)
          console.log('[App] Chat saved (streaming complete)')
        } catch (error) {
          console.error('[App] Error saving chat:', error)
        }
      })()
    }

    // Track current status for next effect run
    prevStatusRef.current = status
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, currentChatId, updateCurrentChatMessages]) // rawMessages intentionally excluded to prevent effect running during streaming

  // Load messages from current chat when it changes
  useEffect(() => {
    console.log('[App] Load effect running:', { currentChatId, chatId: currentChat?.id, messageCount: currentChat?.messages.length })
    
    // No chat selected, clear all messages
    if (!currentChatId) {
      console.log('[App] No currentChatId, clearing messages')
      setMessages([])
      return
    }

    // Chat loaded from storage
    if (currentChat && currentChat.id === currentChatId) {
      console.log('[App] Chat matched:', currentChat.id, 'Messages in storage:', currentChat.messages.length)
      
      // Always clear first to ensure clean state when switching chats
      if (currentChat.messages.length > 0) {
        // Convert stored ChatMessage to UIMessage format
        const convertedMessages = currentChat.messages.map((msg) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          parts: [{ type: 'text' as const, text: msg.content }],
        })) as UIMessage[]
        
        console.log('[App] Setting messages:', convertedMessages.length)
        setMessages(convertedMessages)
        console.log('[App] Loaded messages from chat:', currentChat.id)
      } else {
        console.log('[App] Chat has no messages yet, not clearing to preserve active conversation')
      }
    } else {
      console.log('[App] Chat not loaded yet:', { currentChatId, chatId: currentChat?.id })
    }
  }, [currentChat, currentChatId, setMessages])

  // Reset auto-create flag when manually selecting a chat so it can trigger again for empty chats
  useEffect(() => {
    if (currentChatId) {
      autoCreatedRef.current = false
    }
  }, [currentChatId])

  // Signal to background script that sidebar is ready to receive messages
  useEffect(() => {
    // Check if chrome.runtime is available
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      console.log('[App] chrome.runtime not available, skipping ready signal (normal in dev mode)');
      return;
    }

    // Establish a port connection to signal sidebar lifecycle
    const port = chrome.runtime.connect({ name: 'sidebar' });
    console.log('[App] Established port connection to background');

    // Send a ready signal to the background script
    // This ensures background.ts knows the sidebar is ready to receive messages
    try {
      chrome.runtime.sendMessage({ action: 'sidebarReady' });
      console.log('[App] Sent ready signal to background script');
    } catch {
      console.log('[App] Could not send ready signal (normal if background script not listening)');
    }

    // Cleanup: disconnect port when component unmounts
    return () => {
      port.disconnect();
      console.log('[App] Disconnected port connection');
    };
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
      // Helper function to ensure a chat exists for summarization/rewrite actions
      // Returns the chat ID (either existing or newly created)
      const ensureChatExists = async (chatTitle: string): Promise<string> => {
        if (currentChatId) {
          return currentChatId
        }
        
        console.log('[App] No current chat, creating new chat for:', chatTitle)
        try {
          const newChat = await createChat(chatTitle)
          await selectChat(newChat.id)
          console.log('[App] Created and selected new chat:', newChat.id)
          return newChat.id
        } catch (error) {
          console.error('[App] Error creating chat:', error)
          throw error
        }
      }

      if (message.action === 'summarizePage' && message.data) {
        console.log('[App] Received summarize page request:', message.data);
        
        try {
          const { title = '', content = '', url = '', byline = '' } = message.data;
          
          // Ensure a chat exists for this summarization and get the chat ID
          const chatTitle = `Summary: ${title.substring(0, 50)}${title.length > 50 ? '...' : ''}`
          const wasChatCreated = !currentChatId
          const chatId = await ensureChatExists(chatTitle)
          
          // Track messages locally during summarization to ensure we save the final state
          let currentMessages: UIMessage[] = []
          
          // Only clear existing messages if we just created a new chat
          // If appending to existing chat, keep the existing messages
          if (wasChatCreated) {
            setMessages([]);
            currentMessages = []
          } else {
            // For existing chats, start with the current raw messages (UIMessage format)
            currentMessages = [...rawMessages]
          }
          // Clear any attached image
          setAttachedImage(null);
          
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
          currentMessages = [...currentMessages, userMessage]
          setMessages(currentMessages);
          
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
          currentMessages = [...currentMessages, aiMessage]
          setMessages(currentMessages);
          
          // Use Chrome Summarizer API with fallback to LLM transport
          const userPreference = await getSummarizerPreference()
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
              currentMessages = [...currentMessages]
              const lastIndex = currentMessages.length - 1;
              if (lastIndex >= 0 && currentMessages[lastIndex] && currentMessages[lastIndex].id === aiMessageId) {
                currentMessages[lastIndex] = aiMessage;
              }
              setMessages(currentMessages);
            },
            { 
              type: 'key-points',
              length: 'long',
              format: 'markdown'
            },
            // Fallback function using the transport
            async (text: string, onChunk: (chunk: string) => void) => {
              await transport.streamSummary(text, onChunk)
            },
            userPreference
          );
          
          console.log('[App] Summarization complete with provider:', summarizerProvider);
          
          // Save the final messages to chat using the chat ID we got
          await saveCurrentMessages(currentMessages, chatId);
          
        } catch (error) {
          console.error('[App] Error summarizing page:', error);
          setIsSummarizeOrRewriteLoading(false);
          alert('Failed to summarize page. Please try again.');
        }
      } else if (message.action === 'rewriteText' && message.data) {
        console.log('[App] Received rewrite text request:', message.data);
        
        try {
          const { originalText, tone } = message.data as { originalText: string; tone: RewriteTone };
          
          // Ensure a chat exists for this rewrite and get the chat ID
          const chatTitle = `Rewrite: ${tone.charAt(0).toUpperCase() + tone.slice(1)}`
          const wasChatCreated = !currentChatId
          const chatId = await ensureChatExists(chatTitle)
          
          // Track messages locally during summarization to ensure we save the final state
          let currentMessages: UIMessage[] = []
          
          // Only clear existing messages if we just created a new chat
          // If appending to existing chat, keep the existing messages
          if (wasChatCreated) {
            setMessages([]);
            currentMessages = []
          } else {
            // For existing chats, start with the current raw messages (UIMessage format)
            currentMessages = [...rawMessages]
          }
          // Clear any attached image
          setAttachedImage(null);
          
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
          currentMessages = [...currentMessages, userMessage]
          setMessages(currentMessages);
          
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
          currentMessages = [...currentMessages, aiMessage]
          setMessages(currentMessages);
          
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
            currentMessages = [...currentMessages]
            const lastIndex = currentMessages.length - 1;
            if (lastIndex >= 0 && currentMessages[lastIndex] && currentMessages[lastIndex].id === aiMessageId) {
              currentMessages[lastIndex] = aiMessage;
            }
            setMessages(currentMessages);
          });
          
          console.log('[App] Rewrite text complete');
          
          // Save the final messages to chat using the chat ID we got
          await saveCurrentMessages(currentMessages, chatId);
          
        } catch (error) {
          console.error('[App] Error rewriting text:', error);
          setIsSummarizeOrRewriteLoading(false);
          alert('Failed to rewrite text. Please try again.');
        }
      } else if (message.action === 'summarizeYouTubeVideo' && message.data) {
        console.log('[App] Received summarize YouTube request:', message.data);
        
        try {
          const { title = '', content = '', url = '', byline = '' } = message.data;
          
          // Ensure a chat exists for this YouTube summarization and get the chat ID
          const chatTitle = `YouTube Summary: ${title.substring(0, 40)}${title.length > 40 ? '...' : ''}`
          const wasChatCreated = !currentChatId
          const chatId = await ensureChatExists(chatTitle)
          
          // Track messages locally during summarization to ensure we save the final state
          let currentMessages: UIMessage[] = []
          
          // Only clear existing messages if we just created a new chat
          // If appending to existing chat, keep the existing messages
          if (wasChatCreated) {
            setMessages([]);
            currentMessages = []
          } else {
            // For existing chats, start with the current raw messages (UIMessage format)
            currentMessages = [...rawMessages]
          }
          // Clear any attached image
          setAttachedImage(null);
          
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
          currentMessages = [...currentMessages, userMessage]
          setMessages(currentMessages);
          
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
          currentMessages = [...currentMessages, aiMessage]
          setMessages(currentMessages);
          
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
            currentMessages = [...currentMessages]
            const lastIndex = currentMessages.length - 1;
            if (lastIndex >= 0 && currentMessages[lastIndex] && currentMessages[lastIndex].id === aiMessageId) {
              currentMessages[lastIndex] = aiMessage;
            }
            setMessages(currentMessages);
          });
          
          console.log('[App] YouTube video summarization complete');
          
          // Save the final messages to chat using the chat ID we got
          await saveCurrentMessages(currentMessages, chatId);
          
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
  }, [transport, setMessages, createChat, selectChat, currentChatId, saveCurrentMessages, messageAttachments, rawMessages]);

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

  const handleSubmit = async (event?: { preventDefault?: () => void }) => {
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
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const append = (message: { role: 'user'; content: string }) => {
    sendMessage({ text: message.content })
    setInput('')
  }

  // Handle starting title edit
  const handleStartTitleEdit = () => {
    if (currentChat) {
      setEditingTitle(currentChat.title)
      setIsEditingTitle(true)
    }
  }

  // Handle saving title edit
  const handleSaveTitleEdit = async () => {
    const trimmedTitle = editingTitle.trim()
    if (trimmedTitle && trimmedTitle !== currentChat?.title) {
      try {
        await updateCurrentChatTitle(trimmedTitle)
      } catch (error) {
        console.error('[App] Error updating chat title:', error)
      }
    }
    setIsEditingTitle(false)
    setEditingTitle('')
  }

  // Handle canceling title edit
  const handleCancelTitleEdit = () => {
    setIsEditingTitle(false)
    setEditingTitle('')
  }

  // Handle title input key down
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveTitleEdit()
    } else if (e.key === 'Escape') {
      handleCancelTitleEdit()
    }
  }

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

  return (
    <div className="sidebar-container flex flex-col h-screen">
      {/* Unified Header Section (Fixed Top) */}
      <header className="sidebar-header">
        {/* Left: Chat Name */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={handleSaveTitleEdit}
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
                  onClick={handleStartTitleEdit}
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
          {/* New Chat Button */}
          <button
            onClick={() => setShowNewChatDialog(true)}
            className="p-1.5 rounded-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-offset-background"
            title="New Chat"
            aria-label="New Chat"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* View Chats Dropdown Button */}
          <button
            onClick={() => setShowChatSidebar(!showChatSidebar)}
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

      {/* Warning when AI is not available */}
      {!isAIAvailable && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
            ⚠️ No AI providers available
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
            Please ensure your browser supports Chrome Built-in AI, WebLLM, or TransformersJS.
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

      {/* Info message for TransformersJS fallback */}
      {activeProvider === 'transformers-js' && !dismissedTransformersJSInfo && (
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800 flex items-center justify-between gap-2">
          <p className="text-xs text-purple-700 dark:text-purple-300">
            ℹ️ Using TransformersJS with local model. First response may take longer as
            the model downloads.
          </p>
          <button
            onClick={() => setDismissedTransformersJSInfo(true)}
            className="flex-shrink-0 p-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded transition-colors"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4 text-purple-700 dark:text-purple-300" />
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
          preferredProvider={preferredProvider}
          onProviderChange={(provider) => {
            console.log('[App] User selected provider:', provider)
            setPreferredProvider(provider)
          }}
          availableProviders={availableProviders}
          attachedImage={attachedImage}
          onAttachImage={setAttachedImage}
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
    </div>
  )
}

export default App

