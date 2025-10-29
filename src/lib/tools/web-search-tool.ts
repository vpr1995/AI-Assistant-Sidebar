/**
 * Web Search Tool
 * Simple web search with page content extraction and summarization
 */

import { z } from 'zod'
import type { ToolDefinition } from './types'
import { streamChromeSummary } from '../summarizer-utils'

export interface SearchResult {
  title: string
  url: string
  snippet: string
  summary?: string
}

/**
 * Extract content from a webpage using simple DOM parsing
 */
async function extractPageContent(url: string): Promise<{ title: string; content: string } | null> {
  try {
    const response = await fetch(`https://${url}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      console.warn(`[WebSearch] Failed to fetch ${url}: ${response.status}`)
      return null
    }

    const html = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Remove unwanted elements
    doc.querySelectorAll('script, style, nav, header, footer, aside').forEach(el => el.remove())

    // Get main content
    const mainContent = doc.querySelector('main, article, .content, #content') || doc.body
    const title = doc.querySelector('title')?.textContent?.trim() || doc.querySelector('h1')?.textContent?.trim() || 'Untitled'
    const content = mainContent?.textContent?.trim() || ''

    // If content is short, try paragraphs
    let finalContent = content
    if (content.length < 200) {
      const paragraphs = Array.from(doc.querySelectorAll('p'))
        .map(p => p.textContent?.trim())
        .filter(text => text && text.length > 20)
        .join(' ')
      if (paragraphs.length > content.length) {
        finalContent = paragraphs
      }
    }

    return { title, content: finalContent }
  } catch (error) {
    console.warn(`[WebSearch] Error extracting content from ${url}:`, error)
    return null
  }
}

/**
 * Summarize content using Chrome Summarizer API
 */
async function summarizeContent(content: string): Promise<string> {
  try {
    let summary = ''
    await streamChromeSummary(content, (chunk) => {
      summary += chunk
    }, {
      type: 'key-points',
      length: 'short',
      format: 'plain-text'
    })
    return summary || content.substring(0, 300)
  } catch (error) {
    console.warn('[WebSearch] Summarization failed:', error)
    // Simple fallback: first few sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20).slice(0, 2)
    return sentences.join('. ') || content.substring(0, 300)
  }
}

/**
 * Perform web search using DuckDuckGo
 */
async function performWebSearch(query: string, numResults: number = 3): Promise<SearchResult[]> {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    const response = await fetch(searchUrl)

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`)
    }

    const html = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const resultElements = doc.querySelectorAll('.result')
    const results: SearchResult[] = []

    for (let i = 0; i < Math.min(resultElements.length, numResults); i++) {
      const result = resultElements[i]
      if (!result) continue

      const titleElement = result.querySelector('.result__a')
      const snippetElement = result.querySelector('.result__snippet')
      const urlElement = result.querySelector('.result__url')

      if (titleElement && snippetElement) {
        const title = titleElement.textContent?.trim() || ''
        const snippet = snippetElement.textContent?.trim() || ''
        const url = urlElement?.textContent?.trim() || titleElement.getAttribute('href') || ''

        let summary = snippet

        // Try to get full page content and summarize
        try {
          const pageContent = await extractPageContent(url)
          if (pageContent && pageContent.content.length > snippet.length) {
            summary = await summarizeContent(pageContent.content)
          }
        } catch (error) {
          console.warn(`[WebSearch] Failed to process ${url}:`, error)
        }

        results.push({ title, url, snippet, summary })
      }
    }

    return results
  } catch (error) {
    console.error('[WebSearch] Search error:', error)
    throw new Error(`Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Format search results for AI consumption
 */
function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No search results found.'
  }

  return results
    .map((result, index) => `${index + 1}. ${result.title}\n   URL: ${result.url}\n   ${result.summary || result.snippet}`)
    .join('\n\n')
}

export const webSearchTool: ToolDefinition = {
  id: 'webSearch',
  label: 'Web Search',
  description: 'Search the web and get summaries. Use this when you need up-to-date information or facts not in your training data.',
  inputSchema: z.object({
    query: z.string().describe('The search query'),
    numResults: z.number().optional().default(3).describe('Number of results (default: 3)'),
  }),
  execute: async (input: unknown) => {
    const { query, numResults = 3 } = input as { query: string; numResults?: number }

    console.log('[WebSearch] Searching for:', query)

    try {
      const results = await performWebSearch(query, numResults)

      return {
        query,
        results,
        formatted: formatSearchResults(results),
      }
    } catch (error) {
      console.error('[WebSearch] Error:', error)
      return {
        query,
        error: error instanceof Error ? error.message : 'Search failed',
        results: [],
        formatted: 'Search failed. Please try again.',
      }
    }
  },

  enabledByDefault: true,
}
