import { describe, it, expect } from 'vitest'
import {
  ALL_TOOLS,
  buildEnabledTools,
  getDefaultToolSelection,
  getSelectedToolIds,
} from './registry'

describe('Tools Registry', () => {
  describe('ALL_TOOLS', () => {
    it('should have at least one tool defined', () => {
      expect(ALL_TOOLS.length).toBeGreaterThan(0)
    })

    it('should have tools with required properties', () => {
      ALL_TOOLS.forEach(tool => {
        expect(tool).toHaveProperty('id')
        expect(tool).toHaveProperty('label')
        expect(tool).toHaveProperty('description')
        expect(tool).toHaveProperty('inputSchema')
        expect(tool).toHaveProperty('execute')
        expect(tool).toHaveProperty('enabledByDefault')
      })
    })

    it('should have unique tool IDs', () => {
      const ids = ALL_TOOLS.map(tool => tool.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should include weather tool', () => {
      const weatherTool = ALL_TOOLS.find(t => t.id === 'getWeather')
      expect(weatherTool).toBeDefined()
      expect(weatherTool?.label).toBe('Weather')
    })

    it('should include web search tool', () => {
      const searchTool = ALL_TOOLS.find(t => t.id === 'webSearch')
      expect(searchTool).toBeDefined()
    })

    it('should include memory tool', () => {
      const memoryTool = ALL_TOOLS.find(t => t.id === 'searchMemories')
      expect(memoryTool).toBeDefined()
    })
  })

  describe('buildEnabledTools', () => {
    it('should return undefined when no tools enabled', () => {
      const result = buildEnabledTools([])
      expect(result).toBeUndefined()
    })

    it('should return tools object with enabled tools', () => {
      const result = buildEnabledTools(['getWeather'])
      expect(result).toBeDefined()
      expect(result).toHaveProperty('getWeather')
    })

    it('should only include enabled tools', () => {
      const result = buildEnabledTools(['getWeather'])
      expect(result).toBeDefined()
      expect(Object.keys(result || {})).toHaveLength(1)
      expect(result).toHaveProperty('getWeather')
    })

    it('should handle multiple enabled tools', () => {
      const result = buildEnabledTools(['getWeather', 'webSearch'])
      expect(result).toBeDefined()
      expect(Object.keys(result || {})).toHaveLength(2)
      expect(result).toHaveProperty('getWeather')
      expect(result).toHaveProperty('webSearch')
    })

    it('should ignore non-existent tool IDs', () => {
      const result = buildEnabledTools(['getWeather', 'non-existent-tool'])
      expect(result).toBeDefined()
      expect(Object.keys(result || {})).toHaveLength(1)
      expect(result).toHaveProperty('getWeather')
    })
  })

  describe('getDefaultToolSelection', () => {
    it('should return an object with all tool IDs', () => {
      const selection = getDefaultToolSelection()
      const toolIds = ALL_TOOLS.map(t => t.id)
      
      toolIds.forEach(id => {
        expect(selection).toHaveProperty(id)
      })
    })

    it('should respect enabledByDefault property', () => {
      const selection = getDefaultToolSelection()
      
      ALL_TOOLS.forEach(tool => {
        expect(selection[tool.id]).toBe(tool.enabledByDefault)
      })
    })
  })

  describe('getSelectedToolIds', () => {
    it('should return empty array when no tools selected', () => {
      const selection = { getWeather: false, webSearch: false }
      const ids = getSelectedToolIds(selection)
      expect(ids).toEqual([])
    })

    it('should return IDs of selected tools', () => {
      const selection = { getWeather: true, webSearch: false, searchMemories: true }
      const ids = getSelectedToolIds(selection)
      expect(ids).toContain('getWeather')
      expect(ids).toContain('searchMemories')
      expect(ids).not.toContain('webSearch')
    })

    it('should handle all tools selected', () => {
      const selection = { getWeather: true, webSearch: true, searchMemories: true }
      const ids = getSelectedToolIds(selection)
      expect(ids).toHaveLength(3)
    })

    it('should handle empty selection object', () => {
      const selection = {}
      const ids = getSelectedToolIds(selection)
      expect(ids).toEqual([])
    })
  })
})
