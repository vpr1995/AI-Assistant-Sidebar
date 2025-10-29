# Memory & Bookmarks Storage Architecture

## Storage Strategy Overview

The extension uses a **dual storage** approach optimized for different access patterns:

### 1. Bookmarks: chrome.storage.local (KV Storage)
- **Why**: Fast, simple, good for quick operations
- **Limit**: 500 bookmarks with auto-pruning
- **Performance**: Instant access, no indexing overhead
- **Ideal for**: Quick-saves, fast retrieval, tag filtering

### 2. Memories: PGlite Database (IndexedDB Backend)
- **Why**: Indexed queries, vector search, semantic features
- **Limit**: ~50MB (IndexedDB limit)
- **Performance**: Optimized with indices, cosine similarity search
- **Ideal for**: Knowledge base, semantic search, analytics

---

## Database Architecture (PGlite)

### Initialization
```typescript
// Async lazy initialization on first use
const db = new PGlite('idb://pgdb', {
  extensions: {
    vector,  // pgvector extension
  },
})

// Create pgvector extension
CREATE EXTENSION IF NOT EXISTS vector
```

### Schema: Memories Table
```sql
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,           -- Main memory text
  full_context TEXT,                -- Optional full conversation context
  embedding vector(384),            -- Vector for semantic search (384 dims)
  tags TEXT[] DEFAULT '{}',         -- Array for tag indexing
  category TEXT,                    -- 'fact'|'instruction'|'reference'|'insight'
  timestamp BIGINT NOT NULL,        -- When saved (ms)
  source_url TEXT,                  -- URL if from web/page
  source_message_id TEXT,           -- Original message ID
  source_chat_id TEXT,              -- Which chat
  source_chat_title TEXT,           -- Chat name
  relevance_score FLOAT DEFAULT 0,  -- Usage metric
  last_accessed BIGINT,             -- For tracking
  access_count INT DEFAULT 0,       -- Usage count
  created_at TIMESTAMP,             -- Auto timestamp
  updated_at TIMESTAMP              -- Auto timestamp
)

-- Indices for performance
CREATE INDEX idx_memories_timestamp ON memories(timestamp DESC)
CREATE INDEX idx_memories_category ON memories(category)
CREATE INDEX idx_memories_source_chat ON memories(source_chat_id)
CREATE INDEX idx_memories_tags ON memories USING GIN(tags)  -- For array search
```

### Migrations

**V1: Initial Schema**
- Creates memories table with vectors
- Creates 4 indices
- Idempotent (safe to run multiple times)

**V2: Add source_url Column**
- Adds `source_url TEXT` field
- Handles already-existing columns gracefully
- Idempotent with error suppression

Both stored in `chrome.storage.local` with key: `db_migration_version`

---

## Search Pipeline

### 1. Semantic Search (Vector Embeddings)
```
Query Text → Embedding (gte-small) → Query Vector (384-dim)
                ↓
        For each memory with embedding:
          - Calculate cosine_similarity(query_vec, memory_vec)
          - Score range: 0 (completely different) to 1 (identical)
                ↓
        Filter by threshold (default: 0.6)
        Sort by relevance
        Return top N
```

### 2. Keyword Search (ILIKE)
```
Query Text → Search memories WHERE (
  content ILIKE '%query%' OR
  full_context ILIKE '%query%'
)
```

### 3. Combined Search Results
```
Semantic Results → Merge by ID ← Keyword Results
                    ↓
            Average scores for duplicates
                    ↓
            Filter by min_relevance_score (0.5 default)
                    ↓
            Sort by relevance (highest first)
                    ↓
            Return top maxResults (default: 5)
```

---

## Embedding Generation

### Model: Supabase/gte-small
- **Type**: Dense text embedding model
- **Dimensions**: 384
- **Device**: WebGPU (GPU acceleration)
- **Quantization**: q8 (8-bit, reduces size)
- **Pooling**: mean (average of token embeddings)
- **Normalization**: true (cosine similarity friendly)
- **Max Tokens**: 512 (truncates long text)

### Usage Pattern
```typescript
import { getEmbedding } from '@/lib/embeddings'

const text = "Your memory content"
const embedding: number[] = await getEmbedding(text)  // 384 dimensions
```

---

## Bookmark Storage

### Structure: chrome.storage.local
```typescript
const STORAGE_KEY = 'bookmarks'

interface BookmarkedMessage {
  id: string                    // nanoid()
  content: string              // Message text
  role: 'user' | 'assistant'   // Author
  timestamp: number            // When bookmarked (ms)
  sourceUrl?: string           // URL if from web
  sourceMessageId: string      // Original message ID
  sourceChatId: string         // Which chat
  sourceChatTitle: string      // Chat name
  tags: string[]               // User tags
  note?: string                // Optional note
}
```

### Limits
- **Max Bookmarks**: 500 (auto-prune oldest if exceeded)
- **Storage Size**: Limited by chrome.storage.local quota (~10MB in Manifest V3)
- **Performance**: O(n) for filters, but n ≤ 500 so negligible

---

## Memory Panel: Semantic Search UI

### User Flow
1. User types query in search box
2. Click/enter triggers semantic search
3. Query embedded and compared to all memory embeddings
4. Results sorted by relevance score
5. Display with:
   - Relevance % (score × 100)
   - Content preview
   - Source URL as link
   - Tags and metadata

### Example Result Display
```
75% relevant • From: example.com
"React hooks are functions that let you use state..."

Date: 10/29/2025
Tags: [react, hooks, learning]
```

---

## Memory Save Flow

### From Page Summarization
```
User: Right-click → "Save page summary to memories"
      ↓
Content extracted via @mozilla/readability
      ↓
Summarized with Chrome Summarizer API (or LLM fallback)
      ↓
Generate embedding from summary (384-dim)
      ↓
Save to database with:
  - summary as content
  - sourceUrl from page
  - "page-summary" tag
  - category: 'reference'
  - sourceChatTitle: "Summary: [page title]"
      ↓
Toast progress: "Summarizing..." → "Saving..." → "Success!"
```

### From Bookmark Conversion
```
User: Click "✨ Save to Memories" on bookmark
      ↓
Generate embedding from bookmark content
      ↓
Save to database with:
  - bookmark content as memory content
  - bookmark sourceUrl if available
  - bookmark tags preserved
  - sourceChatId/Title from bookmark
  - category: 'reference'
      ↓
Toast: "Bookmark saved to memories!"
```

---

## Integration Points

### 1. Background Script (src/background.ts)
- Creates context menus
- Extracts page content via content script
- Sends savePageSummaryToMemories message to sidebar

### 2. Content Script (src/content.ts)
- Receives extractPageContent message
- Uses @mozilla/readability to extract main content
- Returns title, content, URL

### 3. Message Listener (src/hooks/use-chrome-message-listener.ts)
- Receives memory save/bookmark requests
- Coordinates with transport for summarization
- Handles embedding generation
- Shows progress toasts

### 4. Memory Tool (src/lib/tools/memory-tool.ts)
- Explicit tool for AI to call
- Searches memories during conversation
- Returns formatted results for AI consumption
- Allows AI to reference user's knowledge base

---

## Migration Strategy

### Idempotent Approach
- All migrations safe to run multiple times
- V1 always runs (ensures base schema)
- V2 only runs if version < 2
- Version stored in chrome.storage.local

### Error Handling
- Gracefully handles already-existing columns
- Logs warnings instead of crashing
- Continues with partial success if possible

### Manual Reset (For Development)
```typescript
await resetDatabase()  // Clears migration version
```

---

## Performance Considerations

### Embeddings
- Generated only once per memory
- Reused for multiple searches
- Cached in memory object (not re-computed)

### Search
- Semantic: O(n) comparisons (n = memories with embeddings)
- Keyword: O(n) ILIKE scan
- For n ≤ 1000, response < 100ms

### Storage
- Bookmarks: O(1) lookup, O(n) filter
- Memories: O(1) by ID, O(log n) by timestamp (indexed)
- Embeddings: ~3KB per memory (384 floats × 4 bytes)

### Limits
- PGlite: ~50MB (IndexedDB quota)
- At 5KB/memory: ~10,000 memories possible
- At 1KB/bookmark: ~500 bookmarks (hard limit)

---

## Error Recovery

### Database Errors
- If DB init fails, user can reload
- Memories won't be available, but chat works
- Migrations re-run on next load

### Search Errors
- Embedding failures logged, memory still saved (keyword-searchable)
- Search returns empty on error (safe fallback)
- Toast shows "search failed" to user

### Storage Errors
- Bookmark save fails if storage quota exceeded
- Memories save fails if PGlite unavailable
- User gets error toast with reason

---

## Privacy Notes

- ✅ All processing local (no cloud uploads)
- ✅ Embeddings computed locally
- ✅ Databases IndexedDB-backed
- ✅ URLs stored only for reference (not sent externally)
- ✅ No external API calls for memory operations
- ❌ Images not stored (excluded from persistence)

---

## Future Enhancements

- [ ] Memory export/import (JSON)
- [ ] Memory collections/folders
- [ ] Shared memory templates
- [ ] Auto-save conversations
- [ ] Memory analytics/insights
- [ ] Full-text search integration
- [ ] Advanced filter UI
- [ ] Memory versioning/history
