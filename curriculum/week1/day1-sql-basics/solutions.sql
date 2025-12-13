-- ============================================================
-- DAY 1 SOLUTIONS: SQL Fundamentals
-- ============================================================
-- Compare your answers with these solutions
-- There are often multiple correct ways to write a query!
-- ============================================================


-- ============================================================
-- EXERCISE 1: Basic SELECT
-- Task: Find all products priced over $200
-- ============================================================
SELECT id, name, price, stock_quantity
FROM products
WHERE price > 200
ORDER BY price DESC;


-- ============================================================
-- EXERCISE 2: Filtering with Multiple Conditions
-- Task: Find orders from the last 30 days that are either 
--       'pending' or 'confirmed'
-- ============================================================
SELECT id, user_id, status, total_amount, created_at
FROM orders
WHERE created_at > NOW() - INTERVAL '30 days'
  AND status IN ('pending', 'confirmed')
ORDER BY created_at DESC;

-- Alternative with OR:
SELECT id, user_id, status, total_amount, created_at
FROM orders
WHERE created_at > NOW() - INTERVAL '30 days'
  AND (status = 'pending' OR status = 'confirmed')
ORDER BY created_at DESC;


-- ============================================================
-- EXERCISE 3: Using IN and LIKE
-- Task: Find all users whose username starts with 'user1'
-- ============================================================
SELECT id, username, email, created_at
FROM users
WHERE username LIKE 'user1%'
ORDER BY username;


-- ============================================================
-- EXERCISE 4: JOIN
-- Task: List all orders with the customer's username and email
-- ============================================================
SELECT 
    o.id AS order_id,
    o.status,
    o.total_amount,
    u.username,
    u.email
FROM orders o
INNER JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC
LIMIT 20;


-- ============================================================
-- EXERCISE 5: Multiple JOINs
-- Task: Find all order items with their product name, order status,
--       and customer username
-- ============================================================
SELECT 
    o.id AS order_id,
    p.name AS product_name,
    oi.quantity,
    oi.unit_price,
    o.status AS order_status,
    u.username AS customer_username
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
JOIN users u ON o.user_id = u.id
ORDER BY o.id, p.name
LIMIT 30;


-- ============================================================
-- EXERCISE 6: GROUP BY Basics
-- Task: Count how many products are in each category
-- ============================================================
SELECT 
    category_id,
    COUNT(*) AS product_count
FROM products
GROUP BY category_id
ORDER BY product_count DESC;


-- ============================================================
-- EXERCISE 7: GROUP BY with JOIN
-- Task: Find the top 5 categories by number of products
-- ============================================================
SELECT 
    c.name AS category_name,
    COUNT(p.id) AS product_count
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.id, c.name
ORDER BY product_count DESC
LIMIT 5;


-- ============================================================
-- EXERCISE 8: HAVING Clause
-- Task: Find users who have placed more than 5 orders
-- ============================================================
SELECT 
    u.username,
    COUNT(o.id) AS order_count
FROM users u
JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.username
HAVING COUNT(o.id) > 5
ORDER BY order_count DESC;


-- ============================================================
-- EXERCISE 9: Aggregate Functions
-- Task: For each order status, calculate various stats
-- ============================================================
SELECT 
    status,
    COUNT(*) AS total_orders,
    SUM(total_amount) AS total_revenue,
    ROUND(AVG(total_amount), 2) AS avg_order_value,
    MIN(total_amount) AS min_order,
    MAX(total_amount) AS max_order
FROM orders
GROUP BY status
ORDER BY total_revenue DESC;


-- ============================================================
-- EXERCISE 10: Subquery
-- Task: Find products that have never been ordered
-- ============================================================
SELECT 
    p.id AS product_id,
    p.name,
    p.price
FROM products p
WHERE p.id NOT IN (
    SELECT DISTINCT product_id 
    FROM order_items
    WHERE product_id IS NOT NULL
)
ORDER BY p.id;

-- Alternative using LEFT JOIN (often more efficient):
SELECT 
    p.id AS product_id,
    p.name,
    p.price
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
WHERE oi.id IS NULL
ORDER BY p.id;

-- Alternative using NOT EXISTS:
SELECT 
    p.id AS product_id,
    p.name,
    p.price
FROM products p
WHERE NOT EXISTS (
    SELECT 1 
    FROM order_items oi 
    WHERE oi.product_id = p.id
)
ORDER BY p.id;


-- ============================================================
-- BONUS EXERCISE 1: Complex Query
-- Task: Top 10 customers by spending with at least 3 orders
-- ============================================================
SELECT 
    u.username,
    u.email,
    COUNT(o.id) AS order_count,
    SUM(o.total_amount) AS total_spent
FROM users u
JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.username, u.email
HAVING COUNT(o.id) >= 3
ORDER BY total_spent DESC
LIMIT 10;


-- ============================================================
-- BONUS EXERCISE 2: Correlated Subquery
-- Task: For each category, find the most expensive product
-- ============================================================
-- Method 1: Correlated Subquery
SELECT 
    c.name AS category_name,
    p.name AS product_name,
    p.price
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.price = (
    SELECT MAX(p2.price)
    FROM products p2
    WHERE p2.category_id = p.category_id
)
ORDER BY c.name;

-- Method 2: Using Window Function (more elegant, we'll learn this later)
SELECT category_name, product_name, price
FROM (
    SELECT 
        c.name AS category_name,
        p.name AS product_name,
        p.price,
        ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY p.price DESC) AS rn
    FROM products p
    JOIN categories c ON p.category_id = c.id
) ranked
WHERE rn = 1
ORDER BY category_name;


-- ============================================================
-- BONUS EXERCISE 3: Date Functions
-- Task: Count orders by month for 2024
-- ============================================================
SELECT 
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS order_count,
    SUM(total_amount) AS total_revenue
FROM orders
WHERE created_at >= '2024-01-01' 
  AND created_at < '2025-01-01'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;

-- Alternative with formatted month:
SELECT 
    TO_CHAR(created_at, 'YYYY-MM') AS month,
    COUNT(*) AS order_count,
    ROUND(SUM(total_amount), 2) AS total_revenue
FROM orders
WHERE created_at >= '2024-01-01' 
  AND created_at < '2025-01-01'
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month;

