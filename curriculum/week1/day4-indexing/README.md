# Day 4: Indexing Deep Dive

> **Time:** 2 hours  
> **Goal:** Master Postgres index types and know when to use each  
> **Analogy:** Like optimizing DOM lookups - from O(n) to O(log n)

---

## 🎯 What You'll Learn Today

```
┌─────────────────────────────────────────────────────────────┐
│                     DAY 4 ROADMAP                           │
├─────────────────────────────────────────────────────────────┤
│  1. Why Indexes Matter               (10 min)               │
│  2. B-tree Indexes                   (30 min)               │
│  3. Hash Indexes                     (10 min)               │
│  4. GIN Indexes                      (25 min)               │
│  5. GiST Indexes                     (15 min)               │
│  6. BRIN Indexes                     (15 min)               │
│  7. Index Selection Strategy         (15 min)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Why Indexes Matter

### Without Index: Sequential Scan

```
Query: SELECT * FROM products WHERE id = 42;

┌─────────────────────────────────────────────────────────────┐
│                   SEQUENTIAL SCAN                            │
│                   (No Index)                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Page 0     Page 1     Page 2     Page 3     Page N        │
│   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐         ┌─────┐    │
│   │ 1-50│──►│51-100──►│101-150─►│151-200 ... ──►│ end │    │
│   │check│   │check│   │check│   │check│         │check│    │
│   └─────┘   └─────┘   └─────┘   └─────┘         └─────┘    │
│                                                              │
│   Must read EVERY page until found (or all pages)           │
│   Time: O(n) - scales linearly with table size              │
│                                                              │
│   500 rows: Fast                                             │
│   500,000 rows: Slow                                         │
│   500,000,000 rows: Unacceptable                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### With Index: Direct Lookup

```
Query: SELECT * FROM products WHERE id = 42;

┌─────────────────────────────────────────────────────────────┐
│                     INDEX SCAN                               │
│                    (With B-tree Index)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   B-tree Index                                               │
│   ┌─────────────────────────────────────────┐               │
│   │             [50, 100, 150]              │  Root         │
│   └─────────────┬───────┬───────────────────┘               │
│           ┌─────┘       └─────┐                              │
│           ↓                   ↓                              │
│   ┌───────────────┐   ┌───────────────┐                     │
│   │ [25, 42, 48]  │   │ [75, 88, 99]  │     Leaf           │
│   │  ↓   ↓   ↓    │   │               │                     │
│   │ ptr ptr ptr   │   │               │                     │
│   └───────┼───────┘   └───────────────┘                     │
│           │                                                  │
│           ↓ Direct pointer to page!                         │
│   ┌─────────────────────────────────────────┐               │
│   │  Table Page 0, Tuple 42                  │               │
│   └─────────────────────────────────────────┘               │
│                                                              │
│   Read: 3 index pages + 1 data page = 4 page reads          │
│   Time: O(log n) - scales logarithmically                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### The Power of Logarithms

| Rows | Seq Scan (O(n)) | Index Scan (O(log n)) |
|------|-----------------|----------------------|
| 1,000 | 1,000 reads | ~10 reads |
| 1,000,000 | 1,000,000 reads | ~20 reads |
| 1,000,000,000 | 1,000,000,000 reads | ~30 reads |

---

## 2. B-tree Indexes

### The Default and Most Common

B-tree = **B**alanced tree. Self-balancing, efficient for:
- Equality: `WHERE id = 42`
- Range: `WHERE price > 100`
- Sorting: `ORDER BY created_at`
- Prefix: `WHERE name LIKE 'Prod%'`

```sql
-- These all use B-tree by default
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_price ON products(price);

