-- ============================================================
-- DAY 4 SOLUTIONS: Indexing Deep Dive
-- ============================================================

-- EXERCISE 1: Index vs No Index
-- Without index: Seq Scan, ~1-5ms for small table
-- With index: Index Scan, ~0.1ms
-- Difference grows with table size

-- EXERCISE 3: Composite Index Column Order
-- (user_id, status) works for:
--   WHERE user_id = 5
--   WHERE user_id = 5 AND status = 'pending'
-- Does NOT work efficiently for:
--   WHERE status = 'pending' (skips first column)

-- EXERCISE 6: Covering Index
CREATE INDEX idx_products_covering ON products(price) INCLUDE (name, stock_quantity);

-- After VACUUM, should show "Index Only Scan" with "Heap Fetches: 0"
-- If Heap Fetches > 0, visibility map needs update (run VACUUM)

-- EXERCISE 7: BRIN vs B-tree Size
-- BRIN is typically 100-1000x smaller than B-tree
-- But only effective for naturally ordered data

-- EXERCISE 9: Expression Index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
-- Now WHERE LOWER(email) = 'x' uses the index

-- EXERCISE 10: Partial Index
CREATE INDEX idx_products_active ON products(name) WHERE is_active = true;
-- Only indexes active products, smaller and faster

-- Key insights:
-- 1. Leftmost prefix rule for composite indexes
-- 2. Covering indexes avoid heap access
-- 3. BRIN for huge time-series tables
-- 4. Expression indexes for function-based queries
-- 5. Partial indexes when you query a subset

