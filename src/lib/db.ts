import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite/vector'

let db: PGlite | null = null
let initPromise: Promise<PGlite> | null = null

async function _initDb() {
  if (db) return db
  
  db = new PGlite('idb://pgdb', {
    extensions: {
      vector,
    },
  })
  
  // Ensure pgvector extension is loaded
  try {
    await db.query('CREATE EXTENSION IF NOT EXISTS vector')
  } catch (error) {
    console.warn('[DB] pgvector extension already loaded or not available:', error)
  }
  
  return db
}

// create a singleton instance of the database
export async function getDbInstance() {
  if (!db) {
    if (!initPromise) {
      initPromise = _initDb()
    }
    return initPromise
  }
  return db
}

// function to close the database connection
export async function closeDbConnection() {
  const instance = await getDbInstance()
  await instance.close()
  db = null
}

// parameterized query execution function
export async function executeQuery(query: string, params: unknown[] = []) {
  const instance = await getDbInstance()
  const result = await instance.query(query, params)
  return result
}