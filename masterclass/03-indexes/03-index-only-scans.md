# Index-Only Scans and Covering Indexes

> **The Question**: "Why does adding columns to my index make queries faster?"

---

## Visual 1: Regular Index Scan vs Index-Only Scan

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REGULAR INDEX SCAN (the double-read problem)                           │
│  ════════════════════════════════════════════                            │
│                                                                          │
│  Query: SELECT email, name FROM users WHERE email = 'alice@example.com' │
│  Index: CREATE INDEX idx_email ON users(email);                         │
│                                                                          │
│  STEP 1: Search Index                                                    │
│  ┌─────────────────────────────────┐                                    │
│  │  idx_email (B-tree)             │                                    │
│  │  ┌─────────────────────────┐    │                                    │
│  │  │ 'alice@example.com' ────┼────┼──▶ ctid = (42, 5)                 │
│  │  └─────────────────────────┘    │                                    │
│  └─────────────────────────────────┘                                    │
│                                                                          │
│  STEP 2: Go to Heap (table) to get 'name' column                        │
│  ┌─────────────────────────────────┐                                    │
│  │  users table (heap)             │                                    │
│  │  Page 42:                       │                                    │
│  │  ┌─────────────────────────┐    │                                    │
│  │  │ Tuple 5:                │    │                                    │
│  │  │ email='alice@...'       │    │                                    │
│  │  │ name='Alice Smith'  ◄───┼────┼── We needed to come here!         │
│  │  └─────────────────────────┘    │                                    │
│  └─────────────────────────────────┘                                    │
│                                                                          │
│  PROBLEM: We read from TWO places (index + heap) = 2 random I/Os       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Index-Only Scan

```
┌─────────────────────────────────────────────────────────────────────────┐
│  INDEX-ONLY SCAN (the zero-heap solution)                                │
│  ═════════════════════════════════════════                               │
│                                                                          │
│  Query: SELECT email, name FROM users WHERE email = 'alice@example.com' │
│  Index: CREATE INDEX idx_email_name ON users(email, name);  ← COVERING  │
│                                                                          │
│  STEP 1: Search Index (all data is here!)                               │
│  ┌─────────────────────────────────────────────────┐                    │
│  │  idx_email_name (B-tree)                        │                    │
│  │  ┌───────────────────────────────────────────┐  │                    │
│  │  │ 'alice@example.com' │ 'Alice Smith' │ ctid│  │                    │
│  │  └───────────────────────────────────────────┘  │                    │
│  │              ↑                ↑                  │                    │
│  │          email             name                  │                    │
│  │                                                  │                    │
│  │  ALL COLUMNS NEEDED ARE IN THE INDEX!           │                    │
│  │  No need to visit heap at all!                   │                    │
│  └─────────────────────────────────────────────────┘                    │
│                                                                          │
│  RESULT: Only 1 read (index only) instead of 2 reads (index + heap)    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: INCLUDE for Covering Indexes (PostgreSQL 11+)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  INCLUDE: The Best of Both Worlds                                        │
│  ═════════════════════════════════                                       │
│                                                                          │
│  Problem with CREATE INDEX ON users(email, name):                       │
│  • The index is sorted by (email, name)                                 │
│  • 'name' is in the B-tree structure (affects sort, size, splits)      │
│  • But we only search by email!                                         │
│                                                                          │
│  Solution: INCLUDE clause                                                │
│                                                                          │
│  CREATE INDEX idx_email_covering ON users(email) INCLUDE (name);        │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                                                                  │    │
│  │  B-tree structure:          Leaf payload:                       │    │
│  │  ┌───────────────┐          ┌───────────────────────────┐       │    │
│  │  │ email (key)   │ ──────── │ email │ name (included) │ ctid │  │    │
│  │  └───────────────┘          └───────────────────────────┘       │    │
│  │         ↑                              ↑                         │    │
│  │    B-tree sorted              Just stored, not sorted           │    │
│  │    by this column             Not used for searches             │    │
│  │                               Only for index-only scans         │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Benefits:                                                               │
│  ✓ Smaller index (name not in B-tree nodes, only in leaves)            │
│  ✓ Fewer page splits (less data in tree structure)                     │
│  ✓ Still enables index-only scans on name                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: The Visibility Map Requirement

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE CATCH: Visibility Map                                               │
│  ═════════════════════════                                               │
│                                                                          │
│  Index-only scans have a secret requirement!                            │
│                                                                          │
│  Remember MVCC: Old versions exist. The index points to a ctid,         │
│  but is that tuple VISIBLE to this transaction?                         │
│                                                                          │
│  PostgreSQL uses the VISIBILITY MAP to answer:                          │
│  "Is every tuple on this page visible to everyone?"                     │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  VISIBILITY MAP (vm file)                                       │     │
│  │  One bit per heap page                                          │     │
│  │                                                                  │     │
│  │  Page 0: 1  (all-visible, can use index-only)                   │     │
│  │  Page 1: 1  (all-visible, can use index-only)                   │     │
│  │  Page 2: 0  (has invisible tuples, MUST check heap!)            │     │
│  │  Page 3: 1  (all-visible, can use index-only)                   │     │
│  │  ...                                                             │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  If the VM bit is 0, PostgreSQL must visit the heap page anyway!       │
│                                                                          │
│  When is VM bit = 0?                                                     │
│  • Recent UPDATEs or DELETEs on that page                               │
│  • VACUUM hasn't run yet to clean dead tuples                           │
│                                                                          │
│  FIX: Run VACUUM to clean pages and set VM bits                         │
│                                                                          │
│  EXPLAIN output shows:                                                   │
│  • "Heap Fetches: 0" ← True index-only scan, all pages visible         │
│  • "Heap Fetches: 5000" ← Had to check 5000 tuples in heap             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
