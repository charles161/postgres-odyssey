# Day 15: The Graveyard

> **Time:** 2+ hours  
> **Goal:** Understand failure modes that end careers  
> **Reality:** These are the scenarios that separate operators from leaders

---

## ⚠️ Why "The Graveyard"?

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      THE GRAVEYARD                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   This day covers scenarios that have:                                  │
│   • Caused multi-hour outages                                          │
│   • Resulted in complete data loss                                     │
│   • Cost companies millions of dollars per minute                      │
│   • Ended engineering careers                                          │
│                                                                          │
│   A Head of Postgres knows these intimately because they've            │
│   either experienced them or studied others' disasters.                │
│                                                                          │
│   "Those who cannot remember the past are condemned to repeat it."     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 What You'll Learn Today

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     DAY 15 ROADMAP                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Transaction ID Wraparound (The Silent Killer)    (40 min)           │
│  2. Data Corruption Detection & Recovery             (30 min)           │
│  3. Bloat: When VACUUM Isn't Enough                 (25 min)           │
│  4. Point-in-Time Recovery (PITR)                   (30 min)           │
│  5. Infrastructure Economics                        (25 min)           │
│  6. Post-Mortem Analysis                            (20 min)           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Transaction ID Wraparound (The Silent Killer)

### The Ticking Time Bomb

```
┌─────────────────────────────────────────────────────────────────────────┐
│           TRANSACTION ID WRAPAROUND                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Postgres Transaction IDs (XIDs) are 32-bit integers.                  │
│                                                                          │
│   Total possible XIDs: 2^32 = 4,294,967,296 (~4.2 billion)             │
│   But only half are "in the past" at any time: ~2.1 billion            │
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                                                                 │   │
│   │    Past ◄───────────── Current XID ───────────────► Future    │   │
│   │    (2.1 billion)           │             (2.1 billion)        │   │
│   │                            │                                   │   │
│   │   Rows with XIDs here     │        Can't see yet              │   │
│   │   are "visible"           │                                   │   │
│   │                                                                 │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   THE PROBLEM:                                                          │
│   If a row's XID is > 2.1 billion XIDs old, it wraps around            │
│   and appears to be "in the future" → ROW DISAPPEARS!                  │
│                                                                          │
│   Worse: When you get within 10 million XIDs of the limit,             │
│   Postgres STOPS ACCEPTING WRITES to prevent data loss.                │
│                                                                          │
│   Your database becomes READ-ONLY. Production is down.                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### The Freezing Solution

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      XID FREEZING                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Solution: "Freeze" old rows by setting a special flag                 │
│   that means "this row is visible to everyone, forever"                 │
│                                                                          │
│   Frozen rows don't consume XID space.                                  │
│                                                                          │
│   VACUUM is responsible for freezing:                                   │
│   • Scans old tuples                                                    │
│   • Sets "frozen" bit on rows older than vacuum_freeze_min_age         │
│   • Updates table's relfrozenxid (oldest unfrozen XID in table)        │
│   • Updates database's datfrozenxid (oldest across all tables)         │
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                    VACUUM FREEZE PROCESS                        │   │
│   │                                                                 │   │
│   │   Row: xid=1000, data='foo'                                    │   │
│   │                    ↓                                            │   │
│   │   Row: frozen=true, data='foo'                                 │   │
│   │        (XID no longer matters)                                 │   │
│   │                                                                 │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Monitoring for Wraparound

```sql
-- CHECK DATABASE AGE (Critical monitoring query!)
SELECT 
    datname,
    age(datfrozenxid) AS xid_age,
    -- Warning at 500M, Critical at 1B, Emergency at 1.5B
    CASE 
        WHEN age(datfrozenxid) > 1500000000 THEN 'EMERGENCY'
        WHEN age(datfrozenxid) > 1000000000 THEN 'CRITICAL'
        WHEN age(datfrozenxid) > 500000000 THEN 'WARNING'
        ELSE 'OK'
    END AS status,
    2147483647 - age(datfrozenxid) AS xids_remaining
FROM pg_database
ORDER BY age(datfrozenxid) DESC;

-- FIND OLDEST TABLES (These are blocking overall freeze)
SELECT 
    schemaname,
    relname,
    age(relfrozenxid) AS xid_age,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || relname)) AS size,
    last_autovacuum,
    last_vacuum
