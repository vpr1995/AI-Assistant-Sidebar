/// <reference types="vite/client" />
/// <reference types="chrome" />

/**
 * Chrome Summarizer API types
 * Available in Chrome 138+
 */

interface SummarizerOptions {
  type?: 'key-points' | 'tldr' | 'teaser' | 'headline'
  length?: 'short' | 'medium' | 'long'
  format?: 'markdown' | 'plain-text'
  sharedContext?: string
  monitor?: (monitor: ProgressMonitor) => void
}

interface ProgressMonitor extends EventTarget {
  addEventListener(type: 'downloadprogress', listener: (e: ProgressEvent) => void): void
}

type SummarizerAvailability = 'readily' | 'after-download' | 'downloadable' | 'unavailable'

interface Summarizer {
  summarize(text: string, options?: { context?: string }): Promise<string>
  summarizeStreaming(text: string, options?: { context?: string }): AsyncIterable<string>
  measureInputUsage(text: string): Promise<number>
  inputQuota: number
}

interface SummarizerStatic {
  availability(): Promise<SummarizerAvailability>
  create(options?: SummarizerOptions): Promise<Summarizer>
}

declare const Summarizer: SummarizerStatic
