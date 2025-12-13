# Day 2: How Postgres Stores Data

> **Time:** 2 hours  
> **Goal:** Understand Postgres storage from disk to memory  
> **Analogy:** Like understanding how the browser renders your React components

---

## 🎯 What You'll Learn Today

```
┌─────────────────────────────────────────────────────────────┐
│                     DAY 2 ROADMAP                           │
├─────────────────────────────────────────────────────────────┤
│  1. Storage Hierarchy Overview       (15 min)               │
│  2. Pages - The Building Block       (20 min)               │
│  3. Tuples - The Rows                (20 min)               │
│  4. Heap Files - Where Tables Live   (15 min)               │
│  5. MVCC - Postgres's Superpower     (35 min)               │
│  6. TOAST - Large Value Storage      (15 min)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Storage Hierarchy Overview

### The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR SQL QUERY                                │
│                         ↓                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌────────────────────────────────────────────────────────┐   │
│    │              SHARED BUFFERS (Memory)                    │   │
│    │    ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │   │
│    │    │Page │ │Page │ │Page │ │Page │ │Page │ ...        │   │
│    │    │ 1   │ │ 7   │ │ 23  │ │ 42  │ │ 99  │            │   │
│    │    └─────┘ └─────┘ └─────┘ └─────┘ └─────┘            │   │
│    │         ↑ Cache of frequently used pages               │   │
│    └─────────┼──────────────────────────────────────────────┘   │
│              │                                                   │
│              │ Read/Write                                        │
│              ↓                                                   │
│    ┌────────────────────────────────────────────────────────┐   │
│    │                 DISK (Storage)                          │   │
│    │                                                         │   │
│    │   data/base/16384/                                      │   │
│    │   ├── 16385  ← users table file                        │   │
│    │   ├── 16386  ← products table file                     │   │
│    │   ├── 16387  ← orders table file                       │   │
│    │   └── ...                                               │   │
│    │                                                         │   │
│    └────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Analogy

| Postgres Concept | Frontend Equivalent |
|------------------|---------------------|
| Shared Buffers | Browser's memory cache |
| Pages | Chunks of virtual DOM |
| Disk files | Bundled JS/HTML files |
| WAL | Redux action log |
| Vacuum | Garbage collection |

---

## 2. Pages - The Building Block

### What is a Page?

A **page** (also called a block) is the smallest unit of I/O in Postgres. Every read and write happens in pages.

```
┌─────────────────────────────────────────────────────────────────┐
│                     PAGE (8 KB default)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ PAGE HEADER (24 bytes)                                   │    │
│  │ - pd_lsn: Last WAL position that modified this page     │    │
│  │ - pd_checksum: Data integrity check                      │    │
│  │ - pd_flags: Page status flags                            │    │
│  │ - pd_lower: Offset to start of free space               │    │
│  │ - pd_upper: Offset to end of free space                 │    │
│  │ - pd_special: Offset to special space (for indexes)     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ITEM POINTERS (Line Pointers) - 4 bytes each            │    │
│  │ ┌────┐ ┌────┐ ┌────┐ ┌────┐                             │    │
│  │ │ 1  │ │ 2  │ │ 3  │ │ 4  │  → Points to tuples below   │    │
│  │ └────┘ └────┘ └────┘ └────┘                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                        ↓ pd_lower                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    FREE SPACE                            │    │
│  │                    (for new rows)                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                        ↓ pd_upper                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ TUPLE 4: {id: 4, name: "Product D", price: 75.00}       │    │
│  │ TUPLE 3: {id: 3, name: "Product C", price: 50.00}       │    │
│  │ TUPLE 2: {id: 2, name: "Product B", price: 25.00}       │    │
│  │ TUPLE 1: {id: 1, name: "Product A", price: 99.99}       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Note: Tuples grow from the END of the page toward the beginning!
      Item pointers grow from the START toward the end!
```

### Why 8KB?

- **Balance**: Small enough for efficient memory, large enough to hold useful data
- **Aligned**: Works well with OS virtual memory pages (usually 4KB)
- **Configurable**: Can be 4KB, 16KB, or 32KB at compile time (rarely changed)

### See It Yourself

```sql
-- Check page size
SHOW block_size;  -- Returns 8192 (bytes)

-- See which page each row lives on
SELECT 
    id,
    name,
    ctid  -- "Current Tuple ID" format: (page_number, tuple_number)
FROM products
LIMIT 10;
```

**The `ctid` column:**
```
 id |    name    |  ctid  
----+------------+--------
  1 | Product 1  | (0,1)   ← Page 0, Tuple 1
  2 | Product 2  | (0,2)   ← Page 0, Tuple 2
 ...
 50 | Product 50 | (0,50)  ← Page 0, Tuple 50
 51 | Product 51 | (1,1)   ← Page 1, Tuple 1 (new page!)
