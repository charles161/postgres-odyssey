# Partitioning vs Sharding

> **The Question**: "What's the difference? When do I need each?"

---

## Visual 1: The Core Difference

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PARTITIONING vs SHARDING: The Core Difference                          │
│  ═════════════════════════════════════════════                           │
│                                                                          │
│  PARTITIONING = One database, multiple tables                           │
│  SHARDING = Multiple databases, distributed data                        │
│                                                                          │
│  ┌────────────────────────────┐  ┌────────────────────────────┐         │
│  │      PARTITIONING          │  │        SHARDING            │         │
│  │                            │  │                            │         │
│  │   ┌──────────────────┐    │  │  ┌───────┐   ┌───────┐    │         │
│  │   │   ONE SERVER     │    │  │  │Server1│   │Server2│    │         │
│  │   │   ══════════     │    │  │  │       │   │       │    │         │
│  │   │                  │    │  │  │ ┌───┐ │   │ ┌───┐ │    │         │
│  │   │  ┌───┐ ┌───┐    │    │  │  │ │ A │ │   │ │ C │ │    │         │
│  │   │  │ A │ │ B │    │    │  │  │ │ B │ │   │ │ D │ │    │         │
│  │   │  ├───┤ ├───┤    │    │  │  │ └───┘ │   │ └───┘ │    │         │
│  │   │  │ C │ │ D │    │    │  │  └───────┘   └───────┘    │         │
│  │   │  └───┘ └───┘    │    │  │                            │         │
│  │   │                  │    │  │  ┌───────┐   ┌───────┐    │         │
│  │   └──────────────────┘    │  │  │Server3│   │Server4│    │         │
│  │                            │  │  │       │   │       │    │         │
│  │   All data in ONE place   │  │  │ ┌───┐ │   │ ┌───┐ │    │         │
│  │   Shares CPU, RAM, disk   │  │  │ │ E │ │   │ │ G │ │    │         │
│  │                            │  │  │ │ F │ │   │ │ H │ │    │         │
│  │                            │  │  │ └───┘ │   │ └───┘ │    │         │
│  │                            │  │  └───────┘   └───────┘    │         │
│  │                            │  │                            │         │
│  │                            │  │  Data DISTRIBUTED across  │         │
│  │                            │  │  independent servers       │         │
│  │                            │  │                            │         │
│  └────────────────────────────┘  └────────────────────────────┘         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: What Each Solves

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHAT EACH SOLVES                                                        │
│  ════════════════                                                        │
│                                                                          │
│  PARTITIONING SOLVES:                                                    │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  ✓ Query performance (partition pruning)                       │     │
│  │  ✓ Maintenance operations (vacuum one partition at a time)    │     │
│  │  ✓ Data retention (drop old partitions instantly)             │     │
│  │  ✓ Index build time (smaller indexes per partition)           │     │
│  │                                                                 │     │
│  │  ✗ Does NOT add more CPU                                       │     │
│  │  ✗ Does NOT add more RAM                                       │     │
│  │  ✗ Does NOT add more write throughput                         │     │
│  │  ✗ Single point of failure remains                            │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  SHARDING SOLVES:                                                        │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  ✓ Write throughput (parallel writes to multiple servers)     │     │
│  │  ✓ Storage capacity (spread data across machines)             │     │
│  │  ✓ CPU/RAM limits (more machines = more resources)            │     │
│  │  ✓ Blast radius (one shard down ≠ all data gone)             │     │
│  │                                                                 │     │
│  │  ✗ MUCH more complex to operate                               │     │
│  │  ✗ Cross-shard queries are slow/impossible                    │     │
│  │  ✗ Transactions across shards are very hard                   │     │
│  │  ✗ Resharding is painful                                       │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: When to Use Each

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DECISION TREE                                                           │
│  ═════════════                                                           │
│                                                                          │
│  Start here:                                                             │
│      │                                                                   │
│      ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Is your table > 100GB and you have time-based queries?         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│      │                                                                   │
│      ├── YES ──▶ Use PARTITIONING (by date)                            │
│      │                                                                   │
│      ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Is your PRIMARY hitting CPU/RAM limits?                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│      │                                                                   │
│      ├── YES, mostly reads ──▶ Add READ REPLICAS                       │
│      │                                                                   │
│      ├── YES, mostly writes ──▶ Consider SHARDING                      │
│      │                                                                   │
│      ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Is a single server's disk too small for your data?             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│      │                                                                   │
│      ├── YES ──▶ SHARDING is required                                  │
│      │                                                                   │
│      ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Do you need > 100K writes/second?                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│      │                                                                   │
│      ├── YES ──▶ SHARDING is required                                  │
│      │                                                                   │
│      ▼                                                                   │
│  Stay with single server + partitioning. You probably don't need      │
│  sharding. Most companies never do.                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: Complexity Comparison

```
┌─────────────────────────────────────────────────────────────────────────┐
│  COMPLEXITY COMPARISON                                                   │
│  ═════════════════════                                                   │
│                                                                          │
│                              Partitioning    Sharding                   │
│  ─────────────────────────────────────────────────────────────          │
│  Setup                        Easy           Hard                       │
│  ─────────────────────────────────────────────────────────────          │
│  Queries work automatically   Yes            Mostly no                  │
│  ─────────────────────────────────────────────────────────────          │
│  JOINs across partitions/     Yes, native    Complex, slow              │
│  shards                                                                  │
│  ─────────────────────────────────────────────────────────────          │
│  Transactions                 Normal         Hard/impossible            │
│  ─────────────────────────────────────────────────────────────          │
│  Backups                      Single backup  N backups                  │
│  ─────────────────────────────────────────────────────────────          │
│  Monitoring                   One database   N databases                │
│  ─────────────────────────────────────────────────────────────          │
│  Rebalancing                  N/A            Very hard                  │
│  ─────────────────────────────────────────────────────────────          │
│  Application changes          None           Significant                │
│  ─────────────────────────────────────────────────────────────          │
│                                                                          │
│  RULE: Exhaust partitioning + replicas + bigger hardware                │
│        before considering sharding.                                      │
│                                                                          │
│  Sharding is the nuclear option. Use it only when you must.            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
