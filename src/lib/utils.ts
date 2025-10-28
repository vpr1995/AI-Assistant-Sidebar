import { AIProvider } from "@/types/chat"
import { doesBrowserSupportBuiltInAI } from "@built-in-ai/core"
import { doesBrowserSupportTransformersJS } from "@built-in-ai/transformers-js"
import { doesBrowserSupportWebLLM } from "@built-in-ai/web-llm"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Detects which AI provider is available and configured
 * Priority: Built-in AI > WebLLM > TransformersJS
 */
export async function detectActiveProvider(): Promise<AIProvider> {
  console.log('[App] Detecting active provider...')
  
  if (doesBrowserSupportBuiltInAI()) {
    console.log('[App] Browser supports Built-in AI API')
    return 'built-in-ai';
  } else {
    console.log('[App] Browser does NOT support Built-in AI API')
  }

  if (doesBrowserSupportWebLLM()) {
    console.log('[App] Browser supports WebLLM')
    return 'web-llm'
  }
  
  console.log('[App] Browser does NOT support WebLLM, checking TransformersJS')

  if (doesBrowserSupportTransformersJS()) {
    console.log('[App] Browser supports TransformersJS')
    return 'transformers-js'
  }

  console.log('[App] Browser does NOT support TransformersJS')
  console.warn('[App] ✗ No AI providers available!')
  return null
}
