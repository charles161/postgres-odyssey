# Replication Internals: WAL Streaming

> **The Question**: "How does data actually get from primary to replica?"

---

## Visual 1: WAL Streaming Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WAL STREAMING ARCHITECTURE                                              │
│  ══════════════════════════                                              │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                         PRIMARY                                 │     │
│  │                                                                 │     │
│  │   ┌─────────┐    ┌─────────────────────────────────────────┐   │     │
│  │   │ Client  │───▶│         Shared Buffers                   │   │     │
│  │   │ Query   │    │  ┌──────┐ ┌──────┐ ┌──────┐             │   │     │
│  │   └─────────┘    │  │ Page │ │ Page │ │ Page │             │   │     │
│  │                  │  │ dirty│ │ dirty│ │clean │             │   │     │
│  │                  │  └──────┘ └──────┘ └──────┘             │   │     │
│  │                  └───────────────┬─────────────────────────┘   │     │
│  │                                  │                              │     │
│  │                                  ▼                              │     │
│  │                         ┌──────────────┐                       │     │
│  │                         │   WAL Buffer │                       │     │
│  │                         │  ┌─────────┐ │                       │     │
│  │                         │  │ Changes │ │                       │     │
│  │                         │  └─────────┘ │                       │     │
│  │                         └───────┬──────┘                       │     │
│  │                                 │                               │     │
│  │                    ┌────────────┴────────────┐                 │     │
│  │                    │                         │                 │     │
│  │                    ▼                         ▼                 │     │
│  │         ┌────────────────┐        ┌─────────────────┐         │     │
│  │         │   WAL Files    │        │  WAL Sender     │         │     │
│  │         │   (pg_wal/)    │        │  Process        │         │     │
│  │         └────────────────┘        └────────┬────────┘         │     │
│  │                                            │                   │     │
│  └────────────────────────────────────────────┼───────────────────┘     │
│                                               │                          │
│                          TCP Connection       │  (streaming WAL)        │
│                                               │                          │
│  ┌────────────────────────────────────────────┼───────────────────┐     │
│  │                         REPLICA            ▼                    │     │
│  │                                  ┌─────────────────┐           │     │
│  │                                  │  WAL Receiver   │           │     │
│  │                                  │  Process        │           │     │
│  │                                  └────────┬────────┘           │     │
│  │                                           │                    │     │
│  │                                           ▼                    │     │
│  │                                  ┌─────────────────┐           │     │
│  │                                  │  Startup Process│           │     │
│  │                                  │  (apply WAL)    │           │     │
│  │                                  └────────┬────────┘           │     │
│  │                                           │                    │     │
│  │                                           ▼                    │     │
│  │                                  ┌─────────────────┐           │     │
│  │                                  │  Data Files     │           │     │
│  │                                  │  (identical!)   │           │     │
│  │                                  └─────────────────┘           │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: What's in the WAL?

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHAT'S IN THE WAL STREAM?                                               │
│  ═════════════════════════                                               │
│                                                                          │
│  WAL contains PHYSICAL changes to data files:                           │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  WAL Record:                                                    │     │
│  │  ┌────────────────────────────────────────────────────────────┐│     │
│  │  │ LSN: 0/16B4D28                                             ││     │
│  │  │ Type: HEAP_INSERT                                          ││     │
│  │  │ Transaction: 12345                                         ││     │
│  │  │ Relation: 16384 (users table)                              ││     │
│  │  │ Block: 1234                                                 ││     │
│  │  │ Offset: 5                                                   ││     │
│  │  │ Data: [binary tuple data]                                  ││     │
│  │  └────────────────────────────────────────────────────────────┘│     │
│  │                                                                 │     │
│  │  WAL Record:                                                    │     │
│  │  ┌────────────────────────────────────────────────────────────┐│     │
│  │  │ LSN: 0/16B4D90                                             ││     │
│  │  │ Type: BTREE_INSERT                                         ││     │
│  │  │ Transaction: 12345                                         ││     │
│  │  │ Relation: 16400 (idx_users_email)                          ││     │
│  │  │ Block: 56                                                   ││     │
│  │  │ Data: [index entry data]                                   ││     │
│  │  └────────────────────────────────────────────────────────────┘│     │
│  │                                                                 │     │
│  │  WAL Record:                                                    │     │
│  │  ┌────────────────────────────────────────────────────────────┐│     │
│  │  │ LSN: 0/16B4E00                                             ││     │
│  │  │ Type: XACT_COMMIT                                          ││     │
│  │  │ Transaction: 12345                                         ││     │
│  │  │ Timestamp: 2024-01-15 10:30:00.123                         ││     │
│  │  └────────────────────────────────────────────────────────────┘│     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  The replica applies these EXACT changes to its files.                  │
│  Result: Byte-for-byte identical databases!                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: Synchronous vs Asynchronous

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SYNCHRONOUS vs ASYNCHRONOUS REPLICATION                                 │
│  ═══════════════════════════════════════                                 │
│                                                                          │
│  ASYNCHRONOUS (default):                                                 │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Client ──▶ Primary ──▶ Write to WAL ──▶ ACK to Client         │     │
│  │                              │                                  │     │
│  │                              └──▶ Stream to Replica (later)    │     │
│  │                                                                 │     │
│  │  • Fast: Client doesn't wait for replica                       │     │
│  │  • Risk: If primary dies, some committed data may be lost     │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  SYNCHRONOUS:                                                            │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Client ──▶ Primary ──▶ Write to WAL ──▶ Send to Replica       │     │
│  │                                                │                │     │
│  │                                                ▼                │     │
│  │                                         Replica receives       │     │
│  │                                                │                │     │
│  │                                                ▼                │     │
│  │                              Primary ◄── Replica ACKs          │     │
│  │                                   │                             │     │
│  │                                   ▼                             │     │
│  │                          ACK to Client                          │     │
│  │                                                                 │     │
│  │  • Slower: Client waits for replica confirmation               │     │
│  │  • Safe: No data loss if primary dies (replica has it)        │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  synchronous_commit levels:                                              │
│  • off: Don't even wait for local WAL flush (fast, risky)              │
│  • local: Wait for local WAL only (default)                             │
│  • remote_write: Wait for replica to receive (OS buffer)               │
│  • remote_apply: Wait for replica to apply changes                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: Replication Slots

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REPLICATION SLOTS: Preventing WAL Loss                                  │
│  ══════════════════════════════════════                                  │
│                                                                          │
│  PROBLEM: What if replica falls behind?                                 │
│                                                                          │
│  Without replication slot:                                               │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Primary WAL: [seg1] [seg2] [seg3] [seg4] [seg5]               │     │
│  │                 ↓                                               │     │
│  │               DELETED (old segments recycled)                   │     │
│  │                                                                 │     │
│  │  Replica position: needs seg2                                  │     │
│  │                                                                 │     │
│  │  💥 FATAL: requested WAL segment has already been removed      │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  With replication slot:                                                  │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Slot "replica1" tracks: "replica needs seg2"                  │     │
│  │                                                                 │     │
│  │  Primary WAL: [seg1] [seg2] [seg3] [seg4] [seg5]               │     │
│  │                        ↑                                        │     │
│  │                     RETAINED (slot prevents deletion)          │     │
│  │                                                                 │     │
│  │  ⚠️  DANGER: If replica is down for days, WAL piles up!        │     │
│  │      Disk fills up. Primary stops accepting writes.            │     │
│  │                                                                 │     │
│  │  MONITOR: pg_replication_slots, pg_stat_replication            │     │
│  │  Set: max_slot_wal_keep_size to limit retained WAL             │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