FROM pg_stat_user_tables
ORDER BY age(relfrozenxid) DESC
LIMIT 20;

-- ACTIVELY FREEZING?
SELECT 
    pid,
    datname,
    query,
    state,
    wait_event_type,
    now() - xact_start AS duration
FROM pg_stat_activity 
WHERE query LIKE '%VACUUM%'
AND state = 'active';
```

### Freeze Storms

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FREEZE STORM                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   If freezing falls behind, you hit "aggressive vacuum" territory:     │
│                                                                          │
│   autovacuum_freeze_max_age = 200,000,000 (default)                    │
│                                                                          │
│   When any table's age exceeds this, autovacuum becomes AGGRESSIVE:    │
│   • Ignores normal cost limits                                         │
│   • Scans ALL pages, not just those with dead tuples                   │
│   • Consumes massive I/O                                               │
│   • Can saturate disk for hours                                        │
│                                                                          │
│   A "freeze storm" is when multiple large tables hit this at once.     │
│   Your disk I/O goes to 100%, normal queries suffer.                   │
│                                                                          │
│   PREVENTION:                                                           │
│   1. Monitor datfrozenxid age continuously                             │
│   2. Lower autovacuum_freeze_max_age to spread work                    │
│   3. Run manual VACUUM FREEZE during low-traffic windows               │
│   4. Ensure autovacuum is keeping up (check last_autovacuum times)     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Settings

```sql
-- Show freeze-related settings
SELECT name, setting, context
FROM pg_settings
WHERE name LIKE '%freeze%' OR name LIKE '%xid%';

-- Key settings:
-- vacuum_freeze_min_age = 50,000,000 (age before rows can be frozen)
-- vacuum_freeze_table_age = 150,000,000 (age before whole-table freeze)
-- autovacuum_freeze_max_age = 200,000,000 (force aggressive vacuum)

-- For high-transaction-rate systems, consider:
-- vacuum_freeze_min_age = 10,000,000  (freeze sooner)
-- vacuum_freeze_table_age = 50,000,000
```

---

## 2. Data Corruption Detection & Recovery

### Types of Corruption

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   DATA CORRUPTION TYPES                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. HARDWARE CORRUPTION                                                │
│      • Bit flips in RAM (cosmic rays, bad memory)                      │
│      • Disk sector failures                                             │
│      • Controller firmware bugs                                         │
│      • Partial writes during power loss                                │
│                                                                          │
│   2. SOFTWARE CORRUPTION                                                │
│      • Postgres bugs (rare but possible)                               │
│      • Extension bugs                                                   │
│      • OS bugs (filesystem, kernel)                                    │
│      • Misconfigured fsync (data loss on crash)                        │
│                                                                          │
│   3. HUMAN CORRUPTION                                                   │
│      • Accidental DELETE/UPDATE without WHERE                          │
│      • Bad migration scripts                                            │
│      • Incorrect pg_resetwal usage                                     │
│      • Restoring wrong backup                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Checksums

```sql
-- Check if checksums are enabled (critical for production!)
SHOW data_checksums;
-- 'on' or 'off'

-- If 'off' and you need to enable (requires downtime):
-- 1. Stop Postgres
-- 2. Run: pg_checksums --enable -D /var/lib/postgresql/data
-- 3. Start Postgres
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATA CHECKSUMS                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   When enabled:                                                         │
│   • Every 8KB page gets a CRC-32 checksum                              │
│   • Verified on every read from disk                                   │
│   • If mismatch → ERROR and page not returned                          │
│                                                                          │
│   This catches:                                                         │
│   • Silent disk corruption                                             │
│   • Memory corruption that made it to disk                             │
│   • Partial writes                                                      │
│                                                                          │
│   OVERHEAD: ~1-2% CPU for checksum calculation                         │
│   BENEFIT: Catch corruption early, before it spreads                   │
│                                                                          │
│   ⚠️ ALWAYS enable for production!                                     │
│   Not enabled by default for backward compatibility.                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Using amcheck for Index Validation

