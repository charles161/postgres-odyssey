-- ============================================================
-- POSTGRES LEARNING LAB - Sample Database
-- ============================================================
-- This creates a realistic e-commerce dataset for learning
-- Designed for a frontend engineer to relate to

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- SCHEMA: E-Commerce Store (Like building a React e-commerce app)
-- ============================================================

-- Users table (like your auth state)
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    username        VARCHAR(50) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100),
    avatar_url      VARCHAR(500),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at   TIMESTAMP WITH TIME ZONE,
    is_active       BOOLEAN DEFAULT true,
    metadata        JSONB DEFAULT '{}'::jsonb
);

-- Products table (like your product catalog component)
CREATE TABLE products (
    id              SERIAL PRIMARY KEY,
    sku             VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    price           DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    cost            DECIMAL(10, 2) CHECK (cost >= 0),
    stock_quantity  INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    category_id     INTEGER,
    tags            TEXT[],
    attributes      JSONB DEFAULT '{}'::jsonb,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories (hierarchical, like a nav tree)
CREATE TABLE categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    parent_id       INTEGER REFERENCES categories(id),
    description     TEXT,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key after categories exists
ALTER TABLE products ADD CONSTRAINT fk_product_category 
    FOREIGN KEY (category_id) REFERENCES categories(id);

-- Orders table (like your checkout flow state)
CREATE TABLE orders (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id),
    status          VARCHAR(20) DEFAULT 'pending' 
                    CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    total_amount    DECIMAL(12, 2) NOT NULL,
    shipping_address JSONB,
    billing_address  JSONB,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    shipped_at      TIMESTAMP WITH TIME ZONE,
    delivered_at    TIMESTAMP WITH TIME ZONE
);

-- Order items (junction table with extra data)
CREATE TABLE order_items (
    id              SERIAL PRIMARY KEY,
    order_id        INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id      INTEGER REFERENCES products(id),
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      DECIMAL(10, 2) NOT NULL,
    total_price     DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews (user-generated content)
CREATE TABLE reviews (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id),
    product_id      INTEGER REFERENCES products(id),
    rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title           VARCHAR(255),
    content         TEXT,
    is_verified     BOOLEAN DEFAULT false,
    helpful_count   INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)  -- One review per user per product
);

-- Sessions table (for understanding MVCC)
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    user_agent      TEXT,
    ip_address      INET,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    last_active_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log (for CDC exercises)
