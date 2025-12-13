# Day 3: Process Architecture & Memory Management

> **Time:** 2 hours  
> **Goal:** Understand how Postgres runs as a system of processes  
> **Analogy:** Like understanding Node.js event loop + worker threads

---

## 🎯 What You'll Learn Today

```
┌─────────────────────────────────────────────────────────────┐
│                     DAY 3 ROADMAP                           │
├─────────────────────────────────────────────────────────────┤
│  1. Process Architecture Overview    (25 min)               │
│  2. The Postmaster                   (15 min)               │
│  3. Backend Processes                (20 min)               │
│  4. Background Workers               (20 min)               │
│  5. Memory Architecture              (30 min)               │
│  6. Query Lifecycle                  (10 min)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Process Architecture Overview

### The Big Picture

Postgres uses a **multi-process architecture** (not threads!):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     POSTGRES PROCESS ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Client Applications                                                    │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                                   │
│   │ App1 │ │ App2 │ │ App3 │ │ psql │                                   │
│   └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘                                   │
│      │        │        │        │                                        │
│      └────────┼────────┼────────┘                                        │
│               │   TCP/IP or Unix Socket                                  │
│               ↓                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    POSTMASTER (Main Process)                     │   │
│   │                                                                  │   │
│   │   • Listens for connections on port 5432                        │   │
│   │   • Forks a new backend for each client                         │   │
│   │   • Manages background workers                                  │   │
│   │   • Handles startup and shutdown                                │   │
│   │                                                                  │   │
│   └──────────────────────────┬──────────────────────────────────────┘   │
│                              │                                           │
│                              │ forks                                     │
│                              ↓                                           │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      SHARED MEMORY                               │   │
│   │  ┌────────────────┐ ┌────────────────┐ ┌────────────────────┐   │   │
│   │  │ Shared Buffers │ │   WAL Buffers  │ │  Lock Tables, etc  │   │   │
│   │  └────────────────┘ └────────────────┘ └────────────────────────┘   │
│   └─────────────────────────────────────────────────────────────────┘   │
│              ↑                    ↑                    ↑                 │
│              │                    │                    │                 │
│   ┌──────────┴────────────────────┴────────────────────┴─────────────┐  │
│   │                    BACKEND PROCESSES                              │  │
│   │                                                                   │  │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │  │
│   │   │Backend 1│ │Backend 2│ │Backend 3│ │Backend 4│  ...         │  │
│   │   │(App1)   │ │(App2)   │ │(App3)   │ │(psql)   │               │  │
│   │   └─────────┘ └─────────┘ └─────────┘ └─────────┘               │  │
│   │                                                                   │  │
│   └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│   ┌───────────────────────────────────────────────────────────────────┐  │
│   │                 BACKGROUND WORKERS                                 │  │
│   │                                                                    │  │
│   │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐         │  │
│   │  │  bgwriter │ │  walwriter│ │autovacuum │ │checkpointer│        │  │
│   │  └───────────┘ └───────────┘ └───────────┘ └───────────┘         │  │
│   │                                                                    │  │
│   └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why Processes Instead of Threads?

| Aspect | Processes (Postgres) | Threads (some DBs) |
|--------|---------------------|-------------------|
| **Isolation** | One crash doesn't kill others | One crash can kill all |
| **Portability** | Works on all Unix systems | Thread APIs vary |
| **Debugging** | Each process is independent | Complex shared state |
| **Memory** | Shared via shared memory | All memory shared |
| **Overhead** | More memory per connection | Less memory per connection |

### See It Yourself

```sql
-- In Docker, first get a shell:
docker exec -it postgres-primary bash

-- See all Postgres processes
ps aux | grep postgres
```

You'll see something like:
```
postgres   1  ... postgres: checkpointer
postgres   2  ... postgres: background writer
postgres   3  ... postgres: walwriter
postgres   4  ... postgres: autovacuum launcher
postgres   5  ... postgres: stats collector
postgres  99  ... postgres: user learn [local] idle
```

---

## 2. The Postmaster

### What is the Postmaster?

The **postmaster** is the main Postgres process:

```
┌─────────────────────────────────────────────────────────────┐
│                    POSTMASTER DUTIES                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. STARTUP                                                  │
│     • Read postgresql.conf                                   │
│     • Initialize shared memory                               │
│     • Start background workers                               │
│     • Open listening socket (port 5432)                      │
│                                                              │
│  2. CONNECTION HANDLING                                      │
│     • Accept new connections                                 │
│     • Fork a new backend process for each client             │
│     • Track all child processes                              │
│                                                              │
│  3. SUPERVISION                                              │
│     • Monitor child processes                                │
│     • Restart failed background workers                      │
│     • Handle signals (reload, shutdown)                      │
│                                                              │
│  4. SHUTDOWN                                                 │
│     • Signal all children to terminate                       │
│     • Wait for clean shutdown                                │
│     • Clean up shared memory                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Connection Flow