```sql
-- Enable amcheck extension
CREATE EXTENSION IF NOT EXISTS amcheck;

-- Check a specific B-tree index for corruption
SELECT bt_index_check('idx_orders_user_id');

-- More thorough check (slower, verifies heap references)
SELECT bt_index_check('idx_orders_user_id', true);

-- Check ALL indexes in database
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT indexrelid::regclass::text AS idx
        FROM pg_index
        JOIN pg_class ON pg_class.oid = pg_index.indexrelid
        WHERE pg_class.relam = (SELECT oid FROM pg_am WHERE amname = 'btree')
    LOOP
        BEGIN
            EXECUTE format('SELECT bt_index_check(%L)', r.idx);
            RAISE NOTICE 'OK: %', r.idx;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'CORRUPTED: % - %', r.idx, SQLERRM;
        END;
    END LOOP;
END $$;
```

### Recovery Options

```
┌─────────────────────────────────────────────────────────────────────────┐
│               CORRUPTION RECOVERY OPTIONS                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   INDEX CORRUPTION:                                                     │
│   → REINDEX INDEX index_name;                                          │
│   → Data still safe, index can be rebuilt                              │
│                                                                          │
│   TABLE CORRUPTION (single page):                                       │
│   → Find affected rows via PITR, restore them                          │
│   → Or use pg_surgery extension to zero the page                       │
│                                                                          │
│   TABLE CORRUPTION (widespread):                                        │
│   → Restore from backup + apply WAL (PITR)                             │
│   → Dump what you can: pg_dump --exclude-table-data=bad_table          │
│                                                                          │
│   SYSTEM CATALOG CORRUPTION:                                           │
│   → Extremely serious                                                   │
│   → May need pg_resetwal (last resort, can lose data)                  │
│   → Best: Restore from backup                                          │
│                                                                          │
│   PREVENTION:                                                           │
│   1. Enable data checksums                                              │
│   2. Use ECC RAM                                                        │
│   3. Reliable storage (no cheap SSDs)                                  │
│   4. UPS/battery backup                                                │
│   5. Regular pg_basebackup + WAL archiving                             │
│   6. Periodic amcheck runs                                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Bloat: When VACUUM Isn't Enough

### Understanding Bloat

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TABLE BLOAT                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   MVCC creates dead tuples on UPDATE/DELETE.                           │
│   VACUUM marks space as reusable.                                       │
│   But VACUUM doesn't SHRINK the file!                                  │
│                                                                          │
│   Table after many updates:                                             │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │   [LIVE] [dead] [LIVE] [dead] [dead] [LIVE] [dead] [LIVE]       │   │
│   │                                                                  │   │
│   │   8KB    8KB    8KB    8KB    8KB    8KB    8KB    8KB          │   │
│   │   Total: 64KB, but only 32KB is live data!                      │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   50% bloat = table is 2x larger than necessary                        │
│                                                                          │
│   Effects:                                                              │
│   • More disk space used                                               │
│   • More I/O for seq scans                                             │
│   • Larger backups                                                     │
│   • More memory for shared_buffers                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Measuring Bloat

```sql
-- Estimate table bloat (pgstattuple extension)
CREATE EXTENSION IF NOT EXISTS pgstattuple;

SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
    ROUND(100.0 * dead_tuple_len / NULLIF(table_len, 0), 2) AS dead_pct
FROM pg_stat_user_tables, 
     pgstattuple(schemaname || '.' || tablename)
ORDER BY dead_tuple_len DESC
LIMIT 10;

-- Simpler bloat check (approximation)
SELECT 
    schemaname,
    relname,
    n_dead_tup,
    n_live_tup,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 10000
ORDER BY n_dead_tup DESC;
```

### VACUUM FULL vs pg_repack

```
┌─────────────────────────────────────────────────────────────────────────┐
│           VACUUM FULL vs PG_REPACK                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   VACUUM FULL:                                                          │
│   ├─ ✓ Built-in, no extension needed                                   │
│   ├─ ✓ Reclaims all space                                              │
│   └─ ✗ EXCLUSIVE LOCK - blocks ALL access to table!                    │
│       ✗ For 100GB table, can take hours                                │
│       ✗ Production outage                                              │
│                                                                          │
│   pg_repack:                                                            │
│   ├─ ✓ Reclaims space with minimal locking                             │
│   ├─ ✓ Table remains readable and writable                             │
│   ├─ ✓ Only brief lock at the very end                                 │
│   ├─ ✗ Requires extension installation                                 │
│   └─ ✗ Needs extra disk space (rebuilds alongside)                     │
│                                                                          │
│   For production: ALWAYS use pg_repack over VACUUM FULL                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

