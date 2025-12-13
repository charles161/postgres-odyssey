-- ============================================================
-- DAY 11 EXERCISES: ETL Patterns & Foreign Data Wrappers
-- ============================================================

-- ============================================================
-- EXERCISE 1: Bulk Loading with COPY
-- ============================================================

-- TASK 1: Export products to CSV
-- Export all products over $100 to a CSV file
\copy (SELECT id, name, price FROM products WHERE price > 100) TO '/tmp/expensive_products.csv' CSV HEADER;

-- TASK 2: Create a staging table and load data
CREATE TABLE staging_import (
    raw_name TEXT,
    raw_price TEXT,
    raw_category TEXT
);

-- Load from CSV (create a sample file first)
-- \copy staging_import FROM '/path/to/file.csv' CSV HEADER;

-- TASK 3: Transform and load into production table
-- Write an INSERT...SELECT that:
-- 1. Cleans the data (TRIM, handle nulls)
-- 2. Looks up category_id from categories table
-- 3. Handles duplicates with ON CONFLICT

-- YOUR SOLUTION:




-- TASK 4: Performance optimization
-- Before bulk loading 1M rows, what steps would you take?
-- List them here as comments:

-- 1. 
-- 2.
-- 3.
-- 4.


-- CLEANUP
DROP TABLE IF EXISTS staging_import;


-- ============================================================
-- EXERCISE 2: pg_dump and pg_restore
-- ============================================================

-- TASK 1: Export single table (run from command line)
-- pg_dump -h localhost -U postgres -t products learn > products_backup.sql

-- TASK 2: Export schema only
-- pg_dump -h localhost -U postgres --schema-only learn > schema.sql

-- TASK 3: Export with custom format (compressed)
-- pg_dump -h localhost -U postgres -Fc learn > backup.dump


-- ============================================================
-- EXERCISE 3: Working with Foreign Data Wrappers
-- ============================================================

-- Check available FDW extensions
SELECT name FROM pg_available_extensions WHERE name LIKE '%fdw%';

-- Enable file_fdw for reading local files
CREATE EXTENSION IF NOT EXISTS file_fdw;

-- Create a server for file access
CREATE SERVER local_files FOREIGN DATA WRAPPER file_fdw;

-- Create a foreign table that reads a CSV
-- (First create /tmp/sample.csv with: echo "id,name\n1,Test" > /tmp/sample.csv)
CREATE FOREIGN TABLE sample_csv (
    id INT,
    name TEXT
) SERVER local_files
OPTIONS (filename '/tmp/sample.csv', format 'csv', header 'true');

-- Query the foreign table
SELECT * FROM sample_csv;

-- CLEANUP
DROP FOREIGN TABLE IF EXISTS sample_csv;
DROP SERVER IF EXISTS local_files;


-- ============================================================
-- EXERCISE 4: Upsert Pattern
-- ============================================================

-- Create a table for upsert testing
CREATE TABLE product_inventory (
    sku TEXT PRIMARY KEY,
    quantity INT,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Initial insert
INSERT INTO product_inventory (sku, quantity) VALUES
    ('SKU-001', 100),
    ('SKU-002', 200);

-- TASK: Write an upsert that updates quantity if SKU exists
INSERT INTO product_inventory (sku, quantity)
VALUES 
    ('SKU-001', 150),  -- Should update
    ('SKU-003', 300)   -- Should insert
ON CONFLICT (sku) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    last_updated = NOW();

-- Verify
SELECT * FROM product_inventory ORDER BY sku;

-- CLEANUP
DROP TABLE product_inventory;


-- ============================================================
-- EXERCISE 5: Incremental ETL Pattern
-- ============================================================

-- Create ETL metadata tracking table
CREATE TABLE etl_watermarks (
    source_name TEXT PRIMARY KEY,
    last_processed_id BIGINT,
    last_processed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Initialize watermark
INSERT INTO etl_watermarks (source_name, last_processed_id, last_processed_at)
VALUES ('orders', 0, '1970-01-01');

-- TASK: Write incremental load query
-- Get orders newer than watermark
SELECT o.*
FROM orders o
WHERE o.id > (SELECT last_processed_id FROM etl_watermarks WHERE source_name = 'orders')
ORDER BY o.id
LIMIT 1000;

-- TASK: Update watermark after processing
-- (Use the max id from the batch you just processed)

-- CLEANUP
DROP TABLE etl_watermarks;