```
Client                    Postmaster                Backend
  │                           │                        │
  │──── Connect TCP ─────────►│                        │
  │                           │                        │
  │                           │──── fork() ───────────►│
  │                           │                        │
  │◄─────────────────────── Connection handed off ────►│
  │                           │                        │
  │◄──── All queries go directly to backend ─────────►│
  │                           │                        │
```

---

## 3. Backend Processes

### One Backend Per Connection

Each client connection gets its own **backend process**:

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND PROCESS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Dedicated to ONE client connection                         │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  CLIENT SOCKET                                        │  │
│   │  ↓                                                    │  │
│   │  PARSER  ──► ANALYZER ──► REWRITER ──► PLANNER       │  │
│   │                                           ↓           │  │
│   │                                      EXECUTOR         │  │
│   │                                           ↓           │  │
│   │                                    ACCESS METHODS     │  │
│   │                                    (heap, index)      │  │
│   │                                           ↓           │  │
│   │                                   BUFFER MANAGER      │  │
│   │                                  (shared buffers)     │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   Private Memory (per backend):                              │
│   • work_mem (for sorts, hash tables)                        │
│   • maintenance_work_mem (for VACUUM, CREATE INDEX)          │
│   • temp_buffers (for temporary tables)                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Connection Limits

```sql
-- Max simultaneous connections
SHOW max_connections;  -- Default: 100

-- Current connections
SELECT count(*) FROM pg_stat_activity;

-- Connection details
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query
FROM pg_stat_activity
WHERE datname = current_database();
```

### The Connection Problem

```
┌─────────────────────────────────────────────────────────────┐
│              THE CONNECTION SCALING PROBLEM                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Each backend uses:                                         │
│   • ~10MB RAM minimum                                        │
│   • OS process overhead                                      │
│   • Forking cost on connect                                  │
│                                                              │
│   100 connections × 10MB = 1GB just for backends!           │
│   1000 connections = Not sustainable!                        │
│                                                              │
│   SOLUTION: Connection Pooling (PgBouncer, pgpool-II)        │
│                                                              │
│   ┌────────────────────────────────────────────────────┐    │
│   │                  Without Pooling                    │    │
│   │    100 app instances → 100 Postgres backends       │    │
│   └────────────────────────────────────────────────────┘    │
│                                                              │
│   ┌────────────────────────────────────────────────────┐    │
│   │                   With Pooling                      │    │
│   │    100 app instances → PgBouncer → 10 backends     │    │
│   └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Background Workers

### Essential Background Processes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKGROUND WORKERS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  BACKGROUND WRITER (bgwriter)                                     │   │
│  │                                                                   │   │
│  │  • Writes dirty pages from shared buffers to disk                │   │
│  │  • Runs continuously in the background                           │   │
│  │  • Reduces I/O spikes from checkpoints                           │   │
│  │  • Like a janitor cleaning up gradually                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  WAL WRITER (walwriter)                                           │   │
│  │                                                                   │   │
│  │  • Flushes WAL buffers to disk                                   │   │
│  │  • Critical for durability                                       │   │
│  │  • More frequent than checkpoints                                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  CHECKPOINTER                                                     │   │
│  │                                                                   │   │
│  │  • Creates checkpoints (consistent snapshots)                    │   │
│  │  • All dirty pages flushed to disk                               │   │
│  │  • Enables faster crash recovery                                 │   │
│  │  • Runs every checkpoint_timeout or checkpoint_completion_target │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  AUTOVACUUM LAUNCHER                                              │   │
│  │                                                                   │   │
│  │  • Monitors tables for dead tuples                               │   │
│  │  • Launches autovacuum workers when needed                       │   │
│  │  • Workers run VACUUM and ANALYZE                                │   │
│  │  • Keeps tables healthy and stats updated                        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  STATS COLLECTOR                                                  │   │
│  │                                                                   │   │
│  │  • Collects usage statistics                                     │   │
│  │  • Query counts, tuple access counts, etc.                       │   │
│  │  • Powers pg_stat_* views                                        │   │
│  │  • Used by autovacuum and query planner                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  LOGICAL REPLICATION LAUNCHER (if configured)                     │   │
│  │                                                                   │   │
│  │  • Manages logical replication workers                           │   │
│  │  • Handles publication/subscription                              │   │
│  │  • Powers CDC (Change Data Capture)                              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### See Background Workers

```sql
-- View background processes
SELECT 
    pid,
    wait_event_type,
    wait_event,
    state,
    backend_type