-- Explicitly specify B-tree
CREATE INDEX idx_products_sku ON products USING btree(sku);
```

### B-tree Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         B-TREE STRUCTURE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Root Node (one per index)                                             │
│   ┌───────────────────────────────────────────────────────────────┐     │
│   │   [100]        [200]        [300]        [400]                │     │
│   │     ↓            ↓            ↓            ↓                  │     │
│   └─────┼────────────┼────────────┼────────────┼──────────────────┘     │
│         │            │            │            │                         │
│   ┌─────┘      ┌─────┘      ┌─────┘      ┌─────┘                        │
│   ↓            ↓            ↓            ↓                               │
│   Internal Nodes (branch)                                                │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│   │[25][50] │ │[125][150]│ │[225][250]│ │[325][350]│                    │
│   │[75]     │ │[175]    │ │[275]    │ │[375]    │                       │
│   └────┼────┘ └────┼────┘ └────┼────┘ └────┼────┘                       │
│        │           │           │           │                             │
│        ↓           ↓           ↓           ↓                             │
│   Leaf Nodes (contain actual index entries → heap pointers)             │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ [1,ctid] [2,ctid] [3,ctid] ... [24,ctid] [25,ctid] → next leaf  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   Properties:                                                            │
│   • All leaf nodes at same depth (balanced)                             │
│   • Leaf nodes linked for range scans                                   │
│   • ~1% of table size typically                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### B-tree Operations Supported

```sql
-- Equality (=)
SELECT * FROM products WHERE id = 42;
-- Index seek: O(log n)

-- Range (<, >, <=, >=, BETWEEN)
SELECT * FROM products WHERE price BETWEEN 10 AND 100;
-- Index range scan

-- Sorting (ORDER BY)
SELECT * FROM products ORDER BY price DESC LIMIT 10;
-- Index scan in reverse order (no sort needed!)

-- Prefix LIKE
SELECT * FROM products WHERE name LIKE 'Apple%';
-- Index range scan (finds 'Apple' then scans until not matching)

-- NOT supported efficiently:
SELECT * FROM products WHERE name LIKE '%Phone%';  -- No index help!
SELECT * FROM products WHERE LOWER(name) = 'apple'; -- Function on column
```

### Composite (Multi-column) Indexes

```sql
-- Index on multiple columns
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPOSITE INDEX                                       │
│                orders(user_id, created_at)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Sorted first by user_id, then by created_at within each user_id       │
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐    │
│   │ user_id=1, 2024-01-01 │                                        │    │
│   │ user_id=1, 2024-01-15 │ ← All user 1 dates are together       │    │
│   │ user_id=1, 2024-02-01 │                                        │    │
│   │ user_id=2, 2024-01-05 │                                        │    │
│   │ user_id=2, 2024-01-20 │ ← All user 2 dates are together       │    │
│   │ user_id=3, 2024-01-10 │                                        │    │
│   └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│   ✓ Works for: WHERE user_id = 5                                        │
│   ✓ Works for: WHERE user_id = 5 AND created_at > '2024-01-01'          │
│   ✓ Works for: WHERE user_id = 5 ORDER BY created_at                    │
│   ✗ Doesn't help: WHERE created_at > '2024-01-01' (wrong leading col)   │
│                                                                          │
│   RULE: Leftmost prefix principle                                        │
│         (user_id) ✓                                                      │
│         (user_id, created_at) ✓                                          │
│         (created_at) ✗ - can't skip user_id                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Index-Only Scans (Covering Indexes)

```sql
-- If the index contains all needed columns, no heap access needed!
CREATE INDEX idx_products_price_name ON products(price, name);

-- This can be an index-only scan:
SELECT name FROM products WHERE price > 100;
-- All data is in the index itself!

-- Postgres 11+ INCLUDE for covering indexes:
CREATE INDEX idx_orders_user_include ON orders(user_id) INCLUDE (status, total_amount);
-- user_id is searchable, status and total_amount are included but not searchable
```

---

## 3. Hash Indexes

### For Equality Only

```sql
CREATE INDEX idx_products_sku_hash ON products USING hash(sku);
```