```

---

## 3. Tuples - The Rows

### Tuple Structure

Every row in Postgres is a **tuple** with this structure:

```
┌─────────────────────────────────────────────────────────────────┐
│                         TUPLE                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ TUPLE HEADER (23 bytes minimum)                          │    │
│  │                                                          │    │
│  │  t_xmin (4B)   → Transaction ID that created this tuple │    │
│  │  t_xmax (4B)   → Transaction ID that deleted/updated    │    │
│  │  t_cid  (4B)   → Command ID within transaction          │    │
│  │  t_ctid (6B)   → Current tuple ID (page, offset)        │    │
│  │  t_infomask (2B) → Status flags                         │    │
│  │  t_infomask2 (2B) → More flags + column count           │    │
│  │  t_hoff (1B)   → Offset to user data                    │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ NULL BITMAP (optional, 1 bit per column)                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ USER DATA (your actual columns!)                         │    │
│  │                                                          │    │
│  │  id: 1                                                   │    │
│  │  name: "Product A"                                       │    │
│  │  price: 99.99                                            │    │
│  │  ...                                                     │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### The Key Insight: t_xmin and t_xmax

These are **THE KEY** to understanding Postgres:

```
t_xmin = "I was born in transaction #___"
t_xmax = "I died in transaction #___" (0 = still alive)
```

This enables **MVCC** - we'll dive deep into this soon!

### See Tuple Metadata

```sql
-- Enable pageinspect extension
CREATE EXTENSION IF NOT EXISTS pageinspect;

-- See tuple header info (advanced!)
SELECT 
    lp,                          -- Line pointer number
    lp_off,                      -- Offset in page
    lp_len,                      -- Tuple length
    t_xmin,                      -- Creating transaction
    t_xmax,                      -- Deleting transaction (0 = alive)
    t_ctid                       -- Current location
FROM heap_page_items(get_raw_page('products', 0))
LIMIT 5;
```

---

## 4. Heap Files - Where Tables Live

### What is a Heap?

A **heap** is an unordered collection of pages. Tables are stored as heaps.

```
┌─────────────────────────────────────────────────────────────────┐
│                    TABLE "products" (Heap)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   File: data/base/16384/16386                                   │
│                                                                  │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│   │ Page 0  │ │ Page 1  │ │ Page 2  │ │ Page 3  │ ...           │
│   │         │ │         │ │         │ │         │               │
│   │ Rows    │ │ Rows    │ │ Rows    │ │ Rows    │               │
│   │ 1-50    │ │ 51-100  │ │ 101-150 │ │ 151-200 │               │
│   │         │ │         │ │         │ │         │               │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                  │
│   Note: Rows are NOT necessarily in order!                       │
│         Updates may place new version on ANY page with space    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why "Heap"?

- **No guaranteed order**: Unlike a B-tree index, rows can be anywhere
- **Append-friendly**: New rows go wherever there's space
- **Fast inserts**: Just find free space and write
- **Slow full scans**: Must read all pages to find all rows

### File Size Limits

```sql
-- Each table file is max 1GB
-- Larger tables get split into segments:
--   16386      (first 1GB)
--   16386.1    (second 1GB)
--   16386.2    (third 1GB)
--   ...

-- See table file size
SELECT 
    pg_relation_filepath('products') AS filepath,
    pg_size_pretty(pg_relation_size('products')) AS size;
```

---

## 5. MVCC - Postgres's Superpower ⭐

### What is MVCC?

**Multi-Version Concurrency Control** - Postgres keeps multiple versions of each row!

```
┌─────────────────────────────────────────────────────────────────┐
│                         MVCC                                     │
│           "Git for your database rows"                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Instead of:     LOCK → MODIFY → UNLOCK (blocking)              │
│                                                                  │
│  Postgres does:  CREATE NEW VERSION (non-blocking!)             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### How Updates Work

When you UPDATE a row:

```sql
UPDATE products SET price = 150.00 WHERE id = 1;
```

Postgres does NOT modify the existing tuple. Instead:

```
BEFORE UPDATE:
┌─────────────────────────────────────────────────────────────┐
│ Page 0                                                       │
│                                                              │
│   Tuple 1: {id: 1, price: 99.99}                            │
│            t_xmin = 100  (created by txn 100)                │
│            t_xmax = 0    (still alive!)                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘

AFTER UPDATE (Transaction 200):
┌─────────────────────────────────────────────────────────────┐
│ Page 0                                                       │
│                                                              │
│   Tuple 1: {id: 1, price: 99.99}    ← OLD VERSION           │
│            t_xmin = 100                                      │
│            t_xmax = 200  ← MARKED AS DEAD by txn 200        │
│            t_ctid → (0,5) ← Points to new version           │
│                                                              │
│   ...                                                        │
│                                                              │
│   Tuple 5: {id: 1, price: 150.00}   ← NEW VERSION           │
│            t_xmin = 200  (created by txn 200)                │
│            t_xmax = 0    (still alive!)                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Why MVCC is Amazing

```
┌─────────────────────────────────────────────────────────────────┐
│                    MVCC BENEFITS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✓ Readers don't block writers                                  │
│  ✓ Writers don't block readers                                  │
│  ✓ Consistent snapshots for every transaction                   │
│  ✓ No read locks needed!                                        │
│                                                                  │
│  Compare to: Traditional locking (MySQL in some modes)          │
│              Where readers and writers block each other         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Transaction Visibility

Each transaction sees a **snapshot** of the database:

```sql
-- Transaction 300 can see a tuple if:
-- 1. t_xmin < 300 (created before I started)
-- 2. t_xmin is committed (not aborted/in-progress)
-- 3. t_xmax = 0 OR t_xmax >= 300 (not deleted before I started)
-- 4. t_xmax is not committed (or aborted)
```

### See MVCC in Action

```sql
-- Terminal 1: Start a transaction
BEGIN;
SELECT txid_current();  -- Get your transaction ID

-- Terminal 2: Start another transaction  
BEGIN;
SELECT txid_current();  -- Different transaction ID!

-- Terminal 1: Update a row
UPDATE products SET price = 999.99 WHERE id = 1;

-- Terminal 2: Read the same row
SELECT price FROM products WHERE id = 1;
-- Still sees OLD price! MVCC in action!

-- Terminal 1: Commit
COMMIT;

-- Terminal 2: Now read again
SELECT price FROM products WHERE id = 1;
-- STILL sees old price (snapshot was taken at BEGIN)

-- Terminal 2: End transaction and start new one
COMMIT;
BEGIN;
SELECT price FROM products WHERE id = 1;
-- NOW sees 999.99!
```

### The Vacuum Problem

Dead tuples accumulate → VACUUM cleans them up:

```
┌─────────────────────────────────────────────────────────────────┐
│                    VACUUM PROCESS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BEFORE VACUUM:                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │ DEAD  │ LIVE  │ DEAD  │ DEAD  │ LIVE  │ DEAD  │    │         │
│  └────────────────────────────────────────────────────┘         │
│         ↑ Wasted space! (table bloat)                           │
│                                                                  │
│  AFTER VACUUM:                                                   │
│  ┌────────────────────────────────────────────────────┐         │
│  │ FREE  │ LIVE  │ FREE  │ FREE  │ LIVE  │ FREE  │    │         │
│  └────────────────────────────────────────────────────┘         │
│         ↑ Space can be reused for new tuples                    │
│                                                                  │
│  Note: VACUUM doesn't shrink the file!                          │
│        Use VACUUM FULL for that (but it locks the table)        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### The Visibility Map (VM) - VACUUM's Performance Secret

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VISIBILITY MAP                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   VACUUM's most important job isn't freeing space - it's updating       │
│   the Visibility Map to enable INDEX-ONLY SCANS!                        │
│                                                                          │
│   The VM is a bitmap: one bit per heap page                             │
│   • Bit = 1: "All tuples on this page are visible to all transactions" │
│   • Bit = 0: "Page has some dead tuples or recent changes"             │
│                                                                          │
│   WHY IT MATTERS:                                                       │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  Query: SELECT name FROM products WHERE id = 42;                │   │
│   │  Index has: id → name → heap pointer                            │   │
│   │                                                                  │   │
│   │  WITHOUT VM: Index → Read heap page to check visibility        │   │
│   │  WITH VM:    Index → VM says "all visible" → Skip heap!        │   │
│   │                                                                  │   │
│   │  Index-Only Scan = FAST (no heap access!)                       │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   If autovacuum falls behind, VM gets stale, Index-Only Scans          │
│   become Index Scans (heap access), read performance degrades!         │
│                                                                          │
│   For high-throughput READ workloads:                                   │
│   • Lower autovacuum_vacuum_scale_factor (e.g., 0.02 = 2%)            │
│   • Keep VM fresh for Index-Only Scans                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

```sql
-- Check if Index-Only Scans are hitting heap
-- "Heap Fetches" should be close to 0 for true Index-Only performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT name FROM products WHERE id = 42;

-- Check VM status per table
SELECT 
    relname,
    pg_size_pretty(pg_relation_size(c.oid)) AS table_size,
    pg_size_pretty(pg_relation_size(c.reltoastrelid)) AS toast_size,
    n_dead_tup,
    last_autovacuum
