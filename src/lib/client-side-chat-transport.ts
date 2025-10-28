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
  stepCountIs,
} from 'ai'
import { buildEnabledTools } from '@/lib/tools'
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
/**
 * Configuration for each AI provider
 * Contains provider-specific metadata and model initialization details
 */
interface ProviderConfig {
  modelId: string
  logPrefix: string
  downloadMessage: string
  errorPrefix: string
  deviceType?: 'webgpu'
  isVisionModel?: boolean
}

/**
 * Provider configuration map - contains metadata for all three providers
 */
const PROVIDER_CONFIGS: Record<'built-in-ai' | 'web-llm' | 'transformers-js', ProviderConfig> = {
  'built-in-ai': {
    modelId: 'chrome-built-in-ai',
    logPrefix: '[Built-in AI]',
    downloadMessage: 'Downloading Chrome Built-in AI model...',
    errorPrefix: 'Error with Chrome Built-in AI',
  },
  'web-llm': {
    modelId: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    logPrefix: '[WebLLM]',
    downloadMessage: 'Downloading WebLLM model...',
    errorPrefix: 'Error with WebLLM',
  },
  'transformers-js': {
    modelId: 'onnx-community/Llama-3.2-1B-Instruct-q4f16',
    logPrefix: '[TransformersJS]',
    downloadMessage: 'Downloading TransformersJS model...',
    errorPrefix: 'Error with TransformersJS',
    deviceType: 'webgpu',
    isVisionModel: false,
  },
}

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
  // Generic model cache: maps provider to cached model instance
  private cachedModels: Map<'web-llm' | 'transformers-js', ReturnType<typeof webLLM> | ReturnType<typeof transformersJS>> = new Map()
  // Generic model initialization tracking: maps provider to initialization promise
  private modelInitializing: Map<'web-llm' | 'transformers-js', Promise<void>> = new Map()
  private providerChangeCallback: ((provider: 'built-in-ai' | 'web-llm' | 'transformers-js') => void) | null = null
  private progressCallback: ((progress: { status: string; progress: number; message: string }) => void) | null = null
  private selectedTools: Set<string> = new Set(['getWeather']) // Tools selected by user
  private static hasLoggedInitialization = false

  constructor(preferredProvider: 'built-in-ai' | 'web-llm' | 'transformers-js' | 'auto' = 'auto') {
    this.preferredProvider = preferredProvider
    // Only log initialization once per session to avoid Strict Mode double-logging in development
    if (!ClientSideChatTransport.hasLoggedInitialization) {
      console.log('[ClientSideChatTransport] Initialized with preferred provider:', preferredProvider)
      ClientSideChatTransport.hasLoggedInitialization = true
    }
  }

  /**
   * Set which tools should be enabled
   */
  setSelectedTools(toolIds: string[]): void {
    this.selectedTools = new Set(toolIds)
    console.log('[ClientSideChatTransport] Selected tools updated:', Array.from(this.selectedTools))
  }

  /**
   * Check if a tool is enabled
   */
  isToolEnabled(toolId: string): boolean {
    return this.selectedTools.has(toolId)
  }

  /**
   * Get enabled tools from registry based on selected tool IDs
   */
  private getEnabledTools() {
    const enabledToolIds = Array.from(this.selectedTools)
    return buildEnabledTools(enabledToolIds)
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
    this.cachedModels.clear()
    this.modelInitializing.clear()
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


  /**
   * Generic handler for streaming inference with any provider
   * Abstracts common logic for download progress tracking and error handling
   */
  private async handleProvider(
    provider: 'built-in-ai' | 'web-llm' | 'transformers-js',
    prompt: ModelMessage[],
    abortSignal: AbortSignal | undefined
  ): Promise<ReadableStream<UIMessageChunk>> {
    const config = PROVIDER_CONFIGS[provider]

    // Get the model
    let model: ReturnType<typeof builtInAI> | ReturnType<typeof webLLM> | ReturnType<typeof transformersJS>

    if (provider === 'built-in-ai') {
      model = builtInAI()
    } else {
      model = await this.getOrInitializeModel(provider as 'web-llm' | 'transformers-js')
    }

    // Check availability and handle download
    const availability = await model.availability()
    console.log(`${config.logPrefix} Model availability:`, availability)

    if (availability === 'available') {
      console.log(`${config.logPrefix} Model is already available, streaming immediately`)
      const result = streamText({
        model,
        messages: prompt,
        abortSignal: abortSignal,
        tools: provider === 'built-in-ai' ? this.getEnabledTools() : undefined,
        stopWhen: stepCountIs(5),
      })
      return result.toUIMessageStream()
    }

    // Handle model download with progress tracking
    console.log(`${config.logPrefix} Model needs to be downloaded/prepared`)
    return createUIMessageStream<UIMessage>({
      execute: async ({ writer }) => {
        try {
          let downloadProgressId: string | undefined

          // Download/prepare model with progress monitoring
          await model.createSessionWithProgress((progressData: number | { progress: number }) => {
            const progress = typeof progressData === 'number' ? progressData : progressData.progress
            const percent = Math.round(progress * 100)
            console.log(`${config.logPrefix} Download progress:`, percent + '%')

            if (progress >= 1) {
              // Download complete - model is ready for inference
              console.log(`${config.logPrefix} Download complete, ready for inference`)
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
                    message: 'Model loaded! Ready to chat...',
                  },
                })
              }
              return
            }

            // First progress update
            if (!downloadProgressId) {
              downloadProgressId = `download-${Date.now()}`
              console.log(`${config.logPrefix} First progress update, id:`, downloadProgressId)
              if (this.progressCallback) {
                this.progressCallback({
                  status: 'downloading',
                  progress: percent,
                  message: config.downloadMessage,
                })
              }
              writer.write({
                type: 'data-modelDownloadProgress',
                id: downloadProgressId,
                data: {
                  status: 'downloading',
                  progress: percent,
                  message: config.downloadMessage,
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
                message: `${config.downloadMessage.replace('...', '')}... ${percent}%`,
              })
            }
            writer.write({
              type: 'data-modelDownloadProgress',
              id: downloadProgressId,
              data: {
                status: 'downloading',
                progress: percent,
                message: `${config.downloadMessage.replace('...', '')}... ${percent}%`,
              },
            })
          })

          // Stream the actual text response
          console.log(`${config.logPrefix} Starting inference`)
          const result = streamText({
            model,
            messages: prompt as ModelMessage[],
            abortSignal: abortSignal,
            tools: provider === 'built-in-ai' ? this.getEnabledTools() : undefined,
            stopWhen: stepCountIs(5),
            onChunk(event) {
              // Clear progress message on first text chunk
              if (event.chunk.type === 'text-delta' && downloadProgressId) {
                console.log(`${config.logPrefix} Received first text chunk, clearing progress`)
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
          const errorMessage = `${config.errorPrefix}: ${error instanceof Error ? error.message : 'Unknown error'
            }`
          console.error(`${config.logPrefix}`, errorMessage, error)
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

  private async handleBuiltInAI(
    prompt: ModelMessage[],
    abortSignal: AbortSignal | undefined
  ): Promise<ReadableStream<UIMessageChunk>> {
    return this.handleProvider('built-in-ai', prompt, abortSignal)
  }

  private async handleWebLLM(
    prompt: ModelMessage[],
    abortSignal: AbortSignal | undefined
  ): Promise<ReadableStream<UIMessageChunk>> {
    return this.handleProvider('web-llm', prompt, abortSignal)
  }

  /**
   * Gets or initializes the cached WebLLM model
   * Ensures only one initialization happens at a time
   */
  /**
   * Generic method to get or initialize a model for any provider
   * Handles caching and concurrent initialization
   */
  private async getOrInitializeModel(
    provider: 'web-llm' | 'transformers-js'
  ): Promise<ReturnType<typeof webLLM> | ReturnType<typeof transformersJS>> {
    const config = PROVIDER_CONFIGS[provider]

    // Return cached model if available
    if (this.cachedModels.has(provider)) {
      console.log(`${config.logPrefix} Using cached model instance`)
      return this.cachedModels.get(provider)!
    }

    // Wait if initialization is in progress
    if (this.modelInitializing.has(provider)) {
      console.log(`${config.logPrefix} Model initialization already in progress, waiting...`)
      await this.modelInitializing.get(provider)
      return this.cachedModels.get(provider)!
    }

    // Initialize the model
    console.log(`${config.logPrefix} Creating new model instance:`, config.modelId)
    const initPromise = (async () => {
      try {
        let model: ReturnType<typeof webLLM> | ReturnType<typeof transformersJS>

        if (provider === 'web-llm') {
          console.log(`${config.logPrefix} Creating WebLLM worker`)

          model = webLLM(config.modelId, {
            worker: new Worker(new URL('../webllm-worker.ts', import.meta.url), {
              type: 'module',
            }),
          })
        } else {
          // transformers-js
          console.log(`${config.logPrefix} Creating TransformersJS worker`)

          model = transformersJS(config.modelId, {
            device: config.deviceType!,
            isVisionModel: config.isVisionModel || false,
            worker: new Worker(new URL('../transformers-worker.ts', import.meta.url), {
              type: 'module',
            }),
          })
        }

        this.cachedModels.set(provider, model)
        console.log(`${config.logPrefix} Model instance created and cached`)
      } catch (error) {
        console.error(`${config.logPrefix} Error during model initialization:`, error)
        throw error
      } finally {
        this.modelInitializing.delete(provider)
      }
    })()

    this.modelInitializing.set(provider, initPromise)
    await initPromise
    return this.cachedModels.get(provider)!
  }

  private async handleTransformersJS(
    prompt: ModelMessage[],
    abortSignal: AbortSignal | undefined
  ): Promise<ReadableStream<UIMessageChunk>> {
    return this.handleProvider('transformers-js', prompt, abortSignal)
  }

  async reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    // Client-side AI doesn't support stream reconnection
    return null
  }

  /**
   * Summarize text directly using the current provider
   * Returns the summary as a string
   */

  /**
   * Generic internal method for streaming summaries
   * Abstracts provider-specific logic for text summarization
   * Supports different callback patterns for collecting vs streaming output
   */
  private async streamSummaryInternal(
    messages: ModelMessage[],
    onChunk: ((chunk: string) => void) | null,
    collectFullText: boolean = false
  ): Promise<string | undefined> {
    // Detect provider if not already detected
    if (!this.provider) {
      this.provider = await this.selectProvider()
      if (this.providerChangeCallback) {
        this.providerChangeCallback(this.provider)
      }
    }

    let model: ReturnType<typeof builtInAI> | ReturnType<typeof webLLM> | ReturnType<typeof transformersJS>

    if (this.provider === 'built-in-ai') {
      model = builtInAI()
    } else {
      model = await this.getOrInitializeModel(this.provider as 'web-llm' | 'transformers-js')
    }

    const result = streamText({
      model,
      messages,
    })

    let fullText = ''
    const reader = result.toUIMessageStream().getReader()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        if (value.type === 'text-delta') {
          const delta = value.delta
          if (onChunk) {
            onChunk(delta)
          }
          if (collectFullText) {
            fullText += delta
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    // Log token usage only for built-in AI
    if (this.provider === 'built-in-ai') {
      const tokenUsage = await result.usage
      console.log('[ChatTransport] Token usage:', tokenUsage)
    }

    return collectFullText ? fullText : undefined
  }

  async summarizeText(prompt: string): Promise<string> {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: prompt
      }
    ]

    const result = await this.streamSummaryInternal(messages, null, true)
    return result || ''
  }

  /**
   * Stream summary text with callback for each chunk
   * Allows UI to update in real-time as text is generated
   */
  async streamSummary(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: prompt
      }
    ]

    await this.streamSummaryInternal(messages, onChunk, false)
  }
}
