# Missing Indexes: The Sequential Scan Problem

> **The Question**: "Why is my simple SELECT taking 30 seconds?"

---

## Visual 1: The Horror of Sequential Scan

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE HORROR OF SEQUENTIAL SCAN                                          │
│  ═════════════════════════════                                           │
│                                                                          │
│  Query: SELECT * FROM users WHERE email = 'alice@example.com';          │
│  Table: 10 million users, ~10 GB on disk                                │
│                                                                          │
│  WITHOUT INDEX (Sequential Scan):                                        │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  PostgreSQL must read EVERY page of the table:                 │     │
│  │                                                                 │     │
│  │  Page 1:    [✗] [✗] [✗] [✗] [✗] [✗] ... (100 rows checked)    │     │
│  │  Page 2:    [✗] [✗] [✗] [✗] [✗] [✗] ... (100 rows checked)    │     │
│  │  Page 3:    [✗] [✗] [✗] [✗] [✗] [✗] ... (100 rows checked)    │     │
│  │  ...                                                            │     │
│  │  Page 50,000: [✗] [✗] [✓] [✗] [✗] [✗] ... (FOUND ONE!)         │     │
│  │  ...                                                            │     │
│  │  Page 100,000: [✗] [✗] [✗] [✗] [✗] [✗] ... (still checking!)  │     │
│  │                                                                 │     │
│  │  Even after finding the row, it keeps going!                   │     │
│  │  (Maybe there's another alice@example.com?)                    │     │
│  │                                                                 │     │
│  │  Total: 10,000,000 rows checked                                │     │
│  │  Time: 30+ seconds                                              │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: With Index - Lightning Fast

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WITH INDEX: Lightning Fast                                              │
│  ══════════════════════════                                              │
│                                                                          │
│  CREATE INDEX idx_users_email ON users(email);                          │
│                                                                          │
│  B-tree Index Structure:                                                 │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │                         [m]                                     │     │
│  │                        ╱   ╲                                    │     │
│  │                       ╱     ╲                                   │     │
│  │                    [f]       [r]                                │     │
│  │                   ╱   ╲     ╱   ╲                               │     │
│  │                  ╱     ╲   ╱     ╲                              │     │
│  │             [a-e]  [f-l] [m-q]  [r-z]                          │     │
│  │                ↓                                                │     │
│  │         'alice@...' → ctid (5000, 3)                           │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  Index Lookup:                                                           │
│  • Level 1: Is 'a' < 'm'? Go left.              (1 page read)          │
│  • Level 2: Is 'a' < 'f'? Go left.              (1 page read)          │
│  • Level 3: Scan leaf page for 'alice@...'     (1 page read)          │
│  • Heap: Fetch row at ctid (5000, 3)           (1 page read)          │
│                                                                          │
│  Total: 4 page reads                                                     │
│  Time: 0.1 milliseconds                                                  │
│                                                                          │
│  SPEEDUP: 300,000x faster!                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: Finding Missing Indexes

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FINDING MISSING INDEXES                                                 │
│  ════════════════════════                                                │
│                                                                          │
│  METHOD 1: pg_stat_user_tables                                          │
│  ─────────────────────────────                                           │
│  SELECT                                                                  │
│    schemaname, relname,                                                  │
│    seq_scan,           -- Number of sequential scans                    │
│    seq_tup_read,       -- Rows read via seq scan                        │
│    idx_scan,           -- Number of index scans                         │
│    idx_tup_fetch       -- Rows fetched via index                        │
│  FROM pg_stat_user_tables                                                │
│  WHERE seq_scan > 0                                                      │
│  ORDER BY seq_tup_read DESC;                                             │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  relname  │ seq_scan │ seq_tup_read │ idx_scan │ idx_tup_fetch│     │
│  │ ──────────┼──────────┼──────────────┼──────────┼──────────────│     │
│  │ users     │ 50,000   │ 500,000,000  │ 100      │ 1,000        │     │
│  │           │    ↑                                               │     │
│  │           │  🚨 RED FLAG!                                      │     │
│  │           │  50K sequential scans, only 100 index scans       │     │
│  │           │  500 billion rows read sequentially!              │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  METHOD 2: EXPLAIN ANALYZE                                               │
│  ─────────────────────────                                               │
│  EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com'; │
│                                                                          │
│  Seq Scan on users  (cost=0.00..250000.00 rows=1 width=100)             │
│    Filter: (email = 'test@example.com'::text)                           │
│    Rows Removed by Filter: 9999999                                       │
│    Actual Time: 30000.000..30000.000 rows=1                              │
│                     ↑                                                    │
│            🚨 30 SECONDS!                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: Common Missing Index Scenarios

```
┌─────────────────────────────────────────────────────────────────────────┐
│  COMMON MISSING INDEX SCENARIOS                                          │
│  ═══════════════════════════════                                         │
│                                                                          │
│  1. FOREIGN KEY COLUMNS                                                  │
│  ──────────────────────                                                  │
│  -- Orders table with user_id foreign key                               │
│  SELECT * FROM orders WHERE user_id = 123;                              │
│  -- FK doesn't auto-create index!                                        │
│  CREATE INDEX idx_orders_user_id ON orders(user_id);                    │
│                                                                          │
│  2. STATUS/TYPE COLUMNS (with low selectivity caveat)                   │
│  ────────────────────────────────────────────────────                    │
│  -- If status='pending' is 1% of rows: index helps                     │
│  -- If status='active' is 80% of rows: seq scan is fine                │
│  CREATE INDEX idx_orders_status ON orders(status)                       │
│    WHERE status = 'pending';  -- Partial index!                         │
│                                                                          │
│  3. DATE RANGE QUERIES                                                   │
│  ─────────────────────                                                   │
│  SELECT * FROM events WHERE created_at > '2024-01-01';                  │
│  CREATE INDEX idx_events_created ON events(created_at);                 │
│                                                                          │
│  4. COMPOSITE QUERIES                                                    │
│  ────────────────────                                                    │
│  SELECT * FROM users WHERE country = 'US' AND status = 'active';        │
│  CREATE INDEX idx_users_country_status ON users(country, status);       │
│  -- Order matters! Most selective column first (usually)                │
│                                                                          │
│  5. ORDER BY / LIMIT                                                     │
│  ────────────────────                                                    │
│  SELECT * FROM posts ORDER BY created_at DESC LIMIT 20;                 │
│  -- Without index: sort 10 million rows, return 20                      │
│  CREATE INDEX idx_posts_created_desc ON posts(created_at DESC);         │
│  -- With index: read 20 rows directly from index                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
