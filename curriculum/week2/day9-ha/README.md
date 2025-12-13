# Day 9: High Availability Patterns

> **Time:** 2 hours  
> **Goal:** Design systems that survive failures  
> **Analogy:** Like Kubernetes pod restarts - automatic recovery without human intervention

---

## 🎯 What You'll Learn Today

```
┌─────────────────────────────────────────────────────────────┐
│                     DAY 9 ROADMAP                           │
├─────────────────────────────────────────────────────────────┤
│  1. HA Concepts                      (15 min)               │
│  2. Failover Strategies              (25 min)               │
│  3. Patroni Deep Dive                (30 min)               │
│  4. Connection Routing               (20 min)               │
│  5. Multi-Region Considerations      (20 min)               │
│  6. Testing Failures                 (10 min)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. HA Concepts

### The Metrics That Matter

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    HA METRICS                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  RTO (Recovery Time Objective)                                          │
│  "How long can we be down?"                                             │
│  ├── Minutes: Acceptable for many apps                                  │
│  ├── Seconds: Critical applications                                     │
│  └── Zero: Real-time systems (trading, etc.)                           │
│                                                                          │
│  RPO (Recovery Point Objective)                                         │
│  "How much data can we lose?"                                           │
│  ├── Hours: Daily backups OK                                            │
│  ├── Minutes: Async replication OK                                      │
│  └── Zero: Sync replication required                                    │
│                                                                          │
│  Availability Target          Downtime per Year                         │
│  ─────────────────────────────────────────────                          │
│  99%      (two 9s)            3.65 days                                 │
│  99.9%    (three 9s)          8.76 hours                                │
│  99.99%   (four 9s)           52.6 minutes                              │
│  99.999%  (five 9s)           5.26 minutes                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### HA Architecture Patterns

```
┌─────────────────────────────────────────────────────────────────────────┐
│                SINGLE PRIMARY + HOT STANDBY                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────┐    Streaming     ┌─────────────────────┐      │
│   │      PRIMARY        │   Replication    │      STANDBY        │      │
│   │                     │ ───────────────► │                     │      │
│   │   Read + Write      │                  │    Read Only        │      │
│   │                     │                  │    Hot Standby      │      │
│   └─────────────────────┘                  └─────────────────────┘      │
│              ▲                                       ▲                   │
│              │                                       │                   │
│              └───────────────┬───────────────────────┘                   │
│                              │                                           │
│                    ┌─────────────────┐                                   │
│                    │   Application   │                                   │
│                    └─────────────────┘                                   │
│                                                                          │
│   Normal: Writes → Primary, Reads → Primary or Standby                  │
│   Failure: Promote Standby to Primary                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                 MULTIPLE STANDBYS                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                     ┌─────────────────────┐                              │
│                     │      PRIMARY        │                              │
│                     │                     │                              │
│                     └──────────┬──────────┘                              │
│                                │                                         │
│              ┌─────────────────┼─────────────────┐                       │
│              │                 │                 │                       │
│              ▼                 ▼                 ▼                       │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐           │
│   │   Standby 1     │ │   Standby 2     │ │   Standby 3     │           │
│   │   (Sync)        │ │   (Async)       │ │   (Different DC)│           │
│   └─────────────────┘ └─────────────────┘ └─────────────────┘           │
│                                                                          │
│   Benefits:                                                              │
│   • Multiple failover candidates                                        │
│   • Read scaling across standbys                                        │
│   • Geographic distribution                                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Failover Strategies

