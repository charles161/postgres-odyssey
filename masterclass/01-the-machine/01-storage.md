# 1.1 How PostgreSQL Stores Data

> **The Question**: "What actually happens on disk when I store data in PostgreSQL?"

---

## Overview

This section reveals the physical structure of PostgreSQL storage. By the end, users will understand:

- Why PostgreSQL reads/writes in 8KB chunks (pages)
- How rows are physically stored (tuples)
- Why tables are called "heaps"
- What ctid means and why it matters

---

## Visual Components

### Visual 1: The Big Picture (Hero Animation)

**Type**: Animated diagram, reveals on scroll

**Description**: Show the journey from SQL to disk

```
[VISUAL: Animated flow on scroll]

YOUR SQL QUERY
    |
    v
+-------------------+
|  PostgreSQL       |
|  Backend Process  |
+-------------------+
    |
    v
+-------------------+
| Shared Buffers    |  <-- Memory (RAM)
| (Page Cache)      |
+-------------------+
    |
    | Read/Write 8KB pages
    v
+-------------------+
| Disk              |  <-- Storage
| (Heap Files)      |
+-------------------+

ANIMATION:
1. Query enters from top
2. Highlights shared buffers (cache check)
3. If miss, arrow goes to disk
4. 8KB page floats up to shared buffers
5. Data extracted from page
```

**Interactive**: None (pure animation on scroll)

---

### Visual 2: The Page Structure

**Type**: Interactive diagram with zoom capability

**Description**: Detailed anatomy of an 8KB page

```
[VISUAL: Page Anatomy - Click to Expand Each Section]

+------------------------------------------------------------------+
|                         PAGE (8 KB)                               |
+------------------------------------------------------------------+
|  PAGE HEADER (24 bytes)                                           |
|  +--------------------------------------------------------------+ |
|  | pd_lsn: 0/15A3B2C0     | Last WAL position that modified    | |
|  | pd_checksum: 0x3F2A    | Data integrity check                | |
|  | pd_flags: 0            | Page status flags                   | |
|  | pd_lower: 152          | Offset to start of free space      | |
|  | pd_upper: 7840         | Offset to end of free space        | |
|  | pd_special: 8192       | Offset to special space            | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
|  LINE POINTERS (Item IDs) - 4 bytes each                         |
|  +--------+--------+--------+--------+--------+                   |
|  |  lp_1  |  lp_2  |  lp_3  |  lp_4  |  ...   |                   |
|  | ->7840 | ->7720 | ->7600 | ->7480 |        |                   |
|  +--------+--------+--------+--------+--------+                   |
|           |                                                       |
|           | Points to tuple locations (offsets from page start)   |
+------------------------------------------------------------------+
|                                                                   |
|                       FREE SPACE                                  |
|            (pd_upper - pd_lower = available bytes)                |
|                                                                   |
+------------------------------------------------------------------+
|  TUPLES (grow from bottom UP)                                     |
|  +--------------------------------------------------------------+ |
|  | Tuple 4: {id: 4, name: "Product D", price: 75.00}           | |
|  | Tuple 3: {id: 3, name: "Product C", price: 50.00}           | |
|  | Tuple 2: {id: 2, name: "Product B", price: 25.00}           | |
|  | Tuple 1: {id: 1, name: "Product A", price: 99.99}           | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+

KEY INSIGHT:
- Line pointers grow DOWN (from top)
- Tuples grow UP (from bottom)
- They meet in the middle (free space shrinks)
- This allows stable addressing (line pointer 1 always points to "row 1")
```

**Interactive Features**:
- Click on PAGE HEADER to expand and see each field explained
- Click on a LINE POINTER to highlight which tuple it points to
- Click on a TUPLE to see its internal structure (leads to Visual 3)
- Hover shows byte offsets in real-time

---

### Visual 3: The Tuple Structure

**Type**: Expandable detail view (triggered from Visual 2)

**Description**: Internal structure of a single tuple (row)

