# Write Optimization Techniques

> **The Question**: "My INSERT rate is too slow. How do I speed up writes?"

---

## Visual 1: The Cost of a Write

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE COST OF A SINGLE INSERT                                             │
│  ═══════════════════════════                                             │
│                                                                          │
│  INSERT INTO users (email) VALUES ('alice@example.com');                │
│                                                                          │
│  WHAT ACTUALLY HAPPENS:                                                  │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  1. Find free space in heap                    (FSM lookup)    │     │
│  │  2. Insert tuple into heap page               (memory write)   │     │
│  │  3. Write WAL record for tuple                (memory write)   │     │
│  │  4. Update idx_users_email                    (B-tree insert)  │     │
│  │  5. Write WAL record for index                (memory write)   │     │
│  │  6. Update idx_users_created_at               (B-tree insert)  │     │
│  │  7. Write WAL record for index                (memory write)   │     │
│  │  8. ... (for each index)                                       │     │
│  │  9. On COMMIT: fsync WAL to disk             (DISK I/O!)      │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  WRITE AMPLIFICATION:                                                    │
│  • 1 row inserted = N+1 writes (1 heap + N indexes)                    │
│  • 5 indexes = 6x write amplification!                                  │
│                                                                          │
│  THE BOTTLENECK: fsync on commit (waiting for disk)                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Batch Inserts

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OPTIMIZATION 1: BATCH INSERTS                                          │
│  ═════════════════════════════                                           │
│                                                                          │
│  SLOW (1000 round trips, 1000 fsyncs):                                  │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  for email in emails:                                           │     │
│  │      INSERT INTO users (email) VALUES (email);                  │     │
│  │      COMMIT;                                                     │     │
│  │                                                                 │     │
│  │  Time: 1000 × 5ms = 5 seconds                                   │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  FAST (1 round trip, 1 fsync):                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  INSERT INTO users (email) VALUES                               │     │
│  │      ('user1@example.com'),                                     │     │
│  │      ('user2@example.com'),                                     │     │
│  │      ('user3@example.com'),                                     │     │
│  │      ... (1000 values);                                         │     │
│  │  COMMIT;                                                         │     │
│  │                                                                 │     │
│  │  Time: 1 × 50ms = 50 milliseconds                               │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  100x faster!                                                            │
│                                                                          │
│  EVEN FASTER (COPY):                                                     │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  COPY users (email) FROM '/path/to/file.csv';                  │     │
│  │                                                                 │     │
│  │  Time: 1 million rows in ~10 seconds                           │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: Index Strategies for Writes

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OPTIMIZATION 2: SMARTER INDEXING                                        │
│  ═════════════════════════════════                                       │
│                                                                          │
│  PROBLEM: Each index slows down writes.                                 │
│                                                                          │
│  Insert rate with N indexes:                                            │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  0 indexes:  50,000 inserts/sec                                │     │
│  │  1 index:    35,000 inserts/sec                                │     │
│  │  3 indexes:  20,000 inserts/sec                                │     │
│  │  5 indexes:  12,000 inserts/sec                                │     │
│  │  10 indexes:  6,000 inserts/sec                                │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  STRATEGIES:                                                             │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  1. AUDIT YOUR INDEXES                                         │     │
│  │     SELECT * FROM pg_stat_user_indexes                         │     │
│  │     WHERE idx_scan = 0;  -- Unused indexes!                    │     │
│  │     → DROP unused indexes                                       │     │
│  │                                                                 │     │
│  │  2. BULK LOAD WITHOUT INDEXES                                  │     │
│  │     DROP INDEX idx_foo;                                         │     │
│  │     COPY data FROM file;                                        │     │
│  │     CREATE INDEX idx_foo ON ...;                               │     │
│  │     → Index built once, not updated per row                    │     │
│  │                                                                 │     │
│  │  3. USE FILLFACTOR                                             │     │
│  │     CREATE INDEX idx_foo ... WITH (fillfactor = 70);           │     │
│  │     → Fewer page splits, faster inserts                        │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: Asynchronous Commit

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OPTIMIZATION 3: ASYNCHRONOUS COMMIT                                     │
│  ═══════════════════════════════════                                     │
│                                                                          │
│  The biggest write bottleneck: waiting for fsync on commit.            │
│                                                                          │
│  SYNCHRONOUS (default):                                                  │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  INSERT → Write WAL → fsync → ACK to client                   │     │
│  │                         ↑                                       │     │
│  │                    waits for disk                               │     │
│  │                    (5-10ms per commit)                          │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ASYNCHRONOUS:                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  SET synchronous_commit = off;                                  │     │
│  │                                                                 │     │
│  │  INSERT → Write WAL → ACK to client                            │     │
│  │                           │                                     │     │
│  │                           └── fsync happens later (background) │     │
│  │                                                                 │     │
│  │  Commits: 100,000+/second (vs 5,000 sync)                      │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ⚠️  THE RISK:                                                           │
│  If server crashes, last ~200ms of commits may be lost.                │
│  Data was in WAL buffer, not yet on disk.                               │
│                                                                          │
│  GOOD FOR:                                                               │
│  • Logging, analytics, metrics (loss is acceptable)                     │
│  • Queues that will retry anyway                                        │
│                                                                          │
│  BAD FOR:                                                                │
│  • Financial transactions                                                │
│  • Anything where every row matters                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 5: Unlogged Tables

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OPTIMIZATION 4: UNLOGGED TABLES                                         │
│  ═══════════════════════════════                                         │
│                                                                          │
│  CREATE UNLOGGED TABLE temp_imports ( ... );                            │
│                                                                          │
│  WHAT IT DOES:                                                           │
│  • No WAL writes at all                                                  │
│  • Inserts go directly to data files                                    │
│  • 10-20x faster writes                                                  │
│                                                                          │
│  THE CATCH:                                                              │
│  • Data LOST on crash (table truncated on recovery)                     │
│  • Not replicated to replicas                                           │
│  • Cannot be part of a transaction that touches logged tables          │
│                                                                          │
│  GOOD FOR:                                                               │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  • ETL staging tables                                          │     │
│  │  • Temporary data processing                                    │     │
│  │  • Cache tables that can be rebuilt                            │     │
│  │  • Materialized view refreshes                                 │     │
│  │                                                                 │     │
│  │  PATTERN:                                                       │     │
│  │  1. CREATE UNLOGGED TABLE staging ...;                         │     │
│  │  2. COPY millions of rows into staging (fast!)                 │     │
│  │  3. INSERT INTO real_table SELECT ... FROM staging;            │     │
│  │  4. DROP TABLE staging;                                         │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
