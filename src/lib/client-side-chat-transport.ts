/**
 * Client-side chat transport for use with Vercel AI SDK's useChat hook
 * This enables using browser built-in AI and WebLLM with the useChat hook
 * Dual-provider architecture: Built-in AI (primary) → WebLLM (fallback)
 */

import {
  ChatTransport,
  UIMessageChunk,
  streamText,
  convertToModelMessages,
  ChatRequestOptions,
  createUIMessageStream,
  type ModelMessage,
} from 'ai'
import {
  builtInAI,
  doesBrowserSupportBuiltInAI,
  type BuiltInAIUIMessage,
} from '@built-in-ai/core'
import {
  webLLM,
  doesBrowserSupportWebLLM,
  type WebLLMUIMessage,
} from '@built-in-ai/web-llm'
import {
  transformersJS,
  doesBrowserSupportTransformersJS,
  type TransformersUIMessage,
} from '@built-in-ai/transformers-js'


// Unified message type supporting all three providers
type UIMessage = BuiltInAIUIMessage | WebLLMUIMessage | TransformersUIMessage

/**
 * Detects which AI provider is available
 * Returns providers in priority order: 'built-in-ai' → 'web-llm' → 'transformers-js'
 */
async function detectAvailableProvider(): Promise<'built-in-ai' | 'web-llm' | 'transformers-js'> {
  console.log('[AI Provider Detection] Starting detection...')
  
  if (doesBrowserSupportBuiltInAI()) {
    console.log('[AI Provider Detection] Browser supports Built-in AI')
    const model = builtInAI()
    const availability = await model.availability()
    console.log('[AI Provider Detection] Built-in AI availability:', availability)
    
    if (availability !== 'unavailable') {
      console.log('[AI Provider Detection] Selected: Built-in AI')
      return 'built-in-ai'
    }
    console.log('[AI Provider Detection] Built-in AI unavailable, checking WebLLM...')
  } else {
    console.log('[AI Provider Detection] Browser does NOT support Built-in AI')
  }

  if (doesBrowserSupportWebLLM()) {
    console.log('[AI Provider Detection] Browser supports WebLLM')
    console.log('[AI Provider Detection] Selected: WebLLM')
    return 'web-llm'
  }
  
  console.log('[AI Provider Detection] Browser does NOT support WebLLM, checking TransformersJS...')

  if (doesBrowserSupportTransformersJS()) {
    console.log('[AI Provider Detection] Browser supports TransformersJS')
    console.log('[AI Provider Detection] Selected: TransformersJS')
    return 'transformers-js'
  }

  console.log('[AI Provider Detection] Browser does NOT support TransformersJS')

  // Fallback to transformers-js even if detection says no (may still work)
  console.log('[AI Provider Detection] Selected: TransformersJS (fallback)')
  return 'transformers-js'
}

/**
 * Client-side chat transport implementing triple-provider AI support
 * Automatically falls back: Built-in AI → WebLLM → TransformersJS
 *
 * @implements {ChatTransport<UIMessage>}
 */
export class ClientSideChatTransport implements ChatTransport<UIMessage> {
  private provider: 'built-in-ai' | 'web-llm' | 'transformers-js' | null = null
  private preferredProvider: 'built-in-ai' | 'web-llm' | 'transformers-js' | 'auto' = 'auto'
  private cachedWebLLMModel: ReturnType<typeof webLLM> | null = null
  private webLLMModelInitializing: Promise<void> | null = null
  private cachedTransformersJSModel: ReturnType<typeof transformersJS> | null = null
  private transformersJSModelInitializing: Promise<void> | null = null
  private providerChangeCallback: ((provider: 'built-in-ai' | 'web-llm' | 'transformers-js') => void) | null = null
  private progressCallback: ((progress: { status: string; progress: number; message: string }) => void) | null = null
  private static hasLoggedInitialization = false