### Manual Failover

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MANUAL FAILOVER                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. Detect failure (monitoring alerts)                                 │
│   2. Human decides to failover                                          │
│   3. Stop old primary (if reachable)                                    │
│   4. Promote standby                                                    │
│   5. Update connection strings / DNS                                    │
│   6. Verify and monitor                                                 │
│                                                                          │
│   Promote command:                                                       │
│   $ pg_ctl promote -D /var/lib/postgresql/data                          │
│   OR                                                                     │
│   postgres=# SELECT pg_promote();                                        │
│                                                                          │
│   RTO: Minutes to hours (depends on human)                              │
│   Pros: Control, no false positives                                     │
│   Cons: Slow, requires on-call engineer                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Automatic Failover

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 AUTOMATIC FAILOVER                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                 CONSENSUS LAYER                                  │   │
│   │         (etcd / Consul / ZooKeeper)                             │   │
│   │                                                                  │   │
│   │   • Distributed consensus for leader election                   │   │
│   │   • Prevents split-brain                                        │   │
│   │   • Stores cluster state                                        │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                              ↑                                           │
│                              │ Health checks / Leader election           │
│                              ↓                                           │
│   ┌───────────────────────────────────────────────────────────────────┐ │
│   │                  HA MANAGER (Patroni, etc.)                       │ │
│   │                                                                   │ │
│   │   Runs on each Postgres node                                     │ │
│   │   • Monitors local Postgres                                      │ │
│   │   • Participates in leader election                              │ │
│   │   • Triggers promotion when elected                              │ │
│   │   • Updates DNS/endpoints                                        │ │
│   └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│   RTO: Seconds to low minutes                                           │
│   Challenge: Avoiding split-brain                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Split-Brain: The Nightmare Scenario

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SPLIT-BRAIN                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Network Partition:                                                     │
│                                                                          │
│   Datacenter A          │ PARTITION │          Datacenter B             │
│   ┌─────────────┐       │           │       ┌─────────────┐             │
│   │   Primary   │       │    ✗      │       │   Standby   │             │
│   │  (writes)   │       │ ──────── │       │  promoted!  │             │
│   │             │       │           │       │  (writes)   │             │
│   └─────────────┘       │           │       └─────────────┘             │
│         ▲                                          ▲                     │
│         │                                          │                     │
│    App writes                                 App writes                 │
│                                                                          │
│   DISASTER: Two primaries accepting writes!                             │
│   Data will diverge and be very hard to reconcile                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### STONITH - Fencing (The Nuclear Option)

