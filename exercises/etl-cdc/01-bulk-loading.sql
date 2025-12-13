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
-- 1. Cleans the data
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