  constructor(preferredProvider: 'built-in-ai' | 'web-llm' | 'transformers-js' | 'auto' = 'auto') {
    this.preferredProvider = preferredProvider
    // Only log initialization once per session to avoid Strict Mode double-logging in development
    if (!ClientSideChatTransport.hasLoggedInitialization) {
      console.log('[ClientSideChatTransport] Initialized with preferred provider:', preferredProvider)
      ClientSideChatTransport.hasLoggedInitialization = true
    }
  }

  async sendMessages(
    options: {
      chatId: string
      messages: UIMessage[]
      abortSignal: AbortSignal | undefined
    } & {
      trigger: 'submit-message' | 'submit-tool-result' | 'regenerate-message'
      messageId: string | undefined
    } & ChatRequestOptions
  ): Promise<ReadableStream<UIMessageChunk>> {
    const { messages, abortSignal, body } = options

    // Detect provider on first use (if not already detected)
    if (!this.provider) {
      console.log('[ClientSideChatTransport] First message, detecting provider...')
      this.provider = await this.selectProvider()
      console.log('[ClientSideChatTransport] Provider selected:', this.provider)
      if (this.providerChangeCallback) {
        this.providerChangeCallback(this.provider)
      }
    }

    // Convert UI messages to model messages
    const prompt: ModelMessage[] = convertToModelMessages(messages) ?? []
    console.log('[ClientSideChatTransport] Prompt messages:', prompt.length)
    
    // If we have an image attachment for built-in-ai, add it to the last message
    const imageAttachment = (body as Record<string, unknown> | undefined)?.imageAttachment as 
      { mediaType: string; data: string } | undefined
    if (imageAttachment && this.provider === 'built-in-ai' && prompt.length > 0) {
      const lastMessage = prompt[prompt.length - 1]
      
      if (lastMessage && lastMessage.role === 'user') {
        // Extract user text from the converted message
        const userText = typeof lastMessage.content === 'string' ? lastMessage.content : ''
        
        console.log('[ClientSideChatTransport] Adding image to message:', imageAttachment.mediaType)
        
        // Build multimodal content: text + file
        lastMessage.content = [
          { type: 'text', text: userText },
          { type: 'file', mediaType: imageAttachment.mediaType, data: imageAttachment.data }
        ] as Array<{ type: 'text'; text: string } | { type: 'file'; mediaType: string; data: string }>
        
        console.log('[ClientSideChatTransport] ✅ Multimodal message:', userText, imageAttachment.mediaType)
      }
    }

    // Route to appropriate provider
    if (this.provider === 'built-in-ai') {
      console.log('[ClientSideChatTransport] Calling handleBuiltInAI')
      return this.handleBuiltInAI(prompt, abortSignal)
    } else if (this.provider === 'web-llm') {
      console.log('[ClientSideChatTransport] Calling handleWebLLM')
      return this.handleWebLLM(prompt, abortSignal)
    } else {
      console.log('[ClientSideChatTransport] Calling handleTransformersJS')
      return this.handleTransformersJS(prompt, abortSignal)
    }
  }

  /**
   * Selects which provider to use based on user preference and availability
   */
  private async selectProvider(): Promise<'built-in-ai' | 'web-llm' | 'transformers-js'> {
    console.log('[ClientSideChatTransport.selectProvider] Current preferred provider:', this.preferredProvider)

    // If user specified a preference
    if (this.preferredProvider === 'built-in-ai') {
      console.log('[ClientSideChatTransport.selectProvider] User prefers Built-in AI, checking availability...')
      if (await this.isBuiltInAIAvailable()) {
        console.log('[ClientSideChatTransport.selectProvider] Built-in AI available, using it')
        return 'built-in-ai'
      }
      console.log('[ClientSideChatTransport.selectProvider] Built-in AI not available, falling back to WebLLM')
      return 'web-llm'
    }

    if (this.preferredProvider === 'web-llm') {
      console.log('[ClientSideChatTransport.selectProvider] User prefers WebLLM, using it')
      return 'web-llm'
    }

    if (this.preferredProvider === 'transformers-js') {
      console.log('[ClientSideChatTransport.selectProvider] User prefers TransformersJS, using it')
      return 'transformers-js'
    }

    // Auto mode: use automatic detection
    console.log('[ClientSideChatTransport.selectProvider] Auto mode, running detection...')
    return await detectAvailableProvider()
  }