```
┌─────────────────────────────────────────────────────────────┐
│                    HASH INDEX                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   hash('SKU-001') → bucket 42                               │
│   hash('SKU-002') → bucket 17                               │
│   hash('SKU-003') → bucket 42 (collision)                   │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  Bucket 17: [SKU-002 → ctid]                         │  │
│   │  Bucket 42: [SKU-001 → ctid] → [SKU-003 → ctid]     │  │
│   │  ...                                                  │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   ✓ Equality: WHERE sku = 'SKU-001'   O(1) average         │
│   ✗ Range: WHERE sku > 'SKU-001'      No help!             │
│   ✗ Sorting: ORDER BY sku            No help!             │
│   ✗ Prefix: WHERE sku LIKE 'SKU%'    No help!             │
│                                                              │
│   When to use:                                               │
│   • High-cardinality equality lookups                       │
│   • UUID or long string exact matches                       │
│   • Rarely useful - B-tree is usually as fast               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. GIN Indexes (Generalized Inverted Index)

### For Containment Queries

Perfect for: arrays, JSONB, full-text search, hstore.

```sql
-- For JSONB
CREATE INDEX idx_products_attributes ON products USING gin(attributes);

-- For arrays
CREATE INDEX idx_products_tags ON products USING gin(tags);

-- For full-text search
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', description));
```

### How GIN Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GIN INDEX                                        │
│                    products.tags (text[])                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Table Data:                                                            │
│   Row 1: tags = ['electronics', 'sale']                                 │
│   Row 2: tags = ['clothing', 'sale']                                    │
│   Row 3: tags = ['electronics', 'featured']                             │
│                                                                          │
│   GIN Index (inverted):                                                  │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │  Key              │  Posting List (row references)               │  │
│   ├──────────────────────────────────────────────────────────────────┤  │
│   │  'clothing'       │  [Row 2]                                     │  │
│   │  'electronics'    │  [Row 1, Row 3]                              │  │
│   │  'featured'       │  [Row 3]                                     │  │
│   │  'sale'           │  [Row 1, Row 2]                              │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│   Query: WHERE tags @> ARRAY['sale']                                    │
│   → Look up 'sale' key → Get [Row 1, Row 2]                             │
│                                                                          │
│   Query: WHERE tags @> ARRAY['electronics', 'sale']                     │
│   → Intersect 'electronics' [1,3] AND 'sale' [1,2] → [Row 1]            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### GIN for JSONB

```sql
-- Sample data
INSERT INTO products (name, attributes) VALUES 
('iPhone', '{"brand": "Apple", "storage": 256, "colors": ["black", "white"]}');

-- GIN index on JSONB
CREATE INDEX idx_attr_gin ON products USING gin(attributes);

-- These queries use the index:
SELECT * FROM products WHERE attributes @> '{"brand": "Apple"}';
SELECT * FROM products WHERE attributes ? 'storage';
SELECT * FROM products WHERE attributes ?| array['brand', 'color'];

-- For path-based queries, use jsonb_path_ops:
CREATE INDEX idx_attr_path ON products USING gin(attributes jsonb_path_ops);
-- Smaller index, but only supports @> operator
```

---

## 5. GiST Indexes (Generalized Search Tree)

### For Geometric and Range Data

```sql
-- For ranges
CREATE INDEX idx_events_during ON events USING gist(during);

-- For geometric data
CREATE INDEX idx_locations_point ON locations USING gist(coordinates);

-- For full-text (alternative to GIN)
CREATE INDEX idx_docs_search ON documents USING gist(search_vector);
```

### GiST vs GIN for Full-Text

```
┌─────────────────────────────────────────────────────────────┐
│              GIN vs GiST for Full-Text Search                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   GIN:                                                       │
│   ✓ Faster lookups (3x)                                     │
│   ✗ Slower updates (insert/update)                          │
│   ✓ Better for mostly-read workloads                        │
│   ✗ Larger index size                                       │
│                                                              │
│   GiST:                                                      │
│   ✓ Faster updates                                          │
│   ✗ Slower lookups                                          │
│   ✓ Better for high-update workloads                        │
│   ✓ Supports more operators (proximity)                     │
│                                                              │
│   Rule: Use GIN unless you have heavy writes                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Range Types with GiST

