/**
 * Tool registry - centralized management of all available tools
 */

import { weatherTool } from './weather-tool'
import type { ToolDefinition, ToolSelection, ToolsRecord } from './types'

// Registry of all available tools - add new tools here
export const ALL_TOOLS: ToolDefinition[] = [weatherTool]

/**
 * Build tools object with only enabled tools for AI provider
 * @returns Tools object for Vercel AI SDK or undefined if no tools enabled
 */
export function buildEnabledTools(enabledToolIds: string[]): ToolsRecord | undefined {
  const enabledSet = new Set(enabledToolIds)
  const tools: ToolsRecord = {}

  ALL_TOOLS.forEach(tool => {
    if (enabledSet.has(tool.id)) {
      tools[tool.id] = {
        description: tool.description,
        inputSchema: tool.inputSchema,
        execute: tool.execute,
      }
    }
  })

  return Object.keys(tools).length > 0 ? tools : undefined
}

/**
 * Get default tool selection based on enabledByDefault property
 */
export function getDefaultToolSelection(): ToolSelection {
  const selection: ToolSelection = {}
  ALL_TOOLS.forEach(tool => {
    selection[tool.id] = tool.enabledByDefault
  })
  return selection
}

/**
 * Extract enabled tool IDs from selection object
 */
export function getSelectedToolIds(selection: ToolSelection): string[] {
  return Object.entries(selection)
    .filter(([, isSelected]) => isSelected)
    .map(([id]) => id)
}
