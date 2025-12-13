# SQL Essentials Cheatsheet

## Query Order of Execution

```
FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT
```

## Basic Patterns

```sql
-- Select with conditions
SELECT col1, col2 FROM table WHERE condition ORDER BY col1 LIMIT 10;

-- Aggregation
SELECT category, COUNT(*), AVG(price) FROM products GROUP BY category HAVING COUNT(*) > 5;

-- Subquery
SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE active = true);
```

## JOIN Types

```sql
-- INNER: Only matching rows
SELECT * FROM a INNER JOIN b ON a.id = b.a_id;

-- LEFT: All from left + matches
SELECT * FROM a LEFT JOIN b ON a.id = b.a_id;

-- Cross join with filter
SELECT * FROM a, b WHERE a.id = b.a_id;  -- Same as INNER
```

## Aggregates

| Function | Purpose |
|----------|---------|
| COUNT(*) | Count all rows |
| COUNT(col) | Count non-NULL |
| SUM(col) | Total |
| AVG(col) | Average |
| MIN/MAX(col) | Extremes |
| ARRAY_AGG(col) | Collect into array |
| STRING_AGG(col, ',') | Concat with delimiter |
| JSON_AGG(row) | Collect as JSON |

## Window Functions

```sql
-- Running total
SUM(amount) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING)

-- Rank
RANK() OVER (PARTITION BY category ORDER BY sales DESC)

-- Previous row value
LAG(value, 1) OVER (ORDER BY date)
```

## Common Table Expressions (CTE)

```sql
WITH active_users AS (
    SELECT * FROM users WHERE last_login > NOW() - INTERVAL '30 days'
)
SELECT * FROM orders WHERE user_id IN (SELECT id FROM active_users);
```

## Useful Functions

```sql
-- Date/Time
NOW(), CURRENT_DATE, DATE_TRUNC('month', date)
date + INTERVAL '1 day'

-- String
LOWER(), UPPER(), CONCAT(), SUBSTRING(), TRIM()
string LIKE '%pattern%', string ~ 'regex'

-- NULL handling
COALESCE(val, default)
NULLIF(a, b)  -- Returns NULL if a = b

-- JSON
data->>'key'           -- Text
data->'key'            -- JSON
data @> '{"k":"v"}'    -- Contains
```

## INSERT/UPDATE/DELETE

```sql
-- Insert
INSERT INTO t (col1, col2) VALUES (v1, v2) RETURNING *;

-- Upsert
INSERT INTO t (id, data) VALUES (1, 'new')
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;

-- Update with FROM
UPDATE orders SET status = 'vip'
FROM users WHERE orders.user_id = users.id AND users.tier = 'premium';

-- Delete with returning
DELETE FROM orders WHERE status = 'cancelled' RETURNING *;
```

