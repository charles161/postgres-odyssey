# Day 5: EXPLAIN ANALYZE Mastery

> **Time:** 2 hours  
> **Goal:** Read execution plans like a pro  
> **Analogy:** Like Chrome DevTools Performance tab for your database

---

## 🎯 What You'll Learn Today

```
┌─────────────────────────────────────────────────────────────┐
│                     DAY 5 ROADMAP                           │
├─────────────────────────────────────────────────────────────┤
│  1. EXPLAIN Basics                   (15 min)               │
│  2. Reading the Output               (30 min)               │
│  3. Scan Types                       (25 min)               │
│  4. Join Types                       (25 min)               │
│  5. Common Patterns & Red Flags      (20 min)               │
│  6. Practice Reading Plans           (15 min)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 0. pg_stat_statements - Your Performance Debugging Superpower

**Before we dive into EXPLAIN, you need to know the most important extension for performance debugging:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PG_STAT_STATEMENTS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   pg_stat_activity tells you what's happening NOW.                      │
│   pg_stat_statements tells you what happened OVER TIME.                 │
│                                                                          │
│   • Aggregates query statistics across all executions                   │
│   • Tracks: call count, total time, mean time, rows returned           │
│   • Normalizes queries (parameters replaced with $1, $2, etc.)         │
│   • Essential for finding the REAL bottlenecks                          │
│                                                                          │
│   Without this, you're flying blind.                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

```sql
-- Enable the extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top 10 queries by TOTAL time (biggest overall impact)
SELECT 
    LEFT(query, 80) AS query,
    calls,
    ROUND(total_exec_time::numeric, 2) AS total_ms,
    ROUND(mean_exec_time::numeric, 2) AS mean_ms,
    ROUND((100 * total_exec_time / SUM(total_exec_time) OVER())::numeric, 2) AS pct
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- Top 10 queries by MEAN time (slowest individual queries)
SELECT 
    LEFT(query, 80) AS query,
    calls,
    ROUND(mean_exec_time::numeric, 2) AS mean_ms,
    rows
FROM pg_stat_statements
WHERE calls > 10  -- Ignore one-off queries
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Top 10 by call count (most frequent - small improvements = big wins)
SELECT 
    LEFT(query, 80) AS query,
    calls,
    ROUND(mean_exec_time::numeric, 2) AS mean_ms,
    ROUND(total_exec_time::numeric, 2) AS total_ms
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;

-- Reset stats after optimization (to measure improvement)
SELECT pg_stat_statements_reset();
```

**The Optimization Formula:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│   total_time = calls × mean_time                                        │
│                                                                          │
│   To reduce total_time:                                                  │
│   1. Reduce mean_time (optimize the query with EXPLAIN ANALYZE)        │
│   2. Reduce calls (batch queries, cache results, fix N+1)              │
│                                                                          │
│   A query called 1 million times that takes 1ms each =                 │
│   1,000,000ms = 16.6 minutes of database time!                         │
│                                                                          │
│   Reducing it to 0.5ms saves 8.3 minutes of CPU per day.               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. EXPLAIN Basics

### The Three Flavors

```sql
-- EXPLAIN: Shows the plan WITHOUT running the query
EXPLAIN SELECT * FROM products WHERE price > 100;

-- EXPLAIN ANALYZE: Actually RUNS the query, shows real timing
EXPLAIN ANALYZE SELECT * FROM products WHERE price > 100;

-- EXPLAIN with all the details
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) 
SELECT * FROM products WHERE price > 100;
```

### Available Options

| Option | Purpose |
|--------|---------|
| `ANALYZE` | Run query, show actual times |
| `BUFFERS` | Show buffer cache hits/misses |
| `COSTS` | Show estimated costs (on by default) |
| `TIMING` | Show actual time per node |
| `FORMAT` | TEXT, JSON, XML, YAML |
| `VERBOSE` | Show extra info (output columns) |

### The Best Combo for Debugging

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT ...;
```

---

## 2. Reading the Output

### Anatomy of EXPLAIN Output

```sql
EXPLAIN ANALYZE SELECT * FROM products WHERE price > 100;
```

