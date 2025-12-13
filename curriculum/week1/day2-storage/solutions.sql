-- ============================================================
-- DAY 2 SOLUTIONS: Postgres Storage Internals
-- ============================================================

-- EXERCISE 1: Explore ctid
-- See where rows physically live
SELECT id, name, ctid FROM products ORDER BY id LIMIT 20;

-- Count rows on page 0
SELECT COUNT(*) FROM products WHERE (ctid::text::point)[0] = 0;
-- Answer: Typically 40-60 rows depending on row size

-- EXERCISE 2: Table Size and Page Count
SELECT 
    relname AS table_name,
    relpages AS page_count,
    reltuples AS estimated_rows,
    pg_size_pretty(pg_relation_size(oid)) AS table_size
FROM pg_class
WHERE relname IN ('users', 'products', 'orders', 'order_items')
ORDER BY relpages DESC;

-- EXERCISE 3: Dead Tuples from MVCC
-- After 3 updates to 100 rows, you should see ~300 dead tuples
-- n_dead_tup shows tuples marked dead but not yet vacuumed

-- EXERCISE 4: VACUUM
-- After VACUUM: n_dead_tup returns to 0
-- After VACUUM FULL: table size may shrink

-- EXERCISE 6: Page Inspection
-- t_xmax = 0 means tuple is alive
-- t_xmax > 0 means tuple was deleted/updated by that transaction

-- EXERCISE 7: TOAST
-- Large text values get compressed and/or stored in TOAST table
-- attstorage 'x' = extended (compress + toast)

