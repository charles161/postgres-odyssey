-- ============================================================
-- DAY 1 EXERCISES: SQL Fundamentals
-- ============================================================
-- Instructions:
-- 1. Run each query to see the results
-- 2. Try to understand what each query does
-- 3. Modify and experiment!
-- 4. Check solutions.sql when stuck
-- ============================================================


-- ============================================================
-- EXERCISE 1: Basic SELECT
-- ============================================================
-- Task: Find all products priced over $200
-- Hint: Use WHERE with a comparison operator

-- Your query here:




-- ============================================================
-- EXERCISE 2: Filtering with Multiple Conditions
-- ============================================================
-- Task: Find orders from the last 30 days that are either 
--       'pending' or 'confirmed'
-- Hint: Use AND, OR, and NOW() - INTERVAL '30 days'

-- Your query here:




-- ============================================================
-- EXERCISE 3: Using IN and LIKE
-- ============================================================
-- Task: Find all users whose username starts with 'user1' 
--       (user1, user10, user11, etc.)
-- Hint: Use LIKE with a pattern

-- Your query here:




-- ============================================================
-- EXERCISE 4: JOIN
-- ============================================================
-- Task: List all orders with the customer's username and email
--       Show: order_id, status, total_amount, username, email
-- Hint: JOIN orders with users on user_id

-- Your query here:




-- ============================================================
-- EXERCISE 5: Multiple JOINs
-- ============================================================
-- Task: Find all order items with their product name, order status,
--       and customer username
--       Show: order_id, product_name, quantity, unit_price, 
--             order_status, customer_username
-- Hint: You need to join 4 tables!

-- Your query here:




-- ============================================================
-- EXERCISE 6: GROUP BY Basics
-- ============================================================
-- Task: Count how many products are in each category
--       Show: category_id, product_count
--       Order by product_count descending
-- Hint: GROUP BY category_id

-- Your query here:




-- ============================================================
-- EXERCISE 7: GROUP BY with JOIN
-- ============================================================
-- Task: Find the top 5 categories by number of products
--       Show: category_name, product_count
-- Hint: JOIN products with categories, then GROUP BY

-- Your query here:




-- ============================================================
-- EXERCISE 8: HAVING Clause
-- ============================================================
-- Task: Find users who have placed more than 5 orders
--       Show: username, order_count
--       Order by order_count descending
-- Hint: GROUP BY user, HAVING COUNT(*) > 5

-- Your query here:




-- ============================================================
-- EXERCISE 9: Aggregate Functions
-- ============================================================
-- Task: For each order status, calculate:
--       - Total number of orders
--       - Total revenue
--       - Average order value
--       - Min and max order values
-- Hint: Multiple aggregate functions in one query

-- Your query here:




-- ============================================================
-- EXERCISE 10: Subquery
-- ============================================================
-- Task: Find products that have never been ordered
--       Show: product_id, name, price
-- Hint: Use NOT IN with a subquery on order_items

-- Your query here:




-- ============================================================
-- BONUS EXERCISE 1: Complex Query
-- ============================================================
-- Task: Find the top 10 customers by total spending, 
--       but only include customers who have placed at least 3 orders
--       Show: username, email, order_count, total_spent
-- Hint: Combine JOIN, GROUP BY, HAVING, and ORDER BY

-- Your query here:




-- ============================================================
-- BONUS EXERCISE 2: Correlated Subquery
-- ============================================================
-- Task: For each category, find the most expensive product
--       Show: category_name, product_name, price
-- Hint: Use a correlated subquery or window function

-- Your query here:




-- ============================================================
-- BONUS EXERCISE 3: Date Functions
-- ============================================================
-- Task: Count orders by month for 2024
--       Show: month, order_count, total_revenue
-- Hint: Use DATE_TRUNC('month', created_at)

-- Your query here:




