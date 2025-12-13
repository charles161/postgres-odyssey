# Day 11: ETL Patterns & Foreign Data Wrappers

> **Time:** 2 hours  
> **Goal:** Master moving data in/out of Postgres and querying external sources  
> **Analogy:** Like API integrations in frontend - connecting to external data sources

---

## 🎯 What You'll Learn Today

```
┌─────────────────────────────────────────────────────────────┐
│                     DAY 11 ROADMAP                          │
├─────────────────────────────────────────────────────────────┤
│  1. ETL Fundamentals                 (15 min)               │
│  2. COPY Command (Bulk Import)       (20 min)               │
│  3. pg_dump and pg_restore           (20 min)               │
│  4. Foreign Data Wrappers (FDW)      (35 min)               │
│  5. Supabase Wrappers                (20 min)               │
│  6. Common ETL Patterns              (10 min)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. ETL Fundamentals

### What is ETL?

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ETL                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   E xtract  → Get data from source                                      │
│   T ransform → Clean, reshape, aggregate                                │
│   L oad      → Put data into destination                                │
│                                                                          │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│   │   SOURCES    │    │   TRANSFORM   │    │ DESTINATION  │             │
│   │              │    │              │    │              │              │
│   │ • CSV files  │───►│ • Clean data │───►│ • Postgres   │              │
│   │ • APIs       │    │ • Map columns│    │ • Data Lake  │              │
│   │ • Other DBs  │    │ • Aggregate  │    │ • Warehouse  │              │
│   │ • S3 bucket  │    │ • Validate   │    │              │              │
│   └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                          │
│   ELT (Extract-Load-Transform) - Load first, transform in database     │
│   • Faster initial load                                                 │
│   • Transform using SQL (where Postgres shines!)                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. COPY Command (Bulk Import/Export)

### The Fastest Way to Load Data

```sql
-- Import from CSV
COPY products (name, price, stock_quantity)
FROM '/path/to/products.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Export to CSV
COPY (SELECT * FROM products WHERE price > 100)
TO '/path/to/expensive_products.csv'
WITH (FORMAT csv, HEADER true);

-- Using stdin (for application data)
COPY products FROM STDIN WITH (FORMAT csv);
Product A,99.99,100
Product B,149.99,50
\.
```

### COPY Options

```sql
-- Full options example
COPY products FROM '/data/products.csv'
WITH (
    FORMAT csv,           -- csv, text, or binary
    HEADER true,          -- First row is column names
    DELIMITER ',',        -- Field separator
    NULL 'NULL',          -- How NULLs are represented
    QUOTE '"',            -- Quote character
    ESCAPE '\',           -- Escape character
    ENCODING 'UTF8'       -- Character encoding
);
```

### \copy (Client-Side)

```sql
-- From psql, use \copy for client-side files
-- (COPY requires superuser for server files)

\copy products FROM '/local/path/products.csv' CSV HEADER;
\copy products TO '/local/path/export.csv' CSV HEADER;
```

### Performance Tips

```
┌─────────────────────────────────────────────────────────────┐
│              COPY PERFORMANCE TIPS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Before loading:                                             │
│  • Drop indexes (rebuild after)                             │
│  • Disable triggers if possible                             │
│  • Increase maintenance_work_mem                            │
│                                                              │
│  During loading:                                             │
│  • Use COPY, not INSERT                                     │
│  • Batch into single transaction                            │
│  • Disable autovacuum temporarily                           │
│                                                              │
│  After loading:                                              │
│  • Rebuild indexes                                          │
│  • ANALYZE for statistics                                   │
│  • Re-enable triggers                                       │
│                                                              │
│  Speed comparison (1M rows):                                │
│  • Row-by-row INSERT: Minutes                               │
│  • Batch INSERT:      Seconds                               │
│  • COPY:              Sub-second                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. pg_dump and pg_restore

### Backup & Restore

