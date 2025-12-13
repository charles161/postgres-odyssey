# Day 12: Change Data Capture (CDC)

> **Time:** 2 hours  
> **Goal:** Stream database changes for real-time data pipelines  
> **Analogy:** Like React's useEffect watching for state changes - but for your database

---

## 🎯 What You'll Learn Today

```
┌─────────────────────────────────────────────────────────────┐
│                     DAY 12 ROADMAP                          │
├─────────────────────────────────────────────────────────────┤
│  1. What is CDC?                     (15 min)               │
│  2. Logical Replication for CDC      (30 min)               │
│  3. Publication & Subscription       (25 min)               │
│  4. Output Plugins                   (20 min)               │
│  5. Debezium                         (20 min)               │
│  6. Supabase Realtime                (10 min)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. What is CDC?

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  CHANGE DATA CAPTURE                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   CDC captures row-level changes as they happen:                        │
│   • INSERT → New row created                                            │
│   • UPDATE → Row modified (old + new values)                            │
│   • DELETE → Row removed                                                │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    Postgres                                      │   │
│   │                                                                  │   │
│   │   INSERT INTO orders VALUES (1, 'pending', 99.99);              │   │
│   │                         │                                        │   │
│   │                         ▼                                        │   │
│   │              ┌─────────────────────┐                            │   │
│   │              │  WAL (Write-Ahead   │                            │   │
│   │              │       Log)          │                            │   │
│   │              └──────────┬──────────┘                            │   │
│   │                         │                                        │   │
│   │                         ▼                                        │   │
│   │              ┌─────────────────────┐                            │   │
│   │              │  Logical Decoding   │ ← CDC happens here!        │   │
│   │              └──────────┬──────────┘                            │   │
│   │                         │                                        │   │
│   └─────────────────────────┼───────────────────────────────────────┘   │
│                             │                                            │
│                             ▼                                            │
│           ┌─────────────────────────────────────────────┐               │
│           │             Change Stream                    │               │
│           │                                              │               │
│           │   {                                          │               │
│           │     "op": "INSERT",                          │               │
│           │     "table": "orders",                       │               │
│           │     "data": {"id": 1, "status": "pending"}  │               │
│           │   }                                          │               │
│           │                                              │               │
│           └──────────────────────┬──────────────────────┘               │
│                                  │                                       │
│              ┌───────────────────┼───────────────────┐                  │
│              │                   │                   │                  │
│              ▼                   ▼                   ▼                  │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐          │
│   │     Kafka       │ │   Data Lake     │ │    Realtime     │          │
│   │                 │ │                 │ │     WebSocket   │          │
│   └─────────────────┘ └─────────────────┘ └─────────────────┘          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### CDC Use Cases

```
┌─────────────────────────────────────────────────────────────┐
│              CDC USE CASES                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. REAL-TIME ANALYTICS                                     │
│     Stream changes to data warehouse                        │
│     Dashboard updates without polling                       │
│                                                              │
│  2. CACHE INVALIDATION                                      │
│     Invalidate Redis cache when data changes               │
│     Consistent cache without TTL guessing                  │
│                                                              │
│  3. SEARCH INDEX SYNC                                       │
│     Update Elasticsearch when Postgres changes             │
│     Always-fresh search results                            │
│                                                              │
│  4. MICROSERVICES EVENTS                                    │
│     Outbox pattern for reliable events                     │
│     Database as event source                               │
│                                                              │
│  5. AUDIT LOGS                                              │
│     Capture all changes automatically                      │
│     Complete history of data modifications                 │
│                                                              │
│  6. DATA REPLICATION                                        │
│     Cross-datacenter sync                                  │
│     Multi-cloud data distribution                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Logical Replication for CDC

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│              LOGICAL REPLICATION PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. WRITE                                                               │
│      Application executes: INSERT INTO orders (...)                     │
│                                                                          │
│   2. WAL WRITE                                                           │
│      Postgres writes to WAL (binary format)                             │
│      This is the source of truth                                        │
│                                                                          │
│   3. LOGICAL DECODING                                                    │
│      Converts binary WAL → Row changes                                  │
│      Uses a replication slot to track position                          │
│      Uses output plugin to format the data                              │
│                                                                          │
│   4. STREAM                                                              │
│      Changes sent to subscribers                                        │
│      Could be: another Postgres, Kafka, custom consumer                │
│                                                                          │
│   Key components:                                                        │
│   • wal_level = logical  (enables logical decoding)                     │
│   • Replication Slot     (tracks consumer position)                     │
│   • Publication          (defines what to replicate)                    │
│   • Output Plugin        (formats change stream)                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Enable Logical Replication

