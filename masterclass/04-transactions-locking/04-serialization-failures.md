# Serialization Failures and Retries

> **The Question**: "Why did my transaction fail with 'could not serialize access'?"

---

## Visual 1: Serialization Failures Explained

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SERIALIZATION FAILURE: "These transactions can't both succeed"          │
│  ═══════════════════════════════════════════════════════════════         │
│                                                                          │
│  At SERIALIZABLE isolation level, PostgreSQL guarantees:                │
│  "The result is the same as if transactions ran one after another."    │
│                                                                          │
│  But sometimes, that's IMPOSSIBLE with concurrent execution.            │
│  When PostgreSQL detects this, it aborts one transaction.               │
│                                                                          │
│  ERROR MESSAGE:                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  ERROR: could not serialize access due to read/write           │     │
│  │         dependencies among transactions                        │     │
│  │  DETAIL: Reason code: Canceled on identification as a pivot,  │     │
│  │          during write.                                         │     │
│  │  HINT: The transaction might succeed if retried.              │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  THIS IS NOT A BUG. This is PostgreSQL protecting your data!           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Why It Happens

```
┌─────────────────────────────────────────────────────────────────────────┐
│  EXAMPLE: The Counter Problem                                            │
│  ════════════════════════════                                            │
│                                                                          │
│  Table: counters (name TEXT, value INT)                                 │
│  Initial: ('likes', 100)                                                │
│                                                                          │
│  Two users "like" at the same time:                                     │
│                                                                          │
│  ┌──────────────────────────┐  ┌──────────────────────────┐             │
│  │ Transaction 1            │  │ Transaction 2            │             │
│  │                          │  │                          │             │
│  │ BEGIN SERIALIZABLE       │  │ BEGIN SERIALIZABLE       │             │
│  │                          │  │                          │             │
│  │ SELECT value             │  │ SELECT value             │             │
│  │ FROM counters            │  │ FROM counters            │             │
│  │ WHERE name = 'likes';    │  │ WHERE name = 'likes';    │             │
│  │ -- Returns: 100          │  │ -- Returns: 100          │             │
│  │                          │  │                          │             │
│  │ UPDATE counters          │  │ UPDATE counters          │             │
│  │ SET value = 101          │  │ SET value = 101          │             │
│  │ WHERE name = 'likes';    │  │ WHERE name = 'likes';    │             │
│  │                          │  │                          │             │
│  │ COMMIT ✓                 │  │ COMMIT                   │             │
│  │                          │  │ 💥 serialization failure │             │
│  └──────────────────────────┘  └──────────────────────────┘             │
│                                                                          │
│  WHY: If both succeeded, value would be 101.                            │
│       But serially: T1→T2 would give 102. T2→T1 would give 102.        │
│       101 is impossible in any serial order!                            │
│                                                                          │
│  PostgreSQL detects this and aborts T2.                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: The Retry Pattern

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE RETRY PATTERN: Handling Serialization Failures                      │
│  ══════════════════════════════════════════════════                      │
│                                                                          │
│  Serialization failures are EXPECTED. Your code MUST handle them.       │
│                                                                          │
│  PYTHON EXAMPLE:                                                         │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  import psycopg2                                                │     │
│  │  from psycopg2 import errors                                    │     │
│  │                                                                 │     │
│  │  MAX_RETRIES = 3                                                │     │
│  │                                                                 │     │
│  │  def increment_likes():                                         │     │
│  │      for attempt in range(MAX_RETRIES):                         │     │
│  │          try:                                                   │     │
│  │              with conn.cursor() as cur:                         │     │
│  │                  cur.execute("BEGIN ISOLATION LEVEL SERIALIZABLE")│   │
│  │                  cur.execute("SELECT value FROM counters ...")  │     │
│  │                  value = cur.fetchone()[0]                      │     │
│  │                  cur.execute("UPDATE counters SET value = %s",  │     │
│  │                              (value + 1,))                      │     │
│  │                  conn.commit()                                  │     │
│  │                  return  # Success!                             │     │
│  │          except errors.SerializationFailure:                    │     │
│  │              conn.rollback()                                    │     │
│  │              time.sleep(random.uniform(0.01, 0.1))  # Backoff   │     │
│  │              continue  # Retry                                  │     │
│  │      raise Exception("Failed after max retries")                │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  KEY POINTS:                                                             │
│  • Catch SerializationFailure specifically                              │
│  • Rollback and retry the ENTIRE transaction                            │
│  • Add random backoff to avoid thundering herd                          │
│  • Limit retries to prevent infinite loops                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: When to Use SERIALIZABLE

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SHOULD YOU USE SERIALIZABLE?                                            │
│  ════════════════════════════                                            │
│                                                                          │
│  SERIALIZABLE is POWERFUL but has COSTS:                                │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  PROS:                                                          │     │
│  │  ✓ Strongest guarantee - no anomalies possible                 │     │
│  │  ✓ Simplifies application logic                                │     │
│  │  ✓ Correctness by default                                      │     │
│  │                                                                 │     │
│  │  CONS:                                                          │     │
│  │  ✗ Higher abort rate under contention                          │     │
│  │  ✗ Application MUST implement retry logic                      │     │
│  │  ✗ More memory usage (tracking dependencies)                   │     │
│  │  ✗ Slightly more CPU overhead                                  │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ALTERNATIVES FOR THE COUNTER PROBLEM:                                  │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  -- Atomic increment (no SELECT needed, no race condition):    │     │
│  │  UPDATE counters SET value = value + 1 WHERE name = 'likes';   │     │
│  │                                                                 │     │
│  │  -- SELECT FOR UPDATE (explicit locking):                      │     │
│  │  SELECT value FROM counters WHERE name = 'likes' FOR UPDATE;   │     │
│  │  -- Now this transaction has exclusive lock, others wait       │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  RULE OF THUMB:                                                          │
│  • Most apps: READ COMMITTED + careful query design                     │
│  • Financial/critical: SERIALIZABLE + retry logic                       │
│  • High contention: Consider explicit locking instead                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