```bash
# Plain SQL backup (readable, portable)
pg_dump -h localhost -U postgres mydb > backup.sql

# Custom format (compressed, parallel restore)
pg_dump -h localhost -U postgres -Fc mydb > backup.dump

# Directory format (parallel dump and restore)
pg_dump -h localhost -U postgres -Fd mydb -j 4 -f backup_dir/

# Restore plain SQL
psql -h localhost -U postgres -d newdb < backup.sql

# Restore custom/directory format
pg_restore -h localhost -U postgres -d newdb backup.dump
pg_restore -h localhost -U postgres -d newdb -j 4 backup_dir/
```

### Selective Backup

```bash
# Single table
pg_dump -t products mydb > products.sql

# Multiple tables
pg_dump -t products -t orders mydb > subset.sql

# Schema only (no data)
pg_dump --schema-only mydb > schema.sql

# Data only
pg_dump --data-only mydb > data.sql

# Exclude tables
pg_dump --exclude-table='logs_*' mydb > backup.sql
```

### Cross-Server Migration

```bash
# Pipe directly to another server
pg_dump -h source_host mydb | psql -h dest_host newdb

# With compression
pg_dump -h source_host mydb | gzip | ssh dest_host "gunzip | psql newdb"
```

---

## 4. Foreign Data Wrappers (FDW)

### What is an FDW?

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 FOREIGN DATA WRAPPERS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Query external data sources as if they were Postgres tables!          │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      Your Postgres                               │   │
│   │                                                                  │   │
│   │   SELECT * FROM foreign_users                                   │   │
│   │   WHERE region = 'US'                                           │   │
│   │   JOIN local_orders ON ...                                      │   │
│   │                                                                  │   │
│   │            │                                                     │   │
│   │            ▼ FDW translates query                               │   │
│   │   ┌─────────────────────────────────────────────────────────┐   │   │
│   │   │              Foreign Data Wrapper                        │   │   │
│   │   │                                                          │   │   │
│   │   │   • Connects to remote source                           │   │   │
│   │   │   • Pushes down predicates when possible                │   │   │
│   │   │   • Returns data as Postgres rows                       │   │   │
│   │   └─────────────────────────────────────────────────────────┘   │   │
│   │                                                                  │   │
│   └──────────────────────────┬──────────────────────────────────────┘   │
│                              │                                           │
│              ┌───────────────┴───────────────┐                          │
│              │                               │                          │
│              ▼                               ▼                          │
│   ┌─────────────────┐             ┌─────────────────┐                  │
│   │ Remote Postgres │             │   MySQL, S3,    │                  │
│   │    Database     │             │   Stripe API,   │                  │
│   │                 │             │   BigQuery...   │                  │
│   └─────────────────┘             └─────────────────┘                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### postgres_fdw (Connect to Another Postgres)

```sql
-- 1. Install extension
CREATE EXTENSION postgres_fdw;

-- 2. Create foreign server
CREATE SERVER remote_db
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host 'remote.host.com', port '5432', dbname 'production');

-- 3. Create user mapping
CREATE USER MAPPING FOR local_user
    SERVER remote_db
    OPTIONS (user 'remote_user', password 'secret');

-- 4. Import foreign tables
IMPORT FOREIGN SCHEMA public
    FROM SERVER remote_db
    INTO local_schema;

-- Or create individual foreign tables
CREATE FOREIGN TABLE remote_users (
    id INTEGER,
    username TEXT,
    email TEXT,
    created_at TIMESTAMP
)
    SERVER remote_db
    OPTIONS (schema_name 'public', table_name 'users');

-- 5. Query as normal!
SELECT * FROM remote_users WHERE created_at > '2024-01-01';

-- Join local and remote!
SELECT 
    r.username,
    COUNT(o.id) as order_count
FROM remote_users r
JOIN local_orders o ON r.id = o.user_id
GROUP BY r.username;
```

