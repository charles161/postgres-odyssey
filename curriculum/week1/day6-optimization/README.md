# Day 6: Query Optimization Techniques

> **Time:** 2 hours  
> **Goal:** Learn practical techniques to make queries faster  
> **Analogy:** Like optimizing React re-renders - minimize unnecessary work

---

## 🎯 What You'll Learn Today

```
┌─────────────────────────────────────────────────────────────┐
│                     DAY 6 ROADMAP                           │
├─────────────────────────────────────────────────────────────┤
│  1. Index Strategy                   (25 min)               │
│  2. Query Rewriting Patterns         (30 min)               │
│  3. JOINs vs Subqueries              (20 min)               │
│  4. Aggregation Optimization         (20 min)               │
│  5. Configuration Tuning             (25 min)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Index Strategy

### When to Create Indexes

```
┌─────────────────────────────────────────────────────────────┐
│               INDEX DECISION FRAMEWORK                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CREATE INDEX when:                                          │
│  ✓ Column appears in WHERE frequently                       │
│  ✓ Column used in JOIN conditions                           │
│  ✓ Column used in ORDER BY (especially with LIMIT)          │
│  ✓ Column used in GROUP BY                                  │
│  ✓ High selectivity (query returns < 10-15% of rows)        │
│                                                              │
│  DON'T CREATE INDEX when:                                    │
│  ✗ Table is very small (< 1000 rows)                        │
│  ✗ Column has low cardinality (few distinct values)         │
│  ✗ Table is write-heavy with rare reads                     │
│  ✗ Query returns most of the table                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Index Column Order (Composite Indexes)

```sql
-- Query pattern:
SELECT * FROM orders 
WHERE user_id = 5 
  AND status = 'pending'
  AND created_at > '2024-01-01';

-- Index column order strategy:
-- 1. Equality columns first (user_id, status)
-- 2. Range columns last (created_at)
-- 3. Most selective first among equals

CREATE INDEX idx_orders_optimal 
ON orders(user_id, status, created_at);
```

```
┌─────────────────────────────────────────────────────────────┐
│           COMPOSITE INDEX COLUMN ORDERING                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Rule: Equality → Range → Sort                             │
│                                                              │
│   Query: WHERE user_id = 5                                  │
│          AND status = 'pending'                              │
│          AND created_at > '2024-01-01'                       │
│          ORDER BY created_at                                 │
│                                                              │
│   Best index: (user_id, status, created_at)                 │
│                 ↑         ↑          ↑                       │
│              equality  equality    range+sort               │
│                                                              │
│   This index can:                                            │
│   ✓ Find user_id = 5 (navigate tree)                        │
│   ✓ Find status = 'pending' within that                     │
│   ✓ Scan created_at > date (no separate sort needed!)       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Partial Indexes

Only index rows that matter:

```sql
-- Most queries only care about active products
CREATE INDEX idx_products_active_price 
ON products(price) 
WHERE is_active = true;

-- Only index pending orders (smaller, faster)
CREATE INDEX idx_orders_pending 
ON orders(user_id, created_at) 
WHERE status = 'pending';
```

### Expression Indexes

When you query on transformed values:

```sql
-- Query uses LOWER()
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';

-- Create expression index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
```

---

## 2. Query Rewriting Patterns

### Pattern 1: Avoid Functions on Indexed Columns

```sql
-- ❌ BAD: Function prevents index use
SELECT * FROM orders 
WHERE DATE(created_at) = '2024-01-15';

-- ✅ GOOD: Range query can use index
SELECT * FROM orders 
WHERE created_at >= '2024-01-15' 
  AND created_at < '2024-01-16';

-- ❌ BAD: Math on column
SELECT * FROM products WHERE price * 1.1 > 100;

-- ✅ GOOD: Math on constant
SELECT * FROM products WHERE price > 100 / 1.1;
```

### Pattern 2: Use EXISTS Instead of IN for Large Lists

```sql
-- ❌ Can be slow with large subquery result
SELECT * FROM products 
WHERE category_id IN (
    SELECT id FROM categories WHERE parent_id = 1
);

