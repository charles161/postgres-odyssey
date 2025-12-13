# Day 7: Real-World Optimization Scenarios

> **Time:** 2 hours  
> **Goal:** Solve common performance problems you'll face in production  
> **Analogy:** Like fixing React performance issues - you've hit them as a frontend dev

---

## 🎯 What You'll Learn Today

```
┌─────────────────────────────────────────────────────────────┐
│                     DAY 7 ROADMAP                           │
├─────────────────────────────────────────────────────────────┤
│  1. The N+1 Query Problem            (25 min)               │
│  2. Pagination at Scale              (25 min)               │
│  3. Connection Pooling               (20 min)               │
│  4. Prepared Statements              (15 min)               │
│  5. Lock Contention                  (20 min)               │
│  6. Hot Tables and Partitioning      (15 min)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. The N+1 Query Problem

### The Problem

```
┌─────────────────────────────────────────────────────────────┐
│                  THE N+1 PROBLEM                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Frontend equivalent: Calling API in a loop                │
│                                                              │
│   // ❌ BAD React pattern:                                   │
│   users.map(user => fetch(`/api/orders/${user.id}`))        │
│                                                              │
│   Database equivalent:                                       │
│   1 query:  SELECT * FROM users                             │
│   N queries: For each user → SELECT * FROM orders           │
│              WHERE user_id = ?                               │
│                                                              │
│   100 users = 101 queries!                                  │
│   1000 users = 1001 queries!                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Example: ORM-Generated N+1

```python
# Python ORM example (same problem exists in all ORMs)
users = User.query.all()  # 1 query

for user in users:
    # Each access triggers a new query!
    print(user.orders)    # N queries
```

```sql
-- What actually happens:
SELECT * FROM users;

-- Then for EACH user:
SELECT * FROM orders WHERE user_id = 1;
SELECT * FROM orders WHERE user_id = 2;
SELECT * FROM orders WHERE user_id = 3;
-- ... 97 more queries ...
```

### Solution 1: JOIN

```sql
-- ✅ Single query with JOIN
SELECT 
    u.id AS user_id,
    u.username,
    o.id AS order_id,
    o.total_amount,
    o.status
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.id IN (1, 2, 3, ...);
```

### Solution 2: Batch Loading (When JOIN is Too Wide)

```sql
-- First query: Get users
SELECT * FROM users WHERE ...;

-- Second query: Get ALL orders for those users at once
SELECT * FROM orders WHERE user_id IN (1, 2, 3, 4, 5, ...);

-- Then JOIN in application code
-- 2 queries total, not N+1!
```

### Solution 3: Array Aggregation

```sql
-- Get users with their orders as JSON arrays
SELECT 
    u.id,
    u.username,
    COALESCE(
        json_agg(
            json_build_object(
                'order_id', o.id,
                'amount', o.total_amount,
                'status', o.status
            )
        ) FILTER (WHERE o.id IS NOT NULL),
        '[]'
    ) AS orders
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.username;
```

---

## 2. Pagination at Scale

### OFFSET Problem

```
┌─────────────────────────────────────────────────────────────┐
│              THE OFFSET PROBLEM                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   SELECT * FROM orders ORDER BY id OFFSET 1000000 LIMIT 10; │
│                                                              │
│   What Postgres must do:                                     │
│   1. Scan/sort 1,000,010 rows                               │
│   2. Skip first 1,000,000                                   │
│   3. Return last 10                                         │
│                                                              │
│   Page 1:    Fast  (OFFSET 0)                               │
│   Page 100:  Slow  (OFFSET 990)                             │
│   Page 10000: Very slow (OFFSET 99990)                      │
│   Page 100000: Timeout (OFFSET 999990)                      │
│                                                              │
│   OFFSET scales linearly with page number!                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Solution: Keyset Pagination (Cursor-Based)

```sql
-- ❌ OFFSET pagination (gets slower with each page)
SELECT * FROM orders 
ORDER BY created_at DESC, id DESC 
LIMIT 20 OFFSET 10000;