```sql
-- Check current wal_level
SHOW wal_level;  -- Must be 'logical'

-- In postgresql.conf (requires restart if not already logical)
wal_level = logical
max_replication_slots = 10
max_wal_senders = 10
```

### Create Replication Slot

```sql
-- Create a slot with pgoutput (built-in plugin)
SELECT pg_create_logical_replication_slot('my_slot', 'pgoutput');

-- View slots
SELECT slot_name, plugin, active, restart_lsn 
FROM pg_replication_slots;

-- Peek at changes (doesn't consume)
SELECT * FROM pg_logical_slot_peek_changes('my_slot', NULL, NULL);

-- Get and consume changes
SELECT * FROM pg_logical_slot_get_changes('my_slot', NULL, NULL);

-- Drop slot (WARNING: allows WAL cleanup)
SELECT pg_drop_replication_slot('my_slot');
```

---

## 3. Publication & Subscription

### Built-in Logical Replication

```
┌─────────────────────────────────────────────────────────────────────────┐
│           PUBLICATION / SUBSCRIPTION MODEL                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   PUBLISHER (Source)              SUBSCRIBER (Destination)              │
│   ┌─────────────────────┐        ┌─────────────────────┐               │
│   │                     │        │                     │               │
│   │  CREATE PUBLICATION │───────►│  CREATE SUBSCRIPTION│               │
│   │  my_pub FOR TABLE   │        │  TO 'my_pub'       │               │
│   │  orders, products;  │        │                     │               │
│   │                     │        │  Changes applied    │               │
│   │  WAL → Decoder →    │───────►│  automatically      │               │
│   │  Stream changes     │        │                     │               │
│   │                     │        │                     │               │
│   └─────────────────────┘        └─────────────────────┘               │
│                                                                          │
│   Unlike physical replication:                                          │
│   • Subscriber can have additional tables                               │
│   • Subscriber can be different Postgres version                        │
│   • Can replicate subset of tables                                      │
│   • Subscriber can be writeable!                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Create Publication (Source)

```sql
-- Publish specific tables
CREATE PUBLICATION my_publication 
FOR TABLE orders, products, users;

-- Publish all tables
CREATE PUBLICATION full_publication 
FOR ALL TABLES;

-- Publish with row filter (Postgres 15+)
CREATE PUBLICATION active_orders 
FOR TABLE orders 
WHERE (status != 'cancelled');

-- Publish specific columns (Postgres 15+)
CREATE PUBLICATION public_users 
FOR TABLE users (id, username, created_at);  -- Exclude email, password

-- View publications
SELECT * FROM pg_publication;
SELECT * FROM pg_publication_tables;

-- Modify publication
ALTER PUBLICATION my_publication ADD TABLE reviews;
ALTER PUBLICATION my_publication DROP TABLE products;
```

### Create Subscription (Destination)

```sql
-- On subscriber database (different server)
CREATE SUBSCRIPTION my_subscription
CONNECTION 'host=publisher.example.com dbname=sourcedb user=replicator password=secret'
PUBLICATION my_publication;

-- View subscriptions
SELECT * FROM pg_subscription;
SELECT * FROM pg_stat_subscription;

-- Disable subscription
ALTER SUBSCRIPTION my_subscription DISABLE;

-- Re-enable
ALTER SUBSCRIPTION my_subscription ENABLE;

-- Drop subscription
DROP SUBSCRIPTION my_subscription;
```

### Initial Data Sync

```sql
-- Default: Copies existing data, then streams changes
CREATE SUBSCRIPTION my_subscription
CONNECTION '...'
PUBLICATION my_publication
WITH (copy_data = true);  -- Default