```
                                                   QUERY PLAN                                                   
────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 Seq Scan on products  (cost=0.00..15.50 rows=167 width=120) (actual time=0.013..0.089 rows=198 loops=1)
   Filter: (price > 100::numeric)
   Rows Removed by Filter: 302
 Planning Time: 0.058 ms
 Execution Time: 0.115 ms
```

Let's break down each part:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXPLAIN OUTPUT BREAKDOWN                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Seq Scan on products                                                    │
│  └─────────┬─────────┘                                                   │
│            │                                                             │
│            └── Node Type: How data is accessed                          │
│                                                                          │
│  (cost=0.00..15.50 rows=167 width=120)                                  │
│        │      │       │        │                                         │
│        │      │       │        └── width: Avg row size in bytes          │
│        │      │       └── rows: Estimated rows returned                  │
│        │      └── Total cost to get all rows (arbitrary units)           │
│        └── Startup cost before first row                                 │
│                                                                          │
│  (actual time=0.013..0.089 rows=198 loops=1)                            │
│              │        │       │       │                                  │
│              │        │       │       └── How many times node executed  │
│              │        │       └── ACTUAL rows returned                   │
│              │        └── Time to complete (ms)                          │
│              └── Time to first row (ms)                                  │
│                                                                          │
│  Rows Removed by Filter: 302                                            │
│  └── Rows examined but didn't match WHERE                                │
│                                                                          │
│  Planning Time: 0.058 ms   ← Time to generate the plan                   │
│  Execution Time: 0.115 ms  ← Time to actually run                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Estimates vs Actuals

```
Estimated: rows=167
Actual:    rows=198

Estimation was ~18% off - that's fine!
Worry when estimates are 10x or 100x off.
```

Bad estimates = bad plans. Run `ANALYZE` to update statistics:

```sql
ANALYZE products;  -- Update stats for one table
ANALYZE;           -- Update stats for all tables
```

### The Cost Model

```
Cost units are arbitrary but consistent:

seq_page_cost     = 1.0   (baseline: reading a page sequentially)
random_page_cost  = 4.0   (random access is ~4x slower)
cpu_tuple_cost    = 0.01  (processing one tuple)
cpu_operator_cost = 0.0025 (applying an operator)

Total cost = startup_cost + (per-row-cost × rows)
```

---

## 3. Scan Types

### Sequential Scan (Seq Scan)

**Reads every page in the table.**

```
┌─────────────────────────────────────────────────────────────┐
│                    SEQUENTIAL SCAN                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Page 0 → Page 1 → Page 2 → Page 3 → ... → Page N           │
│    ↓        ↓        ↓        ↓              ↓              │
│  check    check    check    check          check            │
│                                                              │
│  When used:                                                  │
│  • No suitable index exists                                 │
│  • Query needs most rows anyway (planner chooses seq)       │
│  • Small table (faster than index overhead)                 │
│                                                              │
│  Red flag when:                                              │
│  • Large table + small result set                           │
│  • High "Rows Removed by Filter"                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

```sql
EXPLAIN ANALYZE SELECT * FROM products WHERE description LIKE '%phone%';
-- No index on description with LIKE '%...%' → Seq Scan
```

### Index Scan

**Uses index to find rows, then fetches from heap.**

```
┌─────────────────────────────────────────────────────────────┐
│                     INDEX SCAN                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   B-tree Index                                               │
│   ┌──────────────────┐                                       │
│   │  [42] → (5,3)    │────┐                                 │
│   └──────────────────┘    │                                 │
│                           ↓                                  │
│   Heap ─────────────►  Page 5, Tuple 3                      │
│                                                              │
│   When used:                                                 │
│   • Index exists on filtered column                         │
│   • Selectivity is good (few rows match)                    │
│   • Need columns not in index                               │
│                                                              │
│   Cost: index traversal + random heap reads                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

```sql
EXPLAIN ANALYZE SELECT * FROM products WHERE id = 42;
-- Uses primary key index → Index Scan
```

### Index Only Scan

**All needed data is in the index - no heap access!**

