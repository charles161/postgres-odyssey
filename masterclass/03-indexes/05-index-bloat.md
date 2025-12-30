# Index Bloat and Maintenance

> **The Question**: "Why is my index 10GB when the table is only 2GB?"

---

## Visual 1: How Indexes Get Bloated

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HOW INDEXES GET BLOATED                                                 │
│  ════════════════════════                                                │
│                                                                          │
│  Remember: When you UPDATE a row, PostgreSQL:                           │
│  1. Marks the old tuple as dead                                         │
│  2. Creates a new tuple                                                  │
│  3. Adds a NEW index entry pointing to the new tuple                    │
│  4. The OLD index entry still exists (points to dead tuple)             │
│                                                                          │
│  AFTER MANY UPDATES:                                                     │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  B-tree Index on users(email):                                  │     │
│  │                                                                 │     │
│  │  'alice@v1.com' → (10, 1) ← DEAD (old email)                   │     │
│  │  'alice@v2.com' → (10, 2) ← DEAD (updated email)               │     │
│  │  'alice@v3.com' → (10, 3) ← DEAD (updated again)               │     │
│  │  'alice@v4.com' → (10, 4) ← LIVE (current email)               │     │
│  │                                                                 │     │
│  │  4 entries for 1 row! 3 are useless!                           │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  VACUUM removes dead tuples from HEAP, but index entries remain        │
│  until they're cleaned during index vacuum or REINDEX.                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Measuring Index Bloat

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MEASURING INDEX BLOAT                                                   │
│  ═════════════════════                                                   │
│                                                                          │
│  Quick check:                                                            │
│                                                                          │
│  SELECT                                                                  │
│    indexrelname,                                                         │
│    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,          │
│    idx_scan as index_scans,                                              │
│    idx_tup_read,                                                         │
│    idx_tup_fetch                                                         │
│  FROM pg_stat_user_indexes                                               │
│  ORDER BY pg_relation_size(indexrelid) DESC;                            │
│                                                                          │
│  RESULTS:                                                                │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  indexrelname    │ index_size │ index_scans │ tup_read/fetch  │     │
│  │  ────────────────┼────────────┼─────────────┼────────────────  │     │
│  │  idx_users_email │ 10 GB      │ 50,000      │ 200,000/50,000  │     │
│  │                                                                 │     │
│  │  🚨 RED FLAG: tup_read >> tup_fetch                            │     │
│  │     Reading 200,000 entries to fetch 50,000 rows               │     │
│  │     Index is 4x bloated!                                       │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  Another check - compare to expected size:                              │
│                                                                          │
│  Table has 1M rows, email ~30 bytes average                            │
│  Expected index: ~50MB                                                   │
│  Actual index: 500MB                                                     │
│  Bloat: 10x!                                                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: REINDEX - The Nuclear Option

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REINDEX: Rebuild from Scratch                                           │
│  ═════════════════════════════                                           │
│                                                                          │
│  REINDEX INDEX idx_users_email;                                          │
│                                                                          │
│  What happens:                                                           │
│  1. Takes AccessExclusiveLock on the index (blocks ALL queries!)        │
│  2. Scans the entire table                                               │
│  3. Builds a brand new index                                             │
│  4. Replaces old index with new one                                      │
│  5. Releases lock                                                        │
│                                                                          │
│  ⚠️  PROBLEM: Table is locked! No reads or writes!                      │
│                                                                          │
│  TIMELINE:                                                               │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  0s        30s       60s       90s      120s      150s         │     │
│  │  │─────────│─────────│─────────│────────│─────────│            │     │
│  │  LOCK ════════════════════════════════════════════ UNLOCK      │     │
│  │       │                                       │                 │     │
│  │       ▼                                       ▼                 │     │
│  │   All queries                           All queries             │     │
│  │   blocked                               resume                  │     │
│  │                                                                 │     │
│  │   For a 10GB index: 2-5 minutes of downtime!                  │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: REINDEX CONCURRENTLY - The Safe Way

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REINDEX CONCURRENTLY (PostgreSQL 12+)                                   │
│  ═════════════════════════════════════                                   │
│                                                                          │
│  REINDEX INDEX CONCURRENTLY idx_users_email;                            │
│                                                                          │
│  What happens:                                                           │
│  1. Creates new index with temp name: idx_users_email_ccnew             │
│  2. Builds new index while old index still serves queries               │
│  3. Waits for all transactions using old index to finish                │
│  4. Swaps index names atomically                                        │
│  5. Drops old index                                                      │
│                                                                          │
│  TIMELINE:                                                               │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Old Index:  ══════════════════════════════════════════ DROP   │     │
│  │                                                        ↑        │     │
│  │  New Index:       BUILD ════════════════════════ SWAP ─┘       │     │
│  │                                                                 │     │
│  │  Queries:    SERVED ══════════════════════════════════ SERVED  │     │
│  │              (from old)                               (from new)│     │
│  │                                                                 │     │
│  │  NO DOWNTIME!                                                   │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  TRADEOFFS:                                                              │
│  • Takes ~2x longer (extra bookkeeping)                                 │
│  • Needs 2x disk space temporarily (old + new index)                    │
│  • Can fail if there are long-running transactions                      │
│  • But: NO BLOCKING! Production-safe!                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