-- ✅ Often faster: EXISTS stops at first match
SELECT * FROM products p
WHERE EXISTS (
    SELECT 1 FROM categories c 
    WHERE c.id = p.category_id AND c.parent_id = 1
);
```

### Pattern 3: Avoid SELECT *

```sql
-- ❌ Fetches all columns (more data, can't use index-only scan)
SELECT * FROM products WHERE price > 100;

-- ✅ Only fetch what you need
SELECT id, name, price FROM products WHERE price > 100;

-- ✅✅ Even better with covering index:
CREATE INDEX idx_prod_price_cover ON products(price) INCLUDE (id, name);
SELECT id, name, price FROM products WHERE price > 100;
-- Can be Index Only Scan!
```

### Pattern 4: UNION ALL vs UNION

```sql
-- ❌ UNION removes duplicates (requires sort)
SELECT id, name FROM products WHERE category_id = 1
UNION
SELECT id, name FROM products WHERE category_id = 2;

-- ✅ UNION ALL if duplicates are ok/impossible
SELECT id, name FROM products WHERE category_id = 1
UNION ALL
SELECT id, name FROM products WHERE category_id = 2;

-- ✅✅ Even better: single query
SELECT id, name FROM products WHERE category_id IN (1, 2);
```

### Pattern 5: CASE Aggregation vs Multiple Queries

```sql
-- ❌ Multiple queries (3 table scans)
SELECT COUNT(*) FROM orders WHERE status = 'pending';
SELECT COUNT(*) FROM orders WHERE status = 'shipped';
SELECT COUNT(*) FROM orders WHERE status = 'delivered';

-- ✅ Single query (1 table scan)
SELECT 
    COUNT(*) FILTER (WHERE status = 'pending') AS pending,
    COUNT(*) FILTER (WHERE status = 'shipped') AS shipped,
    COUNT(*) FILTER (WHERE status = 'delivered') AS delivered
FROM orders;

-- Alternative with CASE
SELECT 
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shipped,
    SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered
FROM orders;
```

### Pattern 6: Batch Operations

```sql
-- ❌ Many small inserts
INSERT INTO products (name, price) VALUES ('A', 10);
INSERT INTO products (name, price) VALUES ('B', 20);
INSERT INTO products (name, price) VALUES ('C', 30);

-- ✅ Single batch insert
INSERT INTO products (name, price) VALUES 
    ('A', 10),
    ('B', 20),
    ('C', 30);

-- ✅ Or use COPY for bulk loads
COPY products (name, price) FROM '/path/to/data.csv' CSV;
```

---

## 3. JOINs vs Subqueries

### When to Use What

```
┌─────────────────────────────────────────────────────────────┐
│              JOINS vs SUBQUERIES                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Use JOIN when:                                              │
│  • You need columns from multiple tables                    │
│  • The relationship is straightforward                       │
│  • You want the planner to have full flexibility            │
│                                                              │
│  Use Subquery when:                                          │
│  • Checking existence (EXISTS)                              │
│  • Single-value aggregates (scalar subquery)                │
│  • Complex derived tables                                   │
│                                                              │
│  Modern Postgres optimizes both similarly in most cases!    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Subquery Transformations

```sql
-- These are often equivalent after optimization:

-- Subquery in WHERE
SELECT * FROM orders 
WHERE user_id IN (SELECT id FROM users WHERE created_at > '2024-01-01');

-- JOIN version
SELECT o.* FROM orders o
JOIN users u ON o.user_id = u.id
WHERE u.created_at > '2024-01-01';

-- Check the plans!
EXPLAIN ANALYZE SELECT * FROM orders 
WHERE user_id IN (SELECT id FROM users WHERE created_at > '2024-01-01');
```

### Lateral Joins (Correlated Subqueries Done Right)

```sql
-- Get each user's latest order
-- ❌ Correlated subquery (executed per row)
SELECT u.*, (
    SELECT o.id FROM orders o 
    WHERE o.user_id = u.id 
    ORDER BY o.created_at DESC LIMIT 1
) AS latest_order_id
FROM users u;

-- ✅ LATERAL join (more efficient, more flexible)
SELECT u.*, latest.id AS latest_order_id, latest.total_amount
FROM users u
LEFT JOIN LATERAL (
    SELECT id, total_amount
    FROM orders 
    WHERE user_id = u.id 
    ORDER BY created_at DESC 
    LIMIT 1
) latest ON true;
```

---

## 4. Aggregation Optimization

### Optimize GROUP BY

```sql
-- Index on GROUP BY columns helps
CREATE INDEX idx_orders_user ON orders(user_id);

-- This can use the index for grouping
EXPLAIN ANALYZE
SELECT user_id, COUNT(*) 
FROM orders 
GROUP BY user_id;
```

### Pre-aggregate Where Possible

```sql
-- ❌ Aggregating millions of rows each time
SELECT 
    DATE_TRUNC('day', created_at) AS day,
    COUNT(*) AS order_count,
    SUM(total_amount) AS revenue
FROM orders
WHERE created_at > NOW() - INTERVAL '1 year'
GROUP BY 1;

-- ✅ Create a summary table (materialized view)
CREATE MATERIALIZED VIEW daily_order_stats AS
SELECT 
    DATE_TRUNC('day', created_at)::date AS day,
    COUNT(*) AS order_count,
    SUM(total_amount) AS revenue
FROM orders
GROUP BY 1;

-- Refresh periodically
REFRESH MATERIALIZED VIEW daily_order_stats;

-- Query the pre-aggregated data
SELECT * FROM daily_order_stats WHERE day > '2024-01-01';
```

### DISTINCT Optimization

```sql
-- ❌ DISTINCT on large result (full sort)
SELECT DISTINCT user_id FROM orders;

-- ✅ If you just need existence, use GROUP BY
SELECT user_id FROM orders GROUP BY user_id;

-- ✅✅ Even better: recursive CTE for loose index scan
WITH RECURSIVE distinct_users AS (
    (SELECT user_id FROM orders ORDER BY user_id LIMIT 1)
    UNION ALL
    SELECT (SELECT user_id FROM orders WHERE user_id > d.user_id ORDER BY user_id LIMIT 1)
    FROM distinct_users d
    WHERE d.user_id IS NOT NULL
)
SELECT user_id FROM distinct_users WHERE user_id IS NOT NULL;
```

### Window Functions vs Self-Joins

```sql
-- ❌ Self-join for running total
SELECT 
    o1.id,
    o1.total_amount,
    (SELECT SUM(o2.total_amount) 
     FROM orders o2 
     WHERE o2.id <= o1.id) AS running_total
FROM orders o1;

-- ✅ Window function (single pass)
SELECT 
    id,
    total_amount,
    SUM(total_amount) OVER (ORDER BY id) AS running_total
FROM orders;

-- ✅ With ROWS for predictable performance
SELECT 
    id,
    total_amount,
    SUM(total_amount) OVER (
        ORDER BY id 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total
FROM orders;
```

---

## 5. Configuration Tuning

### Critical Settings

```sql
-- Memory settings
SHOW shared_buffers;       -- Page cache (25% of RAM)
SHOW work_mem;             -- Per-operation memory (4MB default)
SHOW maintenance_work_mem; -- For VACUUM, CREATE INDEX

-- Planner settings
SHOW effective_cache_size; -- Hint about OS cache (50-75% RAM)
SHOW random_page_cost;     -- Cost of random I/O (reduce for SSD)
```

### work_mem Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    work_mem TUNING                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Default: 4MB (too low for complex queries)                 │
│                                                              │
│  Problem: work_mem is per OPERATION, not per query!         │
│                                                              │
│  Complex query example:                                      │
│    Hash Join (work_mem)                                     │
│      -> Sort (work_mem)                                     │
│        -> Merge Join (work_mem)                             │
│                                                              │
│  3 operations × 64MB = 192MB per query                      │
│  100 connections × 192MB = 19GB!                            │
│                                                              │
│  Strategy:                                                   │
│  • Set global work_mem conservatively (16-64MB)             │
│  • Increase per-session for complex analytics:              │
│    SET work_mem = '256MB';                                  │
│    -- run complex query --                                  │
│    RESET work_mem;                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### SSD Tuning

```sql
-- For SSD storage, random I/O is much faster
-- Reduce random_page_cost from 4.0 to ~1.1-1.5

SET random_page_cost = 1.1;

-- This makes the planner prefer index scans more often
-- since random reads aren't as expensive on SSD
```

### Statistics Tuning

```sql
-- Increase statistics for columns with skewed distribution
ALTER TABLE products ALTER COLUMN category_id SET STATISTICS 1000;
ANALYZE products;

-- Check current statistics
SELECT 
    attname,
    n_distinct,
    most_common_vals,
    most_common_freqs
FROM pg_stats
WHERE tablename = 'products' AND attname = 'category_id';
```

---

## 🎤 Interview Angle

**Q: "Walk me through your process for optimizing a slow query."**

> "First, I run EXPLAIN ANALYZE BUFFERS to understand the current plan. I look for: row estimate mismatches (fix with ANALYZE), sequential scans with high Rows Removed (add index), hash joins spilling to disk (increase work_mem), and missing indexes on join or filter columns. Then I check if the query can be rewritten - avoiding functions on indexed columns, using EXISTS instead of IN, only selecting needed columns. Finally, I verify the optimization worked and doesn't regress other queries."

**Q: "When would you NOT add an index even if it would speed up a query?"**

> "When the write overhead isn't worth it. Every index slows down INSERT, UPDATE, DELETE. For write-heavy tables with infrequent reads, the index maintenance cost can outweigh read benefits. Also if the query only runs occasionally, like a monthly report - I might accept the slow query or use partial indexes. I'd also skip indexes on very small tables or columns with few distinct values where Postgres would choose seq scan anyway."

**Q: "How do you handle slow aggregation queries?"**

> "First, I ensure GROUP BY columns are indexed. For very large datasets, I consider materialized views to pre-compute aggregates - refresh on a schedule or via triggers. For real-time needs, I might add summary tables updated by triggers. Window functions are usually faster than self-joins for running calculations. If the table is partitioned by time, I ensure partition pruning works with my query."

---

## 🏋️ Exercises

See `exercises.sql` for hands-on optimization practice!

---

## 🧠 Key Takeaways

```
┌─────────────────────────────────────────────────────────────┐
│            QUERY OPTIMIZATION CHECKLIST                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. INDEXES                                                  │
│     □ Column order: equality → range → sort                 │
│     □ Consider partial indexes for common filters           │
│     □ Expression indexes for LOWER(), DATE(), etc.          │
│                                                              │
│  2. QUERY PATTERNS                                          │
│     □ No functions on indexed columns in WHERE              │
│     □ EXISTS instead of IN for large subqueries            │
│     □ SELECT specific columns, not *                        │
│     □ UNION ALL instead of UNION when possible             │
│     □ Batch operations instead of row-by-row               │
│                                                              │
│  3. AGGREGATION                                             │
│     □ Index on GROUP BY columns                             │
│     □ Materialized views for expensive aggregates          │
│     □ Window functions instead of self-joins               │
│                                                              │
│  4. CONFIGURATION                                           │
│     □ Appropriate work_mem for query complexity            │
│     □ random_page_cost tuned for SSD                       │
│     □ Statistics updated with ANALYZE                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏭️ Tomorrow: Day 7

We'll tackle **real-world optimization scenarios** - N+1 queries, pagination at scale, connection pooling, and prepared statements.

