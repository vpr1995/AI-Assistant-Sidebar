import { describe, it, expect } from 'vitest'
import {
  ALL_TOOLS,
  buildEnabledTools,
  getDefaultToolSelection,
  getSelectedToolIds,
} from '../lib/tools/registry'

describe('Tools Registry', () => {
  describe('ALL_TOOLS', () => {
    it('should have at least one tool defined', () => {
      expect(ALL_TOOLS.length).toBeGreaterThan(0)
    })

    it('should have tools with required properties', () => {
      ALL_TOOLS.forEach(tool => {
        expect(tool).toHaveProperty('id')
        expect(tool).toHaveProperty('name')
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
      const weatherTool = ALL_TOOLS.find(t => t.id === 'weather')
      expect(weatherTool).toBeDefined()
      expect(weatherTool?.name).toBe('Get Weather')
    })

    it('should include web search tool', () => {
      const searchTool = ALL_TOOLS.find(t => t.id === 'web-search')
      expect(searchTool).toBeDefined()
    })

    it('should include memory tool', () => {
      const memoryTool = ALL_TOOLS.find(t => t.id === 'memory')
      expect(memoryTool).toBeDefined()
    })
  })

  describe('buildEnabledTools', () => {
    it('should return undefined when no tools enabled', () => {
      const result = buildEnabledTools([])
      expect(result).toBeUndefined()
    })

    it('should return tools object with enabled tools', () => {
      const result = buildEnabledTools(['weather'])
      expect(result).toBeDefined()
      expect(result).toHaveProperty('weather')
    })

    it('should only include enabled tools', () => {
      const result = buildEnabledTools(['weather'])
      expect(result).toBeDefined()
      expect(Object.keys(result || {})).toHaveLength(1)
      expect(result).toHaveProperty('weather')
    })

    it('should handle multiple enabled tools', () => {
      const result = buildEnabledTools(['weather', 'web-search'])
      expect(result).toBeDefined()
      expect(Object.keys(result || {})).toHaveLength(2)
      expect(result).toHaveProperty('weather')
      expect(result).toHaveProperty('web-search')
    })

    it('should ignore non-existent tool IDs', () => {
      const result = buildEnabledTools(['weather', 'non-existent-tool'])
      expect(result).toBeDefined()
      expect(Object.keys(result || {})).toHaveLength(1)
      expect(result).toHaveProperty('weather')
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
      const selection = { weather: false, 'web-search': false }
      const ids = getSelectedToolIds(selection)
      expect(ids).toEqual([])
    })

    it('should return IDs of selected tools', () => {
      const selection = { weather: true, 'web-search': false, memory: true }
      const ids = getSelectedToolIds(selection)
      expect(ids).toContain('weather')
      expect(ids).toContain('memory')
      expect(ids).not.toContain('web-search')
    })

    it('should handle all tools selected', () => {
      const selection = { weather: true, 'web-search': true, memory: true }
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