```
┌─────────────────────────────────────────────────────────────┐
│                  INDEX ONLY SCAN                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   B-tree Index contains (id, name)                          │
│   ┌──────────────────────────────────────────┐              │
│   │  [42, "iPhone"] → done!                  │              │
│   └──────────────────────────────────────────┘              │
│                                                              │
│   No heap access needed!                                     │
│                                                              │
│   Requirements:                                              │
│   • All requested columns in index                          │
│   • Visibility map is up to date (VACUUM)                   │
│                                                              │
│   Watch for: "Heap Fetches: X" in output                    │
│   If X is high → need VACUUM                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

```sql
-- Create covering index
CREATE INDEX idx_prod_price_name ON products(price) INCLUDE (name);

EXPLAIN ANALYZE SELECT name FROM products WHERE price > 200;
-- Index Only Scan (no heap fetches if vacuumed)
```

### Bitmap Index Scan

**Two-phase: build bitmap from index, then fetch matching pages.**

```
┌─────────────────────────────────────────────────────────────┐
│                  BITMAP INDEX SCAN                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Phase 1: Bitmap Index Scan                                │
│   Scan index → Build bitmap of pages to visit               │
│   [0][1][0][1][1][0][0][1][0][0]  ← 1 = page has matches   │
│                                                              │
│   Phase 2: Bitmap Heap Scan                                 │
│   Visit marked pages, recheck condition                     │
│                                                              │
│   When used:                                                 │
│   • Many rows match (too many for index scan)               │
│   • Combining multiple indexes (BitmapAnd, BitmapOr)        │
│   • Random heap access would be too expensive               │
│                                                              │
│   Advantage: Reads pages in physical order (less random I/O)│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

```sql
EXPLAIN ANALYZE 
SELECT * FROM products WHERE price > 50 AND category_id IN (1, 2, 3);
-- May use Bitmap Index Scan with BitmapAnd
```

### Scan Types Summary

| Scan Type | When Used | Speed |
|-----------|-----------|-------|
| Seq Scan | No index / need most rows | O(n) |
| Index Scan | Few rows, need heap data | O(log n) + heap reads |
| Index Only Scan | All data in index | O(log n), fastest |
| Bitmap Index Scan | Medium selectivity, combine conditions | Between seq and index |

---

## 4. Join Types

### Nested Loop Join

**For each row in outer, scan inner.**

```
┌─────────────────────────────────────────────────────────────┐
│                  NESTED LOOP JOIN                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Outer (orders)     Inner (users)                          │
│   ┌─────────────┐    ┌─────────────┐                        │
│   │ order 1     │───►│ scan users  │                        │
│   │ order 2     │───►│ scan users  │                        │
│   │ order 3     │───►│ scan users  │                        │
│   │ ...         │    │ ...         │                        │
│   └─────────────┘    └─────────────┘                        │
│                                                              │
│   Best when:                                                 │
│   • Outer is small                                          │
│   • Inner has index on join column                          │
│   • O(n × m) without index, O(n × log m) with index         │
│                                                              │
│   Worst when:                                                │
│   • Both tables large, no index                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

```sql
EXPLAIN ANALYZE
SELECT o.id, u.username
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.id < 10;
-- Small outer (10 orders) → Nested Loop likely
```

### Hash Join

**Build hash table from smaller table, probe with larger.**

```
┌─────────────────────────────────────────────────────────────┐
│                     HASH JOIN                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Phase 1: Build Hash Table (smaller table)                 │
│   ┌─────────────────────────────────────────┐               │
│   │  users                                   │               │
│   │  id=1 → hash bucket 7                   │               │
│   │  id=2 → hash bucket 3                   │               │
│   │  id=3 → hash bucket 7                   │               │
│   └─────────────────────────────────────────┘               │
│                                                              │
│   Phase 2: Probe (larger table)                             │
│   ┌─────────────────────────────────────────┐               │
│   │  orders                                  │               │
│   │  user_id=1 → lookup bucket 7 → match!   │               │
│   │  user_id=2 → lookup bucket 3 → match!   │               │
│   └─────────────────────────────────────────┘               │
│                                                              │
│   Best when:                                                 │
│   • Hash table fits in work_mem                             │
│   • No useful indexes                                        │
│   • O(n + m) - very efficient!                              │
│                                                              │
│   Watch for:                                                 │
│   • "Batches: X" - means hash spilled to disk (slow!)       │
│   • Increase work_mem if batches > 1                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

