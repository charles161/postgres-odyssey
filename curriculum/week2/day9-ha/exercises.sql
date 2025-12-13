-- ============================================================
-- DAY 9 EXERCISES: High Availability Patterns
-- ============================================================

-- ============================================================
-- EXERCISE 1: Check Cluster State
-- ============================================================

-- Am I a primary or replica?
SELECT pg_is_in_recovery();
-- false = primary
-- true = replica

-- If primary, check my timeline
SELECT pg_current_wal_lsn(), 
       pg_walfile_name(pg_current_wal_lsn());


-- ============================================================
-- EXERCISE 2: Simulate Failover Preparation
-- ============================================================

-- On primary, check connected replicas
SELECT 
    application_name,
    state,
    sync_state,  -- 'sync' or 'async'
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn)) AS lag
FROM pg_stat_replication;

-- Which replica is most caught up?
-- That's your best failover candidate


-- ============================================================
-- EXERCISE 3: Synchronous Replication Settings
-- ============================================================

-- Check current sync settings
SHOW synchronous_commit;
SHOW synchronous_standby_names;

-- Test different sync levels:
-- SET synchronous_commit = 'off';  -- Fastest, risk of loss
-- SET synchronous_commit = 'local'; -- Default, async to replicas
-- SET synchronous_commit = 'remote_write'; -- Wait for replica receive
-- SET synchronous_commit = 'on';   -- Wait for replica flush
-- SET synchronous_commit = 'remote_apply'; -- Wait for replica apply


-- ============================================================
-- EXERCISE 4: Monitor Lock Activity
-- ============================================================

-- Current locks
SELECT 
    l.pid,
    a.usename,
    l.relation::regclass,
    l.mode,
    l.granted,
    a.state,
    a.query
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE l.relation IS NOT NULL
ORDER BY l.relation;

-- Find blocking queries
SELECT 
    blocked.pid AS blocked_pid,
    blocked.query AS blocked_query,
    blocking.pid AS blocking_pid,
    blocking.query AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_locks blocked_locks ON blocked.pid = blocked_locks.pid
JOIN pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.relation = blocked_locks.relation
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_stat_activity blocking ON blocking.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;


-- ============================================================
-- EXERCISE 5: Transaction ID Monitoring
-- ============================================================

-- Current transaction ID
SELECT txid_current();

-- Oldest running transaction (important for VACUUM)
SELECT 
    datname,
    age(datfrozenxid) AS frozen_age,
    current_setting('autovacuum_freeze_max_age') AS freeze_threshold
FROM pg_database;

-- Oldest transaction blocking vacuum
SELECT 
    pid,
    xact_start,
    NOW() - xact_start AS duration,
    state,
    query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start
LIMIT 5;


-- ============================================================
-- EXERCISE 6: Checkpoint Activity
-- ============================================================

-- Check checkpoint settings
SELECT name, setting, unit
FROM pg_settings
WHERE name LIKE 'checkpoint%'
   OR name = 'max_wal_size';

-- View checkpoint stats
SELECT 
    checkpoints_timed,
    checkpoints_req,
    buffers_checkpoint,
    buffers_clean,
    maxwritten_clean
FROM pg_stat_bgwriter;


-- ============================================================
-- EXERCISE 7: Simulate DDL Lock Impact
-- ============================================================

-- This adds a column (ACCESS EXCLUSIVE lock on older Postgres):
-- In a real HA scenario, you'd plan this carefully!

-- Check current table locks
SELECT 
    locktype,
    relation::regclass,
    mode,
    granted,
    pid
FROM pg_locks 
WHERE relation = 'orders'::regclass;

-- Add a nullable column (fast, minimal locking in PG11+):
-- ALTER TABLE orders ADD COLUMN test_col TEXT;

-- Add with default (older PG rewrites table!):
-- ALTER TABLE orders ADD COLUMN test_col TEXT DEFAULT 'x';

