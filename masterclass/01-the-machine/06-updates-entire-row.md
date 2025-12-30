# Section: Do Updates Update Single Column or Entire Row?

> **The Question**: "When I UPDATE one column, does PostgreSQL rewrite just that column or the entire row?"

---

## Visual 1: The PostgreSQL Update Truth

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE POSTGRESQL UPDATE TRUTH: ENTIRE ROW IS REWRITTEN                   │
│  ════════════════════════════════════════════════════                    │
│                                                                          │
│  Query: UPDATE users SET age = 31 WHERE id = 123;                       │
│                                                                          │
│  You changed ONE column (age).                                          │
│  PostgreSQL writes an ENTIRE NEW ROW.                                   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  BEFORE UPDATE:                                                   │    │
│  │                                                                   │    │
│  │  Page 42:                                                         │    │
│  │  ┌────────────────────────────────────────────────────────────┐  │    │
│  │  │ Tuple 1: {id:123, name:'Alice', email:'a@t.com', age:30,   │  │    │
│  │  │           bio:'Long text...', created_at:..., ...}         │  │    │
│  │  │          xmin: 1000, xmax: 0 (ALIVE)                       │  │    │
│  │  └────────────────────────────────────────────────────────────┘  │    │
│  │                                                                   │    │
│  │  AFTER UPDATE:                                                    │    │
│  │                                                                   │    │
│  │  Page 42:                                                         │    │
│  │  ┌────────────────────────────────────────────────────────────┐  │    │
│  │  │ Tuple 1: {id:123, name:'Alice', email:'a@t.com', age:30,   │  │    │
│  │  │           bio:'Long text...', created_at:..., ...}         │  │    │
│  │  │          xmin: 1000, xmax: 2000 (DEAD!)                    │  │    │
│  │  │          ctid → points to new tuple                        │  │    │
│  │  │                                                            │  │    │
│  │  │ Tuple 5: {id:123, name:'Alice', email:'a@t.com', age:31,   │  │    │
│  │  │           bio:'Long text...', created_at:..., ...}         │  │    │
│  │  │          xmin: 2000, xmax: 0 (NEW VERSION!)                │  │    │
│  │  └────────────────────────────────────────────────────────────┘  │    │
│  │                                                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  The ENTIRE row (all 10 columns) is copied, even though only           │
│  age changed from 30 to 31.                                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Why? MVCC Requires Full Row Copies

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHY? MVCC REQUIRES FULL ROW COPIES                                     │
│  ──────────────────────────────────                                      │
│                                                                          │
│  Remember: MVCC = Multi-Version Concurrency Control.                    │
│                                                                          │
│  When you update, other transactions might still be reading the OLD    │
│  version. PostgreSQL can't modify in place because:                     │
│                                                                          │
│  1. Transaction A starts, sees row with age=30                          │
│  2. Transaction B updates age to 31                                     │
│  3. Transaction A still running - should see age=30!                    │
│                                                                          │
│  Both versions must exist simultaneously.                               │
│  Hence: Create new version, mark old as dead.                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: The Implications

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE IMPLICATIONS:                                                       │
│                                                                          │
│  1. WIDE ROWS = EXPENSIVE UPDATES                                       │
│     ─────────────────────────────                                        │
│     Row with 100 columns, 4KB total size.                               │
│     Update 1 column = write 4KB new tuple.                              │
│     Update 1 column = update ALL indexes that include any column!       │
│                                                                          │
│  2. UPDATE-HEAVY TABLES BLOAT FAST                                      │
│     ─────────────────────────────────                                    │
│     Each update = dead tuple + new tuple.                               │
│     High update rate = lots of dead tuples = bloat.                     │
│     Vacuum must keep up.                                                 │
│                                                                          │
│  3. COUNTER PATTERNS ARE EXPENSIVE                                      │
│     ───────────────────────────────                                      │
│     UPDATE posts SET view_count = view_count + 1 WHERE id = 123;        │
│     Every page view = full row rewrite!                                 │
│     Better: Use Redis for counters, batch update PostgreSQL.            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: The Exception - HOT Updates

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE EXCEPTION: HOT UPDATES (Heap-Only Tuple)                           │
│  ────────────────────────────────────────────                            │
│                                                                          │
│  IF these conditions are met:                                            │
│  • The new tuple fits on the SAME page as the old tuple                 │
│  • NO indexed columns changed                                            │
│  • Page has free space                                                   │
│                                                                          │
│  Then PostgreSQL can do a HOT update:                                   │
│  • Still writes new tuple (MVCC requires it)                            │
│  • But DOESN'T update indexes! (huge win)                               │
│  • Index still points to old tuple, which chains to new tuple           │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  HOT UPDATE (age is not indexed):                                │    │
│  │                                                                   │    │
│  │  Index entry: id=123 → (page 42, tuple 1)                        │    │
│  │                              ↓                                    │    │
│  │  Page 42:                    ↓                                    │    │
│  │  ┌───────────────────────────↓────────────────────────────────┐  │    │
│  │  │ Tuple 1: age=30, xmax=2000                                 │  │    │
│  │  │          ctid → Tuple 5 (chain to new version)             │  │    │
│  │  │                    ↓                                       │  │    │
│  │  │ Tuple 5: age=31, xmin=2000 ← FOUND via chain!              │  │    │
│  │  └────────────────────────────────────────────────────────────┘  │    │
│  │                                                                   │    │
│  │  Index NOT updated (only 1 index entry for both versions)        │    │
│  │                                                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  HOT updates are a HUGE performance optimization.                       │
│  But they require: fillfactor < 100, no indexed column changes.        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 5: Design Implications

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DESIGN IMPLICATIONS:                                                   │
│                                                                          │
│  1. Keep frequently-updated columns SEPARATE from static columns        │
│     (Consider: users table + users_stats table)                        │
│                                                                          │
│  2. Don't index columns that change often                               │
│     (Allows HOT updates)                                                 │
│                                                                          │
│  3. Use fillfactor < 100 for update-heavy tables                        │
│     CREATE TABLE users (...) WITH (fillfactor = 80);                    │
│     (Leaves room for HOT updates on same page)                          │
│                                                                          │
│  4. Batch counter updates                                                │
│     Instead of: UPDATE ... SET count = count + 1 (per event)            │
│     Do: UPDATE ... SET count = count + 100 (per batch)                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
