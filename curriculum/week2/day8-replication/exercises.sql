-- ============================================================
-- DAY 8 EXERCISES: Replication Fundamentals
-- ============================================================
-- Note: Some exercises require multiple terminals or the replica container

-- ============================================================
-- EXERCISE 1: Check Replication Settings
-- ============================================================

-- View current WAL level
SHOW wal_level;
-- Must be 'replica' or 'logical' for replication

-- Check replication-related settings
SELECT name, setting 
FROM pg_settings 
WHERE name IN (
    'wal_level',
    'max_wal_senders',
    'max_replication_slots',
    'hot_standby'
);


-- ============================================================
-- EXERCISE 2: Create Replication Slot
-- ============================================================

-- Create a physical replication slot
SELECT pg_create_physical_replication_slot('test_slot');

-- View all slots
SELECT 
    slot_name,
    slot_type,
    active,
    restart_lsn,
    pg_size_pretty(
        pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)
    ) AS retained_wal
FROM pg_replication_slots;

-- Make some changes
INSERT INTO products (sku, name, price, stock_quantity, category_id)
VALUES ('TEST-001', 'Test Product', 9.99, 100, 1);

-- Check retained WAL again
SELECT 
    slot_name,
    pg_size_pretty(
        pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)
    ) AS retained_wal
FROM pg_replication_slots;

-- CLEANUP: Drop the slot
SELECT pg_drop_replication_slot('test_slot');


-- ============================================================
-- EXERCISE 3: Logical Replication Setup
-- ============================================================

-- Create a publication
CREATE PUBLICATION products_pub FOR TABLE products;

-- View publications
SELECT * FROM pg_publication;

-- View published tables
SELECT * FROM pg_publication_tables;

-- Create a logical replication slot
SELECT pg_create_logical_replication_slot('products_slot', 'pgoutput');

-- Make a change
UPDATE products SET price = price + 1 WHERE id = 1;

-- Peek at the changes (doesn't consume)
SELECT * FROM pg_logical_slot_peek_changes(
    'products_slot', 
    NULL, 
    NULL,
    'proto_version', '1',
    'publication_names', 'products_pub'
);

-- CLEANUP
SELECT pg_drop_replication_slot('products_slot');
DROP PUBLICATION products_pub;


-- ============================================================
-- EXERCISE 4: Monitor WAL Activity
-- ============================================================

-- Current WAL position
SELECT pg_current_wal_lsn();

-- WAL statistics
SELECT 
    pg_current_wal_lsn() AS current_lsn,
    pg_walfile_name(pg_current_wal_lsn()) AS current_wal_file,
    pg_current_wal_insert_lsn() AS insert_lsn;

-- Do some writes
INSERT INTO orders (user_id, status, total_amount)
SELECT 
    (random() * 100)::int + 1,
    'pending',
    (random() * 500)::numeric(10,2)
FROM generate_series(1, 100);

-- Check new WAL position
SELECT pg_current_wal_lsn();


-- ============================================================
-- EXERCISE 5: Replication Monitoring (if replica connected)
-- ============================================================

-- View connected replicas (run on primary)
SELECT 
    application_name,
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS replay_lag
FROM pg_stat_replication;

-- If no replicas connected, this returns empty


-- ============================================================
-- EXERCISE 6: Estimate Replication Lag
-- ============================================================

-- On replica (port 5433), run:
-- SELECT 
--     pg_is_in_recovery() AS is_replica,
--     pg_last_wal_receive_lsn() AS received,
--     pg_last_wal_replay_lsn() AS replayed,
--     pg_last_xact_replay_timestamp() AS last_replay_time,
--     NOW() - pg_last_xact_replay_timestamp() AS lag;


-- ============================================================
-- CLEANUP
-- ============================================================
DELETE FROM products WHERE sku = 'TEST-001';
DELETE FROM orders WHERE id > 1000;