CREATE TABLE audit_log (
    id              BIGSERIAL PRIMARY KEY,
    table_name      VARCHAR(100) NOT NULL,
    record_id       INTEGER NOT NULL,
    action          VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data        JSONB,
    new_data        JSONB,
    changed_by      INTEGER,
    changed_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES (We'll study these in Day 4)
-- ============================================================

-- B-tree indexes (most common)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- GIN index for JSONB (like searching nested objects)
CREATE INDEX idx_products_attributes ON products USING GIN (attributes);
CREATE INDEX idx_users_metadata ON users USING GIN (metadata);

-- GIN index for array search
CREATE INDEX idx_products_tags ON products USING GIN (tags);

-- Composite index
CREATE INDEX idx_order_items_order_product ON order_items(order_id, product_id);

-- ============================================================
-- SAMPLE DATA GENERATION
-- ============================================================

-- Insert categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
    ('Electronics', 'electronics', 'Electronic devices and gadgets', 1),
    ('Clothing', 'clothing', 'Fashion and apparel', 2),
    ('Books', 'books', 'Physical and digital books', 3),
    ('Home & Garden', 'home-garden', 'Home improvement and garden', 4),
    ('Sports', 'sports', 'Sports equipment and gear', 5);

-- Insert subcategories
INSERT INTO categories (name, slug, parent_id, sort_order) VALUES
    ('Smartphones', 'smartphones', 1, 1),
    ('Laptops', 'laptops', 1, 2),
    ('Headphones', 'headphones', 1, 3),
    ('T-Shirts', 't-shirts', 2, 1),
    ('Jeans', 'jeans', 2, 2),
    ('Fiction', 'fiction', 3, 1),
    ('Non-Fiction', 'non-fiction', 3, 2);

-- Generate 100 users
INSERT INTO users (email, username, password_hash, full_name, created_at)
SELECT 
    'user' || n || '@example.com',
    'user' || n,
    crypt('password123', gen_salt('bf')),
    'User Number ' || n,
    NOW() - (random() * INTERVAL '365 days')
FROM generate_series(1, 100) AS n;

-- Generate 500 products
INSERT INTO products (sku, name, description, price, cost, stock_quantity, category_id, tags, attributes)
SELECT 
    'SKU-' || LPAD(n::text, 6, '0'),
    'Product ' || n,
    'This is a detailed description for product ' || n || '. It has many features and benefits.',
    ROUND((random() * 500 + 10)::numeric, 2),
    ROUND((random() * 200 + 5)::numeric, 2),
    FLOOR(random() * 1000)::integer,
    FLOOR(random() * 12 + 1)::integer,
    ARRAY['tag' || FLOOR(random() * 10 + 1)::integer, 'tag' || FLOOR(random() * 10 + 1)::integer],
    jsonb_build_object(
        'color', (ARRAY['red', 'blue', 'green', 'black', 'white'])[FLOOR(random() * 5 + 1)::integer],
        'size', (ARRAY['S', 'M', 'L', 'XL'])[FLOOR(random() * 4 + 1)::integer],
        'weight', ROUND((random() * 10)::numeric, 2)
    )
FROM generate_series(1, 500) AS n;

-- Generate 1000 orders
INSERT INTO orders (user_id, status, total_amount, shipping_address, created_at)
SELECT 
    FLOOR(random() * 100 + 1)::integer,
    (ARRAY['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])[FLOOR(random() * 5 + 1)::integer],
    0,  -- Will be calculated
    jsonb_build_object(
        'street', '123 Main St',
        'city', (ARRAY['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'])[FLOOR(random() * 5 + 1)::integer],
        'zip', LPAD(FLOOR(random() * 99999 + 1)::text, 5, '0')
    ),
    NOW() - (random() * INTERVAL '180 days')
FROM generate_series(1, 1000) AS n;

-- Generate order items (2-5 items per order)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT 
    o.id,
    FLOOR(random() * 500 + 1)::integer,
    FLOOR(random() * 5 + 1)::integer,
    ROUND((random() * 200 + 10)::numeric, 2)
FROM orders o
CROSS JOIN generate_series(1, FLOOR(random() * 4 + 2)::integer);

-- Update order totals
UPDATE orders o
SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM order_items oi
    WHERE oi.order_id = o.id
);

-- Generate reviews (not every product, not every user)
INSERT INTO reviews (user_id, product_id, rating, title, content, is_verified, helpful_count, created_at)
SELECT DISTINCT ON (u.id, p.id)
    u.id,
    p.id,
    FLOOR(random() * 5 + 1)::integer,
    'Review Title ' || u.id || '-' || p.id,
    'This is a review content. The product was ' || 
        (ARRAY['great', 'good', 'okay', 'disappointing', 'terrible'])[FLOOR(random() * 5 + 1)::integer],
    random() > 0.5,
    FLOOR(random() * 100)::integer,
    NOW() - (random() * INTERVAL '90 days')
FROM 
    (SELECT id FROM users ORDER BY random() LIMIT 50) u
CROSS JOIN 
    (SELECT id FROM products ORDER BY random() LIMIT 100) p
WHERE random() > 0.7;

-- Create some sessions
INSERT INTO sessions (user_id, token_hash, user_agent, ip_address, expires_at)
SELECT 
    FLOOR(random() * 100 + 1)::integer,
    encode(gen_random_bytes(32), 'hex'),
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    ('192.168.1.' || FLOOR(random() * 255 + 1)::integer)::inet,
    NOW() + INTERVAL '7 days'
FROM generate_series(1, 50);

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Product summary with stats
CREATE VIEW product_summary AS
SELECT 
    p.id,
    p.name,
    p.price,
    p.stock_quantity,
    c.name AS category_name,
    COALESCE(AVG(r.rating), 0) AS avg_rating,
    COUNT(r.id) AS review_count,
    COALESCE(SUM(oi.quantity), 0) AS total_sold
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN reviews r ON p.id = r.product_id
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name, p.price, p.stock_quantity, c.name;

-- User order summary
CREATE VIEW user_order_summary AS
SELECT 
    u.id AS user_id,
    u.username,
    u.email,
    COUNT(o.id) AS total_orders,
    COALESCE(SUM(o.total_amount), 0) AS total_spent,
    MAX(o.created_at) AS last_order_at
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.username, u.email;

-- ============================================================
-- FUNCTIONS FOR EXERCISES
-- ============================================================

-- Function to simulate slow query (for optimization exercises)
CREATE OR REPLACE FUNCTION slow_search(search_term TEXT)
RETURNS TABLE(product_id INTEGER, product_name VARCHAR, match_score FLOAT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        similarity(p.name, search_term)::FLOAT
    FROM products p
    WHERE p.name ILIKE '%' || search_term || '%'
       OR p.description ILIKE '%' || search_term || '%'
    ORDER BY similarity(p.name, search_term) DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for audit log
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to products (for CDC exercises)
CREATE TRIGGER products_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- STATS FOR QUERY PLANNING
-- ============================================================

-- Analyze all tables to update statistics
ANALYZE;

-- ============================================================
-- PRINT SUMMARY
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE 'POSTGRES LEARNING LAB - Ready!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Users: 100';
    RAISE NOTICE 'Products: 500';
    RAISE NOTICE 'Categories: 12';
    RAISE NOTICE 'Orders: 1000';
    RAISE NOTICE 'Reviews: ~1500';
    RAISE NOTICE '====================================';
END $$;

