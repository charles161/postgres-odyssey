-- ============================================================
-- DAY 9 SOLUTIONS: High Availability Patterns
-- ============================================================

-- EXERCISE 1: Cluster State
-- pg_is_in_recovery() = false means you're on the primary
-- pg_is_in_recovery() = true means you're on a standby

-- EXERCISE 2: Failover Candidate
-- Best candidate has:
-- 1. Smallest lag (replay_lsn closest to current_lsn)
-- 2. sync_state = 'sync' for zero data loss
-- 3. Healthy (state = 'streaming')

-- EXERCISE 3: Synchronous Commit Levels
-- off: Don't wait for any WAL flush (fastest, risky)
-- local: Wait for local WAL flush only
-- remote_write: Wait until replica OS receives
-- on: Wait until replica flushes to disk
-- remote_apply: Wait until replica applies (read-your-writes)

-- Latency impact:
-- local → remote_write: +1 network round trip
-- remote_write → on: Minimal (just fsync)
-- on → remote_apply: +replay time

-- EXERCISE 4: Lock Monitoring
-- AccessShareLock: SELECT
-- RowShareLock: SELECT FOR UPDATE
-- RowExclusiveLock: UPDATE, DELETE, INSERT
-- AccessExclusiveLock: DDL (blocks everything!)

-- EXERCISE 5: Transaction ID
-- datfrozenxid age should stay below autovacuum_freeze_max_age
-- If approaching limit, force VACUUM FREEZE
-- Long-running transactions prevent vacuum from advancing

-- EXERCISE 6: Checkpoints
-- checkpoints_timed: Normal checkpoints (good)
-- checkpoints_req: Forced checkpoints (may indicate too small max_wal_size)
-- If req >> timed, increase max_wal_size

-- HA Best Practices:
-- 1. Use Patroni for automatic failover
-- 2. 3+ nodes for quorum (avoid split-brain)
-- 3. Synchronous replication for zero RPO
-- 4. Regular failover testing
-- 5. Monitor replication lag continuously