FROM pg_stat_activity
WHERE backend_type != 'client backend'
ORDER BY backend_type;
```

---

## 5. Memory Architecture

### Shared Memory vs Private Memory

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MEMORY ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    SHARED MEMORY                                   │  │
│  │                    (All processes share)                           │  │
│  │                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │  SHARED BUFFERS (shared_buffers)                             │  │  │
│  │  │  • Cache for table and index pages                           │  │  │
│  │  │  • Typically 25% of RAM (up to ~8GB)                         │  │  │
│  │  │  • Like a shared CDN cache                                   │  │  │
│  │  │  • Default: 128MB (too small!)                               │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │  WAL BUFFERS (wal_buffers)                                   │  │  │
│  │  │  • Cache for write-ahead log entries                         │  │  │
│  │  │  • Usually 1/32 of shared_buffers                            │  │  │
│  │  │  • Default: -1 (auto-tuned)                                  │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │  LOCK SPACE, PROC ARRAY, CLOG, etc.                          │  │  │
│  │  │  • Transaction status, locks, process info                   │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    PRIVATE MEMORY (Per Backend)                      ││
│  │                                                                      ││
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ││
│  │  │    work_mem      │  │ maintenance_     │  │   temp_buffers   │  ││
│  │  │                  │  │   work_mem       │  │                  │  ││
│  │  │  • Sorts         │  │                  │  │  • Temp tables   │  ││
│  │  │  • Hash joins    │  │  • VACUUM        │  │  • Default: 8MB  │  ││
│  │  │  • Default: 4MB  │  │  • CREATE INDEX  │  │                  │  ││
│  │  │  • Per operation!│  │  • Default: 64MB │  │                  │  ││
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  ││
│  │                                                                      ││
│  │  WARNING: work_mem is per OPERATION, not per connection!            ││
│  │           A complex query can use work_mem × N operations           ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Shared Buffers Deep Dive

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       SHARED BUFFERS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Like a cache between Postgres and the OS file system                  │
│                                                                          │
│   Query: SELECT * FROM products WHERE id = 42;                          │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  1. Check shared buffers for the page containing id=42          │   │
│   │                                                                  │   │
│   │     ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                    │   │
│   │     │  ✓  │ │     │ │  ?  │ │     │ │     │                    │   │
│   │     └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                    │   │
│   │                                                                  │   │
│   │  2a. If FOUND (buffer hit):                                     │   │
│   │      → Return data from memory (fast!)                          │   │
│   │                                                                  │   │
│   │  2b. If NOT FOUND (buffer miss):                                │   │
│   │      → Read page from disk                                      │   │
│   │      → Evict old page if needed (clock sweep)                   │   │
│   │      → Store page in shared buffers                             │   │
│   │      → Return data                                              │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   Buffer Hit Ratio Goal: > 99% for OLTP workloads                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Memory Settings

```sql
-- See memory settings
SHOW shared_buffers;      -- Shared page cache
SHOW work_mem;            -- Per-operation sort/hash memory
SHOW maintenance_work_mem; -- VACUUM, CREATE INDEX memory
SHOW effective_cache_size; -- Planner's estimate of OS cache

-- Check buffer cache hit ratio
SELECT 
    sum(blks_hit) AS buffer_hits,
    sum(blks_read) AS disk_reads,
    ROUND(
        sum(blks_hit)::numeric / 
        NULLIF(sum(blks_hit) + sum(blks_read), 0) * 100, 
        2
    ) AS hit_ratio_percent
