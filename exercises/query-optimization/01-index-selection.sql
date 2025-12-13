-- ============================================================
-- EXERCISE 1: Index Selection
-- ============================================================
-- Goal: Identify missing indexes and create optimal ones

-- SETUP: Check current query performance
EXPLAIN ANALYZE
SELECT * FROM orders 
WHERE status = 'pending' 
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- TASK 1: Create an index to optimize this query
-- Consider: What columns? What order? Partial index?
-- YOUR INDEX HERE:




-- TASK 2: Verify improvement
EXPLAIN ANALYZE
SELECT * FROM orders 
WHERE status = 'pending' 
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- TASK 3: This query is slow. Why? Fix it.
EXPLAIN ANALYZE
SELECT * FROM users WHERE LOWER(email) = 'user1@example.com';

-- YOUR SOLUTION:




-- TASK 4: Create a covering index so this query needs no heap access
-- Query: SELECT name, price FROM products WHERE category_id = 5;
-- YOUR INDEX:




