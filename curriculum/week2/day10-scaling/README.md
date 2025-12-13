# Day 10: Scaling Postgres

> **Time:** 2 hours  
> **Goal:** Understand strategies to scale Postgres beyond a single server  
> **Analogy:** Like scaling React apps - CDNs, code splitting, microservices

---

## 🎯 What You'll Learn Today

```
┌─────────────────────────────────────────────────────────────┐
│                     DAY 10 ROADMAP                          │
├─────────────────────────────────────────────────────────────┤
│  1. Scaling Dimensions                (15 min)              │
│  2. Vertical Scaling                  (15 min)              │
│  3. Read Scaling with Replicas        (20 min)              │
│  4. Connection Pooling at Scale       (20 min)              │
│  5. Partitioning (BEFORE Sharding!)   (25 min)              │
│  6. Sharding Strategies               (25 min)              │
│  7. Supabase's Approach               (15 min)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Scaling Dimensions

### What Are We Scaling?

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SCALING DIMENSIONS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. DATA VOLUME                                                        │
│      How much data can we store?                                        │
│      • Single table: 32TB theoretical                                   │
│      • But: Large tables = slow maintenance, backups                    │
│      • Solution: Partitioning, archival, sharding                       │
│                                                                          │
│   2. QUERY THROUGHPUT                                                    │
│      How many queries per second?                                       │
│      • Reads: Scale with replicas                                       │
│      • Writes: Harder - only one primary                                │
│      • Solution: Caching, connection pooling, sharding                  │
│                                                                          │
│   3. CONNECTIONS                                                        │
│      How many concurrent connections?                                   │
│      • Default max: 100 (each uses ~10MB)                              │
│      • Serverless: Potentially thousands                                │
│      • Solution: Connection pooling (PgBouncer, Supavisor)              │
│                                                                          │
│   4. RESPONSE TIME                                                       │
│      How fast are queries?                                              │
│      • Depends on: Indexes, query optimization, hardware                │
│      • Solution: Optimization, read replicas, caching                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Vertical Scaling

### Scale Up: Bigger Hardware

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VERTICAL SCALING                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Before:                          After:                                │
│   ┌─────────────────┐             ┌─────────────────┐                   │
│   │  4 CPU cores    │             │  32 CPU cores   │                   │
│   │  16 GB RAM      │  ────────►  │  256 GB RAM     │                   │
│   │  500 GB SSD     │             │  4 TB NVMe      │                   │
│   └─────────────────┘             └─────────────────┘                   │
│                                                                          │
│   Pros:                                                                  │
│   ✓ Simplest approach                                                   │
│   ✓ No application changes                                              │
│   ✓ No distributed system complexity                                    │
│                                                                          │
│   Cons:                                                                  │
│   ✗ Hardware limits (can't buy infinite CPU)                            │
│   ✗ Expensive at the high end                                           │
│   ✗ Single point of failure                                             │
│   ✗ Downtime for upgrades                                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### AWS RDS Instance Comparison

| Instance | vCPU | RAM | Max IOPS | Use Case |
|----------|------|-----|----------|----------|
| db.t3.micro | 2 | 1 GB | - | Development |
| db.r6g.large | 2 | 16 GB | 12,000 | Small production |
| db.r6g.4xlarge | 16 | 128 GB | 18,750 | Medium production |
| db.r6g.16xlarge | 64 | 512 GB | 80,000 | Large production |
| db.r6g.metal | 64 | 512 GB | 260,000 | Maximum performance |

### Vertical Scaling Checklist

```
┌─────────────────────────────────────────────────────────────┐
│         BEFORE SCALING UP, ASK:                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  □ Have I optimized indexes?                                │
│  □ Have I analyzed slow queries?                            │
│  □ Is autovacuum keeping up?                                │
│  □ Is shared_buffers properly sized?                        │
│  □ Am I using connection pooling?                           │
│  □ Can I cache frequent reads?                              │
│  □ Are there N+1 queries I can fix?                         │
│                                                              │
│  Often 80% of performance issues are query/index related!   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Read Scaling with Replicas

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    READ SCALING                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                    ┌─────────────────┐                                   │
│                    │   Application   │                                   │
│                    │                 │                                   │
│                    │ Writes → Primary│                                   │
│                    │ Reads → Replicas│                                   │
│                    └────────┬────────┘                                   │
│                             │                                            │
│              ┌──────────────┼──────────────┐                             │
│              │              │              │                             │
│              ▼              ▼              ▼                             │
│   ┌─────────────────┐ ┌───────────┐ ┌───────────┐                       │
│   │     PRIMARY     │ │ Replica 1 │ │ Replica 2 │                       │
│   │                 │ │           │ │           │                       │
│   │  All writes     │ │  Reads    │ │  Reads    │                       │
│   │  + Some reads   │ │           │ │           │                       │
│   └────────┬────────┘ └───────────┘ └───────────┘                       │
│            │                ▲              ▲                             │
│            └────────────────┴──────────────┘                             │
│                    Streaming Replication                                 │
│                                                                          │
│   Scaling: Add more replicas = more read capacity                       │
│   (Writes still limited to single primary)                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Handling Replication Lag