FROM pg_stat_database;
-- Goal: > 99%!
```

### Memory Tuning Guidelines

```
┌─────────────────────────────────────────────────────────────┐
│              MEMORY TUNING RULES OF THUMB                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Total RAM: 16GB example                                     │
│                                                              │
│  shared_buffers      = 4GB   (25% of RAM)                   │
│  effective_cache_size = 12GB (75% of RAM)                   │
│  work_mem            = 64MB  (be careful!)                  │
│  maintenance_work_mem = 1GB  (for maintenance ops)          │
│                                                              │
│  Reserved for OS     ≈ 4GB   (file system cache, etc.)      │
│                                                              │
│  ⚠️  work_mem WARNING:                                       │
│      100 connections × 10 operations × 64MB = 64GB!         │
│      Start small, increase carefully!                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Query Lifecycle

### From SQL to Results

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      QUERY LIFECYCLE                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   SQL: SELECT * FROM products WHERE price > 100 ORDER BY name;          │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ 1. PARSER                                                        │   │
│   │    • Lexical analysis (tokenize)                                │   │
│   │    • Syntax check (grammar)                                     │   │
│   │    • Create parse tree                                          │   │
│   │    • Like: Babel parsing your JS                                │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                           │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ 2. ANALYZER (Semantic Analysis)                                  │   │
│   │    • Resolve table and column names                             │   │
│   │    • Check permissions                                          │   │
│   │    • Type checking                                              │   │
│   │    • Like: TypeScript type checking                             │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                           │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ 3. REWRITER                                                      │   │
│   │    • Apply rewrite rules                                        │   │
│   │    • Expand views                                               │   │
│   │    • Handle rules (like triggers)                               │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                           │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ 4. PLANNER / OPTIMIZER                                          │   │
│   │    • Generate possible execution plans                          │   │
│   │    • Estimate costs using statistics                            │   │
│   │    • Choose cheapest plan                                       │   │
│   │    • Like: Webpack choosing optimal bundle strategy             │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                           │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ 5. EXECUTOR                                                      │   │
│   │    • Run the chosen plan                                        │   │
│   │    • Access tables via access methods                           │   │
│   │    • Manage buffers, handle transactions                        │   │
│   │    • Return results                                             │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Prepared Statements

```sql
-- Without preparation: parse + plan every time
SELECT * FROM products WHERE id = 1;
SELECT * FROM products WHERE id = 2;
SELECT * FROM products WHERE id = 3;

-- With preparation: parse + plan once, execute many
PREPARE get_product(int) AS 
    SELECT * FROM products WHERE id = $1;

EXECUTE get_product(1);
EXECUTE get_product(2);
EXECUTE get_product(3);

DEALLOCATE get_product;
```

---

## 🎤 Interview Angle

**Q: "Why does Postgres use processes instead of threads?"**

> "Postgres chose processes for isolation and reliability. If one backend crashes, it doesn't take down the whole server - the postmaster just restarts that process. It also provides natural memory isolation and simpler debugging. The tradeoff is higher memory usage per connection, which is why connection pooling (PgBouncer) is essential at scale."

**Q: "What is shared_buffers and how would you size it?"**

> "Shared buffers is Postgres's page cache - it holds frequently accessed table and index pages in memory. The rule of thumb is 25% of system RAM, capped around 8-16GB. Beyond that, the OS filesystem cache is often more effective. The key metric is buffer hit ratio - you want above 99% for OLTP workloads. If it's lower, either shared_buffers is too small or your working set doesn't fit in memory."

**Q: "What happens when a client connects to Postgres?"**

> "The postmaster process listens on port 5432. When a client connects, postmaster forks a new backend process dedicated to that connection. The backend handles all queries for that client - parsing, planning, executing. All backends share access to shared buffers and other shared memory. This is why connection pooling is important - forking is expensive and each backend uses significant memory."

---

## 🏋️ Exercises

```sql
-- See all processes
SELECT 
    pid,
    backend_type,
    state,
    wait_event_type,
    query
FROM pg_stat_activity;

-- Check buffer hit ratio per database
SELECT 
    datname,
    blks_hit,
    blks_read,
    ROUND(blks_hit::numeric / NULLIF(blks_hit + blks_read, 0) * 100, 2) AS ratio
FROM pg_stat_database
WHERE datname IS NOT NULL;

-- Memory settings
SELECT name, setting, unit, context
FROM pg_settings
WHERE name IN ('shared_buffers', 'work_mem', 'maintenance_work_mem', 
               'effective_cache_size', 'max_connections');
```

