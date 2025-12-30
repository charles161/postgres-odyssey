# How PostgreSQL Stores & Retrieves Data

> **The Big Question**: "Everyone says Postgres is fast. But... why? What's actually happening under the hood?"

---

## The Journey

We're about to answer the most fundamental questions about PostgreSQL:

- **"Where does my data actually live?"** → You'll see the exact bytes on disk
- **"Why is reading one row sometimes instant, sometimes slow?"** → You'll understand the memory hierarchy
- **"Why does adding an index make my query 1000x faster?"** → You'll do the math yourself
- **"If power goes off mid-transaction, is my data gone?"** → You'll trace exactly what survives

By the end, PostgreSQL won't be magic anymore. It'll be engineering.

---

## Part 1: Where Does Your Data Live?

> **The Question**: "I inserted a row. Where did it go?"

### The 8KB Page: PostgreSQL's Atomic Unit

Everything in PostgreSQL revolves around one magic number: **8,192 bytes** (8KB).

When you INSERT a row, PostgreSQL doesn't write just that row. It reads and writes in PAGES - always 8KB at a time.

Think of it like a bookshelf:
- You don't move individual books
- You move entire shelves (pages)  
- Each shelf holds multiple books (rows)

```
┌─────────────────────────────────────────────────────────────────┐
│                        ONE PAGE (8KB)                           │
├─────────────────────────────────────────────────────────────────┤
│ HEADER (24 bytes)                                               │
│ "I'm page #42, last modified at LSN 0/15A3B2C0"                │
├─────────────────────────────────────────────────────────────────┤
│ POINTERS: [→row1] [→row2] [→row3] [→row4] ...                  │
│ (grow DOWN from top)                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    FREE SPACE                                   │
│              (room for more rows)                               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ ROW 4: {id: 4, email: "dave@..." }                             │
│ ROW 3: {id: 3, email: "carol@..." }                            │
│ ROW 2: {id: 2, email: "bob@..." }                              │
│ ROW 1: {id: 1, email: "alice@..." }                            │
│ (grow UP from bottom)                                           │
└─────────────────────────────────────────────────────────────────┘

⚡ KEY INSIGHT: Pointers grow DOWN, rows grow UP.
   They meet in the middle. When they meet, page is FULL.
```

**🤔 Question to ponder**: If PostgreSQL always reads 8KB at a time, what happens when you need just one 100-byte row?

*Answer: It still reads the entire 8KB page. That row shares the page with ~80 neighbors. This is why sequential scans aren't as wasteful as you'd think - you're amortizing the I/O cost across many rows.*

---

### The Tuple: Your Row's Secret Life

> **The Question**: "What does my row ACTUALLY look like in memory?"

Your row isn't just your data. It's carrying hidden baggage.

**You think you stored this (~50 bytes):**
```
id: 1  │  email: "alice@example.com"  │  balance: 100.00
```

**PostgreSQL actually stored this (~73 bytes):**
```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER (23+ bytes)                           │ YOUR DATA        │
├──────────────────────────────────────────────┼──────────────────┤
│ t_xmin: 1847293                              │ id: 1            │
│ "I was born in transaction 1,847,293"        │                  │
│                                              │ email:           │
│ t_xmax: 0                                    │ "alice@..."      │
│ "I'm still alive (not deleted)"             │                  │
│                                              │ balance:         │
│ t_ctid: (42, 5)                             │ 100.00           │
│ "I live on page 42, slot 5"                 │                  │
└──────────────────────────────────────────────┴──────────────────┘

⚡ KEY INSIGHT: ~30% overhead on small rows! This is the price of MVCC.
```

**🤔 Question to ponder**: Why does every row need a "birth certificate" (t_xmin) and "death certificate" (t_xmax)?

*Answer: MVCC! When you UPDATE a row, PostgreSQL doesn't overwrite it. It creates a NEW version and marks the old one as dead. Other transactions might still need to see the old version.*

---

### The Heap: A Pile, Not a Line

> **The Question**: "Are my rows stored in order? Like row 1, then row 2, then row 3?"

Nope. Welcome to the heap.

**WHAT YOU EXPECT:**
```
Page 0: rows 1-50 (in order)
Page 1: rows 51-100 (in order)
Page 2: rows 101-150 (in order)
...nice and tidy...
```

**WHAT ACTUALLY HAPPENS AFTER UPDATES:**
```
Page 0: [row 1] [row 47] [DEAD] [row 3] [DEAD] [row 201] ...
Page 1: [DEAD] [DEAD] [row 52] [row 7] [row 189] ...
Page 2: [row 101] [DEAD] [row 2] [DEAD] [row 150] ...
```

**WHY?**
- UPDATE creates a NEW row version wherever there's space
- DELETE just marks rows as dead, doesn't remove them
- INSERT goes wherever there's free space
- It's a "heap" - a pile of stuff, not an ordered list

⚡ **KEY INSIGHT**: This is why ORDER BY requires sorting. The data isn't stored in any particular order. This is also why indexes exist!

