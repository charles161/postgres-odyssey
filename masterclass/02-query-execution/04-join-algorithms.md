# Join Algorithms: Nested Loop, Hash, Merge

> **The Question**: "Why is my JOIN slow? Which join type should PostgreSQL use?"

---

## Visual 1: Join Strategy Colosseum

```
┌─────────────────────────────────────────────────────────────────────────┐
│  JOIN STRATEGY SHOWDOWN                                                  │
│  ══════════════════════                                                  │
│                                                                          │
│  Query: SELECT * FROM orders o JOIN users u ON o.user_id = u.id         │
│                                                                          │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐               │
│  │ NESTED LOOP    │ │ HASH JOIN      │ │ MERGE JOIN     │               │
│  │ ════════════   │ │ ══════════     │ │ ═══════════    │               │
│  │                │ │                │ │                │               │
│  │  for each row  │ │  build hash    │ │  sort both     │               │
│  │    in outer:   │ │  on smaller    │ │    then        │               │
│  │    scan inner  │ │  probe with    │ │    zipper      │               │
│  │                │ │  larger        │ │    merge       │               │
│  │                │ │                │ │                │               │
│  │ Best when:     │ │ Best when:     │ │ Best when:     │               │
│  │ • Small outer  │ │ • No index     │ │ • Pre-sorted   │               │
│  │ • Index inner  │ │ • Fits memory  │ │ • Large both   │               │
│  │                │ │ • Equality     │ │ • Equality     │               │
│  └────────────────┘ └────────────────┘ └────────────────┘               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Nested Loop Join

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NESTED LOOP JOIN                                                        │
│  ════════════════                                                        │
│                                                                          │
│  for each row in orders:          ← Outer loop                          │
│      for each row in users:       ← Inner loop                          │
│          if orders.user_id = users.id:                                  │
│              emit joined row                                             │
│                                                                          │
│  COMPLEXITY: O(n × m)                                                   │
│                                                                          │
│  orders (1000 rows)    users (100 rows)                                 │
│  ┌─────────────────┐   ┌─────────────────┐                              │
│  │ order 1 ────────┼──▶│ scan all 100    │  = 100 comparisons          │
│  │ order 2 ────────┼──▶│ scan all 100    │  = 100 comparisons          │
│  │ order 3 ────────┼──▶│ scan all 100    │  = 100 comparisons          │
│  │ ...             │   │ ...             │                              │
│  │ order 1000 ─────┼──▶│ scan all 100    │  = 100 comparisons          │
│  └─────────────────┘   └─────────────────┘                              │
│                                                                          │
│  Total: 1000 × 100 = 100,000 comparisons!                               │
│                                                                          │
│  WITH INDEX on users.id:                                                 │
│  ┌─────────────────┐   ┌─────────────────┐                              │
│  │ order 1 ────────┼──▶│ index lookup    │  = 3 comparisons (B-tree)   │
│  │ order 2 ────────┼──▶│ index lookup    │  = 3 comparisons            │
│  │ ...             │   │ ...             │                              │
│  │ order 1000 ─────┼──▶│ index lookup    │  = 3 comparisons            │
│  └─────────────────┘   └─────────────────┘                              │
│                                                                          │
│  Total: 1000 × 3 = 3,000 comparisons!  (33x faster)                     │
│                                                                          │
│  BEST FOR:                                                               │
│  • Small outer table                                                     │
│  • Index exists on inner table's join column                            │
│  • Non-equality joins (<, >, LIKE)                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: Hash Join

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HASH JOIN                                                               │
│  ═════════                                                               │
│                                                                          │
│  Phase 1: BUILD hash table on smaller table                             │
│  ─────────────────────────────────────────                               │
│                                                                          │
│  users (100 rows)           Hash Table                                  │
│  ┌─────────────────┐        ┌─────────────────┐                         │
│  │ id=1, Alice     │ ──────▶│ hash(1) → Alice │                         │
│  │ id=2, Bob       │ ──────▶│ hash(2) → Bob   │                         │
│  │ id=3, Carol     │ ──────▶│ hash(3) → Carol │                         │
│  │ ...             │        │ ...             │                         │
│  └─────────────────┘        └─────────────────┘                         │
│                             (built in memory)                           │
│                                                                          │
│  Phase 2: PROBE with larger table                                       │
│  ──────────────────────────────────                                      │
│                                                                          │
│  orders (1000 rows)         Hash Table                                  │
│  ┌─────────────────┐        ┌─────────────────┐                         │
│  │ user_id=1 ──────┼───────▶│ hash(1) → Alice │ ✓ MATCH!               │
│  │ user_id=2 ──────┼───────▶│ hash(2) → Bob   │ ✓ MATCH!               │
│  │ user_id=1 ──────┼───────▶│ hash(1) → Alice │ ✓ MATCH!               │
│  │ ...             │        │ ...             │                         │
│  └─────────────────┘        └─────────────────┘                         │
│                                                                          │
│  COMPLEXITY: O(n + m)  (build + probe, each row once)                   │
│                                                                          │
│  BEST FOR:                                                               │
│  • No useful index exists                                                │
│  • Smaller table fits in work_mem                                       │
│  • Equality joins only (=)                                               │
│                                                                          │
│  WATCH OUT:                                                              │
│  • If hash table doesn't fit in work_mem → spills to disk → SLOW       │
│  • Increase work_mem for big joins                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: Merge Join

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MERGE JOIN                                                              │
│  ══════════                                                              │
│                                                                          │
│  REQUIREMENT: Both inputs must be SORTED on join key                    │
│                                                                          │
│  Phase 1: Sort both tables (or use existing index order)                │
│  ──────────────────────────────────────────────────────                  │
│                                                                          │
│  users (sorted by id)       orders (sorted by user_id)                  │
│  ┌─────────────────┐        ┌─────────────────┐                         │
│  │ id=1, Alice     │        │ user_id=1       │                         │
│  │ id=2, Bob       │        │ user_id=1       │                         │
│  │ id=3, Carol     │        │ user_id=2       │                         │
│  │ id=4, Dave      │        │ user_id=3       │                         │
│  │ ...             │        │ user_id=3       │                         │
│  └─────────────────┘        └─────────────────┘                         │
│                                                                          │
│  Phase 2: Zipper merge (like merging sorted arrays)                     │
│  ──────────────────────────────────────────────────                      │
│                                                                          │
│  ┌─────┐                    ┌─────┐                                     │
│  │ 1 ◄─┼────────────────────┼─► 1 │  MATCH! Emit (Alice, order)        │
│  │     │                    │   1 │  MATCH! Emit (Alice, order)        │
│  │ 2 ◄─┼────────────────────┼─► 2 │  MATCH! Emit (Bob, order)          │
│  │ 3 ◄─┼────────────────────┼─► 3 │  MATCH! Emit (Carol, order)        │
│  │     │                    │   3 │  MATCH! Emit (Carol, order)        │
│  │ 4   │                    │     │  No more orders, done.              │
│  └─────┘                    └─────┘                                     │
│                                                                          │
│  COMPLEXITY: O(n log n + m log m) for sorting, O(n + m) for merge       │
│                                                                          │
│  BEST FOR:                                                               │
│  • Both tables are already sorted (index scan)                          │
│  • Very large tables (sorting pays off)                                 │
│  • Equality joins                                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
