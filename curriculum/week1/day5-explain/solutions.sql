-- ============================================================
-- DAY 5 SOLUTIONS: EXPLAIN ANALYZE Mastery
-- ============================================================

-- EXERCISE 2: Scan Types
-- Index Scan on id (primary key): ~0.1ms
-- Seq Scan on id (disabled indexes): ~1-5ms
-- Difference: 10-50x slower without index

-- EXERCISE 5: Join Types
-- Small result (WHERE o.id = 1): Nested Loop
-- Large result (no filter): Hash Join
-- Force Merge Join: Both inputs sorted first

-- EXERCISE 6: Estimate Mismatch
-- After DELETE without ANALYZE:
--   rows=500 (estimate) vs actual rows=400
-- After ANALYZE:
--   rows=400 (estimate) matches actual

-- EXERCISE 8: Hash Join Batches
-- work_mem = 64kB: Batches > 1 (spilled to disk)
-- work_mem = 16MB: Batches = 1 (all in memory)
-- Rule: If Batches > 1, increase work_mem

-- EXERCISE 9: Sort Methods
-- work_mem = 64kB: "external merge Disk: XkB"
-- work_mem = 16MB: "quicksort Memory: XkB"

-- EXERCISE 12: LIMIT Optimization
-- Without LIMIT: Full sort of all rows
-- With LIMIT 10: May use top-N heapsort (more efficient)
-- With index on ORDER BY column: Index scan stops at 10, no sort!

-- Key patterns to recognize:
-- 1. rows=X actual=Y where Y >> X → Run ANALYZE
-- 2. Seq Scan + "Rows Removed by Filter" high → Add index
-- 3. Batches > 1 in Hash Join → Increase work_mem
-- 4. "external merge Disk" → Increase work_mem or add index