### Query Pushdown

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    QUERY PUSHDOWN                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Without pushdown:                                                      │
│   SELECT * FROM remote_users WHERE region = 'US'                        │
│   → Fetches ALL users, filters locally (slow!)                          │
│                                                                          │
│   With pushdown:                                                         │
│   SELECT * FROM remote_users WHERE region = 'US'                        │
│   → Sends "WHERE region = 'US'" to remote (efficient!)                  │
│                                                                          │
│   postgres_fdw pushes down:                                             │
│   ✓ WHERE clauses                                                       │
│   ✓ ORDER BY (with proper options)                                      │
│   ✓ LIMIT                                                               │
│   ✓ Aggregate functions (Postgres 10+)                                  │
│   ✓ JOINs between same-server tables (Postgres 9.6+)                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Available FDWs

| FDW | Purpose |
|-----|---------|
| `postgres_fdw` | Other PostgreSQL databases |
| `mysql_fdw` | MySQL/MariaDB |
| `oracle_fdw` | Oracle databases |
| `mongo_fdw` | MongoDB |
| `file_fdw` | Local CSV/text files |
| `redis_fdw` | Redis key-value store |
| `s3_fdw` | Amazon S3 files |
| `clickhouse_fdw` | ClickHouse analytics |

---

## 5. Supabase Wrappers

### Supabase's FDW Framework

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 SUPABASE WRAPPERS                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   • Open-source FDW framework built on Wasm                             │
│   • Query external services as Postgres tables                          │
│   • Currently supports:                                                  │
│                                                                          │
│   Data Sources:                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ • Stripe      - Payment data as SQL tables                      │   │
│   │ • Firebase    - Firestore data                                  │   │
│   │ • Airtable    - Spreadsheet data                                │   │
│   │ • BigQuery    - Analytics warehouse                             │   │
│   │ • S3          - Files in S3 buckets                             │   │
│   │ • ClickHouse  - Analytics database                              │   │
│   │ • Auth0       - User data                                       │   │
│   │ • Logflare    - Log data                                        │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   Example: Query Stripe customers from Postgres!                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Stripe Wrapper Example

```sql
-- Enable the extension
CREATE EXTENSION wrappers;

-- Create the foreign server
CREATE FOREIGN DATA WRAPPER stripe_wrapper
  HANDLER stripe_fdw_handler
  VALIDATOR stripe_fdw_validator;

CREATE SERVER stripe_server
  FOREIGN DATA WRAPPER stripe_wrapper
  OPTIONS (api_key 'sk_test_xxx');

-- Create foreign tables for Stripe objects
CREATE FOREIGN TABLE stripe_customers (
  id TEXT,
  email TEXT,
  name TEXT,
  created TIMESTAMP,
  metadata JSONB
)
  SERVER stripe_server
  OPTIONS (object 'customers');

CREATE FOREIGN TABLE stripe_subscriptions (
  id TEXT,
  customer TEXT,
  status TEXT,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP
)
  SERVER stripe_server
  OPTIONS (object 'subscriptions');

-- Now query Stripe data with SQL!
SELECT 
    c.email,
    s.status,
    s.current_period_end
FROM stripe_customers c
JOIN stripe_subscriptions s ON c.id = s.customer
WHERE s.status = 'active';

-- Join with local data!
SELECT 
    u.username,
    sc.email as stripe_email,
    COUNT(o.id) as orders
FROM users u
JOIN stripe_customers sc ON u.stripe_id = sc.id
JOIN orders o ON u.id = o.user_id
GROUP BY u.username, sc.email;
```

### S3 Wrapper Example

```sql
-- Query parquet files from S3
CREATE FOREIGN TABLE sales_2024 (
    order_id BIGINT,
    product_id INT,
    quantity INT,
    price DECIMAL,
    order_date DATE
)
  SERVER s3_server
  OPTIONS (
    uri 's3://my-bucket/sales/2024/*.parquet',
    format 'parquet'
  );

-- Query S3 data with SQL
SELECT 
    product_id,
    SUM(quantity) as total_sold,
    SUM(price * quantity) as revenue
FROM sales_2024
WHERE order_date >= '2024-01-01'
GROUP BY product_id
ORDER BY revenue DESC;
```

