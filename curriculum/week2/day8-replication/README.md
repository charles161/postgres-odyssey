# Day 8: Replication Fundamentals

> **Time:** 2 hours  
> **Goal:** Understand how Postgres replicates data between servers  
> **Analogy:** Like Git branches - one source of truth, copies that follow

---

## 🎯 What You'll Learn Today

```
┌─────────────────────────────────────────────────────────────┐
│                     DAY 8 ROADMAP                           │
├─────────────────────────────────────────────────────────────┤
│  1. Why Replicate?                   (10 min)               │
│  2. Physical vs Logical Replication  (25 min)               │
│  3. Streaming Replication Setup      (30 min)               │
│  4. Synchronous vs Asynchronous      (20 min)               │
│  5. Replication Slots                (20 min)               │
│  6. Monitoring Replication           (15 min)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Why Replicate?

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REPLICATION USE CASES                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. HIGH AVAILABILITY                                                    │
│     Primary dies → Replica becomes new primary                          │
│     Goal: Minimize downtime                                             │
│                                                                          │
│  2. READ SCALING                                                         │
│     Primary handles writes                                              │
│     Replicas handle reads (spread the load)                             │
│                                                                          │
│  3. DISASTER RECOVERY                                                    │
│     Replica in different region/datacenter                              │
│     Protection against site-wide failures                               │
│                                                                          │
│  4. ANALYTICS                                                            │
│     Run heavy reports on replica                                        │
│     Don't impact production writes                                      │
│                                                                          │
│  5. ZERO-DOWNTIME MIGRATIONS                                            │
│     Set up replication to new version                                   │
│     Switch over when ready                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Physical vs Logical Replication

### The Two Flavors

```
┌─────────────────────────────────────────────────────────────────────────┐
│              PHYSICAL REPLICATION                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Replicates: WAL (Write-Ahead Log) records - byte-for-byte copy        │
│                                                                          │
│   Primary                    Replica                                     │
│   ┌──────────────────┐      ┌──────────────────┐                        │
│   │ UPDATE users     │      │                  │                        │
│   │ SET name = 'X'   │      │   Exact binary   │                        │
│   │ WHERE id = 5     │──────│     copy of      │                        │
│   │                  │ WAL  │    Primary!      │                        │
│   │ (page changes)   │      │                  │                        │
│   └──────────────────┘      └──────────────────┘                        │
│                                                                          │
│   Pros:                                                                  │
│   ✓ Simple and reliable                                                 │
│   ✓ Replicates everything (all databases, tables, indexes)             │
│   ✓ No decoding overhead                                                │
│                                                                          │
│   Cons:                                                                  │
│   ✗ Replica is read-only (can't even add indexes)                       │
│   ✗ Same Postgres major version required                                │
│   ✗ All or nothing - can't replicate single tables                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│              LOGICAL REPLICATION                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Replicates: Decoded row changes (INSERT/UPDATE/DELETE)                │
│                                                                          │
│   Primary                    Replica                                     │
│   ┌──────────────────┐      ┌──────────────────┐                        │
│   │ UPDATE users     │      │                  │                        │
│   │ SET name = 'X'   │──────│ Can have extra   │                        │
│   │ WHERE id = 5     │      │ tables, indexes  │                        │
│   │                  │ rows │ Can be writeable │                        │
│   │ (decoded change) │      │                  │                        │
│   └──────────────────┘      └──────────────────┘                        │
│                                                                          │
│   Pros:                                                                  │
│   ✓ Selective replication (specific tables)                             │
│   ✓ Different Postgres versions possible                                │
│   ✓ Subscriber can be writeable                                         │
│   ✓ Cross-platform replication                                          │
│   ✓ Powers CDC (Change Data Capture)                                    │
│                                                                          │
│   Cons:                                                                  │
│   ✗ More CPU overhead (decoding/applying)                               │
│   ✗ DDL not replicated automatically                                    │
│   ✗ Large objects (LOBs) not replicated                                 │
│   ✗ Sequences not replicated                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### When to Use Which

| Use Case | Physical | Logical |
|----------|----------|---------|
| HA/Failover | ✅ Best | ⚠️ Possible |
| Read replicas | ✅ Good | ✅ Good |
| Cross-version upgrade | ❌ No | ✅ Yes |
| Selective replication | ❌ No | ✅ Yes |
| CDC/ETL | ❌ No | ✅ Yes |
| Multi-master | ❌ No | ⚠️ Complex |

---

## 3. Streaming Replication (Physical)

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 STREAMING REPLICATION                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   PRIMARY                              REPLICA                           │
│   ┌─────────────────────────────┐     ┌─────────────────────────────┐   │
│   │                             │     │                             │   │
│   │  Client                     │     │         wal receiver        │   │
│   │    ↓                        │     │              ↑              │   │
│   │  Backend                    │     │              │              │   │
│   │    ↓                        │     │              │              │   │
│   │  WAL Buffers               │     │              │              │   │
│   │    ↓                        │     │              │              │   │
│   │  wal writer                 │     │              │              │   │
│   │    ↓                        │     │              │              │   │
│   │  WAL Files ─────────────────┼─────┼──────────────┘              │   │
│   │             wal sender      │     │              ↓              │   │
│   │                             │     │         WAL Files           │   │
│   │                             │     │              ↓              │   │
│   │                             │     │         startup process     │   │
│   │                             │     │         (replay WAL)        │   │
│   │                             │     │              ↓              │   │
│   │                             │     │         Shared Buffers      │   │
│   │                             │     │              ↓              │   │
│   │                             │     │         Read-Only Queries   │   │
│   │                             │     │                             │   │
│   └─────────────────────────────┘     └─────────────────────────────┘   │
│                                                                          │
│   Flow:                                                                  │
│   1. Primary writes WAL                                                  │
│   2. wal sender streams to replica                                      │
│   3. wal receiver writes to replica's WAL                               │
│   4. startup process replays WAL (recovery mode)                        │
│   5. Replica serves read queries                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Setting Up Streaming Replication

**Step 1: Primary Configuration**

```sql
-- postgresql.conf on primary
wal_level = replica            -- Enable replication WAL logging
max_wal_senders = 10           -- Max number of replicas
max_replication_slots = 10     -- Slots to prevent WAL removal
hot_standby = on               -- Allow queries on replicas

-- pg_hba.conf - allow replication connections
-- TYPE  DATABASE   USER         ADDRESS         METHOD
host    replication replicator   10.0.0.0/24     scram-sha-256
```

**Step 2: Create Replication User**

```sql
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'secret';
```

**Step 3: Take Base Backup**

```bash
# On replica server
pg_basebackup -h primary-host -D /var/lib/postgresql/data \
  -U replicator -P --wal-method=stream
```

**Step 4: Replica Configuration**

```bash
# standby.signal file (just create empty file)
touch /var/lib/postgresql/data/standby.signal

# postgresql.conf on replica
primary_conninfo = 'host=primary-host port=5432 user=replicator password=secret'
hot_standby = on
```

**Step 5: Start Replica**

```bash
pg_ctl start
```

### Verify Replication

```sql
-- On Primary: See connected replicas
SELECT 
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn
FROM pg_stat_replication;

-- On Replica: Confirm in recovery mode
SELECT pg_is_in_recovery();  -- Should return 't'

-- Check replication lag
SELECT 
    pg_last_wal_receive_lsn() AS received,
    pg_last_wal_replay_lsn() AS replayed,
    pg_last_wal_receive_lsn() - pg_last_wal_replay_lsn() AS lag_bytes;
```

---

## 4. Synchronous vs Asynchronous Replication

### Asynchronous (Default)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 ASYNCHRONOUS REPLICATION                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Timeline:                                                              │
│                                                                          │
│   Client      Primary         WAL Sender       Replica                  │
│      │                                                                   │
│      │──COMMIT──►│                                                       │
│      │           │──write WAL──►│                                        │
│      │◄──OK──────│              │──stream──────►│                        │
│      │                          │               │──apply                 │
│                                                                          │
│   • COMMIT returns BEFORE replica confirms                              │
│   • Fast! No network latency in commit path                             │
│   • Risk: Data loss if primary crashes before replica gets WAL          │
│                                                                          │
│   Lag window:                                                            │
│   ├── Data on primary, not yet on replica ──┤                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Synchronous

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 SYNCHRONOUS REPLICATION                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Timeline:                                                              │
│                                                                          │
│   Client      Primary         WAL Sender       Replica                  │
│      │                                                                   │
│      │──COMMIT──►│                                                       │
│      │           │──write WAL──►│                                        │
│      │           │              │──stream──────►│                        │
│      │           │              │               │──write WAL             │
│      │           │              │◄─────ACK──────│                        │
│      │◄──OK──────│                                                       │
│                                                                          │
│   • COMMIT waits for replica to confirm receipt                         │
│   • Zero data loss! (RPO = 0)                                           │
│   • Slower - adds network round-trip to every commit                    │
│   • If replica fails, primary can hang!                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Sync Levels

```sql
-- synchronous_commit options:
-- off           : Don't wait for local WAL write (fastest, most dangerous)
-- local         : Wait for local WAL write only (default, async to replicas)
-- remote_write  : Wait for replica to receive (in OS buffer)
-- on            : Wait for replica to flush to disk
-- remote_apply  : Wait for replica to apply (query sees it)

-- Configure sync standbys
synchronous_standby_names = 'replica1'              -- Single
synchronous_standby_names = 'FIRST 2 (r1, r2, r3)'  -- 2 of 3
synchronous_standby_names = 'ANY 2 (r1, r2, r3)'    -- Any 2
```

### Trade-off Summary

| Mode | Commit Latency | Data Safety | Availability |
|------|---------------|-------------|--------------|
| Async | Fast | Some risk | High |
| Sync remote_write | +1 RTT | Good | Medium |
| Sync on | +1 RTT | Best | Medium |
| Sync remote_apply | +1 RTT | Best | Lower |

---

## 5. Replication Slots

### Why Slots?

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 THE WAL RETENTION PROBLEM                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Without slots:                                                         │
│                                                                          │
│   Primary: checkpoint → removes old WAL files                           │
│   Replica: disconnected for maintenance                                 │
│   ...                                                                    │
│   Replica: reconnects, needs WAL that's been deleted!                  │
│   Result: Replica must be rebuilt from scratch 😢                      │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  WAL Timeline                                                    │   │
│   │  ──────[deleted]──────[kept]──────►                             │   │
│   │                        ↑                                         │   │
│   │                    Checkpoint                                    │   │
│   │         ↑                                                        │   │
│   │    Replica was here when it disconnected (oops!)                │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   With slots:                                                            │
│   • Slot tracks each consumer's position                                │
│   • WAL retained until all slots have consumed it                       │
│   • Replica can catch up even after extended outage                    │
│                                                                          │
│   ⚠️ Warning: Inactive slot = WAL accumulates forever!                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Managing Slots

```sql
-- Create a physical replication slot
SELECT pg_create_physical_replication_slot('replica1_slot');

-- View all slots
SELECT 
    slot_name,
    slot_type,
    active,
    restart_lsn,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained_wal
FROM pg_replication_slots;

-- Drop an inactive slot (WARNING: may cause replica rebuild)
SELECT pg_drop_replication_slot('replica1_slot');
```

### Slot Safety

```sql
-- Set max WAL a slot can retain (Postgres 13+)
max_slot_wal_keep_size = '100GB'  -- Prevent runaway disk usage

-- Monitor slot lag
SELECT 
    slot_name,
    active,
    pg_size_pretty(
        pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)
    ) AS lag
FROM pg_replication_slots
WHERE NOT active;  -- Inactive slots are dangerous!
```

---

## 6. Monitoring Replication

### Key Metrics

```sql
-- On Primary: Connected replicas and their lag
SELECT 
    application_name,
    client_addr,
    state,
    pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS replay_lag,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), sent_lsn)) AS send_lag
FROM pg_stat_replication;

-- On Replica: Last received and replayed
SELECT 
    pg_last_wal_receive_lsn() AS received_lsn,
    pg_last_wal_replay_lsn() AS replayed_lsn,
    pg_last_xact_replay_timestamp() AS last_replay_time,
    NOW() - pg_last_xact_replay_timestamp() AS replay_lag_time;

-- Check if in recovery mode
SELECT pg_is_in_recovery();
```

### Replication Lag Dashboard Query

```sql
-- Comprehensive replication status (run on primary)
SELECT 
    r.application_name,
    r.client_addr,
    r.state,
    r.sync_state,
    r.sent_lsn,
    r.write_lsn,
    r.flush_lsn,
    r.replay_lsn,
    pg_size_pretty(pg_wal_lsn_diff(r.sent_lsn, r.replay_lsn)) AS replay_lag_bytes,
    COALESCE(
        EXTRACT(EPOCH FROM (now() - r.replay_lag)),
        0
    ) AS replay_lag_seconds
FROM pg_stat_replication r;
```

---

## 🎤 Interview Angle

**Q: "Explain the difference between physical and logical replication."**

> "Physical replication streams raw WAL bytes - an exact binary copy. The replica must be same Postgres version, same platform, and is read-only. It's simpler and more efficient for HA. Logical replication decodes WAL into row changes (INSERT/UPDATE/DELETE), sends those, and the subscriber applies them. This allows cross-version replication, selective table replication, and the subscriber can have additional tables or indexes. It's more flexible but has more overhead and doesn't replicate DDL automatically."

**Q: "When would you use synchronous replication vs asynchronous?"**

> "Async is default and better for performance - commits don't wait for replicas. Use it when you can tolerate brief data loss on failover. Synchronous replication guarantees zero data loss (RPO=0) because commits wait for replica acknowledgment, but it adds network latency to every write and creates availability risk if the replica fails. I'd use sync for financial data or critical transactions, async for most other cases with good monitoring."

**Q: "What happens if a replica falls behind and its replication slot is still active?"**

> "The slot forces the primary to retain all WAL since the replica's last position. This can exhaust disk space on the primary - a serious incident. Solutions: monitor slot lag, set max_slot_wal_keep_size in Postgres 13+ to cap retention, and have alerting for inactive or lagging slots. Worst case, you may need to drop the slot and rebuild the replica from a fresh base backup."

---

## 🏋️ Exercises

See `exercises.sql` for hands-on replication practice with our Docker setup!

---

## 🧠 Key Takeaways

```
┌─────────────────────────────────────────────────────────────┐
│            REPLICATION MENTAL MODEL                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PHYSICAL REPLICATION (Streaming):                          │
│  • Byte-for-byte WAL copy                                   │
│  • Same version, read-only replica                          │
│  • Best for: HA, read scaling                               │
│                                                              │
│  LOGICAL REPLICATION:                                       │
│  • Decoded row changes                                      │
│  • Flexible, cross-version                                  │
│  • Best for: CDC, migrations, selective sync                │
│                                                              │
│  ASYNC vs SYNC:                                             │
│  • Async: Fast, slight data loss risk                       │
│  • Sync: Zero data loss, commit latency                     │
│                                                              │
│  REPLICATION SLOTS:                                         │
│  • Prevent WAL removal before consumed                      │
│  • ⚠️ Monitor for inactive slots!                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏭️ Tomorrow: Day 9

We'll learn **High Availability patterns** - failover strategies, Patroni, and how to design for zero downtime.

