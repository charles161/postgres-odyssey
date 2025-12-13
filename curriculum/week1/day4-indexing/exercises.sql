-- ============================================================
-- DAY 4 EXERCISES: Indexing Deep Dive
-- ============================================================


-- ============================================================
-- EXERCISE 1: See the Difference Indexes Make
-- ============================================================

-- First, let's check the current indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Now let's compare with and without index
-- Look at the execution plans!

-- Query WITHOUT using index (force seq scan)
SET enable_indexscan = off;
SET enable_bitmapscan = off;

EXPLAIN ANALYZE
SELECT * FROM products WHERE id = 42;
-- Note the "Seq Scan" and the time

-- Re-enable indexes
SET enable_indexscan = on;
SET enable_bitmapscan = on;

-- Same query WITH index
EXPLAIN ANALYZE
SELECT * FROM products WHERE id = 42;
-- Note the "Index Scan" and faster time!


-- ============================================================
-- EXERCISE 2: B-tree for Range Queries
-- ============================================================

-- Create an index on price
CREATE INDEX IF NOT EXISTS idx_products_price_btree ON products(price);

-- Range query using the index
EXPLAIN ANALYZE
SELECT * FROM products WHERE price BETWEEN 50 AND 100;

-- Order by using the index (no separate sort!)
EXPLAIN ANALYZE
SELECT * FROM products ORDER BY price LIMIT 10;


-- ============================================================
-- EXERCISE 3: Composite Index Column Order
-- ============================================================

-- Create a composite index
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Query that uses both columns (good!)
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 5 AND status = 'pending';

-- Query that uses first column only (works!)
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 5;

-- Query that uses second column only (won't use index!)
EXPLAIN ANALYZE
SELECT * FROM orders WHERE status = 'pending';
-- Notice it does a Seq Scan or Bitmap Scan, not Index Scan

-- Cleanup
DROP INDEX idx_orders_user_status;


-- ============================================================
-- EXERCISE 4: GIN Index for JSONB
-- ============================================================

-- Check current GIN indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE indexdef LIKE '%gin%';

-- Query using GIN index
EXPLAIN ANALYZE
SELECT * FROM products 
WHERE attributes @> '{"color": "blue"}';

-- Query for key existence
EXPLAIN ANALYZE
SELECT * FROM products 
WHERE attributes ? 'size';


-- ============================================================
-- EXERCISE 5: GIN Index for Arrays
-- ============================================================

-- Query products by tag
EXPLAIN ANALYZE
SELECT * FROM products 
WHERE tags @> ARRAY['tag1'];

-- Query with ANY (array overlap)
EXPLAIN ANALYZE
SELECT * FROM products 
WHERE tags && ARRAY['tag1', 'tag5'];


-- ============================================================
-- EXERCISE 6: Covering Index (Index-Only Scan)
-- ============================================================

-- Create covering index
CREATE INDEX idx_products_covering ON products(price) INCLUDE (name, stock_quantity);

-- This query can be satisfied entirely from the index!
EXPLAIN ANALYZE
SELECT name, stock_quantity 
FROM products 
WHERE price > 100;
-- Look for "Index Only Scan"!

-- Check visibility map (affects index-only scans)
SELECT 
    relname,
    n_live_tup,
    n_dead_tup
FROM pg_stat_user_tables 
WHERE relname = 'products';

-- Vacuum to update visibility map
VACUUM products;

-- Try again - should be more efficient
EXPLAIN ANALYZE
SELECT name, stock_quantity 
FROM products 
WHERE price > 100;

-- Cleanup
DROP INDEX idx_products_covering;


-- ============================================================
-- EXERCISE 7: BRIN Index for Time-Series Data
-- ============================================================

-- Check order of data (should be roughly ordered by created_at)
SELECT 
    ctid,
    created_at
FROM orders
ORDER BY ctid
LIMIT 20;

-- Create BRIN index
CREATE INDEX idx_orders_created_brin ON orders USING brin(created_at);

-- Check index size (should be tiny!)
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE indexname = 'idx_orders_created_brin';

-- Compare to B-tree size
CREATE INDEX idx_orders_created_btree ON orders(created_at);

SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE indexname IN ('idx_orders_created_brin', 'idx_orders_created_btree');

-- Query using BRIN
EXPLAIN ANALYZE
SELECT * FROM orders 
WHERE created_at > NOW() - INTERVAL '7 days';

-- Cleanup
DROP INDEX idx_orders_created_brin;
DROP INDEX idx_orders_created_btree;


-- ============================================================
-- EXERCISE 8: Find Unused Indexes
-- ============================================================

-- Check index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan AS times_used,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- Find potentially wasteful indexes (never used, takes space)
SELECT 
    schemaname || '.' || tablename AS table,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelid::regclass::text NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;


-- ============================================================
-- EXERCISE 9: Index on Expression
-- ============================================================

-- Query with function (can't use normal index)
EXPLAIN ANALYZE
SELECT * FROM users WHERE LOWER(email) = 'user1@example.com';

-- Create expression index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- Now it uses the index!
EXPLAIN ANALYZE
SELECT * FROM users WHERE LOWER(email) = 'user1@example.com';

-- Cleanup
DROP INDEX idx_users_email_lower;


-- ============================================================
-- EXERCISE 10: Partial Index
-- ============================================================

-- Only index active products (saves space if many inactive)
CREATE INDEX idx_products_active ON products(name) WHERE is_active = true;

-- Query for active products uses the partial index
EXPLAIN ANALYZE
SELECT * FROM products WHERE is_active = true AND name LIKE 'Product 1%';

-- Query for inactive doesn't use it
EXPLAIN ANALYZE
SELECT * FROM products WHERE is_active = false AND name LIKE 'Product 1%';

-- Cleanup
DROP INDEX idx_products_active;


-- ============================================================
-- EXERCISE 11: Check Index Bloat
-- ============================================================

-- Estimate index bloat
SELECT
    current_database() AS db,
    nspname AS schemaname,
    tblname,
    idxname,
    bs*(relpages)::bigint AS real_size,
    bs*(relpages-est_pages_ff)::bigint AS extra_size,
    100 * (relpages-est_pages_ff)::float / relpages AS extra_pct,
    CASE
        WHEN relpages > est_pages_ff THEN
            pg_size_pretty((bs*(relpages-est_pages_ff))::bigint)
        ELSE '0 bytes'
    END AS bloat_size
FROM (
    SELECT
        coalesce(1 + ceil(reltuples/floor((bs-pageopqdata-pagehdr)/(4+nulldatahdrwidth)::float)), 0) AS est_pages_ff,
        bs,
        nspname,
        tblname,
        idxname,
        relpages
    FROM (
        SELECT
            8192 AS bs,
            schemaname AS nspname,
            tablename AS tblname,
            indexname AS idxname,
            idx.relpages,
            (SELECT reltuples FROM pg_class WHERE oid = idx.indexrelid) AS reltuples,
            23 AS pagehdr,
            16 AS pageopqdata,
            24 AS nulldatahdrwidth
        FROM pg_stat_user_indexes idx
        JOIN pg_class c ON c.relname = idx.indexname
        WHERE idx.schemaname = 'public'
    ) AS s
) AS s2
WHERE relpages > 0
ORDER BY extra_size DESC
LIMIT 10;

