-- ============================================================
-- DAY 5 EXERCISES: EXPLAIN ANALYZE Mastery
-- ============================================================


-- ============================================================
-- EXERCISE 1: Basic EXPLAIN vs EXPLAIN ANALYZE
-- ============================================================

-- Just the plan (doesn't run)
EXPLAIN 
SELECT * FROM products WHERE id = 1;

-- Plan + actual execution (runs the query)
EXPLAIN ANALYZE
SELECT * FROM products WHERE id = 1;

-- Full details including buffer usage
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM products WHERE id = 1;

-- Question: What's the difference in the output?


-- ============================================================
-- EXERCISE 2: Compare Scan Types
-- ============================================================

-- Index Scan (using primary key)
EXPLAIN ANALYZE
SELECT * FROM products WHERE id = 42;

-- Force Sequential Scan
SET enable_indexscan = off;
SET enable_bitmapscan = off;

EXPLAIN ANALYZE
SELECT * FROM products WHERE id = 42;

-- Reset
SET enable_indexscan = on;
SET enable_bitmapscan = on;

-- Question: How much slower is the Seq Scan?


-- ============================================================
-- EXERCISE 3: Bitmap Scan in Action
-- ============================================================

-- This query likely uses Bitmap Index Scan
EXPLAIN ANALYZE
SELECT * FROM products 
WHERE price > 100 AND price < 300;

-- Combined conditions with BitmapAnd/BitmapOr
EXPLAIN ANALYZE
SELECT * FROM products 
WHERE (price > 200 OR stock_quantity < 10);


-- ============================================================
-- EXERCISE 4: Index Only Scan
-- ============================================================

-- Create a covering index
CREATE INDEX idx_products_price_covering 
ON products(price) INCLUDE (name);

-- Vacuum to update visibility map
VACUUM products;

-- This should be Index Only Scan
EXPLAIN ANALYZE
SELECT name FROM products WHERE price > 200;

-- Check for Heap Fetches
-- (Should be 0 or low after VACUUM)

DROP INDEX idx_products_price_covering;


-- ============================================================
-- EXERCISE 5: Join Types
-- ============================================================

-- Small result → Nested Loop likely
EXPLAIN ANALYZE
SELECT o.id, u.username
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.id = 1;

-- Larger result → Hash Join likely
EXPLAIN ANALYZE
SELECT o.id, u.username
FROM orders o
JOIN users u ON o.user_id = u.id;

-- Force Merge Join
SET enable_hashjoin = off;
SET enable_nestloop = off;

EXPLAIN ANALYZE
SELECT o.id, u.username
FROM orders o
JOIN users u ON o.user_id = u.id;

-- Reset
SET enable_hashjoin = on;
SET enable_nestloop = on;


-- ============================================================
-- EXERCISE 6: Identify the Red Flag - Estimate Mismatch
-- ============================================================

-- First, intentionally mess up statistics
DELETE FROM products WHERE id > 400;
-- (Now stats think we have 500 rows, but only ~400 exist)

EXPLAIN ANALYZE
SELECT * FROM products;
-- Compare rows estimate vs actual

-- Fix it
ANALYZE products;

EXPLAIN ANALYZE
SELECT * FROM products;
-- Now estimates should match


-- ============================================================
-- EXERCISE 7: Identify the Red Flag - Rows Removed
-- ============================================================

-- Query without useful index
EXPLAIN ANALYZE
SELECT * FROM products 
WHERE description LIKE '%phone%';

-- Notice "Rows Removed by Filter" - this is often a red flag!
-- It means we're scanning rows that don't match

-- For this case, you'd need full-text search index
-- (We'll cover that in optimization)


-- ============================================================
-- EXERCISE 8: Hash Join Batches
-- ============================================================

-- Set very low work_mem to force spill
SET work_mem = '64kB';

EXPLAIN ANALYZE
SELECT o.*, u.username
FROM orders o
JOIN users u ON o.user_id = u.id;

-- Look for "Batches: X" where X > 1 (spilled to disk)

-- Now increase work_mem
SET work_mem = '16MB';

EXPLAIN ANALYZE
SELECT o.*, u.username
FROM orders o
JOIN users u ON o.user_id = u.id;

-- Should be "Batches: 1" (all in memory)

-- Reset
RESET work_mem;


-- ============================================================
-- EXERCISE 9: Sort Methods
-- ============================================================

-- Force low work_mem
SET work_mem = '64kB';

EXPLAIN ANALYZE
SELECT * FROM products ORDER BY price;

-- Look for Sort Method - might be "external merge Disk: XkB"

-- Increase work_mem
SET work_mem = '16MB';

EXPLAIN ANALYZE
SELECT * FROM products ORDER BY price;

-- Should be "quicksort Memory: XkB"

-- Reset
RESET work_mem;


-- ============================================================
-- EXERCISE 10: Reading a Complex Plan
-- ============================================================

-- Analyze this query step by step
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    c.name AS category,
    COUNT(p.id) AS product_count,
    ROUND(AVG(p.price), 2) AS avg_price,
    SUM(p.stock_quantity) AS total_stock
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
WHERE c.parent_id IS NULL  -- Top-level categories only
GROUP BY c.id, c.name
HAVING COUNT(p.id) > 10
ORDER BY avg_price DESC;

-- Questions to answer:
-- 1. What scan type is used for categories?
-- 2. What join type is used?
-- 3. How is the aggregation performed?
-- 4. Is the final sort done in memory?


-- ============================================================
-- EXERCISE 11: Subquery vs JOIN Comparison
-- ============================================================

-- Using subquery
EXPLAIN ANALYZE
SELECT * FROM products
WHERE category_id IN (
    SELECT id FROM categories WHERE parent_id IS NULL
);

-- Using JOIN
EXPLAIN ANALYZE
SELECT p.* FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.parent_id IS NULL;

-- Question: Which plan looks more efficient?


-- ============================================================
-- EXERCISE 12: LIMIT Optimization
-- ============================================================

-- Without LIMIT
EXPLAIN ANALYZE
SELECT * FROM products ORDER BY price DESC;

-- With LIMIT
EXPLAIN ANALYZE
SELECT * FROM products ORDER BY price DESC LIMIT 10;

-- With LIMIT and matching index
CREATE INDEX idx_products_price_desc ON products(price DESC);

EXPLAIN ANALYZE
SELECT * FROM products ORDER BY price DESC LIMIT 10;

-- Notice: No sort needed with the index!

DROP INDEX idx_products_price_desc;


-- ============================================================
-- EXERCISE 13: CTE Optimization Fence (Pre-12) vs Inlined
-- ============================================================

-- CTE - may be optimization fence in old versions
EXPLAIN ANALYZE
WITH recent_orders AS (
    SELECT * FROM orders 
    WHERE created_at > NOW() - INTERVAL '7 days'
)
SELECT * FROM recent_orders WHERE status = 'pending';

-- Equivalent subquery - planner can optimize together
EXPLAIN ANALYZE
SELECT * FROM (
    SELECT * FROM orders 
    WHERE created_at > NOW() - INTERVAL '7 days'
) recent_orders
WHERE status = 'pending';

-- In Postgres 12+, CTEs are usually inlined automatically
-- unless you use MATERIALIZED keyword


-- ============================================================
-- EXERCISE 14: Buffer Analysis
-- ============================================================

-- Run with BUFFERS to see cache behavior
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM products WHERE id < 100;

-- Key stats:
-- Buffers: shared hit=X    ← Found in cache (good!)
-- Buffers: shared read=Y   ← Had to read from disk

-- Run the same query again
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM products WHERE id < 100;

-- Second run should have more hits (pages now cached)


-- ============================================================
-- EXERCISE 15: Parallel Query
-- ============================================================

-- Check if parallel query is enabled
SHOW max_parallel_workers_per_gather;

-- Query that might use parallel workers
EXPLAIN ANALYZE
SELECT COUNT(*) FROM orders;

-- Look for "Parallel Seq Scan" and "Gather" nodes

-- You can force parallel for demo:
SET parallel_tuple_cost = 0;
SET parallel_setup_cost = 0;

EXPLAIN ANALYZE
SELECT AVG(total_amount) FROM orders;

-- Reset
RESET parallel_tuple_cost;
RESET parallel_setup_cost;