-- ✅ Keyset pagination (consistent speed)
-- Page 1:
SELECT * FROM orders 
ORDER BY created_at DESC, id DESC 
LIMIT 20;

-- Page N (use last row's values as cursor):
SELECT * FROM orders 
WHERE (created_at, id) < ('2024-01-15 10:30:00', 12345)
ORDER BY created_at DESC, id DESC 
LIMIT 20;
```

### Why Keyset Works

```
┌─────────────────────────────────────────────────────────────┐
│             KEYSET PAGINATION                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Index: (created_at DESC, id DESC)                         │
│                                                              │
│   Query: WHERE (created_at, id) < (cursor_values)           │
│                                                              │
│   Postgres can:                                              │
│   1. Use index to jump directly to cursor position          │
│   2. Scan forward 20 rows                                   │
│   3. Done! No skipping millions of rows                     │
│                                                              │
│   Time: O(log n + page_size) regardless of page number!    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Pattern

```sql
-- Create optimal index
CREATE INDEX idx_orders_cursor ON orders(created_at DESC, id DESC);

-- First page
SELECT id, created_at, status, total_amount
FROM orders
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- Return cursor with response: {created_at: "2024-01-15T10:30:00Z", id: 12345}

-- Next page (client sends cursor)
SELECT id, created_at, status, total_amount
FROM orders
WHERE (created_at, id) < ('2024-01-15T10:30:00', 12345)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| OFFSET | Simple, random access | Slow for deep pages |
| Keyset | Consistent speed | No random jump, cursor required |

---

## 3. Connection Pooling

### The Problem

```
┌─────────────────────────────────────────────────────────────┐
│            CONNECTION OVERHEAD                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Each Postgres connection:                                  │
│   • Fork a new process (~10MB+ RAM)                         │
│   • Authentication handshake                                │
│   • Initialize backend                                      │
│                                                              │
│   Cost: ~100-200ms to establish                             │
│                                                              │
│   Serverless/Lambda problem:                                │
│   1000 concurrent functions = 1000 connections              │
│   But max_connections = 100!                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Solution: Connection Pooler (PgBouncer)

```
┌─────────────────────────────────────────────────────────────────┐
│                     WITH PGBOUNCER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Application Servers (1000 connections)                  │   │
│   └─────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│                             ↓                                    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │            PgBouncer (Pool Manager)                      │   │
│   │                                                          │   │
│   │   Connection Pool: 20 connections                        │   │
│   │   Waiting queue for overflow                             │   │
│   │   Connection reuse across requests                       │   │
│   │                                                          │   │
│   └─────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│                             ↓                                    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │            Postgres (20 backends)                        │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   1000 app connections → 20 Postgres connections!               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Pool Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| Session | Connection held for session duration | Legacy apps with session state |
| Transaction | Connection returned after each transaction | Most applications (recommended) |
| Statement | ⚠️ **DANGEROUS** - returned after each statement | Almost never use! |

### ⚠️ Statement Mode - THE HIDDEN PERFORMANCE KILLER

```
┌─────────────────────────────────────────────────────────────────────────┐
│       STATEMENT MODE - ALMOST NEVER USE THIS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Statement mode returns connection after EVERY SINGLE QUERY.           │
│                                                                          │
│   WHAT BREAKS:                                                          │
│   • PREPARED STATEMENTS - Discarded immediately!                        │
│   • SET LOCAL - Gone after one query!                                   │
│   • TRANSACTIONS - Can't even do BEGIN...COMMIT!                       │
│   • Everything that needs 2+ statements                                 │
│                                                                          │
│   THE CPU SPIKE DISASTER:                                               │
│   Your ORM (Django, Rails, Prisma, etc.) by default:                   │
│   → Tries to use prepared statements                                    │
│   → PgBouncer Statement mode discards them                              │
│   → Every query re-parses and re-plans                                  │
│   → CPU at 100%, query latency through the roof                         │
│                                                                          │
│   ONLY use statement mode for trivial single-SELECT monitoring apps.   │
│   For everything else: Use TRANSACTION mode.                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### ⚠️ Transaction Mode Gotchas (Critical Knowledge!)

```
┌─────────────────────────────────────────────────────────────────────────┐
│       TRANSACTION MODE BREAKS THESE FEATURES                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   In Transaction Mode, each transaction may get a DIFFERENT backend.   │
│   Session-level state is LOST between transactions!                    │
│                                                                          │
│   BROKEN FEATURES:                                                      │
│                                                                          │
│   1. PREPARED STATEMENTS                                                │
│      Client: PREPARE stmt AS SELECT ...;                               │
│      Client: EXECUTE stmt(1);  ← Works                                  │
│      -- connection returned to pool --                                  │
│      Client: EXECUTE stmt(2);  ← ERROR: stmt doesn't exist!            │
│                                                                          │
│   2. SET LOCAL / SET SESSION                                            │
│      SET LOCAL work_mem = '256MB';                                     │
│      -- next query might use different connection! --                  │
│                                                                          │
│   3. ADVISORY LOCKS                                                     │
│      SELECT pg_advisory_lock(123);                                     │
│      -- You might lose the lock when connection switches! --           │
│                                                                          │
│   4. TEMPORARY TABLES                                                   │
│      CREATE TEMP TABLE foo (...);                                      │
│      -- Gone when connection changes! --                               │
│                                                                          │
│   5. LISTEN/NOTIFY                                                      │
│      Requires persistent connection to receive notifications           │
│                                                                          │
│   REAL-WORLD CPU SPIKE SCENARIO:                                       │
│   "Why is our CPU at 100%?"                                            │
│   "ORM tries to use prepared statements..."                            │
│   "PgBouncer transaction mode discards them..."                        │
│   "Every query re-parses! No plan caching!"                            │
│                                                                          │
│   SOLUTIONS:                                                            │
│   • Disable prepared statements in ORM config                          │
│   • Use session mode for apps that need these features                │
│   • Supavisor: Named prepared statements survive in session mode      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Supabase Approach

Supabase uses **Supavisor** (their Elixir-based pooler):
- Multi-tenant pooling
- Named pools per database
- Built-in for all Supabase projects
- **Transaction mode by default** (be aware of the gotchas above!)
- Session mode available for features requiring persistent connections

---

## 4. Prepared Statements

### What They Are

```sql
-- Without preparation: Parse + Plan + Execute each time
SELECT * FROM orders WHERE user_id = 1;
SELECT * FROM orders WHERE user_id = 2;
SELECT * FROM orders WHERE user_id = 3;

-- With preparation: Parse + Plan once, Execute many times
PREPARE get_user_orders(int) AS
SELECT * FROM orders WHERE user_id = $1;

EXECUTE get_user_orders(1);
EXECUTE get_user_orders(2);
EXECUTE get_user_orders(3);
```

### Performance Benefit

```
┌─────────────────────────────────────────────────────────────┐
│           PREPARED STATEMENT SAVINGS                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Normal query (each time):                                  │
│   [Parse: 0.1ms] [Plan: 0.5ms] [Execute: 1ms] = 1.6ms       │
│                                                              │
│   Prepared statement:                                        │
│   First time: [Prepare: 0.6ms] [Execute: 1ms] = 1.6ms       │
│   After:      [Execute: 1ms] = 1ms                          │
│                                                              │
│   For 1000 executions:                                       │
│   Normal: 1000 × 1.6ms = 1600ms                             │
│   Prepared: 0.6ms + 1000 × 1ms = 1000.6ms                   │
│                                                              │
│   37% faster!                                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Generic vs Custom Plans

```sql
-- First 5 executions: custom plan (uses parameter values)
-- After: may switch to generic plan (ignores values)

-- Force custom plan for skewed data:
PREPARE get_orders(text) AS
SELECT * FROM orders WHERE status = $1;

-- Status 'pending' is 1% of rows → index scan best
-- Status 'delivered' is 80% of rows → seq scan best
-- Generic plan can't optimize for this!
```

### Connection Pooling + Prepared Statements

**⚠️ Warning:** Transaction-mode pooling can break prepared statements!

```
Client A: PREPARE stmt AS ...;
Client A: EXECUTE stmt(1);  ← Works
-- Connection returned to pool --
-- Connection given to Client B --
Client A: EXECUTE stmt(2);  ← ERROR: stmt doesn't exist!
```

**Solution:** Use session mode or re-prepare per transaction.

---

## 5. Lock Contention

### Types of Locks

```
┌─────────────────────────────────────────────────────────────┐
│                  POSTGRES LOCKS                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Row-level locks (usually fine):                            │
│  • FOR UPDATE, FOR SHARE                                    │
│  • Only block conflicting writes                            │
│                                                              │
│  Table-level locks (can be problems):                       │
│  • ACCESS EXCLUSIVE (DDL operations)                        │
│  • Blocks ALL access to table                               │
│                                                              │
│  Common bottlenecks:                                        │
│  • Long transactions holding locks                          │
│  • DDL on busy tables                                       │
│  • Autovacuum blocked by transactions                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Dangerous DDL Operations

```sql
-- ❌ LOCKS TABLE! All queries block
ALTER TABLE orders ADD COLUMN new_col TEXT DEFAULT 'value';

-- ✅ Postgres 11+: No lock for nullable with default
ALTER TABLE orders ADD COLUMN new_col TEXT;
UPDATE orders SET new_col = 'value' WHERE new_col IS NULL;
-- (But UPDATE still takes time for large tables)

-- ✅ Even better: Add constraint with NOT VALID
ALTER TABLE orders ADD CONSTRAINT check_status 
CHECK (status IN ('pending', 'shipped', 'delivered')) NOT VALID;

-- Then validate separately (allows reads):
ALTER TABLE orders VALIDATE CONSTRAINT check_status;
```

### Monitor Locks

```sql
-- See current locks
SELECT 
    pid,
    relation::regclass AS table,
    mode,
    granted,
    query
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE relation IS NOT NULL
ORDER BY relation, mode;

-- Find blocking queries
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.query AS blocked_query,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.query AS blocking_query
FROM pg_locks blocked_locks
JOIN pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.relation = blocked_locks.relation
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

### Avoid Lock Contention

```sql
-- 1. Keep transactions short
BEGIN;
-- Do minimal work inside transaction
COMMIT;

-- 2. Use NOWAIT or SKIP LOCKED
SELECT * FROM orders WHERE id = 1 FOR UPDATE NOWAIT;
-- Fails immediately if locked

SELECT * FROM orders WHERE status = 'pending' 
FOR UPDATE SKIP LOCKED LIMIT 10;
-- Skips locked rows, great for job queues!

-- 3. Batch updates to reduce lock time
UPDATE orders SET status = 'processed' 
WHERE id IN (SELECT id FROM orders WHERE status = 'pending' LIMIT 1000);
-- Instead of updating millions at once
```

---

## 6. Hot Tables and Partitioning

### When Tables Get Too Hot

```
┌─────────────────────────────────────────────────────────────┐
│               HOT TABLE SYMPTOMS                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  • Frequent autovacuum can't keep up                        │
│  • Table bloat growing                                      │
│  • Index scans getting slower                               │
│  • Lock contention on updates                               │
│  • Backup times increasing                                  │
│                                                              │
│  Candidates:                                                 │
│  • Events/analytics tables (append-heavy)                   │
│  • Session tables (update-heavy)                            │
│  • Audit logs (large, growing)                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Solution: Table Partitioning

```sql
-- Create partitioned table
CREATE TABLE events (
    id BIGSERIAL,
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE events_2024_01 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
    
CREATE TABLE events_2024_02 PARTITION OF events
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Index each partition
CREATE INDEX ON events_2024_01 (created_at);
CREATE INDEX ON events_2024_02 (created_at);
```

### Partition Benefits

```
┌─────────────────────────────────────────────────────────────┐
│              PARTITIONING BENEFITS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. PARTITION PRUNING                                       │
│     Query for January only scans January partition          │
│                                                              │
│  2. EASIER MAINTENANCE                                      │
│     VACUUM one partition without locking others            │
│     DROP old partitions instead of DELETE (instant!)       │
│                                                              │
│  3. PARALLEL OPERATIONS                                     │
│     Different partitions can be indexed in parallel        │
│                                                              │
│  4. SMALLER INDEXES                                         │
│     Each partition has smaller, faster indexes             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Auto-Create Partitions

```sql
-- Use pg_partman extension for automatic management
CREATE EXTENSION pg_partman;

SELECT partman.create_parent(
    p_parent_table := 'public.events',
    p_control := 'created_at',
    p_interval := 'monthly',
    p_premake := 3  -- Create 3 months ahead
);
```

---

## 🎤 Interview Angle

**Q: "How would you handle pagination for millions of records?"**

> "OFFSET pagination degrades linearly - page 10000 requires scanning 100k+ rows. I'd use keyset/cursor pagination: track the last row's sort key, then query with WHERE (sort_key) > (cursor) LIMIT N. This uses the index directly and has consistent performance regardless of page depth. Trade-off is you can't jump to arbitrary pages, but infinite scroll or next/prev navigation works great."

**Q: "What's your approach to the N+1 query problem?"**

> "First, identify it - usually ORM lazy loading. Solutions: eager load with JOINs when the result set is reasonable, or use batch loading with IN clauses to fetch related data in one query then join in application code. For complex cases, I might use JSON aggregation to return nested data in a single query. Key is going from O(N) queries to O(1)."

**Q: "How do you handle lock contention on a busy table?"**

> "Prevention: keep transactions short, batch large updates, use SKIP LOCKED for queue-like patterns. For DDL, use techniques like adding columns as nullable first, or ADD CONSTRAINT with NOT VALID then VALIDATE separately. Monitor with pg_locks and pg_stat_activity. If it's a chronic issue, might need to partition the table or reconsider the access patterns."

---

## 🧠 Key Takeaways

```
┌─────────────────────────────────────────────────────────────┐
│         REAL-WORLD OPTIMIZATION PATTERNS                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  N+1 QUERIES:                                               │
│  • Use JOINs or batch loading (IN clause)                   │
│  • JSON aggregation for nested data                         │
│                                                              │
│  PAGINATION:                                                 │
│  • Keyset pagination for scale                              │
│  • Avoid OFFSET for deep pages                              │
│                                                              │
│  CONNECTIONS:                                                │
│  • Use PgBouncer/Supavisor                                  │
│  • Transaction mode for most apps                           │
│                                                              │
│  LOCKS:                                                      │
│  • Keep transactions short                                  │
│  • SKIP LOCKED for queues                                   │
│  • Careful with DDL on busy tables                          │
│                                                              │
│  HOT TABLES:                                                │
│  • Partition by time for append-heavy                       │
│  • Drop partitions instead of DELETE                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎉 Week 1 Complete!

You've learned:
- SQL fundamentals
- Postgres storage internals (pages, tuples, MVCC)
- Process and memory architecture
- All index types and when to use each
- Reading EXPLAIN ANALYZE
- Query optimization techniques
- Real-world performance patterns

---

## ⏭️ Next Week: Week 2

Starting Monday:
- **Day 8:** Replication fundamentals
- **Day 9:** High availability patterns
- **Day 10:** Scaling Postgres

You're building serious Postgres expertise! 🐘