```
┌─────────────────────────────────────────────────────────────────────────┐
│         STONITH - SHOOT THE OTHER NODE IN THE HEAD                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Problem: You promote replica, but old primary is still running!       │
│            Maybe it's just slow, maybe network partition.               │
│            You can't KNOW if it's still accepting writes.               │
│                                                                          │
│   Solution: KILL IT. With certainty.                                    │
│                                                                          │
│   FENCING METHODS:                                                      │
│                                                                          │
│   1. POWER FENCING (Most reliable)                                      │
│      → Send command to IPMI/iLO/DRAC to hard power-off                 │
│      → Cloud: AWS ec2 terminate-instances, GCP compute stop            │
│      → Physical: PDU (Power Distribution Unit) cutoff                   │
│                                                                          │
│   2. NETWORK FENCING                                                    │
│      → Block the old primary at network/firewall level                 │
│      → Less reliable (node might still corrupt local data)              │
│                                                                          │
│   3. STORAGE FENCING                                                    │
│      → Revoke old primary's access to shared storage                   │
│      → Common with SAN setups                                           │
│                                                                          │
│   ⚠️ WITHOUT FENCING, YOU CANNOT GUARANTEE DATA INTEGRITY              │
│                                                                          │
│   Patroni supports fencing callbacks:                                   │
│   on_stop: /path/to/fence-script.sh                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Prevention Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│            SPLIT-BRAIN PREVENTION                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   LAYER 1: CONSENSUS (Etcd/Consul/ZooKeeper)                           │
│   • Need majority quorum to hold leader lock                            │
│   • 3 nodes = need 2 to agree                                           │
│   • 5 nodes = need 3 to agree                                           │
│   • If partitioned from majority, cannot become leader                  │
│                                                                          │
│   LAYER 2: FENCING (STONITH)                                            │
│   • Before promoting new leader, KILL old leader                        │
│   • Use cloud APIs to terminate instance                                │
│   • Use IPMI/iLO for bare metal                                         │
│                                                                          │
│   LAYER 3: SYNCHRONOUS REPLICATION                                      │
│   • Old primary can't commit if sync replica unreachable               │
│   • Trades availability for consistency                                 │
│                                                                          │
│   LAYER 4: APPLICATION AWARENESS                                        │
│   • App checks "SELECT pg_is_in_recovery()" before writes              │
│   • Rejects writes to replicas                                          │
│                                                                          │
│   A Head of Postgres uses ALL layers. Manual failover is negligence.   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Patroni Deep Dive

### What is Patroni?

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PATRONI                                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   • Open-source HA solution for Postgres                                │
│   • Created by Zalando                                                  │
│   • Uses distributed consensus (etcd/Consul/ZooKeeper)                  │
│   • Automatic failover with split-brain protection                      │
│   • Industry standard for Postgres HA                                   │
│                                                                          │
│   Used by: Supabase, GitLab, Zalando, and many more                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Patroni Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 PATRONI CLUSTER                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                    ┌───────────────────────────────┐                     │
│                    │         etcd cluster           │                    │
│                    │     (3+ nodes for quorum)      │                    │
│                    └───────────────┬───────────────┘                     │
│                                    │                                     │
│            ┌───────────────────────┼───────────────────────┐            │
│            │                       │                       │            │
│            ▼                       ▼                       ▼            │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐  │
│   │    Node 1       │     │    Node 2       │     │    Node 3       │  │
│   │  ┌───────────┐  │     │  ┌───────────┐  │     │  ┌───────────┐  │  │
│   │  │ Patroni   │  │     │  │ Patroni   │  │     │  │ Patroni   │  │  │
│   │  └─────┬─────┘  │     │  └─────┬─────┘  │     │  └─────┬─────┘  │  │
│   │        │        │     │        │        │     │        │        │  │
│   │  ┌─────▼─────┐  │     │  ┌─────▼─────┐  │     │  ┌─────▼─────┐  │  │
│   │  │ Postgres  │  │     │  │ Postgres  │  │     │  │ Postgres  │  │  │
│   │  │ (PRIMARY) │  │     │  │ (REPLICA) │  │     │  │ (REPLICA) │  │  │
│   │  └───────────┘  │     │  └───────────┘  │     │  └───────────┘  │  │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘  │
│                                                                          │
│   Patroni on each node:                                                 │
│   • Manages local Postgres                                              │
│   • Maintains leader lock in etcd                                       │
│   • Heartbeats to prove liveness                                        │
│   • Triggers failover when leader lock lost                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Patroni Config Example

```yaml
# patroni.yml
scope: my-cluster
name: node1

restapi:
  listen: 0.0.0.0:8008
  connect_address: node1:8008

etcd:
  hosts:
    - etcd1:2379
    - etcd2:2379
    - etcd3:2379

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576  # 1MB max lag to be failover candidate
    synchronous_mode: false
    postgresql:
      use_pg_rewind: true
      parameters:
        wal_level: replica
        max_connections: 100
        max_wal_senders: 10

postgresql:
  listen: 0.0.0.0:5432
  connect_address: node1:5432
  data_dir: /var/lib/postgresql/data
  authentication:
    replication:
      username: replicator
      password: secret
    superuser:
      username: postgres
      password: secret
```

### Patroni Commands

```bash
# Cluster status
patronictl -c /etc/patroni.yml list

# Output:
# + Cluster: my-cluster (1234567890) ---+----+-----------+
# | Member | Host  | Role    | State   | TL | Lag in MB |
# +--------+-------+---------+---------+----+-----------+
# | node1  | node1 | Leader  | running |  1 |           |
# | node2  | node2 | Replica | running |  1 |       0.0 |
# | node3  | node3 | Replica | running |  1 |       0.0 |
# +--------+-------+---------+---------+----+-----------+

# Manual switchover (planned)
patronictl -c /etc/patroni.yml switchover --master node1 --candidate node2

