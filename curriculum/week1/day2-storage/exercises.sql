-- ============================================================
-- DAY 2 EXERCISES: Postgres Storage Internals
-- ============================================================


-- ============================================================
-- EXERCISE 1: Explore ctid (Tuple Location)
-- ============================================================

-- See where rows physically live
SELECT 
    id,
    name,
    ctid  -- (page_number, tuple_number)
FROM products
ORDER BY id
LIMIT 20;

-- How many rows fit on page 0?
SELECT COUNT(*) 
FROM products 
WHERE (ctid::text::point)[0] = 0;  -- page 0

-- Find rows on page 1
SELECT id, name, ctid
FROM products
WHERE (ctid::text::point)[0] = 1
LIMIT 5;


-- ============================================================
-- EXERCISE 2: See Table Size and Page Count
-- ============================================================

-- Get table statistics
SELECT 
    relname AS table_name,
    relpages AS page_count,
    reltuples AS estimated_rows,
    pg_size_pretty(pg_relation_size(oid)) AS table_size
FROM pg_class
WHERE relname IN ('users', 'products', 'orders', 'order_items')
ORDER BY relpages DESC;

-- Calculate average rows per page
SELECT 
    relname,
    relpages,
    reltuples,
    ROUND(reltuples / NULLIF(relpages, 0), 1) AS rows_per_page
FROM pg_class
WHERE relname = 'products';


-- ============================================================
-- EXERCISE 3: Create Dead Tuples (See MVCC in action)
-- ============================================================

-- Create a test table
CREATE TABLE mvcc_test (
    id SERIAL PRIMARY KEY,
    value TEXT,
    updated_count INT DEFAULT 0
);

-- Insert some rows
INSERT INTO mvcc_test (value)
SELECT 'Initial value ' || n
FROM generate_series(1, 100) AS n;

-- Check baseline - no dead tuples
SELECT 
    relname,
    n_live_tup,
    n_dead_tup,
    last_vacuum
FROM pg_stat_user_tables
WHERE relname = 'mvcc_test';

-- Update rows multiple times (creates dead tuples!)
UPDATE mvcc_test SET value = 'Updated once', updated_count = 1;
UPDATE mvcc_test SET value = 'Updated twice', updated_count = 2;
UPDATE mvcc_test SET value = 'Updated three times', updated_count = 3;

-- Now check dead tuples
SELECT 
    relname,
    n_live_tup,
    n_dead_tup,
    last_vacuum
FROM pg_stat_user_tables
WHERE relname = 'mvcc_test';
-- You should see ~300 dead tuples (3 updates × 100 rows)


-- ============================================================
-- EXERCISE 4: VACUUM in Action
-- ============================================================

-- Before vacuum - check table size
SELECT pg_size_pretty(pg_relation_size('mvcc_test')) AS size_before;

-- Run vacuum
VACUUM mvcc_test;

-- Check dead tuples after vacuum
SELECT 
    relname,
    n_live_tup,
    n_dead_tup,
    last_vacuum
FROM pg_stat_user_tables
WHERE relname = 'mvcc_test';
-- Dead tuples should be 0!

-- Size after vacuum (may be same - space is reusable but file not shrunk)
SELECT pg_size_pretty(pg_relation_size('mvcc_test')) AS size_after;

-- VACUUM FULL actually shrinks the table (but locks it!)
VACUUM FULL mvcc_test;
SELECT pg_size_pretty(pg_relation_size('mvcc_test')) AS size_after_full;


-- ============================================================
-- EXERCISE 5: Explore Autovacuum Settings
-- ============================================================

-- Current autovacuum settings
SHOW autovacuum;
SHOW autovacuum_vacuum_threshold;
SHOW autovacuum_vacuum_scale_factor;
-- Formula: vacuum when dead_tuples > threshold + scale_factor * live_tuples

-- See autovacuum activity
SELECT 
    relname,
    last_vacuum,
    last_autovacuum,
    vacuum_count,
    autovacuum_count