-- Skip initial copy (if tables already in sync)
CREATE SUBSCRIPTION my_subscription
CONNECTION '...'
PUBLICATION my_publication
WITH (copy_data = false);
```

---

## 4. Output Plugins

### What Output Plugins Do

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    OUTPUT PLUGINS                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   WAL (binary) ─────────► Output Plugin ─────────► Formatted Stream    │
│                                                                          │
│   Built-in plugins:                                                      │
│                                                                          │
│   pgoutput (default, Postgres 10+)                                      │
│   • Used by native logical replication                                  │
│   • Binary protocol, efficient                                          │
│   • Required for CREATE SUBSCRIPTION                                    │
│                                                                          │
│   test_decoding                                                          │
│   • Human-readable text output                                          │
│   • Good for debugging                                                  │
│   • Not for production use                                              │
│                                                                          │
│   Third-party plugins:                                                   │
│                                                                          │
│   wal2json                                                              │
│   • Outputs changes as JSON                                             │
│   • Easy to parse in any language                                       │
│   • Popular for custom CDC consumers                                    │
│                                                                          │
│   pglogical                                                              │
│   • Advanced logical replication                                        │
│   • Supports more features than native                                  │
│   • Popular before Postgres 10                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### wal2json Example

```sql
-- Create slot with wal2json
SELECT pg_create_logical_replication_slot('json_slot', 'wal2json');

-- Make some changes
INSERT INTO orders (user_id, status, total_amount) VALUES (1, 'pending', 99.99);

-- Get changes as JSON
SELECT data FROM pg_logical_slot_get_changes('json_slot', NULL, NULL);

-- Output:
-- {
--   "change": [
--     {
--       "kind": "insert",
--       "schema": "public",
--       "table": "orders",
--       "columnnames": ["id", "user_id", "status", "total_amount"],
--       "columnvalues": [1001, 1, "pending", 99.99]
--     }
--   ]
-- }
```

---

## 5. Debezium

### Enterprise-Grade CDC

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       DEBEZIUM                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Open-source distributed CDC platform                                  │
│                                                                          │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    │
│   │    Postgres     │───►│    Debezium     │───►│     Kafka       │    │
│   │                 │    │   Connector     │    │                 │    │
│   │                 │    │                 │    │  Topic per      │    │
│   │  WAL + Logical  │    │ • Reads WAL     │    │  table          │    │
│   │  Replication    │    │ • Formats JSON  │    │                 │    │
│   │                 │    │ • Handles errors│    │                 │    │
│   │                 │    │ • Tracks offset │    │                 │    │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘    │
│                                                         │               │
│                                                         ▼               │
│                                           ┌─────────────────────┐       │
│                                           │     Consumers       │       │
│                                           │                     │       │
│                                           │ • Elasticsearch     │       │
│                                           │ • Data Warehouse    │       │
│                                           │ • Cache Invalidator │       │
│                                           │ • Event Handlers    │       │
│                                           └─────────────────────┘       │
│                                                                          │
│   Supports: Postgres, MySQL, MongoDB, SQL Server, Oracle, Cassandra    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Debezium Message Format

```json
{
  "before": null,
  "after": {
    "id": 1001,
    "user_id": 1,
    "status": "pending",
    "total_amount": 99.99,
    "created_at": 1704067200000000
  },
  "source": {
    "version": "2.4.0",
    "connector": "postgresql",
    "name": "dbserver1",
    "ts_ms": 1704067200123,
    "db": "mydb",
    "schema": "public",
    "table": "orders",
    "lsn": 34567890,
    "xid": 12345
  },
  "op": "c",  // c=create, u=update, d=delete, r=read (snapshot)
  "ts_ms": 1704067200456
}
```

### When to Use Debezium

| Use Case | Native Logical Rep | Debezium |
|----------|-------------------|----------|
| Postgres to Postgres | ✅ Simpler | ⚠️ Overkill |
| Postgres to Kafka | ⚠️ Custom code | ✅ Built for this |
| Multiple databases | ❌ Postgres only | ✅ Many sources |
| High-volume CDC | ⚠️ Limited tooling | ✅ Production-ready |
| Schema evolution | ⚠️ Manual | ✅ Handled |

---

## 6. Supabase Realtime

### Real-Time Subscriptions

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 SUPABASE REALTIME                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Postgres ───► Realtime Server ───► WebSocket ───► Browser             │
│                                                                          │
│   Powered by:                                                            │
│   • Postgres logical replication                                        │
│   • Elixir/Phoenix for WebSocket handling                               │
│   • Row Level Security (RLS) for authorization                          │
│                                                                          │
│   Frontend subscription:                                                 │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  const channel = supabase                                        │   │
│   │    .channel('orders')                                            │   │
│   │    .on(                                                          │   │
│   │      'postgres_changes',                                         │   │
│   │      { event: 'INSERT', schema: 'public', table: 'orders' },    │   │
│   │      (payload) => console.log('New order:', payload.new)        │   │
│   │    )                                                             │   │
│   │    .subscribe();                                                 │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   RLS Integration:                                                       │
│   • Users only receive changes they're authorized to see               │
│   • Security policies apply to realtime streams                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Supabase Realtime Setup

```sql
-- Enable realtime for a table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Check which tables have realtime enabled
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

