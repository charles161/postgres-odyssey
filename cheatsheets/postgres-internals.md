# PostgreSQL Internals Cheatsheet

## Storage Hierarchy

```
Database Cluster
└── Database
    └── Schema
        └── Table (Heap)
            └── Pages (8KB)
                └── Tuples (Rows)
```

## Page Structure (8KB)

```
┌─────────────────────────────────────┐
│ Page Header (24 bytes)              │
├─────────────────────────────────────┤
│ Item Pointers (4 bytes each)        │
├─────────────────────────────────────┤
│ Free Space                          │
├─────────────────────────────────────┤
│ Tuples (grow from bottom)           │
└─────────────────────────────────────┘
```

## Tuple Header

| Field | Size | Purpose |
|-------|------|---------|
| t_xmin | 4B | Creating transaction ID |
| t_xmax | 4B | Deleting transaction ID |
| t_cid | 4B | Command ID |
| t_ctid | 6B | Current tuple location |
| t_infomask | 2B | Status flags |
| t_hoff | 1B | Offset to data |

## MVCC Rules

- **Visible if:** t_xmin < my_txn AND t_xmin committed AND (t_xmax = 0 OR t_xmax > my_txn OR t_xmax aborted)
- UPDATE creates new tuple, marks old with t_xmax
- DELETE just sets t_xmax
- VACUUM reclaims dead tuples

## Process Architecture

```
Postmaster (main)
├── Backend (per connection)
├── Background Writer
├── WAL Writer
├── Checkpointer
├── Autovacuum Launcher
│   └── Autovacuum Workers
├── Stats Collector
└── Logical Replication Workers
```

## Memory Architecture

| Area | Scope | Default | Purpose |
|------|-------|---------|---------|
| shared_buffers | Shared | 128MB | Page cache |
| wal_buffers | Shared | Auto | WAL cache |
| work_mem | Per operation | 4MB | Sorts, hashes |
| maintenance_work_mem | Per operation | 64MB | VACUUM, INDEX |
| effective_cache_size | Planner hint | 4GB | Expected OS cache |

## Key System Catalogs

```sql
pg_class          -- Tables, indexes, sequences
pg_attribute      -- Columns
pg_index          -- Index definitions
pg_stat_user_tables -- Table statistics
pg_stat_activity  -- Current sessions
pg_locks          -- Current locks
pg_replication_slots -- Replication slots
```

## Useful Diagnostic Queries

```sql
-- Buffer cache hit ratio
SELECT sum(blks_hit)::float / sum(blks_hit + blks_read) FROM pg_stat_database;

-- Table bloat estimate
SELECT n_dead_tup, n_live_tup FROM pg_stat_user_tables WHERE relname = 'mytable';

-- Current connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Lock waits
SELECT * FROM pg_locks WHERE NOT granted;
```