# Reinitialize a failed node
patronictl -c /etc/patroni.yml reinit my-cluster node3
```

---

## 4. Connection Routing

### The Problem

```
┌─────────────────────────────────────────────────────────────────────────┐
│                CONNECTION ROUTING CHALLENGE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   After failover:                                                        │
│   • Old primary (node1) is no longer accepting writes                   │
│   • New primary (node2) should receive writes                           │
│   • Application has connection string pointing to node1                 │
│                                                                          │
│   How do apps find the current primary?                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Solution 1: HAProxy / Load Balancer

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    HAPROXY ROUTING                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                     HAProxy                                      │   │
│   │                                                                  │   │
│   │   Port 5432 (writes)    Port 5433 (reads)                       │   │
│   │   → Route to primary     → Route to any replica                 │   │
│   │                                                                  │   │
│   │   Health check: query Patroni REST API                          │   │
│   │   - GET /master returns 200 for primary                         │   │
│   │   - GET /replica returns 200 for replicas                       │   │
│   │                                                                  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   # HAProxy config                                                       │
│   backend postgres-primary                                              │
│       option httpchk GET /master                                        │
│       http-check expect status 200                                      │
│       server node1 node1:5432 check port 8008                          │
│       server node2 node2:5432 check port 8008                          │
│                                                                          │
│   backend postgres-replicas                                             │
│       option httpchk GET /replica                                       │
│       http-check expect status 200                                      │
│       balance roundrobin                                                │
│       server node1 node1:5432 check port 8008                          │
│       server node2 node2:5432 check port 8008                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Solution 2: Connection String with Multiple Hosts

```
┌─────────────────────────────────────────────────────────────────────────┐
│              LIBPQ MULTI-HOST CONNECTION                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   # Connection string with multiple hosts                               │
│   postgresql://user:pass@node1:5432,node2:5432,node3:5432/db            │
│               ?target_session_attrs=read-write                          │
│                                                                          │
│   target_session_attrs options:                                         │
│   • any           : Connect to any server                               │
│   • read-write    : Only connect to primary (writable)                  │
│   • read-only     : Only connect to replicas                            │
│   • primary       : Same as read-write                                  │
│   • standby       : Same as read-only                                   │
│                                                                          │
│   Behavior:                                                              │
│   1. Try first host                                                     │
│   2. If wrong type, try next                                            │
│   3. Continue until matching host found                                 │
│                                                                          │
│   Pros: No extra infrastructure                                         │
│   Cons: Connection time during failover                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Solution 3: DNS-Based Routing

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DNS ROUTING                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   App connects to:                                                       │
│   • primary.db.example.com → Current primary IP                         │
│   • replica.db.example.com → Replica IPs (round-robin)                  │
│                                                                          │
│   On failover:                                                           │
│   • Patroni callback updates DNS                                        │
│   • Or: Use Consul DNS integration                                      │
│                                                                          │
│   Challenge: DNS TTL (caching)                                          │
│   • Set low TTL (30s) for faster failover                               │
│   • Some clients cache regardless of TTL!                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Multi-Region Considerations

### Latency Reality

```
┌─────────────────────────────────────────────────────────────────────────┐
│                NETWORK LATENCY                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Same datacenter:     < 1ms                                            │
│   Same region (AZ):    1-2ms                                            │
│   Cross-region (US):   30-70ms                                          │
│   Cross-continent:     100-200ms                                        │
│                                                                          │
│   Impact on sync replication:                                           │
│   • Same DC: Negligible                                                 │
│   • Cross-region: Every commit waits 60-140ms extra!                    │
│                                                                          │
│   If you do 100 commits/second:                                         │
│   • Same DC: Fine                                                       │
│   • Cross-region: Throughput limited to ~10/second per connection       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Multi-Region Patterns

