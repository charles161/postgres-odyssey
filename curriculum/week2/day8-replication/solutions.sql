-- ============================================================
-- DAY 8 SOLUTIONS: Replication Fundamentals
-- ============================================================

-- EXERCISE 1: Replication Settings
-- wal_level must be 'replica' or 'logical'
-- max_wal_senders should be > 0 (number of replicas)
-- max_replication_slots should match number of consumers

-- EXERCISE 2: Replication Slots
-- Slots retain WAL until consumed
-- retained_wal shows how much WAL is being held
-- Warning: Inactive slots can fill disk!

-- EXERCISE 3: Logical Replication
-- Publication defines what tables to replicate
-- Slot tracks consumer position
-- pgoutput is the built-in output plugin for native replication

-- Key differences Physical vs Logical:
-- Physical: Binary WAL, exact copy, read-only replica
-- Logical: Decoded changes, selective tables, writable subscriber

-- EXERCISE 4: WAL Monitoring
-- pg_current_wal_lsn() returns Log Sequence Number
-- Each write advances the LSN
-- pg_walfile_name() shows the actual file name

-- EXERCISE 5: Replication Lag
-- sent_lsn: WAL sent to replica
-- write_lsn: Written to replica OS
-- flush_lsn: Flushed to replica disk
-- replay_lsn: Applied to replica database
-- 
-- Lag = sent_lsn - replay_lsn

-- Sync commit levels:
-- remote_write: Wait until write_lsn catches up
-- on: Wait until flush_lsn catches up
-- remote_apply: Wait until replay_lsn catches up

