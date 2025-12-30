# Partitioning: Range, List, Hash

> **The Question**: "My table has 1 billion rows and queries are getting slow. What now?"

---

## Visual 1: The Single Table Problem

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE SINGLE TABLE PROBLEM                                                │
│  ════════════════════════                                                │
│                                                                          │
│  Table: events (1 billion rows, 500 GB)                                 │
│                                                                          │
│  PROBLEMS:                                                               │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  1. VACUUM takes hours (must scan entire table)                │     │
│  │                                                                 │     │
│  │  2. Index builds take hours                                     │     │
│  │                                                                 │     │
│  │  3. Even indexed queries slow (massive indexes)                │     │
│  │                                                                 │     │
│  │  4. Data retention: DELETE FROM events WHERE date < '2020-01' │     │
│  │     → Deletes 100M rows, creates massive bloat                │     │
│  │     → Vacuum takes forever                                      │     │
│  │                                                                 │     │
│  │  5. Backups take hours                                          │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  SOLUTION: Split the table into PARTITIONS                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Range Partitioning (Most Common)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  RANGE PARTITIONING: Split by Date                                      │
│  ═════════════════════════════════                                       │
│                                                                          │
│  CREATE TABLE events (                                                   │
│      id BIGSERIAL,                                                       │
│      created_at TIMESTAMP,                                               │
│      data JSONB                                                          │
│  ) PARTITION BY RANGE (created_at);                                     │
│                                                                          │
│  CREATE TABLE events_2024_01 PARTITION OF events                        │
│      FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');                  │
│  CREATE TABLE events_2024_02 PARTITION OF events                        │
│      FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');                  │
│  -- etc.                                                                 │
│                                                                          │
│  PHYSICAL STRUCTURE:                                                     │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │   events (parent - no data)                                    │     │
│  │      │                                                          │     │
│  │      ├── events_2024_01  [Jan data, 40 GB]                     │     │
│  │      ├── events_2024_02  [Feb data, 35 GB]                     │     │
│  │      ├── events_2024_03  [Mar data, 42 GB]                     │     │
│  │      ├── ...                                                    │     │
│  │      └── events_2024_12  [Dec data, 38 GB]                     │     │
│  │                                                                 │     │
│  │  Each partition is a SEPARATE TABLE with its own:              │     │
│  │  • Data files                                                   │     │
│  │  • Indexes                                                      │     │
│  │  • Statistics                                                   │     │
│  │  • VACUUM state                                                 │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: Partition Pruning

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PARTITION PRUNING: The Magic                                            │
│  ════════════════════════════                                            │
│                                                                          │
│  Query: SELECT * FROM events WHERE created_at = '2024-03-15';           │
│                                                                          │
│  WITHOUT PARTITIONING:                                                   │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Scan entire 500 GB table to find one day's data              │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  WITH PARTITIONING:                                                      │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Planner sees: WHERE created_at = '2024-03-15'                 │     │
│  │                                                                 │     │
│  │  events_2024_01  ─────▶ SKIP (Mar 15 not in Jan)              │     │
│  │  events_2024_02  ─────▶ SKIP (Mar 15 not in Feb)              │     │
│  │  events_2024_03  ─────▶ SCAN! (Mar 15 is in Mar)  ✓           │     │
│  │  events_2024_04  ─────▶ SKIP (Mar 15 not in Apr)              │     │
│  │  ...                                                            │     │
│  │                                                                 │     │
│  │  Only 42 GB scanned instead of 500 GB!                        │     │
│  │  12x less I/O!                                                  │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  EXPLAIN shows:                                                          │
│  Append                                                                  │
│    ->  Seq Scan on events_2024_03                                       │
│          Filter: (created_at = '2024-03-15')                            │
│                                                                          │
│  (Other partitions not even mentioned - pruned at planning time!)       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: List and Hash Partitioning

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LIST PARTITIONING: Split by Category                                   │
│  ════════════════════════════════════                                    │
│                                                                          │
│  CREATE TABLE orders (                                                   │
│      id BIGSERIAL,                                                       │
│      region TEXT,                                                        │
│      total DECIMAL                                                       │
│  ) PARTITION BY LIST (region);                                          │
│                                                                          │
│  CREATE TABLE orders_americas PARTITION OF orders                       │
│      FOR VALUES IN ('US', 'CA', 'MX', 'BR');                            │
│  CREATE TABLE orders_europe PARTITION OF orders                         │
│      FOR VALUES IN ('UK', 'DE', 'FR', 'IT');                            │
│  CREATE TABLE orders_asia PARTITION OF orders                           │
│      FOR VALUES IN ('JP', 'CN', 'IN', 'KR');                            │
│                                                                          │
│  Good for: Categorical data, multi-tenant (one partition per tenant)   │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│  HASH PARTITIONING: Split Evenly                                        │
│  ═══════════════════════════════                                         │
│                                                                          │
│  CREATE TABLE users (                                                    │
│      id BIGSERIAL,                                                       │
│      email TEXT                                                          │
│  ) PARTITION BY HASH (id);                                              │
│                                                                          │
│  CREATE TABLE users_p0 PARTITION OF users                               │
│      FOR VALUES WITH (modulus 4, remainder 0);                          │
│  CREATE TABLE users_p1 PARTITION OF users                               │
│      FOR VALUES WITH (modulus 4, remainder 1);                          │
│  CREATE TABLE users_p2 PARTITION OF users                               │
│      FOR VALUES WITH (modulus 4, remainder 2);                          │
│  CREATE TABLE users_p3 PARTITION OF users                               │
│      FOR VALUES WITH (modulus 4, remainder 3);                          │
│                                                                          │
│  id=1  → hash(1) % 4 = 1 → users_p1                                    │
│  id=2  → hash(2) % 4 = 2 → users_p2                                    │
│  id=10 → hash(10) % 4 = 0 → users_p0                                   │
│                                                                          │
│  Good for: Even distribution when no natural partition key             │
│  Caveat: Can't easily drop partitions (data mixed by hash)             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 5: Data Retention Made Easy

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DATA RETENTION: Drop Partition vs DELETE                                │
│  ════════════════════════════════════════                                │
│                                                                          │
│  "Delete all data older than 2 years"                                   │
│                                                                          │
│  WITHOUT PARTITIONING:                                                   │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  DELETE FROM events WHERE created_at < '2022-01-01';           │     │
│  │                                                                 │     │
│  │  • Deletes 200 million rows one by one                         │     │
│  │  • Creates 200 million dead tuples                             │     │
│  │  • VACUUM must clean all of them                               │     │
│  │  • Takes hours, high I/O                                        │     │
│  │  • Table stays bloated until vacuum                            │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  WITH PARTITIONING:                                                      │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  DROP TABLE events_2021_01;                                    │     │
│  │  DROP TABLE events_2021_02;                                    │     │
│  │  ...                                                            │     │
│  │  DROP TABLE events_2021_12;                                    │     │
│  │                                                                 │     │
│  │  • Instant! Just removes files                                 │     │
│  │  • No dead tuples                                               │     │
│  │  • No vacuum needed                                             │     │
│  │  • Disk space immediately freed                                │     │
│  │  • Takes milliseconds                                           │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