**🤔 Question to ponder**: If rows are scattered randomly across pages, how does PostgreSQL find a specific row quickly?

*Answer: Indexes! An index is like a sorted table of contents that says "row with id=42 is at page 7, slot 3." Without an index, PostgreSQL must scan every page.*

---

### The ctid: A Row's Home Address

> **The Question**: "What's ctid and why do I see it in weird queries?"

```sql
SELECT ctid, id, email FROM users LIMIT 10;
```

| ctid   | id | What it means                      |
|--------|----|------------------------------------|
| (0, 1) | 1  | Page 0, Slot 1                     |
| (0, 2) | 2  | Page 0, Slot 2                     |
| (0,50) | 50 | Page 0, Slot 50 ← Page 0 is FULL   |
| (1, 1) | 51 | Page 1, Slot 1 ← New page started! |

**NOW UPDATE ROW 1:**
```sql
UPDATE users SET email = 'newalice@example.com' WHERE id = 1;
SELECT ctid, id FROM users WHERE id = 1;
-- Result: (5, 12) -- Row MOVED to page 5, slot 12!
```

The old (0, 1) location now has a DEAD tuple. The new version was placed wherever there was space.

⚡ **KEY INSIGHT**: ctid changes on UPDATE! Indexes must be updated too. This is "write amplification."

**🤔 Question to ponder**: If every UPDATE changes ctid, and every index stores ctid, what happens to indexes when you update a row?

*Answer: All indexes pointing to that row must be updated with the new ctid. A table with 5 indexes means 1 UPDATE = 6 writes (1 heap + 5 indexes). More indexes = slower writes.*

---

## Part 2: Why Is PostgreSQL Fast (When It Is)?

> **The Question**: "OK, so data is on disk. But disk is slow. How is PostgreSQL ever fast?"

### The Memory Hierarchy: Where Speed Lives

Your query travels through layers. Each layer is ~10-100x slower than the one above.

```
┌─────────────────────────────────────────────────────────────────┐
│  CPU Cache (L1/L2/L3)                                           │
│  Latency: ~1-10 nanoseconds                                     │
└──────────────────────────────┬──────────────────────────────────┘
                               │ miss
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  shared_buffers (PostgreSQL's cache)                            │
│  Latency: ~100 nanoseconds                                      │
│                                                                 │
│  🎯 "Is page 42 already cached?"                                │
│     → YES: Return instantly (BUFFER HIT)                        │
│     → NO:  Go fetch from disk... (BUFFER MISS)                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │ miss
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  OS Page Cache                                                  │
│  Latency: ~1 microsecond                                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │ miss
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  SSD: Latency ~100 microseconds (0.1 ms)                        │
│  HDD: Latency ~10,000 microseconds (10 ms)                      │
│                                                                 │
│  🐌 10ms = 10,000,000 nanoseconds                               │
│     That's 10 MILLION times slower than CPU cache.             │
└─────────────────────────────────────────────────────────────────┘
```

**THE INSIGHT:**
PostgreSQL is "fast" when your working set fits in shared_buffers. If every query hits disk, PostgreSQL is just as slow as anything.

| Buffer Hit Ratio | Status              |
|------------------|---------------------|
| 99.2%            | You're doing GREAT  |
| 85%              | Getting concerning  |
| 50%              | You're in trouble   |

**🤔 Question to ponder**: If shared_buffers is so important, should I set it to use ALL my RAM?

*Answer: No! The OS also caches data (page cache). PostgreSQL recommends ~25% of RAM for shared_buffers. The OS uses the rest. Both layers working together, not fighting.*

---

### The Math: Why Indexes Are Magic

> **The Question**: "My query went from 30 seconds to 1 millisecond after adding an index. What happened?"

**Table:** users (1 million rows, ~100 bytes per row)
**Query:** `SELECT * FROM users WHERE id = 500000`

#### SCENARIO A: NO INDEX (Sequential Scan)

PostgreSQL's thinking: "I don't know where id=500000 is. It could be anywhere. I have to check EVERY. SINGLE. ROW."

```
Data size:     1,000,000 rows × 100 bytes = 100 MB
Pages to read: 100 MB ÷ 8 KB = 12,500 pages

┌────────────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                   Scanning ALL 12,500 pages...                 │
│   Time: 12,500 pages × 0.1ms per page = 1.25 SECONDS           │
└────────────────────────────────────────────────────────────────┘
```

#### SCENARIO B: WITH INDEX (Index Scan)

PostgreSQL's thinking: "Let me check my index. It's a B-tree, so I can binary search. For 1 million rows, tree height is ~3 levels."

```
Step 1: Read root page       → 1 page
Step 2: Read branch page     → 1 page  
Step 3: Read leaf page       → 1 page (found: page 7234, slot 23)
Step 4: Read heap page 7234  → 1 page (got the actual row!)

┌────────────────────────────────────────────────────────────────┐
│ ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ Just 4 pages!                                                   │
│   Time: 4 pages × 0.1ms per page = 0.4 MILLISECONDS            │
└────────────────────────────────────────────────────────────────┘
```

