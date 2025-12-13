# Performance Tuning Cheatsheet

## EXPLAIN ANALYZE Reading

```
Seq Scan          → Reading all pages (no index)
Index Scan        → Using index + heap fetch
Index Only Scan   → All data in index (fastest)
Bitmap Scan       → Building page bitmap, then fetch
Nested Loop       → For each outer, scan inner
Hash Join         → Build hash table, probe
Merge Join        → Both sorted, zipper merge
```

## Red Flags in Plans

| Issue | Symptom | Fix |
|-------|---------|-----|
| Bad estimates | rows=10 actual=10000 | ANALYZE table |
| Missing index | Seq Scan + high "Rows Removed" | Add index |
| Hash to disk | Batches > 1 | Increase work_mem |
| Sort to disk | "external merge Disk:" | Increase work_mem |
| Nested loop + seq | Seq Scan on inner | Index on join column |

## Index Type Selection

| Query Type | Index |
|------------|-------|
| =, <, >, BETWEEN, ORDER BY | B-tree |
| JSONB @>, ?, array @> | GIN |
| Geometry, ranges | GiST |
| Time-series (ordered) | BRIN |

## Index Best Practices

```sql
-- Composite: equality cols first, range last
CREATE INDEX ON orders(user_id, status, created_at);

-- Partial: only index what you query
CREATE INDEX ON orders(created_at) WHERE status = 'pending';

-- Expression: for function-based queries
CREATE INDEX ON users(LOWER(email));

-- Covering: avoid heap access
CREATE INDEX ON orders(user_id) INCLUDE (status, total);
```

## Memory Settings (% of RAM)

```
shared_buffers        = 25%        # Page cache
effective_cache_size  = 75%        # OS cache hint
work_mem              = 4MB-256MB  # Per operation!
maintenance_work_mem  = 1GB        # VACUUM, INDEX
```

## Query Optimization Patterns

```sql
-- DON'T: Function on column
WHERE DATE(created_at) = '2024-01-15'
-- DO: Range query
WHERE created_at >= '2024-01-15' AND created_at < '2024-01-16'

-- DON'T: Large IN list
WHERE id IN (SELECT ...)  -- if returns many rows
-- DO: EXISTS
WHERE EXISTS (SELECT 1 FROM ... WHERE ...)

-- DON'T: SELECT *
SELECT * FROM orders
-- DO: Select what you need
SELECT id, status FROM orders
```

## Connection Pooling (PgBouncer)

```ini
# Transaction mode for most apps
pool_mode = transaction
default_pool_size = 20
max_client_conn = 1000
```

## Pagination

```sql
-- DON'T: OFFSET (gets slower)
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 10000;

-- DO: Keyset pagination
SELECT * FROM orders 
WHERE (created_at, id) < (cursor_date, cursor_id)
ORDER BY created_at DESC, id DESC LIMIT 20;
```