```sql
EXPLAIN ANALYZE
SELECT o.id, u.username
FROM orders o
JOIN users u ON o.user_id = u.id;
-- Larger tables, no filter → Hash Join likely
```

### Merge Join

**Sort both tables, then merge like a zipper.**

```
┌─────────────────────────────────────────────────────────────┐
│                     MERGE JOIN                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Both sorted by join column:                               │
│                                                              │
│   orders (sorted)     users (sorted)                        │
│   ┌───────────────┐   ┌───────────────┐                     │
│   │ user_id=1     │←─→│ id=1          │ ✓ match            │
│   │ user_id=1     │←─→│               │ ✓ match            │
│   │ user_id=2     │←─→│ id=2          │ ✓ match            │
│   │ user_id=3     │←─→│ id=3          │ ✓ match            │
│   └───────────────┘   └───────────────┘                     │
│                                                              │
│   Best when:                                                 │
│   • Both inputs already sorted (from index)                 │
│   • Large datasets                                          │
│   • O(n log n + m log m) for sort, O(n + m) for merge       │
│                                                              │
│   Watch for:                                                 │
│   • "Sort" nodes before merge (expensive if no index)       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Join Types Summary

| Join Type | Best For | Memory | Speed |
|-----------|----------|--------|-------|
| Nested Loop | Small outer, indexed inner | Low | Varies |
| Hash Join | No indexes, medium tables | High (work_mem) | O(n+m) |
| Merge Join | Pre-sorted data, large tables | Medium | O(n+m) |

---

## 5. Common Patterns & Red Flags

### 🚩 Red Flag 1: Huge Row Estimate Mismatch

```
Seq Scan on products (cost=... rows=1) (actual ... rows=50000)
                           ↑                        ↑
                     Expected 1              Got 50,000!
```

**Problem:** Statistics are stale.  
**Fix:** `ANALYZE products;`

### 🚩 Red Flag 2: Seq Scan on Large Table

```
Seq Scan on orders (actual rows=1 ... Rows Removed by Filter: 999999)
```

**Problem:** Reading 1M rows to find 1 row.  
**Fix:** Add index on filter column.

### 🚩 Red Flag 3: Hash Batches > 1

```
Hash Join (actual ... Batches: 16)
                              ↑
                       Spilled to disk!
```

**Problem:** Hash table didn't fit in memory.  
**Fix:** Increase `work_mem` for this query:

```sql
SET work_mem = '256MB';  -- Just for this session
-- Or per-query:
SET LOCAL work_mem = '256MB';
```

### 🚩 Red Flag 4: Nested Loop with Seq Scan Inner

```
Nested Loop
  -> Seq Scan on orders (1000 rows)
  -> Seq Scan on users (repeated 1000 times!)
```

**Problem:** Scanning users 1000 times!  
**Fix:** Add index on users join column.

### 🚩 Red Flag 5: Sort Using Disk

```
Sort (actual ... Sort Method: external merge Disk: 50000kB)
```

**Problem:** Sort didn't fit in memory.  
**Fix:** Increase `work_mem` or add index that provides order.

### ✅ Good Patterns

```
-- Index Only Scan with 0 heap fetches
Index Only Scan ... (Heap Fetches: 0)

-- Bitmap combining multiple indexes efficiently
BitmapAnd
  -> Bitmap Index Scan on idx_a
  -> Bitmap Index Scan on idx_b

-- Hash Join completing in memory
Hash Join (Batches: 1)  ← Good, all in memory

-- Limit stopping early
Limit (actual rows=10)
  -> Seq Scan (actual rows=10)  ← Stopped after 10, not full scan
```

---

## 6. Reading Complex Plans

### Tree Structure

Plans read **bottom-up, inside-out**:

```
Hash Join
  -> Seq Scan on orders      ← 1. Read orders first
  -> Hash                    
       -> Seq Scan on users  ← 2. Build hash from users
                             ← 3. Then join
