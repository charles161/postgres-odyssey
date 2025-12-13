-- ============================================================
-- DAY 12 SOLUTIONS: Change Data Capture (CDC)
-- ============================================================

-- EXERCISE 1: Prerequisites
-- wal_level must be 'logical' for CDC
-- max_replication_slots determines how many consumers
-- max_wal_senders limits concurrent streaming connections

-- EXERCISE 2: Publications
-- Publications define WHAT to replicate
-- Options:
--   FOR ALL TABLES - everything
--   FOR TABLE x, y, z - specific tables
--   FOR TABLE x WHERE (condition) - filtered (PG15+)

-- EXERCISE 3: Replication Slots
-- Slots track consumer position
-- WAL is retained until slot advances
-- DANGER: Inactive slots can fill disk!

-- EXERCISE 4: Change Output
-- INSERT shows: new row data
-- UPDATE shows: old key + new row data (needs REPLICA IDENTITY)
-- DELETE shows: old key data

-- REPLICA IDENTITY options:
ALTER TABLE orders REPLICA IDENTITY FULL;    -- Include all columns in changes
ALTER TABLE orders REPLICA IDENTITY DEFAULT; -- Only primary key
-- ALTER TABLE orders REPLICA IDENTITY USING INDEX idx_name;

-- EXERCISE 5: Peek vs Get
-- peek_changes: Read without advancing (for testing)
-- get_changes: Read and advance (for consuming)
-- In production, use get_changes to prevent WAL buildup

-- EXERCISE 6: Monitoring
-- Always monitor replication slots!
-- Alert if:
--   1. retained_wal > threshold (e.g., 10GB)
--   2. active = false for extended period
--   3. slot not advancing

-- EXERCISE 7: Row Filters (PG15+)
-- Filters reduce replication traffic
-- Useful for:
--   - Multi-tenant (filter by tenant_id)
--   - Importance (only high-value orders)
--   - Geography (only local region data)

-- CDC Architecture Patterns:
-- 
-- 1. Direct Consumption:
--    Postgres → Your App polls slot → Process changes
--    Simple, but polling overhead
--
-- 2. Debezium + Kafka:
--    Postgres → Debezium → Kafka → Multiple consumers
--    Best for microservices
--
-- 3. Supabase Realtime:
--    Postgres → Realtime Server → WebSocket → Browser
--    Best for real-time UIs

-- Best Practices:
-- 1. Monitor slot lag continuously
-- 2. Set max_slot_wal_keep_size (PG13+) to prevent disk fill
-- 3. Use REPLICA IDENTITY FULL if you need old values
-- 4. Consider row filters to reduce volume
-- 5. Handle schema changes carefully (DDL not replicated)