```sql
-- Create a table with ranges
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    room_id INT,
    during TSRANGE  -- timestamp range
);

-- GiST index for range operations
CREATE INDEX idx_reservations_during ON reservations USING gist(during);

-- Find overlapping reservations
SELECT * FROM reservations 
WHERE during && '[2024-01-01, 2024-01-07)'::tsrange;

-- Find adjacent reservations
SELECT * FROM reservations 
WHERE during -|- '[2024-01-07, 2024-01-14)'::tsrange;
```

---

## 6. BRIN Indexes (Block Range Index)

### For Large, Naturally Ordered Data

BRIN stores summary info per block range. Tiny size, great for ordered data.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BRIN INDEX                                       │
│               orders.created_at (naturally ordered)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Table blocks:                                                          │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│   │Block 0  │ │Block 1  │ │Block 2  │ │Block 3  │ │Block 4  │ ...      │
│   │Jan 1-5  │ │Jan 6-10 │ │Jan 11-15│ │Jan 16-20│ │Jan 21-25│          │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                                          │
│   BRIN index (tiny!):                                                    │
│   ┌────────────────────────────────────────────────────────────────┐    │
│   │ Block Range │ Min created_at │ Max created_at                  │    │
│   ├────────────────────────────────────────────────────────────────┤    │
│   │ 0-127       │ 2024-01-01     │ 2024-01-05                     │    │
│   │ 128-255     │ 2024-01-06     │ 2024-01-10                     │    │
│   │ 256-383     │ 2024-01-11     │ 2024-01-15                     │    │
│   └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│   Query: WHERE created_at = '2024-01-12'                                │
│   → Check BRIN: Only block range 256-383 could contain it              │
│   → Scan just those blocks instead of whole table!                      │
│                                                                          │
│   Size: ~0.01% of table (vs B-tree ~1-3%)                               │
│                                                                          │
│   ✓ Best for: Append-only tables, time-series, logs                     │
│   ✗ Bad for: Randomly ordered data                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

```sql
-- Create BRIN index
CREATE INDEX idx_orders_created_brin ON orders USING brin(created_at);

-- Adjust pages per range (default 128)
CREATE INDEX idx_orders_brin ON orders USING brin(created_at) 
WITH (pages_per_range = 32);  -- Smaller = more precise, larger index
```

---

## 7. Index Selection Strategy

### Decision Flowchart

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INDEX SELECTION FLOWCHART                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   What type of query?                                                    │
│          │                                                               │
│   ┌──────┼──────────────────────────────────────────────────────────┐   │
│   │      │                                                           │   │
│   ↓      ↓                                                           │   │
│ Equality? Range/Sort?                                                │   │
│   │         │                                                         │   │
│   │         └──────────────────────────────┐                         │   │
│   ↓                                        ↓                         │   │
│ High cardinality?              B-tree (default)                      │   │
│ UUID/hash key only?                                                  │   │
│   │                                                                  │   │
│   ├─Yes─→ Hash (or B-tree)                                          │   │
│   │                                                                  │   │
│   └─No──→ B-tree                                                    │   │
│                                                                          │
│   Array/JSONB containment?                                              │
│          │                                                               │
│          └──────────→ GIN                                               │
│                                                                          │
│   Geometric/Range data?                                                  │
│          │                                                               │
│          └──────────→ GiST                                              │
│                                                                          │
│   Huge table, naturally ordered (time-series)?                          │
│          │                                                               │
│          └──────────→ BRIN                                              │
│                                                                          │
│   Full-text search?                                                      │
│          │                                                               │
│          ├─Mostly reads──→ GIN                                          │
│          └─Heavy writes─→ GiST                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Quick Reference Table

