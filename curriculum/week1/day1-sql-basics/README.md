# Day 1: SQL Fundamentals Crash Course

> **Time:** 2 hours  
> **Goal:** Go from zero SQL to writing practical queries  
> **Analogy:** SQL is like querying the DOM, but for structured data

---

## 🎯 What You'll Learn Today

```
┌─────────────────────────────────────────────────────────────┐
│                     DAY 1 ROADMAP                           │
├─────────────────────────────────────────────────────────────┤
│  1. What is SQL & Postgres?         (10 min)               │
│  2. SELECT - Reading Data           (25 min)               │
│  3. WHERE - Filtering               (20 min)               │
│  4. JOIN - Combining Tables         (30 min)               │
│  5. GROUP BY - Aggregating          (20 min)               │
│  6. Subqueries                      (15 min)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Setup: Connect to Your Database

```bash
# Start the containers (if not already running)
cd docker
docker-compose up -d

# Connect to Postgres
docker exec -it postgres-primary psql -U postgres -d learn

# You should see:
# learn=#
```

---

## 1. What is SQL & Postgres?

### SQL = Structured Query Language

Think of it as a **declarative language for data**:

| Frontend (JS)             | SQL                        |
|---------------------------|----------------------------|
| `array.filter()`          | `WHERE`                    |
| `array.map()`             | `SELECT`                   |
| `array.reduce()`          | `GROUP BY` + aggregates    |
| `[...arr1, ...arr2]`      | `JOIN`                     |
| `array.sort()`            | `ORDER BY`                 |
| `array.slice(0, 10)`      | `LIMIT 10`                 |

### Why Postgres?

```
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LANDSCAPE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MySQL ───────┐                                             │
│               │                                             │
│  SQLite ──────┼──── Relational (SQL) ──── Postgres ⭐       │
│               │                                             │
│  SQL Server ──┘                                             │
│                                                             │
│  MongoDB ─────┬──── Document (NoSQL)                        │
│  CouchDB ─────┘                                             │
│                                                             │
│  Redis ───────────── Key-Value                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Postgres is the "React" of databases:
✓ Most extensible (like React's ecosystem)
✓ Strong community (like React's community)  
✓ Used by Supabase, Discord, Instagram, Spotify
✓ Best for complex applications
```

---

## 2. SELECT - Reading Data

### Basic SELECT (Like reading component state)

```sql
-- Get everything from users table
SELECT * FROM users;

-- Get specific columns (like destructuring)
SELECT id, username, email FROM users;

-- Limit results (like array.slice)
SELECT id, username FROM users LIMIT 5;
```

**Try it:**
```sql
-- See what's in our database
SELECT * FROM users LIMIT 5;
SELECT * FROM products LIMIT 5;
SELECT * FROM orders LIMIT 5;
```

### Column Aliases (Like renaming in destructuring)

```sql
-- JavaScript: const { email: userEmail } = user
-- SQL equivalent:
SELECT 
    email AS user_email,
    username AS display_name
FROM users
LIMIT 5;
```

### Expressions in SELECT

```sql
-- Calculate values (like computed properties)
SELECT 
    name,
    price,
    price * 0.9 AS discounted_price,
    stock_quantity,
    price * stock_quantity AS inventory_value
FROM products
LIMIT 10;
```

### DISTINCT (Like [...new Set(array)])

```sql
-- Get unique values
SELECT DISTINCT status FROM orders;

-- Count unique values
SELECT COUNT(DISTINCT user_id) AS unique_customers FROM orders;
```

---

## 3. WHERE - Filtering Data

### Basic Comparisons

```sql
-- Exact match
SELECT * FROM products WHERE price = 99.99;

-- Greater/less than
SELECT * FROM products WHERE price > 100;
SELECT * FROM products WHERE stock_quantity < 50;

-- Not equal
SELECT * FROM products WHERE status != 'inactive';
-- Or use: WHERE status <> 'inactive'
```

### Multiple Conditions (AND, OR)

```sql
-- AND - all conditions must be true
SELECT * FROM products 
WHERE price > 50 
  AND stock_quantity > 100;

-- OR - any condition can be true  
SELECT * FROM orders
WHERE status = 'pending'
   OR status = 'confirmed';

-- Combined with parentheses (like JS)
SELECT * FROM products
WHERE (price > 100 OR stock_quantity > 500)
  AND is_active = true;
```

### IN Operator (Like array.includes)

```sql
-- Instead of multiple ORs
SELECT * FROM orders
WHERE status IN ('pending', 'confirmed', 'shipped');

-- NOT IN
SELECT * FROM orders
WHERE status NOT IN ('cancelled', 'delivered');
```

### BETWEEN (Range queries)

```sql
-- Price range (inclusive)
SELECT * FROM products
WHERE price BETWEEN 50 AND 100;

-- Date range
SELECT * FROM orders
WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31';
```

### LIKE (Pattern matching - like regex lite)

```sql
-- % = any characters (like .*)
SELECT * FROM products WHERE name LIKE '%Phone%';

-- _ = single character (like .)
SELECT * FROM users WHERE username LIKE 'user_';

-- ILIKE = case-insensitive (Postgres-specific!)
SELECT * FROM products WHERE name ILIKE '%phone%';
```

### NULL Handling (Important!)

```sql
-- NULL is special - use IS NULL, not = NULL
SELECT * FROM users WHERE last_login_at IS NULL;
SELECT * FROM users WHERE last_login_at IS NOT NULL;

-- COALESCE - like nullish coalescing (??)
SELECT 
    name,
    COALESCE(description, 'No description') AS description
FROM products;
```

---

## 4. JOIN - Combining Tables

This is where SQL gets powerful. Think of it as **denormalizing** data at query time.

### Visual Mental Model

```
┌─────────────────┐         ┌─────────────────┐
│     orders      │         │     users       │
├─────────────────┤         ├─────────────────┤
│ id              │         │ id              │
│ user_id ────────┼────────►│ username        │
│ total_amount    │         │ email           │
│ status          │         │ full_name       │
└─────────────────┘         └─────────────────┘

JOIN connects these tables via user_id → id relationship
```

### INNER JOIN (Most common)

Returns only rows with matches in BOTH tables:

```sql
-- Get orders with user information
SELECT 
    o.id AS order_id,
    o.total_amount,
    o.status,
    u.username,
    u.email
FROM orders o
INNER JOIN users u ON o.user_id = u.id
LIMIT 10;
```

**Note the aliases:** `orders o` lets us use `o.id` instead of `orders.id`

### LEFT JOIN (Keep all from left table)

```sql
-- Get ALL users, even those without orders
SELECT 
    u.username,
    COUNT(o.id) AS order_count,
    COALESCE(SUM(o.total_amount), 0) AS total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.username
ORDER BY total_spent DESC
LIMIT 10;
```

### Multiple JOINs

```sql
-- Get order details with product and user info
SELECT 
    o.id AS order_id,
    u.username,
    p.name AS product_name,
    oi.quantity,
    oi.unit_price,
    oi.total_price
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.status = 'delivered'
LIMIT 20;
```

### JOIN Types Visual

```
    Table A         Table B
   ┌───────┐       ┌───────┐
   │ 1     │       │ 1     │
   │ 2     │       │ 2     │
   │ 3     │       │ 4     │
   └───────┘       └───────┘

INNER JOIN: [1, 2]           (only matches)
LEFT JOIN:  [1, 2, 3]        (all from A + matches)
RIGHT JOIN: [1, 2, 4]        (all from B + matches)  
FULL JOIN:  [1, 2, 3, 4]     (everything)
```

---

## 5. GROUP BY - Aggregating Data

Think of this as `array.reduce()` on steroids.

### Common Aggregate Functions

```sql
-- COUNT, SUM, AVG, MIN, MAX
SELECT 
    COUNT(*) AS total_products,
    AVG(price) AS avg_price,
    MIN(price) AS min_price,
    MAX(price) AS max_price,
    SUM(stock_quantity) AS total_inventory
FROM products;
```

### GROUP BY (Like reduce with grouping)

```sql
-- Orders per status (like grouping by key)
SELECT 
    status,
    COUNT(*) AS order_count,
    SUM(total_amount) AS total_revenue
FROM orders
GROUP BY status
ORDER BY order_count DESC;
```

### Multiple GROUP BY columns

```sql
-- Sales by user and status
SELECT 
    u.username,
    o.status,
    COUNT(*) AS order_count,
    SUM(o.total_amount) AS total
FROM orders o
JOIN users u ON o.user_id = u.id
GROUP BY u.username, o.status
ORDER BY u.username, o.status;
```

### HAVING (Filter AFTER grouping)

```sql
-- WHERE filters rows BEFORE grouping
-- HAVING filters groups AFTER grouping

-- Find users with more than 5 orders
SELECT 
    u.username,
    COUNT(*) AS order_count
FROM orders o
JOIN users u ON o.user_id = u.id
GROUP BY u.username
HAVING COUNT(*) > 5
ORDER BY order_count DESC;
```

### GROUP BY with JOINs

```sql
-- Product sales summary
SELECT 
    p.name,
    p.price,
    COUNT(oi.id) AS times_ordered,
    SUM(oi.quantity) AS total_quantity_sold,
    SUM(oi.total_price) AS total_revenue
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name, p.price
ORDER BY total_revenue DESC NULLS LAST
LIMIT 10;
```

---

## 6. Subqueries

Queries within queries - like calling a function inside a function.

### Subquery in WHERE

```sql
-- Find users who have placed orders above average
SELECT username, email
FROM users
WHERE id IN (
    SELECT DISTINCT user_id 
    FROM orders 
    WHERE total_amount > (
        SELECT AVG(total_amount) FROM orders
    )
);
```

### Subquery in FROM (Derived Table)

```sql
-- Get average orders per user
SELECT 
    AVG(order_count) AS avg_orders_per_user
FROM (
    SELECT user_id, COUNT(*) AS order_count
    FROM orders
    GROUP BY user_id
) AS user_orders;
```

### Correlated Subquery

```sql
-- Find each user's most expensive order
SELECT 
    u.username,
    o.total_amount,
    o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.total_amount = (
    SELECT MAX(total_amount)
    FROM orders o2
    WHERE o2.user_id = o.user_id  -- Correlated!
)
ORDER BY o.total_amount DESC
LIMIT 10;
```

---

## 7. ORDER BY and LIMIT

### Sorting

```sql
-- Single column
SELECT * FROM products ORDER BY price ASC;  -- Low to high (default)
SELECT * FROM products ORDER BY price DESC; -- High to low

-- Multiple columns
SELECT * FROM products 
ORDER BY category_id ASC, price DESC;

-- Handle NULLs
SELECT * FROM users 
ORDER BY last_login_at DESC NULLS LAST;
```

### Pagination

```sql
-- Page 1 (items 1-10)
SELECT * FROM products ORDER BY id LIMIT 10 OFFSET 0;

-- Page 2 (items 11-20)
SELECT * FROM products ORDER BY id LIMIT 10 OFFSET 10;

-- Page 3 (items 21-30)
SELECT * FROM products ORDER BY id LIMIT 10 OFFSET 20;

-- ⚠️ WARNING: OFFSET gets slow with large datasets
-- We'll learn better pagination in Day 7!
```

---

## 📝 Query Building Template

When writing complex queries, build them step by step:

```sql
-- Step 1: What tables do I need?
FROM orders o
JOIN users u ON o.user_id = u.id

-- Step 2: What columns do I want?
SELECT 
    u.username,
    o.status,
    COUNT(*) AS order_count

-- Step 3: What filters apply?
WHERE o.created_at > '2024-01-01'

-- Step 4: Do I need grouping?
GROUP BY u.username, o.status

-- Step 5: Filter groups?
HAVING COUNT(*) > 3

-- Step 6: Sort and limit
ORDER BY order_count DESC
LIMIT 20;
```

**Full query:**
```sql
SELECT 
    u.username,
    o.status,
    COUNT(*) AS order_count
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.created_at > '2024-01-01'
GROUP BY u.username, o.status
HAVING COUNT(*) > 3
ORDER BY order_count DESC
LIMIT 20;
```

---

## 🎤 Interview Angle

**Q: "What's the difference between WHERE and HAVING?"**

> "WHERE filters individual rows before any grouping happens - it works on the raw data. HAVING filters after GROUP BY has created aggregated groups - it works on the aggregated results. You can't use aggregate functions like COUNT() in WHERE, but you can in HAVING."

**Q: "When would you use a LEFT JOIN vs INNER JOIN?"**

> "INNER JOIN when I only want rows that have matches in both tables - like showing orders with their customers. LEFT JOIN when I want all rows from the first table even if there's no match - like showing all customers including those who haven't ordered yet."

---

## 🏋️ Exercises

Open `exercises.sql` in this folder and try:

1. **Basic SELECT:** Find all products priced over $200
2. **Filtering:** Find orders from the last 30 days that are either pending or confirmed
3. **JOIN:** List all orders with the customer's username and email
4. **GROUP BY:** Find the top 5 categories by number of products
5. **Subquery:** Find products that have never been ordered

Solutions are in `solutions.sql` - but try first!

---

## 🧠 Key Takeaways

```
┌─────────────────────────────────────────────────────────────┐
│  TODAY'S MENTAL MODEL                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SELECT ... FROM ... WHERE ...                              │
│      ↓           ↓         ↓                                │
│   map()     data       filter()                             │
│                  source                                      │
│                                                             │
│  JOIN → Combine multiple arrays by matching key             │
│  GROUP BY → reduce() with grouping                          │
│  ORDER BY → sort()                                          │
│  LIMIT → slice()                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏭️ Tomorrow: Day 2

How does Postgres actually **store** this data on disk? We'll learn about pages, tuples, and the magic of MVCC (Multi-Version Concurrency Control) - the killer feature that makes Postgres so reliable.

---

**Checkpoint:** Can you write a query that finds the top 10 users by total amount spent, showing their username, email, number of orders, and total spent? Try it before moving on!

<details>
<summary>Solution</summary>

```sql
SELECT 
    u.username,
    u.email,
    COUNT(o.id) AS order_count,
    SUM(o.total_amount) AS total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.username, u.email
ORDER BY total_spent DESC NULLS LAST
LIMIT 10;
```

</details>

