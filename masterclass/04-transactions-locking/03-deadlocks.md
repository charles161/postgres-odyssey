# Deadlocks: Detection and Prevention

> **The Question**: "Why did my transaction fail with 'deadlock detected'?"

---

## Visual 1: What Is a Deadlock?

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DEADLOCK: The Deadly Embrace                                            │
│  ════════════════════════════                                            │
│                                                                          │
│  Two transactions, each holding a lock the other needs.                 │
│  Neither can proceed. Both wait forever.                                │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │        Transaction 1                 Transaction 2                │   │
│  │        ┌───────────┐                 ┌───────────┐                │   │
│  │        │           │                 │           │                │   │
│  │        │  HOLDING  │────── waits ───▶│  HOLDING  │                │   │
│  │        │  Lock A   │◀───── for ──────│  Lock B   │                │   │
│  │        │           │                 │           │                │   │
│  │        │  WAITING  │                 │  WAITING  │                │   │
│  │        │  for B    │                 │  for A    │                │   │
│  │        │           │                 │           │                │   │
│  │        └───────────┘                 └───────────┘                │   │
│  │                                                                   │   │
│  │              ╲                           ╱                        │   │
│  │               ╲                         ╱                         │   │
│  │                ╲       DEADLOCK        ╱                          │   │
│  │                 ╲         ⚠️          ╱                           │   │
│  │                  ╲                   ╱                            │   │
│  │                   ╲                 ╱                             │   │
│  │                    ╲_______________╱                              │   │
│  │                                                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Deadlock Timeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DEADLOCK IN ACTION: Timeline                                            │
│  ═════════════════════════════                                           │
│                                                                          │
│  Table: accounts (id, balance)                                          │
│                                                                          │
│  ┌──────────────────────────┐  ┌──────────────────────────┐             │
│  │ Transaction 1            │  │ Transaction 2            │             │
│  │                          │  │                          │             │
│  │ T=0: BEGIN               │  │ T=0: BEGIN               │             │
│  │                          │  │                          │             │
│  │ T=1: UPDATE accounts     │  │                          │             │
│  │      SET balance = 100   │  │                          │             │
│  │      WHERE id = 1;       │  │                          │             │
│  │      -- LOCK on row 1 ✓  │  │                          │             │
│  │                          │  │                          │             │
│  │                          │  │ T=2: UPDATE accounts     │             │
│  │                          │  │      SET balance = 200   │             │
│  │                          │  │      WHERE id = 2;       │             │
│  │                          │  │      -- LOCK on row 2 ✓  │             │
│  │                          │  │                          │             │
│  │ T=3: UPDATE accounts     │  │                          │             │
│  │      SET balance = 150   │  │                          │             │
│  │      WHERE id = 2;       │  │                          │             │
│  │      -- WAITING for T2's │  │                          │             │
│  │      -- lock on row 2... │  │                          │             │
│  │                          │  │                          │             │
│  │                          │  │ T=4: UPDATE accounts     │             │
│  │                          │  │      SET balance = 250   │             │
│  │                          │  │      WHERE id = 1;       │             │
│  │                          │  │      -- WAITING for T1's │             │
│  │                          │  │      -- lock on row 1... │             │
│  │                          │  │                          │             │
│  │ ⏳ Waiting...            │  │ ⏳ Waiting...            │             │
│  │                          │  │                          │             │
│  │ 💥 ERROR: deadlock       │  │ ✓ (continues now)        │             │
│  │    detected              │  │                          │             │
│  │                          │  │ COMMIT                   │             │
│  └──────────────────────────┘  └──────────────────────────┘             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: PostgreSQL's Deadlock Detection

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HOW POSTGRESQL DETECTS DEADLOCKS                                        │
│  ═════════════════════════════════                                       │
│                                                                          │
│  PostgreSQL runs a deadlock detector periodically.                       │
│                                                                          │
│  deadlock_timeout = 1s (default)                                         │
│                                                                          │
│  DETECTION ALGORITHM:                                                    │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  1. Transaction waits for lock                                  │     │
│  │  2. After 1 second, deadlock detector activates                │     │
│  │  3. Build wait-for graph:                                       │     │
│  │                                                                 │     │
│  │     T1 ──waits──▶ T2 ──waits──▶ T3 ──waits──▶ T1               │     │
│  │                                               ↑                 │     │
│  │                                            CYCLE!               │     │
│  │                                                                 │     │
│  │  4. If cycle found: deadlock!                                   │     │
│  │  5. Choose one transaction to abort (usually the newest)        │     │
│  │  6. Abort chosen transaction, releasing its locks               │     │
│  │  7. Other transactions can proceed                              │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ERROR MESSAGE:                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  ERROR: deadlock detected                                       │     │
│  │  DETAIL: Process 1234 waits for ShareLock on transaction 5678; │     │
│  │          blocked by process 5678.                               │     │
│  │          Process 5678 waits for ShareLock on transaction 1234; │     │
│  │          blocked by process 1234.                               │     │
│  │  HINT: See server log for query details.                       │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: Preventing Deadlocks

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PREVENTING DEADLOCKS: Consistent Lock Ordering                          │
│  ══════════════════════════════════════════════                          │
│                                                                          │
│  THE RULE: Always acquire locks in the same order.                      │
│                                                                          │
│  BAD (causes deadlock):                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────┐             │
│  │ Transaction 1            │  │ Transaction 2            │             │
│  │ LOCK account 1           │  │ LOCK account 2           │             │
│  │ LOCK account 2           │  │ LOCK account 1           │             │
│  │ -- Different order!      │  │ -- Different order!      │             │
│  └──────────────────────────┘  └──────────────────────────┘             │
│                                                                          │
│  GOOD (no deadlock possible):                                            │
│  ┌──────────────────────────┐  ┌──────────────────────────┐             │
│  │ Transaction 1            │  │ Transaction 2            │             │
│  │ LOCK account 1           │  │ LOCK account 1           │             │
│  │ LOCK account 2           │  │ LOCK account 2           │             │
│  │ -- Same order!           │  │ -- Same order!           │             │
│  └──────────────────────────┘  └──────────────────────────┘             │
│                                                                          │
│  PRACTICAL STRATEGIES:                                                   │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  1. SORT BY PRIMARY KEY                                        │     │
│  │     -- For bank transfer between accounts A and B:             │     │
│  │     SELECT ... WHERE id IN (A, B) ORDER BY id FOR UPDATE;      │     │
│  │                                                                 │     │
│  │  2. LOCK PARENT FIRST                                          │     │
│  │     -- Lock order table before order_items                     │     │
│  │                                                                 │     │
│  │  3. USE ADVISORY LOCKS                                         │     │
│  │     SELECT pg_advisory_lock(hashtext('transfer_123_456'));     │     │
│  │     -- Application-level lock on the operation                 │     │
│  │                                                                 │     │
│  │  4. KEEP TRANSACTIONS SHORT                                    │     │
│  │     -- Less time holding locks = less chance of collision      │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