```sql
-- Check current lag on replica
SELECT 
    pg_last_wal_receive_lsn() AS received,
    pg_last_wal_replay_lsn() AS replayed,
    pg_last_xact_replay_timestamp() AS last_replay_time,
    EXTRACT(EPOCH FROM (NOW() - pg_last_xact_replay_timestamp())) AS lag_seconds;
```

### Read-Your-Writes Consistency

```
┌─────────────────────────────────────────────────────────────────────────┐
│              READ-YOUR-WRITES PROBLEM                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Timeline:                                                              │
│                                                                          │
│   t=0   User updates profile on Primary                                 │
│   t=1   Response sent to user                                           │
│   t=2   User reads profile from Replica (stale data!)                   │
│   t=3   Replica catches up (too late, user is confused)                 │
│                                                                          │
│   Solutions:                                                             │
│                                                                          │
│   1. Read from Primary after writes (for same user/session)            │
│                                                                          │
│   2. Use synchronous_commit = remote_apply                              │
│      (Commit waits until replica has applied)                           │
│                                                                          │
│   3. Application-level: track write LSN, wait for replica               │
│      SELECT pg_last_wal_replay_lsn() >= 'write_lsn';                   │
│                                                                          │
│   4. Use sticky sessions (user always hits same replica)                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Connection Pooling at Scale

### The Scale Problem

```
┌─────────────────────────────────────────────────────────────────────────┐
│               CONNECTION SCALING                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Scenario: 100 serverless functions, each wants a connection           │
│                                                                          │
│   Without pooling:                                                       │
│   • 100 Postgres backend processes                                      │
│   • 100 × 10MB = 1GB RAM just for connections                          │
│   • Connection setup overhead on cold starts                            │
│   • max_connections quickly exhausted                                   │
│                                                                          │
│   With pooling:                                                          │
│   • 100 app connections → Pooler → 10 Postgres connections             │
│   • 10 × 10MB = 100MB RAM                                               │
│   • Instant connection from pool                                        │
│   • Postgres stays happy                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### PgBouncer Configuration

```ini
# pgbouncer.ini

[databases]
mydb = host=localhost port=5432 dbname=mydb

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432

# Pool mode
pool_mode = transaction    # Recommended for most apps

# Pool sizing
default_pool_size = 20     # Connections per user/db pair
max_client_conn = 1000     # Max client connections
min_pool_size = 5          # Keep this many ready

# Timeouts
server_idle_timeout = 600  # Close idle server connections
client_idle_timeout = 0    # No timeout for clients

# Limits
max_db_connections = 50    # Max connections to database
```

