# Replication & HA Architecture Diagrams

## Streaming Replication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STREAMING REPLICATION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PRIMARY                                    REPLICA                         │
│   ┌────────────────────────────────┐        ┌────────────────────────────┐  │
│   │                                │        │                            │  │
│   │   Client                       │        │       wal receiver         │  │
│   │     │                          │        │            ↑               │  │
│   │     ▼                          │        │            │               │  │
│   │   Backend                      │        │            │               │  │
│   │     │                          │        │            │               │  │
│   │     ▼                          │        │            │               │  │
│   │   WAL Buffers                  │        │            │               │  │
│   │     │                          │        │            │               │  │
│   │     ▼                          │        │            │               │  │
│   │   WAL Files ──────────────────────────────────────────               │  │
│   │     │       wal sender         │        │            ▼               │  │
│   │     │                          │        │       WAL Files            │  │
│   │     │                          │        │            │               │  │
│   │     │                          │        │            ▼               │  │
│   │     │                          │        │     startup process        │  │
│   │     │                          │        │       (replay)             │  │
│   │     │                          │        │            │               │  │
│   │     │                          │        │            ▼               │  │
│   │     ▼                          │        │     Shared Buffers         │  │
│   │   Data Files                   │        │            │               │  │
│   │                                │        │            ▼               │  │
│   │                                │        │     Read-Only Queries      │  │
│   │                                │        │                            │  │
│   └────────────────────────────────┘        └────────────────────────────┘  │
│                                                                              │
│   WAL = Write-Ahead Log (binary journal of all changes)                     │
│   All changes written to WAL before data files                              │
│   Replica replays WAL to stay in sync                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Synchronous vs Asynchronous Replication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ASYNCHRONOUS REPLICATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Client        Primary           WAL Sender        Replica                 │
│     │                                                                       │
│     │──COMMIT──▶│                                                           │
│     │           │──write WAL──▶│                                            │
│     │◀──OK──────│              │──stream────────▶│                          │
│     │           │              │                 │──apply                   │
│                                                                              │
│   • COMMIT returns BEFORE replica confirms                                  │
│   • Fast! No network latency in commit path                                 │
│   • Risk: Data loss if primary crashes before replica gets WAL              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    SYNCHRONOUS REPLICATION                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Client        Primary           WAL Sender        Replica                 │
│     │                                                                       │
│     │──COMMIT──▶│                                                           │
│     │           │──write WAL──▶│                                            │
│     │           │              │──stream────────▶│                          │
│     │           │              │                 │──write/flush WAL         │
│     │           │              │◀─────ACK────────│                          │
│     │◀──OK──────│                                                           │
│                                                                              │
│   • COMMIT waits for replica acknowledgment                                 │
│   • Zero data loss (RPO = 0)                                                │
│   • Slower - adds network round-trip to every commit                        │
│   • If replica fails, primary can hang (need timeout/fallback)              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Patroni HA Cluster

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PATRONI HA CLUSTER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                  ┌────────────────────────────────────┐                     │
│                  │          etcd cluster               │                    │
│                  │    (distributed consensus)          │                    │
│                  │                                     │                    │
│                  │   • Stores cluster state            │                    │
│                  │   • Leader election                 │                    │
│                  │   • Prevents split-brain            │                    │
│                  └──────────────┬─────────────────────┘                     │
│                                 │                                            │
│         ┌───────────────────────┼───────────────────────┐                   │
│         │                       │                       │                   │
│         ▼                       ▼                       ▼                   │
│   ┌───────────────┐       ┌───────────────┐       ┌───────────────┐        │
│   │    Node 1     │       │    Node 2     │       │    Node 3     │        │
│   │               │       │               │       │               │        │
│   │  ┌─────────┐  │       │  ┌─────────┐  │       │  ┌─────────┐  │        │
│   │  │ Patroni │  │       │  │ Patroni │  │       │  │ Patroni │  │        │
│   │  │         │  │       │  │         │  │       │  │         │  │        │
│   │  │ • Health│  │       │  │ • Health│  │       │  │ • Health│  │        │
│   │  │   check │  │       │  │   check │  │       │  │   check │  │        │
│   │  │ • Leader│  │       │  │ • Leader│  │       │  │ • Leader│  │        │
│   │  │   lock  │  │       │  │   lock  │  │       │  │   lock  │  │        │
│   │  └────┬────┘  │       │  └────┬────┘  │       │  └────┬────┘  │        │
│   │       │       │       │       │       │       │       │       │        │
│   │  ┌────▼────┐  │       │  ┌────▼────┐  │       │  ┌────▼────┐  │        │
│   │  │Postgres │  │       │  │Postgres │  │       │  │Postgres │  │        │
│   │  │(PRIMARY)│  │       │  │(REPLICA)│  │       │  │(REPLICA)│  │        │
│   │  └─────────┘  │       │  └─────────┘  │       │  └─────────┘  │        │
│   └───────────────┘       └───────────────┘       └───────────────┘        │
│         │                       ▲                       ▲                   │
│         └───────────────────────┴───────────────────────┘                   │
│                    Streaming Replication                                    │
│                                                                              │
│   Failover Process:                                                         │
│   1. Primary fails → Patroni loses heartbeat                               │
│   2. etcd releases leader lock                                             │
│   3. Replicas compete for leader lock                                      │
│   4. Winner promotes to primary                                            │
│   5. Other replicas reconfigure to follow new primary                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Connection Routing with HAProxy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CONNECTION ROUTING                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                        ┌────────────────────┐                               │
│                        │   Applications     │                               │
│                        └─────────┬──────────┘                               │
│                                  │                                          │
│                                  ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                          HAProxy                                     │  │
│   │                                                                      │  │
│   │   ┌─────────────────────┐    ┌─────────────────────┐                │  │
│   │   │  Port 5432          │    │  Port 5433          │                │  │
│   │   │  (writes)           │    │  (reads)            │                │  │
│   │   │                     │    │                     │                │  │
│   │   │  Backend:           │    │  Backend:           │                │  │
│   │   │  postgres-primary   │    │  postgres-replicas  │                │  │
│   │   │                     │    │  (round-robin)      │                │  │
│   │   └─────────────────────┘    └─────────────────────┘                │  │
│   │                                                                      │  │
│   │   Health Check: GET /master or /replica from Patroni REST API       │  │
│   │                                                                      │  │
│   └───────────────────────────────┬─────────────────────────────────────┘  │
│                                   │                                         │
│           ┌───────────────────────┼───────────────────────┐                │
│           │                       │                       │                │
│           ▼                       ▼                       ▼                │
│   ┌───────────────┐       ┌───────────────┐       ┌───────────────┐       │
│   │  Node 1       │       │  Node 2       │       │  Node 3       │       │
│   │  (PRIMARY)    │       │  (REPLICA)    │       │  (REPLICA)    │       │
│   │               │       │               │       │               │       │
│   │  Patroni REST │       │  Patroni REST │       │  Patroni REST │       │
│   │  :8008        │       │  :8008        │       │  :8008        │       │
│   │               │       │               │       │               │       │
│   │  /master→200  │       │  /master→503  │       │  /master→503  │       │
│   │  /replica→503 │       │  /replica→200 │       │  /replica→200 │       │
│   └───────────────┘       └───────────────┘       └───────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Logical Replication / CDC

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  LOGICAL REPLICATION / CDC                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PUBLISHER (Source)                                                        │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │                                                                     │   │
│   │   Transaction: INSERT INTO orders (user_id, amount) VALUES (1, 99) │   │
│   │                        │                                            │   │
│   │                        ▼                                            │   │
│   │   ┌─────────────────────────────────────────────────────────────┐  │   │
│   │   │                    WAL                                       │  │   │
│   │   │   Binary record of INSERT                                   │  │   │
│   │   └─────────────────────────────────────────────────────────────┘  │   │
│   │                        │                                            │   │
│   │                        ▼                                            │   │
│   │   ┌─────────────────────────────────────────────────────────────┐  │   │
│   │   │              Logical Decoding                                │  │   │
│   │   │                                                              │  │   │
│   │   │   • Replication Slot tracks consumer position               │  │   │
│   │   │   • Publication defines what tables to stream               │  │   │
│   │   │   • Output plugin formats the changes                       │  │   │
│   │   │                                                              │  │   │
│   │   │   Output: {op: INSERT, table: orders, data: {user_id: 1}}   │  │   │
│   │   └─────────────────────────────────────────────────────────────┘  │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────┬───────────────────────────┘   │
│                                             │                               │
│              ┌──────────────────────────────┼──────────────────────────┐    │
│              │                              │                          │    │
│              ▼                              ▼                          ▼    │
│   ┌──────────────────┐         ┌──────────────────┐         ┌─────────────┐│
│   │ Another Postgres │         │      Kafka       │         │  Supabase   ││
│   │   (Subscriber)   │         │   (via Debezium) │         │  Realtime   ││
│   │                  │         │                  │         │             ││
│   │ CREATE           │         │ Topic:           │         │ WebSocket   ││
│   │ SUBSCRIPTION ... │         │ dbserver.orders  │         │ to clients  ││
│   └──────────────────┘         └──────────────────┘         └─────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

