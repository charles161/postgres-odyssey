-- ============================================================
-- DAY 7 SOLUTIONS: Real-World Optimization Scenarios
-- ============================================================

-- EXERCISE 1: N+1 Query Solution
-- Single query with JSON aggregation:
SELECT 
    u.id,
    u.username,
    COALESCE(
        json_agg(
            json_build_object(
                'order_id', o.id,
                'status', o.status,
                'total', o.total_amount
            )
        ) FILTER (WHERE o.id IS NOT NULL),
        '[]'
    ) AS orders
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.username
LIMIT 10;

-- Alternative: Batch loading (2 queries instead of N+1)
-- Query 1: Get users
-- SELECT id, username FROM users LIMIT 10;
-- Query 2: Get all orders for those users at once
-- SELECT * FROM orders WHERE user_id IN (1,2,3,4,5,6,7,8,9,10);
-- Then join in application code

-- EXERCISE 2: Keyset Pagination
-- Create supporting index:
CREATE INDEX idx_orders_keyset ON orders(created_at DESC, id DESC);

-- Next page query:
SELECT * FROM orders
WHERE (created_at, id) < ('2024-01-15 10:30:00', 1000)
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- EXERCISE 4: Prepared Statements
-- Planning Time for prepared statements approaches 0 after first execution
-- because the plan is cached and reused

-- EXERCISE 6: Skip Locked Pattern
-- Key points:
-- 1. FOR UPDATE SKIP LOCKED prevents workers blocking each other
-- 2. Each worker gets different rows
-- 3. Perfect for job queues

-- EXERCISE 7: Batch Updates
DO $$
DECLARE
    rows_updated INT;
BEGIN
    LOOP
        WITH batch AS (
            SELECT id FROM orders 
            WHERE created_at < '2020-01-01' 
              AND status != 'archived'
            LIMIT 1000
            FOR UPDATE SKIP LOCKED
        )
        UPDATE orders SET status = 'archived'
        WHERE id IN (SELECT id FROM batch);
        
        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        RAISE NOTICE 'Updated % rows', rows_updated;
        EXIT WHEN rows_updated = 0;
        
        PERFORM pg_sleep(0.1);
    END LOOP;
END $$;

