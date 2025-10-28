/**
 * Tool definition types and interfaces
 */

import type { z } from 'zod'

export interface ToolDefinition {
  /** Unique identifier for the tool */
  id: string

  /** Display label in UI */
  label: string

  /** Description of what the tool does */
  description: string

  /** Zod schema for input validation */
  inputSchema: z.ZodSchema

  enabledByDefault: boolean

  /** Execute function that runs the tool */
  execute: (input: unknown) => Promise<unknown>
}

/**
 * Tools object format for Vercel AI SDK streamText function
 */
export type ToolsRecord = Record<
  string,
  {
    description: string
    inputSchema: z.ZodSchema
    execute: (input: unknown) => Promise<unknown>
  }
>
export type ToolSelection = Record<string, boolean>