  /**
   * Checks if Built-in AI is available
   */
  private async isBuiltInAIAvailable(): Promise<boolean> {
    if (!doesBrowserSupportBuiltInAI()) {
      console.log('[ClientSideChatTransport.isBuiltInAIAvailable] Browser does not support Built-in AI')
      return false
    }
    const model = builtInAI()
    const availability = await model.availability()
    console.log('[ClientSideChatTransport.isBuiltInAIAvailable] Built-in AI availability:', availability)
    return availability !== 'unavailable'
  }

  /**
   * Update the preferred provider (allows user to switch)
   * Only resets provider detection if preference actually changed
   */
  setPreferredProvider(provider: 'built-in-ai' | 'web-llm' | 'transformers-js' | 'auto'): void {
    // Only reset if preference actually changed
    if (this.preferredProvider === provider) {
      console.log('[ClientSideChatTransport] Preferred provider unchanged:', provider)
      return
    }
    
    console.log('[ClientSideChatTransport] Switching preferred provider from', this.preferredProvider, 'to', provider)
    this.preferredProvider = provider
    // Reset the detected provider to force re-detection on next message
    this.provider = null
    // Clear cached models to force re-initialization
    this.cachedWebLLMModel = null
    this.webLLMModelInitializing = null
    this.cachedTransformersJSModel = null
    this.transformersJSModelInitializing = null
    console.log('[ClientSideChatTransport] Provider detection will be re-run on next message')
  }

  /**
   * Get the currently active provider
   * Returns the provider that will be used for the next message
   * If not yet determined, returns null
   */
  getActiveProvider(): 'built-in-ai' | 'web-llm' | 'transformers-js' | null {
    return this.provider
  }

  /**
   * Set a callback to be called when the active provider is determined or changes
   */
  onProviderChange(callback: (provider: 'built-in-ai' | 'web-llm' | 'transformers-js') => void): void {
    this.providerChangeCallback = callback
  }

  /**
   * Set a callback to be called with download progress updates
   */
  onDownloadProgress(callback: (progress: { status: string; progress: number; message: string }) => void): void {
    this.progressCallback = callback
  }