---

## 🧠 Key Takeaways

```
┌─────────────────────────────────────────────────────────────┐
│                    MENTAL MODEL                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  POSTMASTER: Main process, handles connections, supervision  │
│                                                              │
│  BACKENDS: One per client connection, runs your queries      │
│            • Each uses private memory (work_mem)             │
│            • All share shared_buffers                        │
│                                                              │
│  BACKGROUND WORKERS:                                         │
│            • bgwriter: gradual dirty page writes             │
│            • walwriter: WAL durability                       │
│            • checkpointer: periodic full flush               │
│            • autovacuum: dead tuple cleanup                  │
│                                                              │
│  SHARED MEMORY:                                              │
│            • shared_buffers: page cache (25% RAM)            │
│            • WAL buffers: write-ahead log cache              │
│                                                              │
│  CONNECTION POOLING: Essential for > 100 connections         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Critical Addendum: Transaction ID Wraparound

```
┌─────────────────────────────────────────────────────────────────────────┐
│           THE SILENT KILLER: XID WRAPAROUND                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Postgres Transaction IDs (XIDs) are 32-bit = ~4.2 billion             │
│   But only ~2.1 billion can be "in the past" at any moment.             │
│                                                                          │
│   If XIDs aren't "frozen" before they get too old,                      │
│   rows DISAPPEAR (appear "in the future").                              │
│                                                                          │
│   Worse: When within 10M XIDs of limit → DATABASE STOPS WRITES!         │
│                                                                          │
│   AUTOVACUUM's Hidden Job:                                              │
│   • Freeze old rows (set special bit = "visible forever")              │
│   • Track oldest unfrozen XID per table (relfrozenxid)                 │
│   • Track oldest across database (datfrozenxid)                        │
│                                                                          │
│   Monitor This! Alert if age(datfrozenxid) > 500,000,000               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

```sql
-- CHECK DATABASE XID AGE (Run this regularly!)
SELECT 
    datname,
    age(datfrozenxid) AS xid_age,
    CASE 
        WHEN age(datfrozenxid) > 1000000000 THEN 'CRITICAL'
        WHEN age(datfrozenxid) > 500000000 THEN 'WARNING'
        ELSE 'OK'
    END AS status
FROM pg_database
ORDER BY age(datfrozenxid) DESC;
```

---

## 🐧 Linux Kernel Tuning (The Foundation)

A Head of Postgres knows: the database config is useless if the OS is fighting it.

```
┌─────────────────────────────────────────────────────────────────────────┐
│               ESSENTIAL LINUX SETTINGS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. HUGE PAGES                                                         │
│      Problem: Postgres uses lots of RAM. Standard 4KB pages →          │
│               CPU's TLB (Translation Lookaside Buffer) thrashes.       │
│      Solution: Enable Huge Pages (2MB pages)                           │
│                                                                          │
│      # Calculate huge pages needed:                                     │
│      # shared_buffers / 2MB + some overhead                            │
│      echo "vm.nr_hugepages = 4096" >> /etc/sysctl.conf                 │
│                                                                          │
│      # In postgresql.conf:                                              │
│      huge_pages = try  # or 'on' to require                            │
│                                                                          │
│   2. SWAPPINESS                                                         │
│      Problem: Default 60 → OS will swap shared_buffers to disk!       │
│      Solution: Set to 1 (not 0, which disables swap entirely)         │
│                                                                          │
│      echo "vm.swappiness = 1" >> /etc/sysctl.conf                      │
│                                                                          │
│   3. OVERCOMMIT MEMORY                                                  │
│      Problem: If memory runs out, OOM Killer kills Postgres!          │
│      Solution: Proper memory accounting                                │
│                                                                          │
│      echo "vm.overcommit_memory = 2" >> /etc/sysctl.conf               │
│      echo "vm.overcommit_ratio = 80" >> /etc/sysctl.conf               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ⏭️ Tomorrow: Day 4

We'll dive deep into **indexing** - B-trees, GIN, GiST, BRIN - and learn how to choose the right index for your workload. This is critical for query optimization!

