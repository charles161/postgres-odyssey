-- ============================================================
-- DAY 6 EXERCISES: Query Optimization Techniques
-- ============================================================

-- ============================================================
-- EXERCISE 1: Index Column Order
-- ============================================================

-- This query runs often:
EXPLAIN ANALYZE
SELECT * FROM orders 
WHERE user_id = 5 
  AND status = 'pending'
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- TASK: Create the optimal composite index for this query
-- Remember: equality columns first, range columns last
-- YOUR INDEX:




-- Verify the improvement
EXPLAIN ANALYZE
SELECT * FROM orders 
WHERE user_id = 5 
  AND status = 'pending'
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;


-- ============================================================
-- EXERCISE 2: Avoid Functions on Columns
-- ============================================================

-- This query can't use an index on created_at:
EXPLAIN ANALYZE
SELECT * FROM orders WHERE DATE(created_at) = CURRENT_DATE;

-- TASK: Rewrite this query to use an index on created_at
-- YOUR REWRITE:




-- ============================================================
-- EXERCISE 3: EXISTS vs IN
-- ============================================================

-- Compare these two approaches:
EXPLAIN ANALYZE
SELECT * FROM products 
WHERE category_id IN (
    SELECT id FROM categories WHERE parent_id IS NULL
);

EXPLAIN ANALYZE
SELECT * FROM products p
WHERE EXISTS (
    SELECT 1 FROM categories c 
    WHERE c.id = p.category_id AND c.parent_id IS NULL
);

-- Question: Which is faster? Why?


-- ============================================================
-- EXERCISE 4: Covering Index
-- ============================================================

-- This query fetches only a few columns:
SELECT id, name, price FROM products WHERE category_id = 1;

-- TASK: Create a covering index to make this an Index Only Scan
-- YOUR INDEX:



VACUUM products;

EXPLAIN ANALYZE
SELECT id, name, price FROM products WHERE category_id = 1;
-- Should show: Index Only Scan, Heap Fetches: 0


-- ============================================================
-- EXERCISE 5: Batch Aggregation
-- ============================================================

-- Instead of 3 queries, write 1 query that returns all 3 counts
-- Count orders by status: pending, shipped, delivered

-- Method 1: FILTER clause (Postgres 9.4+)
SELECT
    -- YOUR CODE HERE
FROM orders;

-- Method 2: CASE expressions
SELECT
    -- YOUR CODE HERE  
FROM orders;


-- ============================================================
-- EXERCISE 6: Optimize this Slow Query
-- ============================================================

-- This query is slow. Diagnose and fix it.
EXPLAIN ANALYZE
SELECT 
    u.username,
    COUNT(o.id) as order_count,
    SUM(o.total_amount) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE LOWER(u.email) LIKE '%example.com'
GROUP BY u.id, u.username
ORDER BY total_spent DESC NULLS LAST
LIMIT 20;

-- Problems identified:
-- 1.
-- 2.
-- 3.

-- Your optimizations:



-- ============================================================
-- EXERCISE 7: Partial Index
-- ============================================================

-- 95% of queries only look at pending orders
-- TASK: Create a partial index that only indexes pending orders

-- YOUR INDEX:



-- This query should use the partial index:
EXPLAIN ANALYZE
SELECT * FROM orders WHERE status = 'pending' AND user_id = 5;

