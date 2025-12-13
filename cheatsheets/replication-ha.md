# Replication & High Availability Cheatsheet

## Replication Types

| Type | Replicates | Selective | Cross-Version |
|------|------------|-----------|---------------|
| Physical (Streaming) | WAL bytes | No | No |
| Logical | Row changes | Yes | Yes |

## Physical Replication Setup

```sql
-- Primary: postgresql.conf
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10

-- Primary: Create slot
SELECT pg_create_physical_replication_slot('replica1');

-- Replica: Take base backup
pg_basebackup -h primary -D /data -U replicator -P

-- Replica: Create standby.signal
touch /data/standby.signal

-- Replica: Set primary_conninfo
primary_conninfo = 'host=primary port=5432 user=replicator'
```

## Logical Replication Setup

```sql
-- Publisher
CREATE PUBLICATION my_pub FOR TABLE orders, products;

-- Subscriber
CREATE SUBSCRIPTION my_sub
CONNECTION 'host=publisher dbname=mydb user=repuser'
PUBLICATION my_pub;
```

## Sync Commit Levels

| Level | Wait For | Data Safety | Latency |
|-------|----------|-------------|---------|
| off | Nothing | Risk | Fastest |
| local | Local WAL flush | Local only | Fast |
| remote_write | Replica receives | Good | +1 RTT |
| on | Replica flushes | Better | +1 RTT |
| remote_apply | Replica applies | Best | +1 RTT |

## Monitoring Replication

```sql
-- On Primary: See replicas
SELECT client_addr, state, sent_lsn, replay_lsn,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes
FROM pg_stat_replication;

-- On Replica: Check recovery
SELECT pg_is_in_recovery();
SELECT pg_last_wal_replay_lsn();
SELECT pg_last_xact_replay_timestamp();

-- Replication slots
SELECT slot_name, active, 
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained
FROM pg_replication_slots;
```

## Patroni (HA)

```bash
# Cluster status
patronictl list

# Planned switchover
patronictl switchover --master node1 --candidate node2

# Reinit failed node
patronictl reinit cluster_name node_name
```

## Failover Checklist

1. Detect failure (monitoring)
2. Verify not false positive
3. Stop old primary (if reachable)
4. Promote standby: `pg_ctl promote` or `SELECT pg_promote()`
5. Update connection routing
6. Verify applications reconnected
7. Rebuild old primary as replica

## Connection Routing

```sql
-- Multi-host connection string
postgresql://user:pass@node1,node2,node3/db?target_session_attrs=read-write

-- target_session_attrs options
any         -- Any server
read-write  -- Primary only
read-only   -- Replicas only
```

## CDC (Change Data Capture)

```sql
-- Enable logical decoding
wal_level = logical

-- Create slot for CDC
SELECT pg_create_logical_replication_slot('cdc_slot', 'pgoutput');

-- Get changes
SELECT * FROM pg_logical_slot_get_changes('cdc_slot', NULL, NULL);
```

