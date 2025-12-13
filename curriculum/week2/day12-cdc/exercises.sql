-- ============================================================
-- DAY 12 EXERCISES: Change Data Capture (CDC)
-- ============================================================
-- Run these on the PRIMARY (port 5432)

-- ============================================================
-- EXERCISE 1: Check Logical Replication Prerequisites
-- ============================================================

-- Verify wal_level is logical
SHOW wal_level;

-- Check replication settings
SELECT name, setting 
FROM pg_settings 
WHERE name IN ('wal_level', 'max_replication_slots', 'max_wal_senders');


-- ============================================================
-- EXERCISE 2: Create a Publication
-- ============================================================

-- Create publication for specific tables
CREATE PUBLICATION orders_pub FOR TABLE orders, order_items;

-- Verify publication
SELECT * FROM pg_publication;

-- View published tables
SELECT * FROM pg_publication_tables;

-- TASK: Modify publication to add another table
-- ALTER PUBLICATION orders_pub ADD TABLE users;


-- ============================================================
-- EXERCISE 3: Create and Use Replication Slot
-- ============================================================

-- Create a logical replication slot
SELECT pg_create_logical_replication_slot('cdc_slot', 'pgoutput');

-- View all slots
SELECT 
    slot_name,
    plugin,
    slot_type,
    active,
    restart_lsn
FROM pg_replication_slots;

-- Make some test changes
INSERT INTO orders (user_id, status, total_amount) 
VALUES (1, 'cdc_test', 99.99);

UPDATE orders SET total_amount = 100.00 WHERE status = 'cdc_test';

DELETE FROM orders WHERE status = 'cdc_test';


-- ============================================================
-- EXERCISE 4: Peek at Changes
-- ============================================================

-- Peek at changes WITHOUT consuming them
SELECT * FROM pg_logical_slot_peek_changes(
    'cdc_slot', 
    NULL, 
    NULL,
    'proto_version', '1',
    'publication_names', 'orders_pub'
);

-- QUESTION: What do you see for each operation (INSERT/UPDATE/DELETE)?


-- ============================================================
-- EXERCISE 5: Consume Changes
-- ============================================================

-- Get and CONSUME changes (advances the slot position)
SELECT * FROM pg_logical_slot_get_changes(
    'cdc_slot', 
    NULL, 
    NULL,
    'proto_version', '1',
    'publication_names', 'orders_pub'
);

-- Peek again - should be empty now
SELECT * FROM pg_logical_slot_peek_changes('cdc_slot', NULL, NULL);


-- ============================================================
-- EXERCISE 6: Monitor Slot Retention
-- ============================================================

-- Check how much WAL the slot is retaining
SELECT 
    slot_name,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained_wal,
    active
FROM pg_replication_slots;

-- Make more changes
INSERT INTO products (sku, name, price, stock_quantity, category_id)
SELECT 
    'CDC-' || n,
    'CDC Test Product ' || n,
    (random() * 100)::numeric(10,2),
    100,
    1
FROM generate_series(1, 100) AS n;

-- Check retention again
SELECT 
    slot_name,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained_wal
FROM pg_replication_slots;


-- ============================================================
-- EXERCISE 7: Row Filter (Postgres 15+)
-- ============================================================

-- Create publication with row filter (if on Postgres 15+)
-- CREATE PUBLICATION high_value_orders FOR TABLE orders WHERE (total_amount > 100);

-- This only replicates orders over $100!


-- ============================================================
-- EXERCISE 8: Simulate CDC Consumer
-- ============================================================

-- Create a CDC audit log table
CREATE TABLE cdc_audit_log (
    id SERIAL PRIMARY KEY,
    lsn TEXT,
    xid BIGINT,
    change_data TEXT,
    captured_at TIMESTAMP DEFAULT NOW()
);

-- Simple consumer loop (you'd normally do this in application code)
DO $$
DECLARE
    change RECORD;
BEGIN
    FOR change IN 
        SELECT * FROM pg_logical_slot_get_changes('cdc_slot', NULL, 10)
    LOOP
        INSERT INTO cdc_audit_log (lsn, xid, change_data)
        VALUES (change.lsn::text, change.xid, change.data);
    END LOOP;
END $$;

-- View captured changes
SELECT * FROM cdc_audit_log ORDER BY id;


-- ============================================================
-- CLEANUP
-- ============================================================

-- Drop the replication slot
SELECT pg_drop_replication_slot('cdc_slot');

-- Drop publication
DROP PUBLICATION IF EXISTS orders_pub;

-- Clean up test data
DELETE FROM products WHERE sku LIKE 'CDC-%';
DROP TABLE IF EXISTS cdc_audit_log;