```bash
# Install pg_repack
# (Usually via package manager or compile from source)

# Repack a specific table (minimal locking)
pg_repack -h localhost -U postgres -d mydb --table orders

# Repack entire database
pg_repack -h localhost -U postgres -d mydb

# Repack indexes only
pg_repack -h localhost -U postgres -d mydb --table orders --only-indexes
```

---

## 4. Point-in-Time Recovery (PITR)

### Replication ≠ Disaster Recovery

```
┌─────────────────────────────────────────────────────────────────────────┐
│       REPLICATION vs DISASTER RECOVERY                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Scenario: Developer runs "DELETE FROM users;" (no WHERE clause)      │
│                                                                          │
│   WITH STREAMING REPLICATION:                                           │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  Primary: DELETE → 0 users remain                               │   │
│   │           ↓ WAL                                                  │   │
│   │  Replica: DELETE applied → 0 users remain                       │   │
│   │                                                                  │   │
│   │  RESULT: All replicas have 0 users. Data is GONE everywhere.   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   WITH POINT-IN-TIME RECOVERY:                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  "Restore the database to 10:14:59 AM"                          │   │
│   │   (one second before the DELETE)                                │   │
│   │                                                                  │   │
│   │  1. Restore base backup from last night                         │   │
│   │  2. Replay WAL up to 10:14:59                                   │   │
│   │  3. Stop at that moment                                         │   │
│   │                                                                  │   │
│   │  RESULT: Database restored to state before the mistake.        │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   Replication = High Availability (survive hardware failure)           │
│   PITR = Disaster Recovery (survive human error, corruption)           │
│                                                                          │
│   YOU NEED BOTH.                                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Setting Up PITR

```sql
-- 1. Enable WAL archiving in postgresql.conf
archive_mode = on
archive_command = 'pgbackrest --stanza=mydb archive-push %p'
-- Or: 'wal-g wal-push %p'
-- Or: 'cp %p /archive/%f'

-- 2. Verify archiving is working
SELECT 
    archived_count,
    last_archived_wal,
    last_archived_time,
    failed_count,
    last_failed_wal
FROM pg_stat_archiver;
```

### Performing PITR

```bash
# Using pgBackRest (recommended)

# 1. List available restore points
pgbackrest info --stanza=mydb

# 2. Restore to a specific time
pgbackrest restore --stanza=mydb --type=time \
    --target="2024-01-15 10:14:59" \
    --target-action=promote

# 3. Start Postgres - it will replay WAL to that moment
pg_ctl start
```

```sql
-- Or manually with recovery.conf / postgresql.conf:
restore_command = 'pgbackrest --stanza=mydb archive-get %f %p'
recovery_target_time = '2024-01-15 10:14:59'
recovery_target_action = 'promote'
```

### PITR Best Practices

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PITR BEST PRACTICES                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. AUTOMATE BASE BACKUPS                                              │
│      • Daily full backups (or more frequent for high-change DBs)       │
│      • Use pgBackRest or WAL-G                                         │
│                                                                          │
│   2. CONTINUOUS WAL ARCHIVING                                           │
│      • Every WAL segment shipped immediately                           │
│      • Monitor for archive failures!                                   │
│                                                                          │
│   3. TEST YOUR RESTORES                                                 │
│      • Monthly restore tests to separate server                        │
│      • Verify data integrity after restore                             │
│      • Time the restore process                                        │
│                                                                          │
│   4. OFFSITE STORAGE                                                    │
│      • Backups in different region/provider                            │
│      • S3, GCS, or Azure Blob with versioning                         │
│                                                                          │
│   5. RETENTION POLICY                                                   │
│      • How far back can you restore?                                   │
│      • 7 days? 30 days? 1 year?                                        │
│      • Balance cost vs recovery needs                                  │
│                                                                          │
│   METRICS TO TRACK:                                                     │
│   • RPO (Recovery Point Objective): Max acceptable data loss           │
│   • RTO (Recovery Time Objective): Max acceptable downtime             │
│   • Time since last successful backup test                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Infrastructure Economics

### The Cost of Postgres at Scale

```
┌─────────────────────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE ECONOMICS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   A Head of Databases owns the budget.                                  │
│                                                                          │
│   COMPUTE:                                                              │
│   • Reserved Instances: 30-60% savings vs On-Demand                    │
│   • Right-sizing: Most DBs are over-provisioned                        │
│   • Spot/Preemptible for read replicas (if you can handle restarts)    │
│                                                                          │
│   STORAGE:                                                              │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │  Storage Type     │  IOPS      │  $/GB/mo │  Use Case          │   │
│   ├────────────────────────────────────────────────────────────────┤   │
│   │  gp3 (AWS)        │  3000 base │  $0.08   │  Most workloads    │   │
│   │  io2 (AWS)        │  64K max   │  $0.125  │  High IOPS needs   │   │
│   │  Local NVMe       │  Extreme   │  Included│  Replicas, ephemeral│  │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   NETWORK:                                                              │
│   • Cross-AZ: $0.01/GB (adds up for replication!)                      │
│   • Cross-region: $0.02-0.09/GB                                        │
│   • Egress to internet: $0.09/GB                                       │
│                                                                          │
│   COMMON MISTAKES:                                                      │
│   ✗ Over-provisioned instances sitting idle                            │
│   ✗ io2 storage when gp3 would suffice                                │
│   ✗ Keeping old replicas that aren't needed                           │
│   ✗ Not using Reserved Instances for stable workloads                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Supabase Context

