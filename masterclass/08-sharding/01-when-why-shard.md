# When and Why to Shard

> **The Question**: "Everyone talks about sharding. Do I actually need it?"

---

## Visual 1: The Scaling Path

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE SCALING PATH: Exhaust Everything Before Sharding                   │
│  ══════════════════════════════════════════════════════                  │
│                                                                          │
│  LEVEL 1: OPTIMIZE                                                       │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  • Add missing indexes                                          │     │
│  │  • Fix slow queries                                             │     │
│  │  • Tune PostgreSQL config (shared_buffers, work_mem)           │     │
│  │  • Connection pooling                                           │     │
│  │  Cost: $0, Time: Days                                           │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                              │                                           │
│                              ▼                                           │
│  LEVEL 2: VERTICAL SCALING                                              │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  • More RAM (256GB → 512GB → 1TB)                              │     │
│  │  • More CPU cores (32 → 64 → 128)                               │     │
│  │  • Faster storage (SSD → NVMe → NVMe RAID)                     │     │
│  │  Cost: $1-10K/month, Time: Hours                                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                              │                                           │
│                              ▼                                           │
│  LEVEL 3: READ REPLICAS                                                  │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  • Add 2-5 read replicas                                        │     │
│  │  • Route reads to replicas                                      │     │
│  │  • Primary handles writes only                                  │     │
│  │  Cost: $2-5K/month, Time: Days                                  │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                              │                                           │
│                              ▼                                           │
│  LEVEL 4: PARTITIONING                                                   │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  • Partition large tables by date                              │     │
│  │  • Faster queries via partition pruning                        │     │
│  │  • Easier maintenance                                           │     │
│  │  Cost: $0, Time: Days-Weeks                                     │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                              │                                           │
│                              ▼                                           │
│  LEVEL 5: SHARDING (Nuclear option)                                     │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  • Split data across multiple servers                          │     │
│  │  • Massive complexity                                           │     │
│  │  • Changed application code                                     │     │
│  │  • Operational burden forever                                   │     │
│  │  Cost: $10K+/month + engineering years                          │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Signs You Actually Need Sharding

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SIGNS YOU ACTUALLY NEED SHARDING                                        │
│  ═════════════════════════════════                                       │
│                                                                          │
│  ✓ TRUE INDICATORS:                                                      │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  1. WRITE THROUGHPUT                                           │     │
│  │     Your biggest server can't handle the write rate.          │     │
│  │     Example: 100K+ writes/second, single primary at 100% CPU  │     │
│  │                                                                 │     │
│  │  2. DATA SIZE                                                   │     │
│  │     Data doesn't fit on the largest available server.         │     │
│  │     Example: 100TB+ data, largest disk is 64TB                │     │
│  │                                                                 │     │
│  │  3. MULTI-REGION LATENCY                                       │     │
│  │     Users in Asia need local writes, not 200ms to US.         │     │
│  │                                                                 │     │
│  │  4. ISOLATION REQUIREMENTS                                     │     │
│  │     Tenant A's traffic can't affect Tenant B's performance.  │     │
│  │     (Multi-tenant SaaS with strict SLAs)                      │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ✗ FALSE INDICATORS (don't shard for these):                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  • "Our table has 100 million rows"                            │     │
│  │    (PostgreSQL handles billions just fine)                     │     │
│  │                                                                 │     │
│  │  • "Queries are slow"                                          │     │
│  │    (Add indexes, optimize queries first)                       │     │
│  │                                                                 │     │
│  │  • "We might need it someday"                                  │     │
│  │    (YAGNI - You Ain't Gonna Need It)                          │     │
│  │                                                                 │     │
│  │  • "Netflix/Instagram does it"                                 │     │
│  │    (You're not at their scale, probably never will be)        │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: The Real Costs of Sharding

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE REAL COSTS OF SHARDING                                              │
│  ══════════════════════════                                              │
│                                                                          │
│  WHAT YOU LOSE:                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  1. JOINs ACROSS SHARDS                                        │     │
│  │     -- This becomes impossible or very slow:                   │     │
│  │     SELECT * FROM orders o                                      │     │
│  │     JOIN products p ON o.product_id = p.id;                    │     │
│  │     -- If orders is sharded but products isn't...             │     │
│  │                                                                 │     │
│  │  2. TRANSACTIONS ACROSS SHARDS                                 │     │
│  │     -- This doesn't work:                                       │     │
│  │     BEGIN;                                                      │     │
│  │       UPDATE user_1.balance;  -- Shard A                       │     │
│  │       UPDATE user_2.balance;  -- Shard B                       │     │
│  │     COMMIT;  -- ??? Which shard commits?                       │     │
│  │                                                                 │     │
│  │  3. AGGREGATIONS                                                │     │
│  │     SELECT COUNT(*) FROM users;                                 │     │
│  │     -- Must query all shards and sum                           │     │
│  │                                                                 │     │
│  │  4. UNIQUE CONSTRAINTS                                         │     │
│  │     -- email must be unique GLOBALLY, not per-shard            │     │
│  │     -- Requires coordination layer                             │     │
│  │                                                                 │     │
│  │  5. FOREIGN KEYS                                                │     │
│  │     -- Can't enforce across shards                             │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  OPERATIONAL BURDEN:                                                     │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  • N databases to monitor instead of 1                         │     │
│  │  • N backups to manage                                          │     │
│  │  • N failovers to handle                                        │     │
│  │  • Shard rebalancing when traffic shifts                       │     │
│  │  • Schema migrations across all shards                         │     │
│  │  • Every engineer needs to understand sharding                 │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