```

### Example: Complex Query

```sql
EXPLAIN ANALYZE
SELECT 
    u.username,
    COUNT(o.id) as order_count,
    SUM(o.total_amount) as total_spent
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.username
ORDER BY total_spent DESC
LIMIT 10;
```

```
Limit  (cost=... rows=10) (actual time=5.2..5.3 rows=10)
  -> Sort  (cost=... rows=50) (actual time=5.2..5.2 rows=10)
        Sort Key: sum(o.total_amount) DESC
        Sort Method: top-N heapsort  Memory: 26kB
        -> HashAggregate  (cost=... rows=50) (actual time=5.0..5.1 rows=50)
              Group Key: u.id
              Batches: 1  Memory: 40kB
              -> Hash Join  (cost=... rows=200) (actual time=1.0..4.5 rows=200)
                    Hash Cond: (o.user_id = u.id)
                    -> Index Scan using idx_orders_created on orders o  
                          (actual time=0.1..3.0 rows=200)
                          Index Cond: (created_at > ...)
                    -> Hash  (actual time=0.8..0.8 rows=100)
                          Buckets: 1024  Memory: 15kB
                          -> Seq Scan on users u  
                                (actual time=0.01..0.5 rows=100)
```

Reading order:
1. Seq Scan users (build hash)
2. Index Scan orders with date filter
3. Hash Join users + orders
4. HashAggregate (GROUP BY)
5. Sort by total_spent
6. Limit to 10

---

## 🎤 Interview Angle

**Q: "How do you identify a slow query?"**

> "I use EXPLAIN ANALYZE with BUFFERS to see actual execution. Key things I look for: large gaps between estimated and actual rows (stale stats), sequential scans on large tables with high 'Rows Removed by Filter', hash joins with multiple batches (need more work_mem), and nested loops with sequential scan on the inner table (missing index)."

**Q: "What's the difference between cost and actual time?"**

> "Cost is the planner's estimate in arbitrary units - it's relative, used to compare plans. Actual time is real milliseconds from EXPLAIN ANALYZE. When the planner picks a bad plan, it's usually because the cost estimate was wrong, often due to stale statistics or underestimated row counts."

**Q: "When would you use Index Scan vs Bitmap Scan?"**

> "Index Scan is for highly selective queries - a few rows out of millions. It's fast but does random I/O to the heap. Bitmap Scan is chosen when more rows match - maybe 5-15% of the table. It builds a bitmap of pages to visit, then reads them in physical order, converting random I/O to sequential. The planner switches based on selectivity estimates."

---

## 🏋️ Exercises

See `exercises.sql` for hands-on practice with:
1. Reading basic EXPLAIN output
2. Comparing scan types
3. Identifying red flags
4. Forcing different join types

---

## 🧠 Key Takeaways

```
┌─────────────────────────────────────────────────────────────┐
│               EXPLAIN ANALYZE CHEAT SHEET                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SCAN TYPES:                                                │
│  • Seq Scan: Full table read, O(n)                         │
│  • Index Scan: B-tree + heap fetch, O(log n)               │
│  • Index Only Scan: B-tree only, fastest                   │
│  • Bitmap Scan: Build bitmap → batch heap reads            │
│                                                              │
│  JOIN TYPES:                                                │
│  • Nested Loop: Small outer + indexed inner                │
│  • Hash Join: Build hash + probe, O(n+m)                   │
│  • Merge Join: Both sorted, zipper merge                   │
│                                                              │
│  RED FLAGS:                                                 │
│  • rows=X actual=Y where Y >> X (run ANALYZE)             │
│  • Seq Scan + high "Rows Removed" (add index)             │
│  • Hash Batches > 1 (increase work_mem)                   │
│  • Nested Loop + Seq Scan inner (add index)               │
│  • Sort to disk (increase work_mem)                        │
│                                                              │
│  ALWAYS USE: EXPLAIN (ANALYZE, BUFFERS)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏭️ Tomorrow: Day 6

We'll apply this knowledge to **optimize real queries** - rewriting queries, choosing indexes, and understanding when to break the rules.

