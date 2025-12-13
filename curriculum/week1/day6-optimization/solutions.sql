-- ============================================================
-- DAY 6 SOLUTIONS: Query Optimization Techniques
-- ============================================================

-- EXERCISE 1: Index Column Order
-- Equality first (user_id, status), range last (created_at)
CREATE INDEX idx_orders_optimal ON orders(user_id, status, created_at DESC);

-- EXERCISE 2: Avoid Functions on Columns
-- Instead of: WHERE DATE(created_at) = CURRENT_DATE
-- Use range:
SELECT * FROM orders 
WHERE created_at >= CURRENT_DATE 
  AND created_at < CURRENT_DATE + INTERVAL '1 day';

-- EXERCISE 3: EXISTS vs IN
-- EXISTS often faster for large subquery results
-- because it stops at first match
-- IN must materialize entire subquery first
-- Modern Postgres optimizes both similarly in many cases

-- EXERCISE 4: Covering Index
CREATE INDEX idx_products_cat_covering 
ON products(category_id) INCLUDE (id, name, price);

-- EXERCISE 5: Batch Aggregation
-- Method 1: FILTER clause
SELECT
    COUNT(*) FILTER (WHERE status = 'pending') AS pending,
    COUNT(*) FILTER (WHERE status = 'shipped') AS shipped,
    COUNT(*) FILTER (WHERE status = 'delivered') AS delivered
FROM orders;

-- Method 2: CASE expressions
SELECT
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shipped,
    SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered
FROM orders;

-- EXERCISE 6: Optimize Slow Query
-- Problems:
-- 1. LOWER() prevents index use on email
-- 2. LIKE '%...' can't use index prefix
-- 3. No index on orders.user_id for the join

-- Solutions:
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
CREATE INDEX idx_orders_user_id ON orders(user_id);
-- Consider: expression index with text_pattern_ops for suffix matching

-- EXERCISE 7: Partial Index
CREATE INDEX idx_orders_pending ON orders(user_id, created_at) 
WHERE status = 'pending';
-- Much smaller than full index, faster for pending queries

