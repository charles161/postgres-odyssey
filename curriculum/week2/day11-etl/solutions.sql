-- ============================================================
-- DAY 11 SOLUTIONS: ETL Patterns & Foreign Data Wrappers
-- ============================================================

-- EXERCISE 1: Bulk Loading

-- TASK 3: Transform and load
INSERT INTO products (name, price, category_id, sku)
SELECT 
    TRIM(s.raw_name),
    s.raw_price::numeric,
    c.id,
    'IMPORT-' || nextval('products_id_seq')
FROM staging_import s
LEFT JOIN categories c ON LOWER(c.name) = LOWER(s.raw_category)
WHERE s.raw_name IS NOT NULL
ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    updated_at = NOW();

-- TASK 4: Performance steps for 1M rows:
-- 1. Drop indexes before load, recreate after
-- 2. Disable triggers if safe
-- 3. Increase maintenance_work_mem
-- 4. Use COPY instead of INSERT
-- 5. Wrap in single transaction
-- 6. Disable autovacuum temporarily
-- 7. ANALYZE after load


-- EXERCISE 4: Upsert Pattern
-- ON CONFLICT (sku) DO UPDATE:
-- - EXCLUDED refers to the row that would have been inserted
-- - Updates only the conflicting row
-- - Can include WHERE clause for conditional updates


-- EXERCISE 5: Incremental Load Pattern
-- After processing batch:
UPDATE etl_watermarks 
SET 
    last_processed_id = (SELECT MAX(id) FROM orders WHERE id <= last_batch_max_id),
    last_processed_at = NOW(),
    updated_at = NOW()
WHERE source_name = 'orders';

-- Key points:
-- 1. Always use ORDER BY and LIMIT for batching
-- 2. Track by ID is more reliable than timestamp
-- 3. Handle gaps in IDs gracefully
-- 4. Add error handling for failed batches


-- FDW Best Practices:
-- 1. postgres_fdw for cross-Postgres queries
-- 2. Use IMPORT FOREIGN SCHEMA to bulk-import table definitions
-- 3. Push down WHERE clauses when possible
-- 4. Be aware of network latency for large result sets
-- 5. Consider materializing frequently-used foreign data

