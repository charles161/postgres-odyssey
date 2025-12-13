-- ============================================================
-- DAY 10 EXERCISES: Scaling Postgres
-- ============================================================

-- ============================================================
-- EXERCISE 1: Measure Current Capacity
-- ============================================================

-- Database size
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;

-- Table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname || '.' || tablename::regclass)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;


-- ============================================================
-- EXERCISE 2: Connection Usage
-- ============================================================

-- Current connections by state
SELECT 
    state,
    count(*) AS connections
FROM pg_stat_activity
GROUP BY state;

-- Connections by application
SELECT 
    application_name,
    count(*) AS connections
FROM pg_stat_activity
GROUP BY application_name
ORDER BY connections DESC;

-- Connection limit check
SELECT 
    current_setting('max_connections')::int AS max_connections,
    (SELECT count(*) FROM pg_stat_activity) AS current_connections,
    current_setting('max_connections')::int - (SELECT count(*) FROM pg_stat_activity) AS available;


-- ============================================================
-- EXERCISE 3: Table Partitioning
-- ============================================================

-- Create a partitioned table
CREATE TABLE events_partitioned (
    id BIGSERIAL,
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE events_2024_01 PARTITION OF events_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE events_2024_02 PARTITION OF events_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

CREATE TABLE events_2024_03 PARTITION OF events_partitioned
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

-- Insert test data
INSERT INTO events_partitioned (event_type, payload, created_at)
SELECT 
    'event_' || (n % 10),
    jsonb_build_object('value', n),
    '2024-01-15'::timestamp + (n || ' hours')::interval
FROM generate_series(1, 1000) AS n;

-- Check partition pruning
EXPLAIN ANALYZE
SELECT * FROM events_partitioned
WHERE created_at >= '2024-02-01' AND created_at < '2024-02-15';
-- Should only scan events_2024_02!

-- CLEANUP
DROP TABLE events_partitioned;


-- ============================================================
-- EXERCISE 4: Analyze Table Statistics
-- ============================================================

-- Check statistics accuracy
SELECT 
    schemaname,
    tablename,
    n_live_tup,
    n_dead_tup,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Detailed column statistics
SELECT 
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE tablename = 'orders'
ORDER BY attname;


-- ============================================================
-- EXERCISE 5: Estimate Rows Per Page
-- ============================================================

-- Calculate table density
SELECT 
    relname,
    relpages,
    reltuples,
    ROUND(reltuples / NULLIF(relpages, 0), 1) AS rows_per_page,
    pg_size_pretty(pg_relation_size(oid)) AS size
FROM pg_class
WHERE relname IN ('users', 'products', 'orders')
ORDER BY relname;


-- ============================================================
-- EXERCISE 6: Index Usage Analysis
-- ============================================================

-- Find unused indexes (candidates for removal)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelid::regclass::text NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find most used indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 10;


-- ============================================================
-- EXERCISE 7: Identify Bloat
-- ============================================================

-- Simple bloat estimate
SELECT
    schemaname,
    tablename,
    n_live_tup,
    n_dead_tup,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY n_dead_tup DESC;

