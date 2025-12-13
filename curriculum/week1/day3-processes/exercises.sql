-- ============================================================
-- DAY 3 EXERCISES: Process & Memory Architecture
-- ============================================================

-- ============================================================
-- EXERCISE 1: Explore Running Processes
-- ============================================================

-- See all Postgres processes and their types
SELECT 
    pid,
    backend_type,
    state,
    query
FROM pg_stat_activity
ORDER BY backend_type;

-- Question: How many different backend_types do you see?


-- ============================================================
-- EXERCISE 2: Connection Information
-- ============================================================

-- Current connection count
SELECT count(*) AS total_connections FROM pg_stat_activity;

-- Breakdown by state
SELECT 
    state,
    count(*) AS count
FROM pg_stat_activity
GROUP BY state;

-- What's the max connections setting?
SHOW max_connections;


-- ============================================================
-- EXERCISE 3: Memory Settings
-- ============================================================

-- View all memory-related settings
SELECT name, setting, unit, context, short_desc
FROM pg_settings
WHERE name IN (
    'shared_buffers',
    'work_mem', 
    'maintenance_work_mem',
    'effective_cache_size',
    'temp_buffers'
)
ORDER BY name;

-- Question: What would happen if you set work_mem to 1GB 
-- with 100 concurrent connections running complex queries?


-- ============================================================
-- EXERCISE 4: Buffer Cache Hit Ratio
-- ============================================================

-- Check buffer cache efficiency
SELECT 
    datname,
    blks_hit,
    blks_read,
    CASE WHEN blks_hit + blks_read = 0 THEN 0
         ELSE ROUND(blks_hit::numeric / (blks_hit + blks_read) * 100, 2)
    END AS hit_ratio_pct
FROM pg_stat_database
WHERE datname = current_database();

-- Goal: > 99% for OLTP workloads


-- ============================================================
-- EXERCISE 5: Background Workers
-- ============================================================

-- See background worker activity
SELECT 
    pid,
    backend_type,
    wait_event_type,
    wait_event,
    state
FROM pg_stat_activity
WHERE backend_type != 'client backend'
ORDER BY backend_type;

-- Check autovacuum status
SELECT 
    relname,
    last_vacuum,
    last_autovacuum,
    vacuum_count,
    autovacuum_count
FROM pg_stat_user_tables
ORDER BY autovacuum_count DESC
LIMIT 10;


-- ============================================================
-- EXERCISE 6: Simulate work_mem Impact
-- ============================================================

-- Set low work_mem and run a sort
SET work_mem = '64kB';

EXPLAIN ANALYZE
SELECT * FROM products ORDER BY name;
-- Look for: Sort Method: external merge Disk

-- Now increase work_mem
SET work_mem = '4MB';

EXPLAIN ANALYZE
SELECT * FROM products ORDER BY name;
-- Look for: Sort Method: quicksort Memory

RESET work_mem;


-- ============================================================
-- EXERCISE 7: Watch a Query Execute
-- ============================================================

-- In terminal 1, run a slow query:
-- SELECT pg_sleep(30);

-- In terminal 2, watch it:
SELECT 
    pid,
    state,
    wait_event_type,
    wait_event,
    query,
    query_start,
    NOW() - query_start AS duration
FROM pg_stat_activity
WHERE state = 'active' 
  AND pid != pg_backend_pid();

