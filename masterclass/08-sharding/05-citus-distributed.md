# Distributed PostgreSQL: Citus

> **The Question**: "Can I get sharding without giving up PostgreSQL?"

---

## Visual 1: Citus Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CITUS: Distributed PostgreSQL                                          │
│  ═════════════════════════════                                           │
│                                                                          │
│  Citus is an extension that turns PostgreSQL into a distributed DB.    │
│                                                                          │
│  ARCHITECTURE:                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │              ┌───────────────────────────────┐                 │     │
│  │              │      COORDINATOR NODE          │                 │     │
│  │              │                                │                 │     │
│  │              │  • Receives all queries        │                 │     │
│  │              │  • Plans distributed execution │                 │     │
│  │              │  • Routes to worker nodes      │                 │     │
│  │              │  • Aggregates results          │                 │     │
│  │              │  • Stores metadata only        │                 │     │
│  │              │                                │                 │     │
│  │              └───────────────┬───────────────┘                 │     │
│  │                              │                                  │     │
│  │           ┌──────────────────┼──────────────────┐              │     │
│  │           │                  │                  │              │     │
│  │           ▼                  ▼                  ▼              │     │
│  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │     │
│  │  │   WORKER 1   │   │   WORKER 2   │   │   WORKER 3   │       │     │
│  │  │              │   │              │   │              │       │     │
│  │  │ users_102001 │   │ users_102003 │   │ users_102005 │       │     │
│  │  │ users_102002 │   │ users_102004 │   │ users_102006 │       │     │
│  │  │ orders_...   │   │ orders_...   │   │ orders_...   │       │     │
│  │  │              │   │              │   │              │       │     │
│  │  │ (actual data │   │ (actual data │   │ (actual data │       │     │
│  │  │  lives here) │   │  lives here) │   │  lives here) │       │     │
│  │  └──────────────┘   └──────────────┘   └──────────────┘       │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Distributed Tables

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DISTRIBUTED TABLES: Sharding Made Easy                                  │
│  ═══════════════════════════════════════                                 │
│                                                                          │
│  CREATE TABLE users (                                                    │
│      id BIGSERIAL,                                                       │
│      email TEXT,                                                         │
│      name TEXT                                                           │
│  );                                                                      │
│                                                                          │
│  -- Turn it into a distributed table:                                   │
│  SELECT create_distributed_table('users', 'id');                        │
│                                                                          │
│  That's it! Citus:                                                       │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  1. Creates 32 shards (default) across workers                 │     │
│  │  2. Hashes 'id' to determine shard placement                   │     │
│  │  3. Routes queries based on WHERE clauses                      │     │
│  │                                                                 │     │
│  │  users_102001  users_102002  ...  users_102032                 │     │
│  │     (shard 1)    (shard 2)          (shard 32)                 │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  QUERIES WORK NORMALLY:                                                  │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  -- Routed to single shard (efficient):                        │     │
│  │  SELECT * FROM users WHERE id = 12345;                         │     │
│  │                                                                 │     │
│  │  -- Parallel across all shards:                                │     │
│  │  SELECT COUNT(*) FROM users;                                    │     │
│  │                                                                 │     │
│  │  -- JOINs work if co-located:                                  │     │
│  │  SELECT * FROM users u JOIN orders o ON u.id = o.user_id       │     │
│  │    WHERE u.id = 12345;                                          │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: Reference Tables

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REFERENCE TABLES: Replicated to All Nodes                              │
│  ═════════════════════════════════════════                               │
│                                                                          │
│  Some tables are small and needed everywhere (countries, categories).  │
│                                                                          │
│  CREATE TABLE countries (                                                │
│      code CHAR(2) PRIMARY KEY,                                          │
│      name TEXT                                                           │
│  );                                                                      │
│  -- Replicate to all workers:                                           │
│  SELECT create_reference_table('countries');                            │
│                                                                          │
│  RESULT:                                                                 │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Worker 1               Worker 2               Worker 3        │     │
│  │  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐│     │
│  │  │ countries      │    │ countries      │    │ countries      ││     │
│  │  │ (full copy)    │    │ (full copy)    │    │ (full copy)    ││     │
│  │  │                │    │                │    │                ││     │
│  │  │ users_shard_1  │    │ users_shard_2  │    │ users_shard_3  ││     │
│  │  │ users_shard_4  │    │ users_shard_5  │    │ users_shard_6  ││     │
│  │  └────────────────┘    └────────────────┘    └────────────────┘│     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  NOW JOINs WORK:                                                         │
│  SELECT u.*, c.name as country_name                                     │
│  FROM users u                                                            │
│  JOIN countries c ON u.country_code = c.code                            │
│  WHERE u.id = 12345;                                                     │
│                                                                          │
│  Each worker has countries locally, no network hop needed!              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: Colocation

```
┌─────────────────────────────────────────────────────────────────────────┐
│  COLOCATION: Keeping Related Data Together                              │
│  ═════════════════════════════════════════                               │
│                                                                          │
│  PROBLEM: users and orders on different shards → slow JOINs            │
│                                                                          │
│  SOLUTION: Colocate by the same shard key                               │
│                                                                          │
│  SELECT create_distributed_table('users', 'id');                        │
│  SELECT create_distributed_table('orders', 'user_id',                   │
│      colocate_with => 'users');                                         │
│                                                                          │
│  RESULT:                                                                 │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Worker 1:                                                      │     │
│  │  ┌──────────────────────────────────────────────────────────┐  │     │
│  │  │  users (id 1-1000)                                       │  │     │
│  │  │  orders (user_id 1-1000)  ← Same shard!                  │  │     │
│  │  │                                                           │  │     │
│  │  │  User 42's data + User 42's orders = SAME WORKER         │  │     │
│  │  │  JOINs are LOCAL, no network!                            │  │     │
│  │  └──────────────────────────────────────────────────────────┘  │     │
│  │                                                                 │     │
│  │  Worker 2:                                                      │     │
│  │  ┌──────────────────────────────────────────────────────────┐  │     │
│  │  │  users (id 1001-2000)                                    │  │     │
│  │  │  orders (user_id 1001-2000)                              │  │     │
│  │  └──────────────────────────────────────────────────────────┘  │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  Query: SELECT * FROM users u                                           │
│         JOIN orders o ON u.id = o.user_id                               │
│         WHERE u.id = 42;                                                 │
│                                                                          │
│  → Executed entirely on Worker 1, fast as single PostgreSQL!           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