FROM pg_class c
JOIN pg_stat_user_tables s ON c.relname = s.relname
WHERE s.schemaname = 'public';
```

### Autovacuum

Postgres runs VACUUM automatically:

```sql
-- See autovacuum settings
SHOW autovacuum;
SHOW autovacuum_vacuum_threshold;
SHOW autovacuum_vacuum_scale_factor;

-- See dead tuples and last vacuum
SELECT 
    relname,
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- For read-heavy tables, tune autovacuum aggressively:
-- ALTER TABLE hot_reads SET (
--     autovacuum_vacuum_scale_factor = 0.02,  -- 2% instead of 20%
--     autovacuum_vacuum_threshold = 50
-- );
```

---

## 6. TOAST - Large Value Storage

### What is TOAST?

**The Oversized-Attribute Storage Technique** - handles values > 2KB

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOAST STRATEGIES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  When a column value is too big for a tuple:                    │
│                                                                  │
│  1. COMPRESS    → Compress in-line (if fits after compression) │
│  2. TOAST OUT   → Store in separate TOAST table                 │
│  3. BOTH        → Compress, then toast if still too big         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Main Table                                               │    │
│  │                                                          │    │
│  │  id: 1                                                   │    │
│  │  name: "Product A"                                       │    │
│  │  description: ──────────────────────┐ TOAST pointer     │    │
│  │                                      ↓                   │    │
│  └──────────────────────────────────────│───────────────────┘    │
│                                         │                        │
│  ┌──────────────────────────────────────↓───────────────────┐    │
│  │ TOAST Table (pg_toast.pg_toast_16386)                    │    │
│  │                                                          │    │
│  │  chunk_id | chunk_seq | chunk_data                       │    │
│  │  ─────────────────────────────────────                   │    │
│  │  1        | 0         | "This is a very long..."        │    │
│  │  1        | 1         | "...description that..."        │    │
│  │  1        | 2         | "...continues here..."          │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why TOAST Matters

```sql
-- Common TOASTed types:
-- TEXT, BYTEA, JSONB, arrays, etc.

-- See TOAST tables
SELECT 
    c.relname AS table_name,
    t.relname AS toast_table,
    pg_size_pretty(pg_relation_size(t.oid)) AS toast_size
FROM pg_class c
JOIN pg_class t ON c.reltoastrelid = t.oid
WHERE c.relkind = 'r'
ORDER BY pg_relation_size(t.oid) DESC;
```

---

## 🎤 Interview Angle

**Q: "How does Postgres handle concurrent updates without locking?"**

> "Postgres uses MVCC - Multi-Version Concurrency Control. Instead of locking rows, it creates new versions. Each tuple has xmin (creating transaction) and xmax (deleting transaction) fields. When you UPDATE, it marks the old tuple as dead and creates a new one. Readers see a consistent snapshot based on their transaction ID, so they never block writers and vice versa. Dead tuples are cleaned up by VACUUM."

**Q: "What is table bloat and how do you fix it?"**

> "Table bloat happens because MVCC leaves dead tuples behind after updates and deletes. These tuples take up space until VACUUM reclaims it. Regular VACUUM marks space as reusable but doesn't shrink the file. VACUUM FULL actually compacts the table but requires an exclusive lock. The best approach is proper autovacuum tuning to prevent bloat from accumulating. For heavily updated tables, you might need to tune autovacuum_vacuum_scale_factor to run more frequently."

**Q: "What's the relationship between pages and tuples?"**

> "A page is the basic unit of I/O - 8KB by default. It's the smallest amount Postgres reads from or writes to disk. A tuple is a row of data stored within a page. Each page has a header, line pointers that reference tuples, free space, and the tuples themselves growing from the end of the page. This design allows efficient space reuse and enables HOT updates."

---

## 🏋️ Exercises

Open `exercises.sql` and try:

1. Use `ctid` to see which pages your rows live on
2. Create a table, insert rows, update some, and see the dead tuples
3. Run VACUUM and observe the change
4. Explore the pageinspect extension

---

## 🧠 Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                    MENTAL MODEL                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Table = Heap = Collection of Pages = Collection of Tuples      │
│                                                                  │
│  Page (8KB) contains:                                           │
│    • Header (metadata)                                          │
│    • Line pointers (like array indices)                         │
│    • Free space                                                 │
│    • Tuples (actual rows)                                       │
│                                                                  │
│  Tuple contains:                                                │
│    • t_xmin/t_xmax (MVCC magic!)                                │
│    • Your actual data                                           │
│                                                                  │
│  MVCC means:                                                    │
│    • Updates create new versions                                │
│    • Readers see consistent snapshots                           │
│    • No read locks!                                             │
│    • VACUUM cleans up dead tuples                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⏭️ Tomorrow: Day 3

We'll explore the **process architecture** - what happens when you connect to Postgres, how queries flow through the system, and the critical role of shared memory.