---

## 6. Common ETL Patterns

### Pattern 1: Staging Tables

```sql
-- Load raw data into staging
CREATE TABLE staging_products (
    raw_data JSONB
);

COPY staging_products FROM '/data/products.json';

-- Transform and load into production
INSERT INTO products (name, price, category_id)
SELECT 
    raw_data->>'name',
    (raw_data->>'price')::decimal,
    (SELECT id FROM categories WHERE slug = raw_data->>'category')
FROM staging_products
WHERE raw_data->>'price' IS NOT NULL;

-- Clean up
DROP TABLE staging_products;
```

### Pattern 2: Incremental Loads

```sql
-- Track last loaded timestamp
CREATE TABLE etl_metadata (
    source_name TEXT PRIMARY KEY,
    last_loaded_at TIMESTAMP
);

-- Load only new records
INSERT INTO orders (id, user_id, total, created_at)
SELECT id, user_id, total, created_at
FROM remote_orders
WHERE created_at > (
    SELECT last_loaded_at FROM etl_metadata WHERE source_name = 'orders'
);

-- Update metadata
UPDATE etl_metadata 
SET last_loaded_at = NOW() 
WHERE source_name = 'orders';
```

### Pattern 3: Upsert (Insert or Update)

```sql
-- Insert new, update existing
INSERT INTO products (id, name, price, updated_at)
SELECT id, name, price, NOW()
FROM staging_products
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    updated_at = EXCLUDED.updated_at;
```

---

## 🎤 Interview Angle

**Q: "How would you migrate data from MySQL to Postgres?"**

> "Several approaches: For one-time migration, I'd use pgloader which handles type mapping automatically. For ongoing sync, I'd use mysql_fdw or a CDC tool like Debezium to stream changes. The key considerations are data type differences (MySQL's lack of array types, timestamp handling), character encoding, and testing thoroughly before cutover."

**Q: "What are Foreign Data Wrappers and when would you use them?"**

> "FDWs let you query external data sources as if they were Postgres tables. Use cases: querying another Postgres for cross-database JOINs, integrating external services like Stripe without building ETL pipelines, accessing data lakes or warehouses. The key benefit is using familiar SQL instead of building custom integration code. Supabase Wrappers extend this to many SaaS APIs."

**Q: "What's the difference between COPY and INSERT for bulk loading?"**

> "COPY is Postgres's bulk loading mechanism - it bypasses the SQL parser and writes directly to table files. For a million rows, COPY can be 10-100x faster than individual INSERTs. Even batched INSERTs can't match it. For best performance, drop indexes before COPY and rebuild after, and increase maintenance_work_mem."

---

## 🧠 Key Takeaways

```
┌─────────────────────────────────────────────────────────────┐
│                ETL TOOLKIT                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  BULK LOADING:                                              │
│  • COPY for fastest import/export                           │
│  • \copy for client-side files                              │
│  • Drop indexes before, rebuild after                       │
│                                                              │
│  BACKUP/MIGRATION:                                          │
│  • pg_dump/pg_restore for Postgres                         │
│  • pgloader for cross-database migration                   │
│                                                              │
│  FOREIGN DATA WRAPPERS:                                     │
│  • postgres_fdw for other Postgres                         │
│  • Supabase Wrappers for SaaS (Stripe, etc.)               │
│  • Query external data with SQL JOINs                      │
│                                                              │
│  ETL PATTERNS:                                              │
│  • Staging tables for transformation                        │
│  • Incremental loads with metadata tracking                │
│  • Upsert with ON CONFLICT                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏭️ Tomorrow: Day 12

We'll explore **Change Data Capture (CDC)** - streaming database changes in real-time for event-driven architectures.