```
┌─────────────────────────────────────────────────────────────────────────┐
│           SUPABASE-SPECIFIC ECONOMICS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   As Head of Postgres at Supabase, you manage:                         │
│   • Hundreds of thousands of customer databases                        │
│   • Multi-tenant infrastructure                                         │
│   • Pause/resume for inactive databases (cost optimization)            │
│                                                                          │
│   Key decisions:                                                        │
│   • When to pause vs keep running                                      │
│   • Resource allocation per tier (Free, Pro, Enterprise)               │
│   • Compute pooling across tenants                                     │
│   • Storage tiering and compression                                    │
│                                                                          │
│   Unit economics matter:                                                │
│   • Cost per database per hour                                         │
│   • Gross margin per tier                                               │
│   • Infrastructure spend as % of revenue                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Post-Mortem Analysis

### How to Write a Post-Mortem

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   POST-MORTEM STRUCTURE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. TITLE & SEVERITY                                                   │
│      "2024-01-15: 2-hour outage due to XID wraparound"                │
│      Severity: SEV-1                                                    │
│                                                                          │
│   2. SUMMARY                                                            │
│      • What happened (1-2 sentences)                                   │
│      • Impact (users affected, revenue lost)                           │
│      • Duration                                                         │
│                                                                          │
│   3. TIMELINE                                                           │
│      10:00 - First alerts fire                                         │
│      10:05 - On-call engineer paged                                    │
│      10:15 - Root cause identified                                     │
│      10:45 - Mitigation applied                                        │
│      12:00 - Full recovery                                             │
│                                                                          │
│   4. ROOT CAUSE                                                         │
│      Deep technical explanation of WHY                                  │
│      (Not just what broke, but why it was possible)                    │
│                                                                          │
│   5. CONTRIBUTING FACTORS                                               │
│      • Monitoring gap                                                   │
│      • Runbook was outdated                                            │
│      • Alert fatigue                                                    │
│                                                                          │
│   6. ACTION ITEMS                                                       │
│      [ ] Add datfrozenxid monitoring (owner: @alice, due: 1/22)       │
│      [ ] Update runbook (owner: @bob, due: 1/20)                      │
│      [ ] Schedule freeze maintenance window (owner: @carol)            │
│                                                                          │
│   7. LESSONS LEARNED                                                    │
│      What we'll do differently                                         │
│                                                                          │
│   BLAMELESS: Focus on systems, not individuals                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Famous Postgres Outages to Study

```
┌─────────────────────────────────────────────────────────────────────────┐
│               CASE STUDIES WORTH READING                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. GitLab's Database Deletion (2017)                                 │
│      • Accidental rm -rf on production DB directory                    │
│      • 6 hours of data loss                                            │
│      • Lessons: Backup testing, PITR                                   │
│                                                                          │
│   2. Sentry's XID Wraparound (2015)                                    │
│      • Approached 2.1B XID limit                                       │
│      • Emergency VACUUM FREEZE                                          │
│      • Lessons: Monitoring, proactive freezing                         │
│                                                                          │
│   3. Various Replication Slot Disasters                                 │
│      • Inactive slot fills disk                                        │
│      • Primary runs out of space, crashes                              │
│      • Lessons: Slot monitoring, max_slot_wal_keep_size               │
│                                                                          │
│   4. Long-Running Transaction Blocks Vacuum                            │
│      • Idle transaction holds xmin                                     │
│      • Vacuum can't clean any newer dead tuples                        │
│      • Table bloats to 10x size                                        │
│      • Lessons: idle_in_transaction_session_timeout                    │
│                                                                          │
│   Read post-mortems regularly. Every failure teaches something.        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎤 Interview Angle