  private async handleBuiltInAI(
    prompt: ModelMessage[],
    abortSignal: AbortSignal | undefined
  ): Promise<ReadableStream<UIMessageChunk>> {
    const model = builtInAI()

    // Check if model is already available to skip progress tracking
    const availability = await model.availability()
    console.log('[Built-in AI] Model availability:', availability)
    
    if (availability === 'available') {
      console.log('[Built-in AI] Model is already available, streaming immediately')
      const result = streamText({
        model,
        messages: prompt,
        abortSignal: abortSignal,
      })
      return result.toUIMessageStream()
    }

    // Handle model download with progress tracking
    console.log('[Built-in AI] Model needs to be downloaded/prepared')
    return createUIMessageStream<UIMessage>({
      execute: async ({ writer }) => {
        try {
          let downloadProgressId: string | undefined

          // Download/prepare model with progress monitoring
          await model.createSessionWithProgress((progress: number) => {
            const percent = Math.round(progress * 100)
            console.log('[Built-in AI] Download progress:', percent + '%')

            if (progress >= 1) {
              // Download complete - model is ready for inference
              console.log('[Built-in AI] Download complete, ready for inference')
              if (this.progressCallback) {
                this.progressCallback({
                  status: 'complete',
                  progress: 100,
                  message: 'Model loaded! Ready to chat...',
                })
              }
              if (downloadProgressId) {
                writer.write({
                  type: 'data-modelDownloadProgress',
                  id: downloadProgressId,
                  data: {
                    status: 'complete',
                    progress: 100,
                    message:
                      'Model loaded! Ready to chat...',
                  },
                })
              }
              return
            }

            // First progress update
            if (!downloadProgressId) {
              downloadProgressId = `download-${Date.now()}`
              console.log('[Built-in AI] First progress update, id:', downloadProgressId)
              if (this.progressCallback) {
                this.progressCallback({
                  status: 'downloading',
                  progress: percent,
                  message: 'Downloading Chrome Built-in AI model...',
                })
              }
              writer.write({
                type: 'data-modelDownloadProgress',
                id: downloadProgressId,
                data: {
                  status: 'downloading',
                  progress: percent,
                  message: 'Downloading Chrome Built-in AI model...',
                },
                transient: true,
              })
              return
            }

            // Ongoing progress updates
            if (this.progressCallback) {
              this.progressCallback({
                status: 'downloading',
                progress: percent,
                message: `Downloading Chrome Built-in AI model... ${percent}%`,
              })
            }
            writer.write({
              type: 'data-modelDownloadProgress',
              id: downloadProgressId,
              data: {
                status: 'downloading',
                progress: percent,
                message: `Downloading Chrome Built-in AI model... ${percent}%`,
              },
            })
          })

          // Stream the actual text response
          console.log('[Built-in AI] Starting inference')
          const result = streamText({
            model,
            messages: prompt as ModelMessage[],
            abortSignal: abortSignal,
            onChunk(event) {
              // Clear progress message on first text chunk
              if (event.chunk.type === 'text-delta' && downloadProgressId) {
                console.log('[Built-in AI] Received first text chunk, clearing progress')
                writer.write({
                  type: 'data-modelDownloadProgress',
                  id: downloadProgressId,
                  data: { status: 'complete', progress: 100, message: '' },
                })
                downloadProgressId = undefined
              }
            },
          })

          writer.merge(result.toUIMessageStream({ sendStart: false }))
        } catch (error) {
          const errorMessage = `Error with Chrome Built-in AI: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
          console.error('[Built-in AI]', errorMessage, error)
          writer.write({
            type: 'data-notification',
            data: {
              message: errorMessage,
              level: 'error',
            },
            transient: true,
          })
          throw error
        }
      },
    })
  }

  private async handleWebLLM(
    prompt: ModelMessage[],
    abortSignal: AbortSignal | undefined
  ): Promise<ReadableStream<UIMessageChunk>> {
    // Use SmolLM2 360M model for WebLLM
    const modelId = 'Llama-3.2-1B-Instruct-q4f16_1-MLC'
    
    // Get or initialize the model (with caching)
    const model = await this.getOrInitializeWebLLMModel(modelId)

    // Check availability and handle download
    const availability = await model.availability()
    console.log('[WebLLM] Model availability:', availability)

    if (availability === 'available') {
      console.log('[WebLLM] Model is already available, streaming immediately')
      const result = streamText({
        model,
        messages: prompt,
        abortSignal: abortSignal,
      })
      return result.toUIMessageStream()
    }

    // Handle model download with progress tracking
    console.log('[WebLLM] Model needs to be downloaded/prepared')
    return createUIMessageStream<UIMessage>({
      execute: async ({ writer }) => {
        try {
          let downloadProgressId: string | undefined

          // Download/prepare model with progress monitoring
          await model.createSessionWithProgress(({ progress }: { progress: number }) => {
            const percent = Math.round(progress * 100)
            console.log('[WebLLM] Download progress:', percent + '%')

            if (progress >= 1) {
              // Download complete - model is ready for inference
              console.log('[WebLLM] Download complete, ready for inference')
              if (this.progressCallback) {
                this.progressCallback({
                  status: 'complete',
                  progress: 100,
                  message: 'Model loaded! Ready to chat...',
                })
              }
              if (downloadProgressId) {
                writer.write({
                  type: 'data-modelDownloadProgress',
                  id: downloadProgressId,
                  data: {
                    status: 'complete',
                    progress: 100,
                    message:
                      'Model loaded! Ready to chat...',
                  },
                })
              }
              return
            }

            // First progress update
            if (!downloadProgressId) {
              downloadProgressId = `download-${Date.now()}`
              console.log('[WebLLM] First progress update, id:', downloadProgressId)
              if (this.progressCallback) {
                this.progressCallback({
                  status: 'downloading',
                  progress: percent,
                  message: 'Downloading WebLLM model...',
                })
              }
              writer.write({
                type: 'data-modelDownloadProgress',
                id: downloadProgressId,
                data: {
                  status: 'downloading',
                  progress: percent,
                  message: 'Downloading WebLLM model...',
                },
                transient: true,
              })
              return
            }

            // Ongoing progress updates
            if (this.progressCallback) {
              this.progressCallback({
                status: 'downloading',
                progress: percent,
                message: `Downloading WebLLM model... ${percent}%`,
              })
            }
            writer.write({
              type: 'data-modelDownloadProgress',
              id: downloadProgressId,
              data: {
                status: 'downloading',
                progress: percent,
                message: `Downloading WebLLM model... ${percent}%`,
              },
            })
          })

          // Stream the actual text response
          console.log('[WebLLM] Starting inference')
          const result = streamText({
            model,
            messages: prompt as ModelMessage[],
            abortSignal: abortSignal,
            onChunk(event) {
              // Clear progress message on first text chunk
              if (event.chunk.type === 'text-delta' && downloadProgressId) {
                console.log('[WebLLM] Received first text chunk, clearing progress')
                writer.write({
                  type: 'data-modelDownloadProgress',
                  id: downloadProgressId,
                  data: { status: 'complete', progress: 100, message: '' },
                })
                downloadProgressId = undefined
              }
            },
          })

          writer.merge(result.toUIMessageStream({ sendStart: false }))
        } catch (error) {
          const errorMessage = `Error with WebLLM: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
          console.error('[WebLLM]', errorMessage, error)
          writer.write({
            type: 'data-notification',
            data: {
              message: errorMessage,
              level: 'error',
            },
            transient: true,
          })
          throw error
        }
      },
    })
  }

