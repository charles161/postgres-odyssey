# Read Replicas: Why and How

> **The Question**: "My primary is at 90% CPU and most of it is reads. Now what?"

---

## Visual 1: The Read Scaling Problem

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE READ SCALING PROBLEM                                                │
│  ════════════════════════                                                │
│                                                                          │
│  YOUR CURRENT STATE:                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         PRIMARY                                   │    │
│  │                                                                   │    │
│  │   CPU: ████████████████████░░░░ 85%                              │    │
│  │                                                                   │    │
│  │   Breakdown:                                                      │    │
│  │   ├── SELECT queries:  ████████████████ 80%                      │    │
│  │   ├── INSERT/UPDATE:   ██ 10%                                    │    │
│  │   └── System overhead: ██ 10%                                    │    │
│  │                                                                   │    │
│  │   You're doing 10,000 queries/second.                            │    │
│  │   9,000 of them are reads. 1,000 are writes.                     │    │
│  │                                                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  THE INSIGHT:                                                            │
│  Reads are stateless. They don't need the "source of truth."           │
│  They just need a COPY of the truth that's reasonably recent.          │
│                                                                          │
│  Writes MUST go to primary (only one truth).                            │
│  Reads CAN go to replicas (copies are fine).                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: With Read Replicas

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WITH READ REPLICAS:                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                                                                   │    │
│  │            ┌─────────────────────────────────────┐               │    │
│  │            │            PRIMARY                   │               │    │
│  │            │                                      │               │    │
│  │            │  CPU: ████░░░░░░░░░░░░░░░░ 20%      │               │    │
│  │            │  (writes only + WAL generation)     │               │    │
│  │            │                                      │               │    │
│  │            └───────────────┬─────────────────────┘               │    │
│  │                            │                                      │    │
│  │                            │ WAL Stream (all changes)            │    │
│  │                            │                                      │    │
│  │            ┌───────────────┼───────────────┐                     │    │
│  │            │               │               │                     │    │
│  │            ▼               ▼               ▼                     │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │    │
│  │  │  REPLICA 1  │  │  REPLICA 2  │  │  REPLICA 3  │              │    │
│  │  │             │  │             │  │             │              │    │
│  │  │ CPU: ███░░  │  │ CPU: ███░░  │  │ CPU: ███░░  │              │    │
│  │  │ 3,000 q/s   │  │ 3,000 q/s   │  │ 3,000 q/s   │              │    │
│  │  │             │  │             │  │             │              │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │    │
│  │                                                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Load distributed: 9,000 reads ÷ 3 replicas = 3,000 each.               │
│  Primary is now relaxed, handling just writes.                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: Replication Lag - The Tradeoff

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REPLICATION LAG - WHY REPLICAS ARE "EVENTUALLY CONSISTENT"             │
│  ═══════════════════════════════════════════════════════════            │
│                                                                          │
│  THE TIMELINE OF A WRITE:                                                │
│                                                                          │
│  T+0ms:    User clicks "Save"                                           │
│  T+1ms:    Write lands on Primary                                       │
│  T+2ms:    Primary commits, writes to WAL                               │
│  T+3ms:    Primary sends "success" to user                              │
│  T+4ms:    WAL segment streams to replicas (network latency)            │
│  T+10ms:   Replica receives WAL                                         │
│  T+15ms:   Replica applies the change                                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  PRIMARY        ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━▶  │     │
│  │                 │                                               │     │
│  │  REPLICA        ○━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━▶  │     │
│  │                           ↑                                     │     │
│  │                     15ms LAG                                    │     │
│  │                                                                 │     │
│  │  T=0           T=3        T=15                                  │     │
│  │  (write)       (ack)      (replica has it)                      │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: The Read-Your-Own-Writes Problem

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE READ-YOUR-OWN-WRITES PROBLEM:                                      │
│  ─────────────────────────────────                                       │
│                                                                          │
│  T+3ms:  User sees "Saved!" (write confirmed)                           │
│  T+4ms:  User immediately queries their data                            │
│  T+5ms:  Query goes to replica (load balancer's choice)                 │
│  T+6ms:  Replica doesn't have the change yet! (10ms behind)             │
│  User:   "WHERE'S MY DATA?!"                                            │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│  SOLUTIONS:                                                              │
│                                                                          │
│  1. STICKY SESSIONS (Route user to primary after write)                 │
│     Pro: Simple. Guaranteed consistency.                                │
│     Con: Defeats the purpose if user keeps writing.                     │
│                                                                          │
│  2. TIMESTAMP-BASED ROUTING                                              │
│     App knows "last write was at T+3ms"                                 │
│     Query includes "read from replica only if caught up to T+3ms"       │
│     Pro: Precise. Scales.                                               │
│     Con: Complex. Needs infrastructure support.                         │
│                                                                          │
│  3. SYNCHRONOUS REPLICATION                                              │
│     Primary waits for replica to confirm WAL receipt before ACK.        │
│     Pro: Strong consistency.                                            │
│     Con: Write latency = Primary + Network + Replica. Much slower.      │
│                                                                          │
│  4. APPLICATION-LEVEL HANDLING                                           │
│     For critical reads (just after write): Go to primary.               │
│     For everything else: Go to replica.                                 │
│     Pro: Pragmatic. Works.                                              │
│     Con: App complexity. Easy to forget.                                │
│                                                                          │
│  THERE IS NO FREE LUNCH.                                                │
│  Scaling reads means accepting some lag, or paying for sync replication.│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
