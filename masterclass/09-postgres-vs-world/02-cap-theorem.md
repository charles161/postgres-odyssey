# CAP Theorem in Practice

> **The Question**: "What does CAP theorem actually mean for my database choice?"

---

## Visual 1: CAP Theorem Explained

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CAP THEOREM: You Can Only Pick Two                                     │
│  ══════════════════════════════════                                      │
│                                                                          │
│                           CONSISTENCY                                    │
│                               ▲                                          │
│                              ╱ ╲                                         │
│                             ╱   ╲                                        │
│                            ╱     ╲                                       │
│                           ╱       ╲                                      │
│                          ╱ CP      ╲                                     │
│                         ╱  Systems  ╲                                    │
│                        ╱             ╲                                   │
│                       ╱               ╲                                  │
│                      ╱                 ╲                                 │
│                     ╱                   ╲                                │
│     AVAILABILITY ◄─────────────────────────▶ PARTITION TOLERANCE         │
│                        AP Systems                                        │
│                                                                          │
│  DEFINITIONS:                                                            │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  C - CONSISTENCY                                               │     │
│  │      Every read returns the most recent write.                 │     │
│  │      All nodes see the same data at the same time.            │     │
│  │                                                                 │     │
│  │  A - AVAILABILITY                                               │     │
│  │      Every request receives a response (not an error).        │     │
│  │      The system always answers, even if data might be stale.  │     │
│  │                                                                 │     │
│  │  P - PARTITION TOLERANCE                                       │     │
│  │      System continues despite network failures between nodes.  │     │
│  │      (In distributed systems, this is non-negotiable!)        │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: The Partition Scenario

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHEN PARTITION HAPPENS: The Choice                                     │
│  ═══════════════════════════════════                                     │
│                                                                          │
│  Normal operation: User writes $100 to account                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Node A ◄────── synced ──────▶ Node B                          │     │
│  │  balance = $100                balance = $100                   │     │
│  │                                                                 │     │
│  │  Everyone agrees. No problem.                                  │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  NETWORK PARTITION: Nodes can't communicate!                            │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Node A          ✗ BROKEN ✗           Node B                   │     │
│  │  balance = $100  ══════════════════   balance = $100           │     │
│  │                                                                 │     │
│  │  User wants to write $200 to Node A. What do we do?           │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  CHOICE 1 (CP - Consistency): Reject the write                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  "I can't verify Node B agrees. Write rejected."              │     │
│  │  ✓ Data is always consistent                                   │     │
│  │  ✗ System is unavailable during partition                     │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  CHOICE 2 (AP - Availability): Accept the write                        │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  "I'll take the write now. We'll sync later."                 │     │
│  │                                                                 │     │
│  │  Node A: balance = $200                                        │     │
│  │  Node B: balance = $100 (stale! doesn't know about update)   │     │
│  │                                                                 │     │
│  │  ✓ System stays available                                      │     │
│  │  ✗ Data is inconsistent until partition heals                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: Where Databases Sit

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHERE DATABASES SIT ON CAP                                              │
│  ══════════════════════════                                              │
│                                                                          │
│  CP SYSTEMS (Consistency + Partition Tolerance):                        │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  • PostgreSQL (single primary)                                 │     │
│  │  • MySQL (with sync replication)                               │     │
│  │  • MongoDB (with write concern: majority)                      │     │
│  │  • Consul, etcd, ZooKeeper                                     │     │
│  │  • Spanner, CockroachDB                                         │     │
│  │                                                                 │     │
│  │  "If I can't guarantee consistency, I'll return an error."    │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  AP SYSTEMS (Availability + Partition Tolerance):                       │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  • Cassandra                                                    │     │
│  │  • DynamoDB (default settings)                                 │     │
│  │  • Riak                                                         │     │
│  │  • CouchDB                                                      │     │
│  │                                                                 │     │
│  │  "I'll always respond, but data might be stale."              │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  CA SYSTEMS (Consistency + Availability):                               │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  • Single-node PostgreSQL                                       │     │
│  │  • Single-node MySQL                                            │     │
│  │  • SQLite                                                       │     │
│  │                                                                 │     │
│  │  (No partition to tolerate - it's one machine!)               │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: Eventual Consistency

```
┌─────────────────────────────────────────────────────────────────────────┐
│  EVENTUAL CONSISTENCY: The AP Compromise                                 │
│  ═══════════════════════════════════════                                 │
│                                                                          │
│  AP systems use "eventual consistency":                                 │
│  "If no new updates, all replicas will eventually converge."          │
│                                                                          │
│  TIMELINE:                                                               │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  T=0:  Write arrives at Node A                                 │     │
│  │        Node A: X=5    Node B: X=?    Node C: X=?              │     │
│  │                                                                 │     │
│  │  T=1:  Async replication starts                                │     │
│  │        Node A: X=5    Node B: X=5    Node C: X=?              │     │
│  │                                                                 │     │
│  │  T=2:  Replication completes                                   │     │
│  │        Node A: X=5    Node B: X=5    Node C: X=5              │     │
│  │                                                                 │     │
│  │  Between T=0 and T=2: Reading from B or C gives STALE data!  │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  WHEN EVENTUAL IS OK:                                                    │
│  • Social media likes (off by a few is fine)                           │
│  • Product view counts (approximate is acceptable)                     │
│  • Session data (worst case: user logs in again)                       │
│  • Cache invalidation (stale for a few seconds is OK)                  │
│                                                                          │
│  WHEN EVENTUAL IS NOT OK:                                               │
│  • Bank balances (overdrafts!)                                          │
│  • Inventory counts (overselling!)                                      │
│  • Booking systems (double-booking!)                                    │
│  • Anything with money or legal consequences                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