### Pool Mode Comparison

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    POOL MODES                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   SESSION MODE (safest, least efficient)                                │
│   • Connection assigned for entire session                              │
│   • Released when client disconnects                                    │
│   • Supports: Everything                                                │
│   • Use when: App requires session-level features                       │
│                                                                          │
│   TRANSACTION MODE (recommended)                                        │
│   • Connection assigned per transaction                                 │
│   • Released after COMMIT/ROLLBACK                                      │
│   • Doesn't support: PREPARE, LISTEN/NOTIFY, session vars              │
│   • Use when: Normal web applications                                   │
│                                                                          │
│   STATEMENT MODE (most aggressive)                                      │
│   • Connection assigned per statement                                   │
│   • Released after each query                                           │
│   • Doesn't support: Transactions!                                      │
│   • Use when: Simple read-only queries                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Supavisor (Supabase's Pooler)

Supabase built their own pooler for multi-tenant scale:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SUPAVISOR                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   • Multi-tenant: One pooler for thousands of databases                │
│   • Written in Elixir (excellent for connection handling)               │
│   • Named pools per database                                            │
│   • Native Postgres protocol support                                    │
│   • JWT authentication integration                                      │
│                                                                          │
│   Connection string:                                                     │
│   postgresql://user:[YOUR_PASSWORD]@                                    │
│     db.project.supabase.co:6543/postgres                                │
│     ?options=pool_size=10                                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Partitioning: Scale BEFORE You Shard

### ⚠️ CRITICAL: You Should Partition Before You Shard

```
┌─────────────────────────────────────────────────────────────────────────┐
│       PARTITIONING - THE STEP MOST TEAMS SKIP                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Many teams jump from "table is slow" to "let's shard!"               │
│   That's like hiring 10 devs before you've tried better tools.         │
│                                                                          │
│   PARTITIONING = Splitting one table into smaller physical tables      │
│   Still one database, one server, but:                                  │
│   • Smaller indexes (fit in memory!)                                   │
│   • Partition pruning (skip irrelevant data)                           │
│   • Parallel operations across partitions                              │
│   • Easy archival (DROP old partitions instantly)                      │
│                                                                          │
│   Partitioning can give you 10-100x improvement on large tables        │
│   with FAR less complexity than sharding.                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Partitioning Strategies

```sql
-- TIME-BASED PARTITIONING (Most common - events, logs, orders)
CREATE TABLE events (
    id BIGSERIAL,
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE events_2024_01 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE events_2024_02 PARTITION OF events
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE events_2024_03 PARTITION OF events
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

-- Query only touches relevant partition!
SELECT * FROM events WHERE created_at >= '2024-02-15';
-- Postgres automatically skips events_2024_01, events_2024_03


-- TENANT-BASED PARTITIONING (Multi-tenant SaaS)
CREATE TABLE tenant_data (
    id BIGSERIAL,
    tenant_id UUID NOT NULL,
    data JSONB
) PARTITION BY HASH (tenant_id);

-- Create N partitions (commonly 8, 16, or 32)
CREATE TABLE tenant_data_0 PARTITION OF tenant_data
    FOR VALUES WITH (MODULUS 8, REMAINDER 0);
CREATE TABLE tenant_data_1 PARTITION OF tenant_data
    FOR VALUES WITH (MODULUS 8, REMAINDER 1);
-- ... etc
```

### pg_partman for Automatic Management

```sql
-- Install pg_partman
CREATE EXTENSION pg_partman;

-- Auto-create partitions for time-series data
SELECT partman.create_parent(
    p_parent_table := 'public.events',
    p_control := 'created_at',
    p_type := 'native',
    p_interval := 'monthly',
    p_premake := 3  -- Create 3 months ahead
);

-- Auto-maintenance (run via pg_cron or external scheduler)
SELECT partman.run_maintenance();

-- Retention: automatically drop partitions older than 1 year
UPDATE partman.part_config
SET retention = '1 year', retention_keep_table = false
WHERE parent_table = 'public.events';
```

### Partition Benefits

```
┌─────────────────────────────────────────────────────────────────────────┐
│           PARTITIONING BENEFITS                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. PARTITION PRUNING                                                  │
│      Query for January only reads January partition                     │
│      1TB table → Query scans 80GB (monthly partition)                  │
│                                                                          │
│   2. SMALLER INDEXES                                                    │
│      Each partition has its own indexes                                │
│      Index on 80GB is 12x smaller than index on 1TB                   │
│      More likely to fit in memory!                                     │
│                                                                          │
│   3. INSTANT DATA DELETION                                              │
│      DROP TABLE events_2023_01;  -- Instant!                           │
│      vs DELETE FROM events WHERE created_at < '2023-02-01';  -- Hours  │
│                                                                          │
│   4. PARALLEL VACUUM                                                    │
│      Autovacuum can work on different partitions concurrently          │
│      Less blocking, faster maintenance                                  │
│                                                                          │
│   5. ONLINE MAINTENANCE                                                 │
│      REINDEX one partition without blocking others                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Sharding Strategies

### When You Need Sharding

```
┌─────────────────────────────────────────────────────────────────────────┐
│              SHARDING: WHEN?                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Consider sharding when:                                               │
│   • Write throughput exceeds single-node capacity                       │
│   • Dataset exceeds practical single-node storage                       │
│   • Multi-region write locality needed                                  │
│   • Regulatory data residency requirements                              │
│                                                                          │
│   ⚠️ NOT YET READY IF YOU HAVEN'T:                                     │
│   • Optimized queries and indexes                                       │
│   • Set up read replicas                                                │
│   • Implemented proper caching                                          │
│   • Used vertical scaling headroom                                      │
│   • ⭐ PARTITIONED YOUR LARGE TABLES (see above!)                       │
│                                                                          │
│   Sharding adds SIGNIFICANT complexity!                                 │
│   Partitioning is free. Try it first.                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Sharding Approaches

```
┌─────────────────────────────────────────────────────────────────────────┐
│           APPROACH 1: APPLICATION-LEVEL SHARDING                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Application decides which shard to query                              │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      Application                                 │   │
│   │                                                                  │   │
│   │   shard_id = hash(tenant_id) % num_shards                       │   │
│   │   connection = shard_connections[shard_id]                       │   │
│   │   result = connection.query(sql)                                │   │
│   │                                                                  │   │
│   └───────────────────────────┬─────────────────────────────────────┘   │
│                               │                                         │
│           ┌───────────────────┼───────────────────┐                     │
│           │                   │                   │                     │
│           ▼                   ▼                   ▼                     │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │
│   │  Shard 0    │     │  Shard 1    │     │  Shard 2    │              │
│   │ Tenants A-F │     │ Tenants G-M │     │ Tenants N-Z │              │
│   └─────────────┘     └─────────────┘     └─────────────┘              │
│                                                                          │
│   Pros: Full control, no extra dependencies                             │
│   Cons: Complex application logic, cross-shard queries hard            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│           APPROACH 2: CITUS (Distributed Postgres)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Citus makes Postgres distributed transparently                        │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │              Coordinator Node                                    │   │
│   │                                                                  │   │
│   │   Receives query, plans distributed execution,                  │   │
│   │   routes to appropriate workers, aggregates results             │   │
│   │                                                                  │   │
│   └───────────────────────────┬─────────────────────────────────────┘   │
│                               │                                         │
│           ┌───────────────────┼───────────────────┐                     │
│           │                   │                   │                     │
│           ▼                   ▼                   ▼                     │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │
│   │  Worker 0   │     │  Worker 1   │     │  Worker 2   │              │
│   │ (shards     │     │ (shards     │     │ (shards     │              │
│   │  0,3,6...)  │     │  1,4,7...)  │     │  2,5,8...)  │              │
│   └─────────────┘     └─────────────┘     └─────────────┘              │
│                                                                          │
│   CREATE TABLE orders (...) DISTRIBUTED BY (tenant_id);                 │
│   -- Citus handles the rest!                                            │
│                                                                          │
│   Pros: Standard SQL, automatic distribution                            │
│   Cons: Some SQL limitations, another system to manage                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Shard Key Selection

```
┌─────────────────────────────────────────────────────────────────────────┐
│              CHOOSING A SHARD KEY                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Good shard keys:                                                       │
│   ✓ tenant_id - Queries usually within one tenant                       │
│   ✓ user_id - User data stays together                                  │
│   ✓ region_id - Geographic queries                                      │
│                                                                          │
│   Bad shard keys:                                                        │
│   ✗ timestamp - Creates hot spots (recent data)                         │
│   ✗ auto-increment - All inserts hit same shard                        │
│   ✗ Low cardinality - Uneven distribution                              │
│                                                                          │
│   Key insight: Choose based on access patterns                          │
│   If most queries include tenant_id, shard by tenant_id                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Supabase's Approach: Database per Tenant

### The Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│              SUPABASE: DATABASE PER TENANT                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Each Supabase project = Dedicated Postgres instance                   │
│                                                                          │
│   ┌───────────────────────────────────────────────────────────────────┐ │
│   │                      Supabase Platform                             │ │
│   │                                                                    │ │
│   │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │ │
│   │   │ Project A   │ │ Project B   │ │ Project C   │               │ │
│   │   │             │ │             │ │             │               │ │
│   │   │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │               │ │
│   │   │ │Postgres │ │ │ │Postgres │ │ │ │Postgres │ │               │ │
│   │   │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │               │ │
│   │   │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │               │ │
│   │   │ │PostgREST│ │ │ │PostgREST│ │ │ │PostgREST│ │               │ │
│   │   │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │               │ │
│   │   └─────────────┘ └─────────────┘ └─────────────┘               │ │
│   │                                                                    │ │
│   │   Shared Infrastructure:                                          │ │
│   │   • Supavisor (connection pooling)                                │ │
│   │   • Edge Functions runtime                                        │ │
│   │   • Storage service                                               │ │
│   │   • Realtime service                                              │ │
│   │                                                                    │ │
│   └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│   Benefits:                                                              │
│   ✓ Complete isolation between tenants                                  │
│   ✓ Each tenant can customize Postgres                                 │
│   ✓ Simple mental model                                                 │
│   ✓ No noisy neighbor performance issues                               │
│                                                                          │
│   Challenges (that Supabase solves):                                    │
│   • Managing hundreds of thousands of instances                         │
│   • Efficient resource utilization (pause inactive)                    │
│   • Automated provisioning and upgrades                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Supabase Scaling Features

- **Pause/Resume:** Inactive projects pause to save resources
- **Compute Add-ons:** Scale individual projects up
- **Read Replicas:** Available on Pro+ plans
- **Point-in-Time Recovery:** Continuous backups
- **Database Branching:** Preview environments

---

## 🎤 Interview Angle

**Q: "How would you scale Postgres writes?"**

> "Write scaling is harder than read scaling since only the primary accepts writes. First, I'd optimize queries, connection pool with PgBouncer, and batch writes. If that's not enough, sharding is the next step - either application-level or with Citus for transparent distribution. The key is choosing a good shard key based on access patterns. For multi-region, each region might have its own primary with async replication between them, accepting eventual consistency."

**Q: "Explain connection pooling and why it matters."**

> "Each Postgres connection is a process using significant memory. Without pooling, 1000 app instances mean 1000 backend processes. Connection poolers like PgBouncer sit between apps and Postgres, maintaining a smaller pool of actual connections. In transaction mode, a connection is borrowed per transaction then returned. This lets thousands of clients share dozens of connections, essential for serverless architectures where connections are ephemeral."

**Q: "How does Supabase scale to manage many databases?"**

> "Supabase uses a database-per-tenant model - each project gets its own Postgres. They manage scale through automation - provisioning is automated, inactive databases pause, and they use shared services like Supavisor for pooling across all tenants. This gives perfect isolation without sharding complexity. The challenges are operational - managing thousands of database instances requires robust automation and monitoring infrastructure."

---

## 🧠 Key Takeaways

```
┌─────────────────────────────────────────────────────────────┐
│              SCALING STRATEGY                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FIRST (cheap, simple):                                     │
│  • Optimize queries and indexes                             │
│  • Connection pooling (PgBouncer/Supavisor)                │
│  • Caching layer (Redis)                                    │
│  • Vertical scaling (bigger instance)                       │
│                                                              │
│  THEN (for read scaling):                                   │
│  • Read replicas                                            │
│  • Load balance reads across replicas                       │
│  • Handle replication lag appropriately                     │
│                                                              │
│  FINALLY (for write scaling):                               │
│  • Partitioning (single node)                               │
│  • Sharding (multiple nodes)                                │
│  • Citus for transparent distribution                       │
│  • Or: Database-per-tenant (Supabase model)                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏭️ Tomorrow: Day 11

We'll dive into **ETL and Foreign Data Wrappers** - moving data in/out of Postgres and querying external sources.

