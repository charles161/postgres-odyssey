-- ============================================================
-- EXERCISE 2: Logical Replication Setup
-- ============================================================
-- Run these on the PRIMARY (port 5432)

-- TASK 1: Create a publication for specific tables
CREATE PUBLICATION orders_pub FOR TABLE orders, order_items;

-- Verify
SELECT * FROM pg_publication;
SELECT * FROM pg_publication_tables;

-- TASK 2: Create a replication slot
SELECT pg_create_logical_replication_slot('orders_slot', 'pgoutput');

-- View slots
SELECT * FROM pg_replication_slots;

-- TASK 3: Make some changes and peek at them
INSERT INTO orders (user_id, status, total_amount) 
VALUES (1, 'test', 1.00);

-- Peek at changes (doesn't consume)
SELECT * FROM pg_logical_slot_peek_changes('orders_slot', NULL, NULL);

-- TASK 4: Consume the changes
SELECT * FROM pg_logical_slot_get_changes('orders_slot', NULL, NULL);

-- Peek again - should be empty now
SELECT * FROM pg_logical_slot_peek_changes('orders_slot', NULL, NULL);

-- CLEANUP
SELECT pg_drop_replication_slot('orders_slot');
DROP PUBLICATION orders_pub;
DELETE FROM orders WHERE status = 'test';

