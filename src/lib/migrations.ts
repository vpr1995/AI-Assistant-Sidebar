/**
 * Database Migration & Initialization Module
 * Handles database setup and migrations for memory storage
 */

import { initializeMemoryTable } from './memory-storage'

const MIGRATION_VERSION_KEY = 'db_migration_version'
const CURRENT_VERSION = 2

/**
 * Initialize database with all necessary tables and indices
 * Safe to call multiple times - idempotent operations
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('[DB Migration] Starting database initialization...')

    // Get current migration version
    const data = await chrome.storage.local.get(MIGRATION_VERSION_KEY)
    const currentVersion = (data[MIGRATION_VERSION_KEY] as number) || 0

    console.log('[DB Migration] Current migration version:', currentVersion)

    // Always run v1 initialization to ensure tables exist
    await runMigrationV1()
    
    // Run v2 migration if needed (adds source_url column)
    if (currentVersion < 2) {
      await runMigrationV2()
      await chrome.storage.local.set({ [MIGRATION_VERSION_KEY]: 2 })
      console.log('[DB Migration] Migration v2 completed and version updated')
    }
    
    // Update version if only v1 was done
    if (currentVersion < 1) {
      await chrome.storage.local.set({ [MIGRATION_VERSION_KEY]: Math.max(currentVersion, 1) })
      console.log('[DB Migration] Migration v1 completed and version updated')
    }

    console.log('[DB Migration] Database initialization complete')
  } catch (error) {
    console.error('[DB Migration] Failed to initialize database:', error)
    throw error
  }
}

/**
 * Migration v1: Initial schema setup
 * Creates memories table with vector extension support
 */
async function runMigrationV1(): Promise<void> {
  try {
    // Initialize memory table
    await initializeMemoryTable()

    console.log('[DB Migration] Memory table initialized')
  } catch (error) {
    console.error('[DB Migration] Migration v1 failed:', error)
    throw error
  }
}

/**
 * Migration v2: Add source_url column to memories table
 * Safely adds column if it doesn't exist
 */
async function runMigrationV2(): Promise<void> {
  try {
    const { executeQuery } = await import('./db')
    
    // Try to add source_url column if it doesn't exist
    // PGlite doesn't support IF NOT EXISTS for ALTER TABLE, so we need to handle the error
    try {
      await executeQuery(`
        ALTER TABLE memories 
        ADD COLUMN source_url TEXT
      `)
      console.log('[DB Migration] Added source_url column to memories table')
    } catch (error: unknown) {
      // Check if column already exists (error message will contain "already exists" or similar)
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
      if (errorMessage.includes('already exists') || errorMessage.includes('column "source_url"')) {
        console.log('[DB Migration] source_url column already exists, skipping')
      } else {
        // Re-throw if it's a different error
        throw error
      }
    }

    console.log('[DB Migration] Migration v2 completed')
  } catch (error) {
    console.error('[DB Migration] Migration v2 failed:', error)
    throw error
  }
}

/**
 * Reset database (for development/testing)
 * Clears all data
 */
export async function resetDatabase(): Promise<void> {
  try {
    console.log('[DB Migration] Resetting database...')

    // Clear migration version
    await chrome.storage.local.remove(MIGRATION_VERSION_KEY)

    console.log('[DB Migration] Database reset complete')
  } catch (error) {
    console.error('[DB Migration] Failed to reset database:', error)
    throw error
  }
}

/**
 * Get database status
 */
export async function getDatabaseStatus(): Promise<{
  initialized: boolean
  version: number
  lastMigration: number
}> {
  try {
    const data = await chrome.storage.local.get(MIGRATION_VERSION_KEY)
    const version = (data[MIGRATION_VERSION_KEY] as number) || 0

    return {
      initialized: version === CURRENT_VERSION,
      version,
      lastMigration: Date.now(),
    }
  } catch (error) {
    console.error('[DB Migration] Failed to get status:', error)
    return {
      initialized: false,
      version: 0,
      lastMigration: 0,
    }
  }
}
