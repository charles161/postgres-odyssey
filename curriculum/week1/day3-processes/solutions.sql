-- ============================================================
-- DAY 3 SOLUTIONS: Process & Memory Architecture
-- ============================================================

-- EXERCISE 1: Backend Types
-- You should see: client backend, background writer, checkpointer,
-- walwriter, autovacuum launcher, stats collector, etc.

-- EXERCISE 2: Connection States
-- idle: waiting for commands
-- active: executing a query
-- idle in transaction: in a transaction block, waiting

-- EXERCISE 3: Memory Math
-- work_mem = 1GB with 100 connections running 5 operations each:
-- 100 * 5 * 1GB = 500GB! System would crash.
-- Always be conservative with work_mem.

-- EXERCISE 4: Hit Ratio
-- If < 99%, either:
-- 1. shared_buffers is too small
-- 2. Working set doesn't fit in memory
-- 3. Lots of sequential scans on large tables

-- EXERCISE 6: work_mem Impact
-- Low work_mem forces sorts to disk (external merge)
-- High work_mem keeps sorts in memory (quicksort)
-- Disk sorts are ~10x slower

-- Key formulas:
-- shared_buffers = 25% of RAM (up to ~8GB)
-- effective_cache_size = 75% of RAM
-- work_mem = RAM / max_connections / expected_operations (start at 4MB)