```
┌─────────────────────────────────────────────────────────────────────────┐
│           PATTERN 1: ASYNC CROSS-REGION REPLICA                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   US-East (Primary)          US-West (DR)          EU (Read)            │
│   ┌─────────────────┐       ┌─────────────────┐   ┌─────────────────┐   │
│   │ Primary         │       │ Async Replica   │   │ Async Replica   │   │
│   │ + Sync Replica  │──────►│ (DR failover)   │──►│ (Local reads)   │   │
│   └─────────────────┘       └─────────────────┘   └─────────────────┘   │
│                                                                          │
│   • Fast writes (no cross-region sync)                                  │
│   • Some data loss on region failure (async lag)                        │
│   • Read latency improved for EU users                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│           PATTERN 2: WITNESS NODE                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   US-East              US-West              US-Central                   │
│   ┌─────────────┐     ┌─────────────┐      ┌─────────────┐              │
│   │ Primary     │     │ Standby     │      │ Witness     │              │
│   │ (etcd node) │     │ (etcd node) │      │ (etcd only) │              │
│   └─────────────┘     └─────────────┘      └─────────────┘              │
│                                                                          │
│   3 etcd nodes = quorum of 2 needed                                     │
│   Witness has no data, just votes in consensus                          │
│   If East fails: West + Central have quorum → West promoted            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Testing Failures

### Chaos Engineering for Databases

```sql
-- Test 1: Kill primary process
-- On primary node:
pg_ctl stop -D /var/lib/postgresql/data -m immediate

-- Observe: How long until failover? Did apps reconnect?

-- Test 2: Network partition simulation
-- Using iptables to block replication traffic:
iptables -A INPUT -s replica_ip -j DROP
iptables -A OUTPUT -d replica_ip -j DROP

-- Test 3: Slow disk simulation
-- (Use tools like tc or chaos engineering platforms)

-- Test 4: Planned switchover
patronictl switchover --master node1 --candidate node2 --force
```

### What to Measure

```
┌─────────────────────────────────────────────────────────────────────────┐
│              FAILOVER TESTING CHECKLIST                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   □ Detection time (how long to notice failure?)                        │
│   □ Failover time (detection → new primary serving)                     │
│   □ Application reconnection time                                       │
│   □ Data loss (check last committed transaction)                        │
│   □ Error rate during failover                                          │
│   □ Alert accuracy (no false positives?)                                │
│   □ Runbook followed correctly?                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎤 Interview Angle

**Q: "How would you design a highly available Postgres deployment?"**

> "I'd use Patroni with etcd for automatic failover and split-brain protection. Minimum three Postgres nodes - one primary, two sync standbys - across different availability zones. HAProxy or pgbouncer in front for connection routing, with health checks against Patroni's REST API. For cross-region DR, I'd add an async replica in another region. The key is testing failover regularly and having runbooks for common scenarios."

**Q: "What is split-brain and how do you prevent it?"**

> "Split-brain is when two nodes both think they're primary after a network partition, leading to data divergence. Prevention requires a consensus mechanism - Patroni uses etcd/Consul where you need majority quorum to hold the leader lock. If you're partitioned from the majority, you can't become leader. Additionally, fencing (STONITH) can force-kill the old primary to be sure it stops accepting writes."

**Q: "Synchronous or asynchronous replication for HA?"**

> "It depends on RPO requirements. Async is default and better for performance - failover might lose recent commits. Sync guarantees zero data loss (RPO=0) but adds latency and availability risk if replica fails. For most HA setups, I'd use sync replication within the same region/DC with `synchronous_commit = remote_apply` or `on`, then async for cross-region DR replicas."

---

## 🧠 Key Takeaways

```
┌─────────────────────────────────────────────────────────────┐
│               HA MENTAL MODEL                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CORE COMPONENTS:                                           │
│  • Streaming replication (sync or async)                    │
│  • Consensus store (etcd/Consul) for leader election        │
│  • HA manager (Patroni) on each node                        │
│  • Connection routing (HAProxy/DNS/multi-host)              │
│                                                              │
│  FAILURE MODES TO HANDLE:                                   │
│  • Primary crash → Automatic failover                       │
│  • Network partition → Quorum prevents split-brain          │
│  • Replica failure → Degraded but operational               │
│  • etcd failure → Cluster continues, no failover possible   │
│                                                              │
│  KEY DECISIONS:                                             │
│  • Sync vs Async (latency vs data safety)                   │
│  • Number of replicas (cost vs resilience)                  │
│  • Cross-region (DR capability vs complexity)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏭️ Tomorrow: Day 10

We'll learn about **Scaling Postgres** - vertical vs horizontal, sharding strategies, and how Supabase manages millions of databases.