  /**
   * Gets or initializes the cached WebLLM model
   * Ensures only one initialization happens at a time
   */
  private async getOrInitializeWebLLMModel(
    modelId: string
  ): Promise<ReturnType<typeof webLLM>> {
    // Return cached model if available
    if (this.cachedWebLLMModel) {
      console.log('[WebLLM] Using cached model instance')
      return this.cachedWebLLMModel
    }

    // Wait if initialization is in progress
    if (this.webLLMModelInitializing) {
      console.log('[WebLLM] Model initialization already in progress, waiting...')
      await this.webLLMModelInitializing
      return this.cachedWebLLMModel!
    }

    // Initialize the model
    console.log('[WebLLM] Creating new model instance:', modelId)
    this.webLLMModelInitializing = (async () => {
      try {
        this.cachedWebLLMModel = webLLM(modelId, {
          worker: new Worker(new URL('../webllm-worker.ts', import.meta.url), {
            type: 'module',
          }),
        })
        console.log('[WebLLM] Model instance created and cached')
      } finally {
        this.webLLMModelInitializing = null
      }
    })()

    await this.webLLMModelInitializing
    return this.cachedWebLLMModel!
  }

  private async handleTransformersJS(
    prompt: ModelMessage[],
    abortSignal: AbortSignal | undefined
  ): Promise<ReadableStream<UIMessageChunk>> {
    // Use SmolLM2 360M model for TransformersJS (same as recommended in docs)
    const modelId = 'onnx-community/Llama-3.2-1B-Instruct-q4f16'
    
    // Get or initialize the model (with caching)
    const model = await this.getOrInitializeTransformersJSModel(modelId)

    // Check availability and handle download
    const availability = await model.availability()
    console.log('[TransformersJS] Model availability:', availability)

    if (availability === 'available') {
      console.log('[TransformersJS] Model is already available, streaming immediately')
      const result = streamText({
        model,
        messages: prompt,
        abortSignal: abortSignal,
      })
      return result.toUIMessageStream()
    }

    // Handle model download with progress tracking
    console.log('[TransformersJS] Model needs to be downloaded/prepared')
    return createUIMessageStream<UIMessage>({
      execute: async ({ writer }) => {
        try {
          let downloadProgressId: string | undefined

          // Download/prepare model with progress monitoring
          await model.createSessionWithProgress(({ progress }: { progress: number }) => {
            const percent = Math.round(progress * 100)
            console.log('[TransformersJS] Download progress:', percent + '%')

            if (progress >= 1) {
              // Download complete - model is ready for inference
              console.log('[TransformersJS] Download complete, ready for inference')
              if (this.progressCallback) {
                this.progressCallback({
                  status: 'complete',
                  progress: 100,
                  message: 'Model loaded! Ready to chat...',
                })
              }
              if (downloadProgressId) {
                writer.write({
                  type: 'data-modelDownloadProgress',
                  id: downloadProgressId,
                  data: {
                    status: 'complete',
                    progress: 100,
                    message:
                      'Model loaded! Ready to chat...',
                  },
                })
              }
              return
            }

            // First progress update
            if (!downloadProgressId) {
              downloadProgressId = `download-${Date.now()}`
              console.log('[TransformersJS] First progress update, id:', downloadProgressId)
              if (this.progressCallback) {
                this.progressCallback({
                  status: 'downloading',
                  progress: percent,
                  message: 'Downloading TransformersJS model...',
                })
              }
              writer.write({
                type: 'data-modelDownloadProgress',
                id: downloadProgressId,
                data: {
                  status: 'downloading',
                  progress: percent,
                  message: 'Downloading TransformersJS model...',
                },
                transient: true,
              })
              return
            }

            // Ongoing progress updates
            if (this.progressCallback) {
              this.progressCallback({
                status: 'downloading',
                progress: percent,
                message: `Downloading TransformersJS model... ${percent}%`,
              })
            }
            writer.write({
              type: 'data-modelDownloadProgress',
              id: downloadProgressId,
              data: {
                status: 'downloading',
                progress: percent,
                message: `Downloading TransformersJS model... ${percent}%`,
              },
            })
          })

          // Stream the actual text response
          console.log('[TransformersJS] Starting inference')
          const result = streamText({
            model,
            messages: prompt as ModelMessage[],
            abortSignal: abortSignal,
            onChunk(event) {
              // Clear progress message on first text chunk
              if (event.chunk.type === 'text-delta' && downloadProgressId) {
                console.log('[TransformersJS] Received first text chunk, clearing progress')
                writer.write({
                  type: 'data-modelDownloadProgress',
                  id: downloadProgressId,
                  data: { status: 'complete', progress: 100, message: '' },
                })
                downloadProgressId = undefined
              }
            },
          })

          writer.merge(result.toUIMessageStream({ sendStart: false }))
        } catch (error) {
          const errorMessage = `Error with TransformersJS: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
          console.error('[TransformersJS]', errorMessage, error)
          writer.write({
            type: 'data-notification',
            data: {
              message: errorMessage,
              level: 'error',
            },
            transient: true,
          })
          throw error
        }
      },
    })
  }

  /**
   * Gets or initializes the cached TransformersJS model
   * Ensures only one initialization happens at a time
   */
  private async getOrInitializeTransformersJSModel(
    modelId: string
  ): Promise<ReturnType<typeof transformersJS>> {
    // Return cached model if available
    if (this.cachedTransformersJSModel) {
      console.log('[TransformersJS] Using cached model instance')
      return this.cachedTransformersJSModel
    }

    // Wait if initialization is in progress
    if (this.transformersJSModelInitializing) {
      console.log('[TransformersJS] Model initialization already in progress, waiting...')
      await this.transformersJSModelInitializing
      return this.cachedTransformersJSModel!
    }

    // Initialize the model
    console.log('[TransformersJS] Creating new model instance:', modelId)
    this.transformersJSModelInitializing = (async () => {
      try {
        this.cachedTransformersJSModel = transformersJS(modelId, {
          device: 'webgpu',
          worker: new Worker(new URL('../transformers-worker.ts', import.meta.url), {
            type: 'module',
          }),
        })
        console.log('[TransformersJS] Model instance created and cached')
      } finally {
        this.transformersJSModelInitializing = null
      }
    })()

    await this.transformersJSModelInitializing
    return this.cachedTransformersJSModel!
  }

  async reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    // Client-side AI doesn't support stream reconnection
    return null
  }

  /**
   * Summarize text directly using the current provider
   * Returns the summary as a string
   */
  async summarizeText(prompt: string): Promise<string> {
    // Detect provider if not already detected
    if (!this.provider) {
      this.provider = await this.selectProvider()
      if (this.providerChangeCallback) {
        this.providerChangeCallback(this.provider)
      }
    }

    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: prompt
      }
    ]

    if (this.provider === 'built-in-ai') {
      const model = builtInAI()
      const result = streamText({
        model,
        messages,
      })
      
      // Collect all text chunks
      let fullText = ''
      const reader = result.toUIMessageStream().getReader()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          if (value.type === 'text-delta') {
            fullText += value.delta
          }
        }
      } finally {
        reader.releaseLock()
      }
      
      return fullText
    } else if (this.provider === 'web-llm') {
      // WebLLM
      const modelId = 'Llama-3.2-1B-Instruct-q4f16_1-MLC'
      const model = await this.getOrInitializeWebLLMModel(modelId)
      
      const result = streamText({
        model,
        messages,
      })
      
      // Collect all text chunks
      let fullText = ''
      const reader = result.toUIMessageStream().getReader()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          if (value.type === 'text-delta') {
            fullText += value.delta
          }
        }
      } finally {
        reader.releaseLock()
      }
      
      return fullText
    } else {
      // TransformersJS
      const modelId = 'HuggingFaceTB/SmolLM2-360M-Instruct'
      const model = await this.getOrInitializeTransformersJSModel(modelId)
      
      const result = streamText({
        model,
        messages,
      })
      
      // Collect all text chunks
      let fullText = ''
      const reader = result.toUIMessageStream().getReader()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          if (value.type === 'text-delta') {
            fullText += value.delta
          }
        }
      } finally {
        reader.releaseLock()
      }
      
      return fullText
    }
  }

  /**
   * Stream summary text with callback for each chunk
   * Allows UI to update in real-time as text is generated
   */
  async streamSummary(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
    // Detect provider if not already detected
    if (!this.provider) {
      this.provider = await this.selectProvider()
      if (this.providerChangeCallback) {
        this.providerChangeCallback(this.provider)
      }
    }

    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: prompt
      }
    ]

    if (this.provider === 'built-in-ai') {
      const model = builtInAI()
      const result = streamText({
        model,
        messages,
      })
      
      const reader = result.toUIMessageStream().getReader()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          if (value.type === 'text-delta') {
            onChunk(value.delta)
          }
        }
      } finally {
        reader.releaseLock()
      }
    } else if (this.provider === 'web-llm') {
      // WebLLM
      const modelId = 'Llama-3.2-1B-Instruct-q4f16_1-MLC'
      const model = await this.getOrInitializeWebLLMModel(modelId)
      
      const result = streamText({
        model,
        messages,
      })
      
      const reader = result.toUIMessageStream().getReader()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          if (value.type === 'text-delta') {
            onChunk(value.delta)
          }
        }
      } finally {
        reader.releaseLock()
      }
    } else {
      // TransformersJS
      const modelId = 'onnx-community/Llama-3.2-1B-Instruct-q4f16'
      const model = await this.getOrInitializeTransformersJSModel(modelId)
      
      const result = streamText({
        model,
        messages,
      })
      
      const reader = result.toUIMessageStream().getReader()
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          if (value.type === 'text-delta') {
            onChunk(value.delta)
          }
        }
      } finally {
        reader.releaseLock()
      }
    }
  }
}
