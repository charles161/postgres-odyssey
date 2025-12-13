-- ============================================================
-- DAY 7 EXERCISES: Real-World Optimization Scenarios
-- ============================================================

-- ============================================================
-- EXERCISE 1: N+1 Query Problem
-- ============================================================

-- This simulates an N+1 pattern (don't do this!):
-- First query:
SELECT id, username FROM users LIMIT 10;

-- Then for EACH user (10 separate queries):
SELECT * FROM orders WHERE user_id = 1;
SELECT * FROM orders WHERE user_id = 2;
-- ... etc

-- TASK: Write a SINGLE query that gets users and their orders
-- Use JSON aggregation to return orders as an array




-- ============================================================
-- EXERCISE 2: OFFSET Pagination Problem
-- ============================================================

-- Compare performance at different page depths
EXPLAIN ANALYZE SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 0;
EXPLAIN ANALYZE SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 1000;
EXPLAIN ANALYZE SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 10000;

-- TASK: Implement keyset pagination
-- Given last page ended at id=1000, created_at='2024-01-15 10:30:00'
-- Write the query for the next page:




-- ============================================================
-- EXERCISE 3: Connection Pool Simulation
-- ============================================================

-- See current connections
SELECT count(*) FROM pg_stat_activity;

-- Check max allowed
SHOW max_connections;

-- See connection details
SELECT 
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change
FROM pg_stat_activity
WHERE datname = current_database();


-- ============================================================
-- EXERCISE 4: Prepared Statements
-- ============================================================

-- Without preparation:
EXPLAIN ANALYZE SELECT * FROM products WHERE id = 1;
EXPLAIN ANALYZE SELECT * FROM products WHERE id = 2;

-- With preparation:
PREPARE get_product(int) AS SELECT * FROM products WHERE id = $1;

EXPLAIN ANALYZE EXECUTE get_product(1);
EXPLAIN ANALYZE EXECUTE get_product(2);

-- What difference do you notice in planning time?

DEALLOCATE get_product;


-- ============================================================
-- EXERCISE 5: Lock Observation
-- ============================================================

-- Terminal 1: Start a transaction
BEGIN;
SELECT * FROM products WHERE id = 1 FOR UPDATE;
-- Don't commit yet!

-- Terminal 2: Try to update the same row
-- UPDATE products SET price = 999 WHERE id = 1;
-- This will block!

-- Terminal 3: See the locks
SELECT 
    l.pid,
    l.mode,
    l.granted,
    a.query
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE l.relation = 'products'::regclass;

-- Terminal 1: COMMIT to release locks


-- ============================================================
-- EXERCISE 6: Skip Locked for Queues
-- ============================================================

-- Create a simple job queue
CREATE TABLE job_queue (
    id SERIAL PRIMARY KEY,
    payload JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO job_queue (payload) 
SELECT jsonb_build_object('task', 'task_' || n)
FROM generate_series(1, 100) AS n;

-- Worker query that skips locked rows
BEGIN;

SELECT * FROM job_queue 
WHERE status = 'pending'
ORDER BY created_at
LIMIT 5
FOR UPDATE SKIP LOCKED;

-- Process jobs here...

UPDATE job_queue SET status = 'processing' 
WHERE id IN (SELECT id FROM job_queue WHERE status = 'pending' LIMIT 5);

COMMIT;

-- CLEANUP
DROP TABLE job_queue;


-- ============================================================
-- EXERCISE 7: Batch Updates
-- ============================================================

-- BAD: Update all at once (long lock)
-- UPDATE orders SET status = 'archived' WHERE created_at < '2020-01-01';

-- GOOD: Batch update (shorter locks)
-- Write a DO block that updates 1000 rows at a time with LIMIT

DO $$
DECLARE
    rows_updated INT;
BEGIN
    LOOP
        -- YOUR UPDATE HERE with LIMIT 1000
        
        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        EXIT WHEN rows_updated = 0;
        
        -- Small pause between batches
        PERFORM pg_sleep(0.1);
    END LOOP;
END $$;