**SPEEDUP: 1,250ms → 0.4ms = 3,125x faster**

⚡ This is not magic. This is MATH. B-tree gives you O(log n) instead of O(n).

**🤔 Question to ponder**: If indexes are so great, why not create an index on every column?

*Answer: Every index must be updated on every INSERT/UPDATE/DELETE. 5 indexes = 6 writes for each modification. Indexes speed up reads but slow down writes. Choose wisely.*

---

## Part 3: What Happens When Power Goes Off?

> **The Question**: "I ran UPDATE and saw 'COMMIT OK'. Then the power went out. Is my data gone?"

### The Write Path

**STEP 1: You run UPDATE ... COMMIT**
- The new balance is written to shared_buffers (RAM)
- The page is marked DIRTY (RAM version ≠ disk version)
- RAM: [Page 42: balance = $200] ← new value
- Disk: [Page 42: balance = $100] ← old value still!

**STEP 2: Write to WAL (Write-Ahead Log)**
- "Transaction 305: Changed page 42, offset 123, from X to Y"
- This is a SEQUENTIAL write to a separate file
- Sequential writes are FAST

**STEP 3: FSYNC the WAL ⭐ THE CRITICAL MOMENT**
- PostgreSQL calls fsync(), which tells the OS:
- "I don't care about your caches. Write to PHYSICAL DISK."
- 🎯 ONLY NOW does PostgreSQL return "COMMIT OK"

**STEP 4: You see "COMMIT OK"**
At this moment:
- WAL on disk: ✅ Has the change record
- Table on disk: ❌ Still has OLD data!
- RAM: ✅ Has new data (dirty page)

**STEP 5: Checkpoint (later, asynchronously)**
- Eventually, background processes write dirty pages to disk
- NOW the table file has the new data

### Crash Scenarios

| Crash Point | What Happens |
|-------------|--------------|
| Before FSYNC (Step 1-2) | Transaction was never committed. You never saw "COMMIT OK". On restart: Rolled back. THIS IS CORRECT. |
| After FSYNC (Step 3+) | WAL is on disk. It survived. On restart: PostgreSQL REPLAYS the WAL. Your data is SAFE! ✅ |

**THE GUARANTEE:** If you saw "COMMIT OK", your data WILL survive a crash.

**🤔 Question to ponder**: Why does PostgreSQL write to WAL first, then update table files later? Seems backwards!

*Answer: WAL writes are SEQUENTIAL (fast). Table updates are RANDOM (slow). By writing WAL first, commits are fast. Actual table updates happen in background when convenient. If crash happens, WAL can reconstruct everything.*

---

## Summary: Key Mental Models

| Concept | What to Remember |
|---------|------------------|
| **THE PAGE (8KB)** | PostgreSQL's atom. Everything is read/written in 8KB chunks. Even for 1 tiny row, a full page is touched. |
| **THE TUPLE** | Your row carries ~23 bytes of overhead (xmin, xmax, ctid). This enables MVCC but adds overhead. |
| **THE HEAP** | Data is stored wherever there's space. Not sorted. Updates create new versions in random locations. |
| **THE MEMORY HIERARCHY** | shared_buffers hit = ~100ns. Disk read = ~100,000ns. 1000x difference! Buffer hit ratio is key. |
| **THE INDEX MATH** | No index = O(n). With index = O(log n). For 1M rows: 12,500 pages vs 4 pages. Math, not magic. |
| **THE WAL** | Changes go to WAL FIRST, table files LATER. If you saw "COMMIT OK", WAL has it, you're safe. |

---

## Try It Yourself

```sql
-- See the page size
SHOW block_size;  -- Returns 8192

-- See where rows live (ctid = page, slot)
SELECT ctid, id, email FROM users LIMIT 20;

-- Update a row and watch ctid change!
UPDATE users SET email = 'new@example.com' WHERE id = 1;
SELECT ctid, id FROM users WHERE id = 1;  -- Different ctid!

-- Check your buffer hit ratio
SELECT 
  sum(blks_hit) * 100.0 / nullif(sum(blks_hit + blks_read), 0) as hit_ratio
FROM pg_stat_database
WHERE datname = current_database();
-- Want this above 99%!

-- See actual page contents (advanced)
CREATE EXTENSION IF NOT EXISTS pageinspect;
SELECT lp, t_xmin, t_xmax, t_ctid 
FROM heap_page_items(get_raw_page('users', 0)) 
LIMIT 5;
```

---

## What's Next?

**NOW YOU KNOW:**
- ✓ How data is physically stored (pages, tuples, heap)
- ✓ Why RAM makes PostgreSQL fast (memory hierarchy)
- ✓ Why indexes are 1000x faster (the math)
- ✓ How crashes don't lose your data (WAL)

**NEXT UP: The Memory Hierarchy (Deep Dive)**
- How to configure shared_buffers
- What "working set" means
- Why more RAM helps (until it doesn't)
