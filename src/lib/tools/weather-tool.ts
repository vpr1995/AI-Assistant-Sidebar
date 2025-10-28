/**
 * Weather tool definition
 * Provides weather information for a given location
 */

import { z } from 'zod'
import type { ToolDefinition } from './types'

export const weatherTool: ToolDefinition = {
  id: 'getWeather',
  label: 'Weather',
  description: 'Get weather information for a location',
  inputSchema: z.object({
    location: z.string().describe('The city name'),
  }),
  execute: async (input: unknown) => {
    const { location } = input as { location: string }
    console.log('[Weather Tool] Fetching weather for location:', location)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Return mock weather data
    return {
      temperature: 72,
      conditions: 'Partly Cloudy',
      humidity: 65,
      windSpeed: 12,
      location,
    }
  },

  enabledByDefault: true,
}