```javascript
// Frontend code
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Subscribe to all changes on orders table
supabase
  .channel('orders-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()

// Subscribe to specific events
supabase
  .channel('new-orders')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'orders' },
    handleNewOrder
  )
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'orders', filter: 'status=eq.shipped' },
    handleShippedOrder
  )
  .subscribe()
```

---

## 🎤 Interview Angle

**Q: "How does Change Data Capture work in Postgres?"**

> "Postgres CDC uses logical replication which decodes the WAL (Write-Ahead Log) into row-level changes. You set wal_level=logical, create a replication slot to track position, and either use native publication/subscription to another Postgres, or tools like Debezium to stream to Kafka. The key components are the replication slot that ensures no changes are lost, and the output plugin that formats the data."

**Q: "When would you use CDC vs traditional ETL?"**

> "Traditional ETL runs on a schedule - maybe hourly or daily. CDC streams changes in real-time, often sub-second latency. Use CDC for: real-time dashboards, cache invalidation, event-driven microservices, and keeping search indexes in sync. Use batch ETL for: historical analysis, data warehouse loads where freshness isn't critical, and when processing overhead matters more than latency."

**Q: "How does Supabase Realtime work under the hood?"**

> "Supabase Realtime uses Postgres logical replication. When you enable realtime on a table, it's added to a publication. Changes flow through logical decoding to a Realtime server written in Elixir, which broadcasts to connected WebSocket clients. The clever part is RLS integration - the server checks Row Level Security policies before sending events, so users only receive changes they're authorized to see."

---

## 🧠 Key Takeaways

```
┌─────────────────────────────────────────────────────────────┐
│                CDC MENTAL MODEL                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CORE CONCEPTS:                                             │
│  • WAL = source of truth for all changes                   │
│  • Logical Decoding = binary WAL → row changes             │
│  • Replication Slot = tracks consumer position             │
│  • Publication = what tables to stream                     │
│                                                              │
│  NATIVE POSTGRES:                                           │
│  • Publication/Subscription for Postgres-to-Postgres       │
│  • pgoutput or wal2json for custom consumers               │
│                                                              │
│  EXTERNAL TOOLS:                                            │
│  • Debezium for Kafka integration                          │
│  • Supabase Realtime for browser subscriptions             │
│                                                              │
│  KEY WARNINGS:                                              │
│  ⚠️ Replication slots retain WAL until consumed            │
│  ⚠️ DDL changes not automatically replicated               │
│  ⚠️ REPLICA IDENTITY needed for UPDATE/DELETE              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏭️ Tomorrow: Day 13

We'll explore **Supabase Platform Deep Dive** - understanding how Supabase builds on Postgres, their unique extensions, and OrioleDB.