FROM pg_stat_user_tables
WHERE relname IN ('users', 'products', 'orders')
ORDER BY relname;


-- ============================================================
-- EXERCISE 6: Page Inspection (Advanced!)
-- ============================================================

-- Enable the extension
CREATE EXTENSION IF NOT EXISTS pageinspect;

-- Look at page header
SELECT * FROM page_header(get_raw_page('products', 0));

-- See individual tuples on a page
SELECT 
    lp,          -- Line pointer (slot in item pointer array)
    lp_off,      -- Offset from start of page
    lp_len,      -- Tuple length
    t_xmin,      -- Creating transaction ID
    t_xmax,      -- Deleting transaction ID (0 = alive)
    t_ctid       -- Current tuple ID (for update chains)
FROM heap_page_items(get_raw_page('products', 0))
LIMIT 10;

-- Now update a product and see the change
UPDATE products SET price = price + 0.01 WHERE id = 1;

-- Look at the page again - find dead and new tuple
SELECT 
    lp,
    t_xmin,
    t_xmax,  -- Old tuple now has t_xmax set!
    t_ctid,
    CASE WHEN t_xmax = 0 THEN 'LIVE' ELSE 'DEAD' END AS status
FROM heap_page_items(get_raw_page('products', 0))
WHERE lp <= 5;


-- ============================================================
-- EXERCISE 7: TOAST Exploration
-- ============================================================

-- Create a table with large text
CREATE TABLE toast_test (
    id SERIAL PRIMARY KEY,
    small_text VARCHAR(100),
    large_text TEXT
);

-- Insert small data
INSERT INTO toast_test (small_text, large_text)
VALUES ('Short', 'This is a short text');

-- Insert large data (will be TOASTed)
INSERT INTO toast_test (small_text, large_text)
VALUES ('Has TOAST', repeat('This is a very long text that will be compressed and TOASTed. ', 500));

-- Find the TOAST table
SELECT 
    c.relname AS main_table,
    t.relname AS toast_table,
    pg_size_pretty(pg_relation_size(t.oid)) AS toast_size
FROM pg_class c
JOIN pg_class t ON c.reltoastrelid = t.oid
WHERE c.relname = 'toast_test';

-- See TOAST storage strategy for columns
SELECT 
    attname,
    atttypid::regtype AS type,
    CASE attstorage
        WHEN 'p' THEN 'plain (no TOAST)'
        WHEN 'e' THEN 'external (TOAST, no compress)'
        WHEN 'm' THEN 'main (compress first, then TOAST)'
        WHEN 'x' THEN 'extended (compress and TOAST)'
    END AS storage_strategy
FROM pg_attribute
WHERE attrelid = 'toast_test'::regclass
  AND attnum > 0;


-- ============================================================
-- EXERCISE 8: Transaction IDs and Snapshots
-- ============================================================

-- Get current transaction ID
SELECT txid_current();

-- See the current snapshot
SELECT txid_current_snapshot();
-- Format: xmin:xmax:xip_list
-- xmin = oldest active transaction
-- xmax = first as-yet-unassigned transaction ID
-- xip_list = active transaction IDs between xmin and xmax


-- ============================================================
-- EXERCISE 9: Relation File Paths
-- ============================================================

-- See where table files live on disk
SELECT 
    pg_relation_filepath('users') AS users_file,
    pg_relation_filepath('products') AS products_file,
    pg_relation_filepath('orders') AS orders_file;

-- See file size breakdown
SELECT 
    tablename,
    pg_size_pretty(pg_table_size(tablename::regclass)) AS table_size,
    pg_size_pretty(pg_indexes_size(tablename::regclass)) AS index_size,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;


-- ============================================================
-- CLEANUP
-- ============================================================
DROP TABLE IF EXISTS mvcc_test;
DROP TABLE IF EXISTS toast_test;