| Use Case | Index Type | Example |
|----------|------------|---------|
| Primary key | B-tree | `id` |
| Foreign key | B-tree | `user_id` |
| Unique constraint | B-tree | `email` |
| Range queries | B-tree | `WHERE price > 100` |
| Sorting | B-tree | `ORDER BY created_at` |
| JSONB containment | GIN | `WHERE data @> '{"key": "val"}'` |
| Array contains | GIN | `WHERE tags @> ARRAY['sale']` |
| Full-text search | GIN/GiST | `WHERE search_vector @@ 'term'` |
| Geometry/ranges | GiST | `WHERE location <@ box` |
| Time-series | BRIN | `WHERE timestamp > '2024-01-01'` |
| Large append-only | BRIN | Log tables |

### Index Maintenance Costs

```
┌─────────────────────────────────────────────────────────────┐
│              INDEX OVERHEAD                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Every INSERT/UPDATE/DELETE must also update indexes!       │
│                                                              │
│   Table with 5 indexes:                                      │
│   INSERT = 1 table write + 5 index writes                   │
│                                                              │
│   Too many indexes = Slow writes                             │
│   Too few indexes = Slow reads                               │
│                                                              │
│   STRATEGY:                                                  │
│   1. Index primary keys (automatic)                          │
│   2. Index foreign keys (for JOINs)                          │
│   3. Index commonly filtered columns                         │
│   4. Add more only when queries prove slow                   │
│   5. Remove unused indexes!                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Find Unused Indexes

```sql
-- Find indexes that aren't being used
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,  -- Number of index scans
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelid::regclass::text NOT LIKE '%_pkey'  -- Skip primary keys
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## 🎤 Interview Angle

**Q: "When would you use a GIN index vs a B-tree?"**

> "B-tree is for single values - equality, ranges, sorting. GIN is for containment queries on composite types - does this array contain this element, does this JSONB document contain this key-value pair. GIN creates an inverted index where each element points to all rows containing it. For JSONB queries with @> or ?, use GIN. For simple lookups like id = 5, use B-tree."

**Q: "What is a covering index and when would you use one?"**

> "A covering index includes all columns needed by a query, eliminating heap access entirely - Postgres calls this an index-only scan. Instead of: find row in index → fetch full row from heap, it's just: read directly from index. You'd use it for frequently-run queries where the index + included columns are smaller than touching the heap. In Postgres 11+, use the INCLUDE clause to add columns that are retrieved but not searched."

**Q: "How would you index a large time-series table?"**

> "For append-only time-series data, BRIN indexes are ideal. They're tiny - maybe 0.01% of table size - because they only store min/max values per block range. The key is that the data must be physically ordered by the indexed column. For time-series, new rows go at the end with increasing timestamps, which is perfect for BRIN. You can tune pages_per_range to balance precision vs index size."

---

## 🏋️ Exercises

See `exercises.sql` for hands-on practice with:
1. Creating different index types
2. Comparing query plans with and without indexes
3. Finding unused indexes
4. Composite index ordering

---

## 🧠 Key Takeaways

```
┌─────────────────────────────────────────────────────────────┐
│                    INDEX CHEAT SHEET                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  B-tree (default)                                            │
│  └─ =, <, >, <=, >=, BETWEEN, LIKE 'prefix%', ORDER BY      │
│                                                              │
│  GIN                                                         │
│  └─ @>, ?, ?|, ?&, @@  (arrays, JSONB, full-text)           │
│                                                              │
│  GiST                                                        │
│  └─ <<, >>, &<, &>, ~=, &&  (geometry, ranges, full-text)   │
│                                                              │
│  BRIN                                                        │
│  └─ Huge tables, naturally ordered, minimal overhead         │
│                                                              │
│  Hash                                                        │
│  └─ = only, rarely needed over B-tree                       │
│                                                              │
│  Composite indexes: leftmost prefix rule!                    │
│  Covering indexes: avoid heap access with INCLUDE            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏭️ Tomorrow: Day 5

We'll learn to read `EXPLAIN ANALYZE` output - your superpower for understanding and optimizing queries!