```
[VISUAL: Tuple Internals - Expanded View]

+------------------------------------------------------------------+
|                           TUPLE                                   |
+------------------------------------------------------------------+
|  TUPLE HEADER (23 bytes minimum)                                  |
|  +--------------------------------------------------------------+ |
|  | t_xmin (4 bytes)    | 1847293                                | |
|  |                     | Transaction ID that CREATED this tuple | |
|  |                     | "I was born in transaction 1847293"    | |
|  +---------------------+----------------------------------------+ |
|  | t_xmax (4 bytes)    | 0                                      | |
|  |                     | Transaction ID that DELETED this tuple | |
|  |                     | 0 = "I'm still alive!"                 | |
|  +---------------------+----------------------------------------+ |
|  | t_cid (4 bytes)     | 0                                      | |
|  |                     | Command ID within transaction          | |
|  +---------------------+----------------------------------------+ |
|  | t_ctid (6 bytes)    | (42, 5)                                | |
|  |                     | Current Tuple ID: (page 42, item 5)    | |
|  |                     | Points to self, or to newer version    | |
|  +---------------------+----------------------------------------+ |
|  | t_infomask (2 bytes)| Status flags (HASNULL, XMIN_COMMITTED) | |
|  +---------------------+----------------------------------------+ |
|  | t_infomask2 (2 bytes)| Number of columns + more flags        | |
|  +---------------------+----------------------------------------+ |
|  | t_hoff (1 byte)     | 24 - Offset where data starts          | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
|  NULL BITMAP (optional)                                           |
|  Present if any column can be NULL. 1 bit per column.            |
+------------------------------------------------------------------+
|  USER DATA                                                        |
|  +--------------------------------------------------------------+ |
|  | id (int4):     00 00 00 05           | 4 bytes               | |
|  | name (text):   05 41 6C 69 63 65     | length + "Alice"      | |
|  | email (text):  [TOAST pointer]        | Stored externally     | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+

THE KEY INSIGHT:
Every row carries its own "birth certificate" (t_xmin) and 
"death certificate" (t_xmax). This is the foundation of MVCC.
```

**Interactive Features**:
- Hover over t_xmin/t_xmax to see tooltip explaining MVCC
- Click "See TOAST" if external storage is referenced
- Toggle between "Pretty View" and "Hex View" for raw bytes

---

### Visual 4: The Heap File

**Type**: Scrollable visualization

**Description**: How multiple pages form a table

```
[VISUAL: Heap File Structure]

TABLE: users (1 million rows)

FILE ON DISK: data/base/16384/16385

+--------+--------+--------+--------+--------+--------+     +--------+
| Page 0 | Page 1 | Page 2 | Page 3 | Page 4 | Page 5 | ... | Page N |
+--------+--------+--------+--------+--------+--------+     +--------+
|        |        |        |        |        |        |     |        |
| Rows   | Rows   | Rows   | Rows   | Rows   | Rows   |     | Rows   |
| 1-50   | 51-100 | 101-150| 151-200| 201-250| 251-300|     | ...    |
|        |        |        |        |        |        |     |        |
+--------+--------+--------+--------+--------+--------+     +--------+

IMPORTANT NOTES:
1. Rows are NOT necessarily in order after updates!
2. Updates may place new version on ANY page with free space
3. Each file segment is max 1GB (16385, 16385.1, 16385.2, ...)

WHY "HEAP"?
- Data is dumped in a "heap" - no guaranteed order
- New rows go wherever there's space
- Unlike B-tree which maintains order
- Fast for inserts, but requires indexes for efficient reads
```

**Interactive Features**:
- Click on any page to see its contents
- Slider to simulate table growth (add more pages)
- Toggle to show "fragmented" view after many updates

---

### Visual 5: The ctid Explained

**Type**: Interactive SQL demonstration

**Description**: Show ctid in action

```
[VISUAL: ctid Explorer]

LEFT SIDE: SQL Query Input
+------------------------------------------+
| SELECT ctid, id, name FROM users         |
| LIMIT 10;                                |
|                                          |
| [Run Query]                              |
+------------------------------------------+

RIGHT SIDE: Results with Explanation
+------------------------------------------+
|  ctid  | id  | name     | Explanation    |
+--------+-----+----------+----------------+
| (0,1)  |  1  | Alice    | Page 0, Item 1 |
| (0,2)  |  2  | Bob      | Page 0, Item 2 |
| (0,3)  |  3  | Carol    | Page 0, Item 3 |
| ...    | ... | ...      | ...            |
| (0,50) | 50  | User50   | Page 0, Item 50|
| (1,1)  | 51  | User51   | Page 1, Item 1 | <-- New page started!
| (1,2)  | 52  | User52   | Page 1, Item 2 |
+------------------------------------------+

INSIGHT BOX:
"When ctid jumps from (0,50) to (1,1), it means 
Page 0 was full (only fits ~50 rows of this size), 
so Page 1 was allocated."

EXPERIMENT:
[Update Row 1]  -- Watch ctid change!
[Delete Row 2]  -- Line pointer becomes "dead"
[Insert Row]    -- See where it lands
```

