# Section 3.2: How Many Indexes Can a Query Touch?

> **The Question**: "Does PostgreSQL use one index or multiple? How does it decide?"

---

## Visual 1: Single Index (Most Common)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  INDEX SELECTION: HOW POSTGRESQL CHOOSES                                 │
│  ═══════════════════════════════════════                                 │
│                                                                          │
│  SHORT ANSWER: Usually ONE index per table, but sometimes more.         │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│  SCENARIO 1: SINGLE INDEX (Most Common)                                 │
│  ──────────────────────────────────────                                  │
│                                                                          │
│  Query: SELECT * FROM users WHERE email = 'alice@test.com';             │
│  Index: idx_users_email (email)                                         │
│                                                                          │
│  Plan:                                                                   │
│  Index Scan using idx_users_email on users                              │
│    Index Cond: (email = 'alice@test.com')                               │
│                                                                          │
│  PostgreSQL uses ONE index. Simple.                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Multiple Conditions, One Index

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SCENARIO 2: MULTIPLE CONDITIONS, ONE INDEX                             │
│  ──────────────────────────────────────────                              │
│                                                                          │
│  Query: SELECT * FROM users WHERE email = 'alice@test.com' AND age > 25;│
│  Indexes: idx_users_email (email), idx_users_age (age)                  │
│                                                                          │
│  PostgreSQL has a choice:                                               │
│  • Use idx_users_email, then filter age in heap                         │
│  • Use idx_users_age, then filter email in heap                         │
│  • Use BOTH indexes and combine results (Bitmap scan)                   │
│                                                                          │
│  Usually: It picks the MORE SELECTIVE index.                            │
│  If email='alice@test.com' matches 1 row, but age>25 matches 500K rows, │
│  it will use email index and filter age afterward.                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: Bitmap Index Scan (Multiple Indexes!)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SCENARIO 3: BITMAP INDEX SCAN (Combining Multiple Indexes!)            │
│  ────────────────────────────────────────────────────────────            │
│                                                                          │
│  Query: SELECT * FROM orders                                            │
│         WHERE status = 'pending'                                         │
│         AND created_at > '2024-01-01';                                  │
│                                                                          │
│  Indexes: idx_orders_status (status), idx_orders_created (created_at)   │
│                                                                          │
│  If both conditions are moderately selective, PostgreSQL can:           │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                                                                   │    │
│  │  Step 1: Scan idx_orders_status                                  │    │
│  │          Find all pages containing status='pending'              │    │
│  │          Create BITMAP A: [page 1, page 5, page 8, page 12...]   │    │
│  │                                                                   │    │
│  │  Step 2: Scan idx_orders_created                                 │    │
│  │          Find all pages containing created_at > '2024-01-01'     │    │
│  │          Create BITMAP B: [page 3, page 5, page 8, page 15...]   │    │
│  │                                                                   │    │
│  │  Step 3: BITMAP AND                                              │    │
│  │          Combine bitmaps: A ∩ B = [page 5, page 8]               │    │
│  │                                                                   │    │
│  │  Step 4: Fetch only pages 5 and 8 from heap                      │    │
│  │          Filter rows that match BOTH conditions                  │    │
│  │                                                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  This is called a BITMAP AND scan. Uses MULTIPLE indexes!              │
│                                                                          │
│  EXPLAIN output:                                                         │
│  Bitmap Heap Scan on orders                                             │
│    Recheck Cond: ((status = 'pending') AND (created_at > '2024-01-01')) │
│    -> BitmapAnd                                                         │
│         -> Bitmap Index Scan on idx_orders_status                       │
│              Index Cond: (status = 'pending')                           │
│         -> Bitmap Index Scan on idx_orders_created                      │
│              Index Cond: (created_at > '2024-01-01')                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: OR Conditions (Bitmap OR)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SCENARIO 4: OR CONDITIONS (Bitmap OR)                                  │
│  ──────────────────────────────────────                                  │
│                                                                          │
│  Query: SELECT * FROM users WHERE email = 'a@test.com' OR id = 123;     │
│  Indexes: idx_users_email (email), users_pkey (id)                      │
│                                                                          │
│  EXPLAIN output:                                                         │
│  Bitmap Heap Scan on users                                              │
│    -> BitmapOr                                                          │
│         -> Bitmap Index Scan on idx_users_email                         │
│              Index Cond: (email = 'a@test.com')                         │
│         -> Bitmap Index Scan on users_pkey                              │
│              Index Cond: (id = 123)                                     │
│                                                                          │
│  Both indexes scanned, results combined with OR logic.                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 5: The Rule

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE RULE:                                                               │
│                                                                          │
│  • Per table: Usually 1 index, sometimes 2-3 via Bitmap scans           │
│  • Across tables: Each table can use its own index                      │
│  • Too many indexes: Slows down writes, wastes space                    │
│  • Missing index: Sequential scan (disaster on large tables)            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
