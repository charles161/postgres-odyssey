-- ============================================================
-- DAY 10 SOLUTIONS: Scaling Postgres
-- ============================================================

-- EXERCISE 1: Capacity Measurement
-- Know your current usage to plan scaling
-- Watch for tables approaching partition size limits (32TB)
-- Monitor index size vs table size ratio

-- EXERCISE 2: Connection Usage
-- If current is > 80% of max_connections, consider:
-- 1. Connection pooling (PgBouncer, Supavisor)
-- 2. Increasing max_connections (with more RAM)
-- 3. Checking for connection leaks

-- EXERCISE 3: Partitioning Benefits
-- 1. Partition pruning: Only scan relevant partitions
-- 2. Faster maintenance: VACUUM one partition at a time
-- 3. Easy data retention: DROP partition vs DELETE
-- 4. Parallel operations on different partitions

-- EXERCISE 4: Statistics
-- n_live_tup vs actual count can drift
-- Run ANALYZE after large data changes
-- last_autoanalyze shows when stats were updated

-- EXERCISE 5: Table Density
-- Low rows_per_page = bloat or wide rows
-- After many updates/deletes, density drops
-- VACUUM FULL recompacts but locks table

-- EXERCISE 6: Index Analysis
-- Remove unused indexes to speed up writes
-- Keep primary keys even if unused (for integrity)
-- High idx_tup_fetch means index is effective

-- EXERCISE 7: Bloat
-- > 20% dead tuples = consider manual VACUUM
-- Chronic bloat = tune autovacuum settings
-- Per-table autovacuum settings for hot tables

-- Scaling Strategy Summary:
-- 1. Optimize first (queries, indexes)
-- 2. Vertical scaling (more CPU/RAM)
-- 3. Read replicas for read scaling
-- 4. Partitioning for large tables
-- 5. Sharding only when truly necessary

