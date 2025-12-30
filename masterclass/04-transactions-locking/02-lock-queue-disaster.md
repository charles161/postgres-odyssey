# The Lock Queue Disaster

> **The Question**: "Why did one ALTER TABLE freeze my entire database?"

---

## Visual 1: Why One Bad Transaction Kills Your Whole Database

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHY ONE BAD TRANSACTION KILLS YOUR WHOLE DATABASE                       │
│  ═════════════════════════════════════════════════                       │
│                                                                          │
│  SCENARIO: Friday 5pm. Production.                                      │
│                                                                          │
│  Developer runs: ALTER TABLE users ADD COLUMN new_field TEXT;           │
│  "It'll just take a second..."                                          │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  WHAT ACTUALLY HAPPENS:                                          │    │
│  │                                                                   │    │
│  │  T+0ms:   ALTER TABLE requests AccessExclusiveLock on users      │    │
│  │           (This is the STRONGEST lock. Blocks EVERYTHING.)       │    │
│  │                                                                   │    │
│  │  T+1ms:   But there's an open transaction from the analytics job │    │
│  │           holding an AccessShareLock (just reading)              │    │
│  │           ALTER TABLE must WAIT for it to finish.                │    │
│  │                                                                   │    │
│  │  T+2ms:   New requests arrive:                                   │    │
│  │           - SELECT from users (needs AccessShareLock)            │    │
│  │           - INSERT into users (needs RowExclusiveLock)           │    │
│  │           - UPDATE users (needs RowExclusiveLock)                │    │
│  │                                                                   │    │
│  │  T+3ms:   These new requests see ALTER TABLE waiting.            │    │
│  │           THEY MUST WAIT BEHIND THE ALTER TABLE.                 │    │
│  │           Lock queue forms:                                       │    │
│  │           [Analytics Read] → [ALTER TABLE] → [SELECT] → [INSERT] │    │
│  │                                                                   │    │
│  │  T+10s:   1000 queries waiting in the queue.                     │    │
│  │           All connections exhausted.                              │    │
│  │           Application starts timing out.                          │    │
│  │           Users see 500 errors.                                   │    │
│  │                                                                   │    │
│  │  T+30s:   Analytics job finally finishes.                        │    │
│  │           ALTER TABLE runs (takes 50ms).                         │    │
│  │           Lock queue drains.                                      │    │
│  │           But damage is done - 30 seconds of downtime.           │    │
│  │                                                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: The Lock Queue Visualization

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE LOCK QUEUE VISUALIZATION:                                          │
│                                                                          │
│     Holds Lock          Waiting for Lock                                 │
│         │                     │                                          │
│         ▼                     ▼                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Analytics   │─▶│ ALTER TABLE │─▶│   SELECT    │─▶│   INSERT    │    │
│  │ (reading)   │  │ (waiting)   │  │ (waiting)   │  │ (waiting)   │    │
│  │             │  │             │  │             │  │             │    │
│  │ Lock:       │  │ Needs:      │  │ Needs:      │  │ Needs:      │    │
│  │ AccessShare │  │ Access      │  │ AccessShare │  │ RowExclusive│    │
│  │             │  │ Exclusive   │  │             │  │             │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                                          │
│  The ALTER TABLE is BLOCKING reads even though it hasn't started yet!  │
│  This is because PostgreSQL's lock queue is FIFO (fair, but deadly).   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: The Solution

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE SOLUTION: LOCK TIMEOUT                                              │
│  ══════════════════════════                                              │
│                                                                          │
│  SET lock_timeout = '3s';  -- Give up after 3 seconds                   │
│  ALTER TABLE users ADD COLUMN new_field TEXT;                           │
│                                                                          │
│  Now: ALTER TABLE tries for 3 seconds.                                  │
│       If it can't get the lock, it FAILS instead of waiting forever.   │
│       Your application continues working.                               │
│       You retry the ALTER during low-traffic window.                    │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│  BETTER SOLUTION: CREATE INDEX CONCURRENTLY                             │
│  ───────────────────────────────────────────                             │
│                                                                          │
│  For index creation (the most common lock offender):                    │
│  CREATE INDEX CONCURRENTLY idx_users_email ON users(email);             │
│                                                                          │
│  This takes much longer, but doesn't block reads/writes.                │
│  It uses a special two-phase approach to avoid AccessExclusiveLock.    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