**Q: "The database is approaching XID wraparound and is 2 weeks from shutting down writes. What do you do?"**

> "First, alert leadership - this is a potential outage. Then assess: run the datfrozenxid query to identify which tables are blocking. Check for long-running transactions (they prevent freezing). If one huge table dominates, consider partitioning it post-crisis. Immediate action: manual VACUUM FREEZE on the oldest tables, starting with smallest to get quick wins. Schedule a maintenance window for the largest table. Monitor pg_stat_progress_vacuum. Post-incident: implement monitoring, lower freeze thresholds, establish regular freeze maintenance windows."

**Q: "A developer accidentally deleted all user data. Replication is in place. How do you recover?"**

> "Replication doesn't help - the delete propagated. I need PITR. First, stop the bleeding - if application is still running, it might be making more changes. Identify the exact time of the delete from logs or pg_stat_activity. Spin up a separate server. Restore from last base backup. Apply WAL archives up to one second before the delete. Verify the recovered data. Either export and re-import the missing data, or failover to the recovered server. Post-incident: implement more granular PITR testing, consider delayed replicas."

**Q: "How do you handle table bloat on a production system that can't have downtime?"**

> "VACUUM FULL is not an option - it takes an exclusive lock. I'd use pg_repack which rebuilds the table online with only a brief lock at the end. Before running: verify we have disk space for the rebuilt table (it creates a copy). Run during low traffic. Monitor pg_repack progress. If the table is huge, consider whether we should partition it going forward to make future bloat management easier. Also investigate why bloat accumulated - is autovacuum undersized for this table?"

---

## 🧠 Key Takeaways

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    THE GRAVEYARD - SURVIVAL GUIDE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   XID WRAPAROUND:                                                       │
│   • Monitor datfrozenxid constantly                                    │
│   • Alert at 500M, panic at 1B                                         │
│   • Regular VACUUM FREEZE maintenance                                  │
│                                                                          │
│   CORRUPTION:                                                           │
│   • Enable data checksums (always!)                                    │
│   • Regular amcheck runs                                               │
│   • ECC RAM, reliable storage                                          │
│                                                                          │
│   BLOAT:                                                                │
│   • Monitor with pgstattuple                                           │
│   • Use pg_repack, never VACUUM FULL in prod                          │
│   • Investigate why autovacuum isn't keeping up                        │
│                                                                          │
│   PITR:                                                                 │
│   • Replication != Disaster Recovery                                   │
│   • pgBackRest or WAL-G for archiving                                  │
│   • TEST your restores regularly                                       │
│                                                                          │
│   COST:                                                                 │
│   • Right-size instances                                               │
│   • Reserved Instances for stable workloads                            │
│   • Monitor storage tier appropriateness                               │
│                                                                          │
│   POST-MORTEMS:                                                         │
│   • Blameless culture                                                  │
│   • Focus on systemic fixes                                            │
│   • Track action items to completion                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Resources

- [Postgres XID Wraparound Deep Dive](https://blog.sentry.io/transaction-id-wraparound-in-postgres/)
- [pgBackRest Documentation](https://pgbackrest.org/)
- [pg_repack GitHub](https://github.com/reorg/pg_repack)
- [GitLab Database Incident Post-Mortem](https://about.gitlab.com/blog/2017/02/10/postmortem-of-database-outage-of-january-31/)

---

## 🎯 You Made It

You've completed the extended curriculum. You now know:

1. SQL fundamentals through advanced optimization
2. Postgres internals from pages to processes
3. Replication and high availability
4. Scaling patterns and multi-tenancy
5. ETL/CDC and data pipelines
6. Supabase-specific knowledge
7. The failure modes that haunt DBAs' nightmares

**The difference between a Senior Engineer and a Head of Databases:**

The Senior knows how to build it.
The Head knows how to keep it from dying at 3 AM.

Good luck with your interview. 🐘