**Interactive Features**:
- Run predefined queries
- Update a row and watch ctid change (shows MVCC creating new version)
- Visualize which page each row lives on

---

## Key Takeaways Panel

**Type**: Sticky summary (visible throughout section)

```
+------------------------------------------------------------------+
|  KEY TAKEAWAYS                                                    |
+------------------------------------------------------------------+
|                                                                   |
|  1. PAGE (8KB) is the smallest unit of I/O                       |
|     - Every read/write is a full page, never individual rows     |
|     - This is why sequential scans read lots of data             |
|                                                                   |
|  2. TUPLE = Row + Hidden Metadata                                 |
|     - Every row carries xmin/xmax for MVCC                       |
|     - This is why rows are larger than just your data            |
|                                                                   |
|  3. HEAP = Unordered pile of pages                               |
|     - No guaranteed row order (use indexes!)                      |
|     - New rows go wherever there's space                         |
|                                                                   |
|  4. ctid = Physical address (page, item)                         |
|     - Changes when row is updated (new version)                   |
|     - Indexes store ctids to find rows                           |
|                                                                   |
+------------------------------------------------------------------+
```

---

## SQL Experiments Panel

```
[INTERACTIVE: Try These Queries]

-- See page size
SHOW block_size;  -- Returns 8192 (bytes)

-- See which page each row lives on
SELECT ctid, id, name FROM users LIMIT 20;

-- See detailed page contents (requires pageinspect)
CREATE EXTENSION IF NOT EXISTS pageinspect;
SELECT * FROM heap_page_items(get_raw_page('users', 0)) LIMIT 5;

-- See tuple header details
SELECT 
    lp,                    -- Line pointer number
    lp_off,                -- Offset in page
    t_xmin,                -- Creating transaction
    t_xmax,                -- Deleting transaction (0 = alive)
    t_ctid                 -- Current location
FROM heap_page_items(get_raw_page('users', 0))
LIMIT 5;

-- See table file location
SELECT pg_relation_filepath('users');
-- Returns: base/16384/16385
```

---

## Common Questions Answered

### "Why 8KB pages?"

```
BALANCE:
- Small enough: Efficient memory usage, less wasted space
- Large enough: Amortize I/O overhead, hold meaningful data
- OS-aligned: Works well with 4KB OS pages (2 OS pages = 1 PG page)

CONFIGURABLE:
- Can be 4KB, 16KB, or 32KB at compile time
- 99% of deployments use default 8KB
- Larger pages help with big columns, hurt with small rows
```

### "What if my row is bigger than 8KB?"

```
TOAST (The Oversized-Attribute Storage Technique):
- Large values (>2KB typically) are compressed and/or moved
- Stored in a separate TOAST table
- Main tuple keeps a "pointer" to the external data

Example:
- users.bio is 50KB of text
- Main tuple stores: [id, name, email, TOAST_POINTER]
- TOAST table stores: [chunk1, chunk2, chunk3, ...] of bio content
```

### "Why doesn't PostgreSQL just update rows in place?"

```
MVCC REQUIREMENT:
- Other transactions might still need the OLD version
- Can't overwrite - must keep both versions
- This is why updates = insert new + mark old as dead
- This is also why VACUUM exists (to clean dead versions)

More in Section 1.4: MVCC
```

---

## Connection to Next Section

```
NOW YOU KNOW: How data is organized on disk (pages, tuples, heap)

NEXT QUESTION: But reading from disk is slow. How does PostgreSQL
make it fast? 

NEXT SECTION: 1.2 The Memory Hierarchy
- shared_buffers: The page cache
- Buffer hit ratio: The most important metric
- Why more RAM = faster database (to a point)
```

---

## Technical Implementation Notes

### UI Components Needed

1. **ScrollRevealDiagram**: Animates diagram as user scrolls
2. **ExpandableSection**: Click to expand/collapse detailed info
3. **InteractivePageView**: Clickable page diagram with tooltips
4. **SQLPlayground**: Run queries and show results
5. **HexViewer**: Toggle between pretty and raw byte view

### Data Requirements

- Sample `users` table with ~100 rows for demonstrations
- Access to `pageinspect` extension (or simulated results)
- Pre-computed examples for all interactive elements

### Animations

- Page structure reveal: 800ms, ease-out
- Tuple highlight: 200ms, ease-in-out  
- Section transitions: 400ms, ease-in-out
