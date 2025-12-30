# The Cost Model: How PostgreSQL Chooses

> **The Question**: "Why did PostgreSQL use a sequential scan when I have an index?"

---

## Visual 1: The Planner's Chess Board

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE PLANNER'S CHESS BOARD                                               │
│  ═════════════════════════                                               │
│                                                                          │
│  The planner doesn't know "good" from "bad". It only knows COST.        │
│                                                                          │
│  Cost is measured in arbitrary "cost units" (roughly: disk page reads). │
│                                                                          │
│  KEY COST PARAMETERS:                                                    │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  seq_page_cost     = 1.0    # Reading a page sequentially       │     │
│  │  random_page_cost  = 4.0    # Reading a page randomly (seek!)   │     │
│  │  cpu_tuple_cost    = 0.01   # Processing one row                │     │
│  │  cpu_index_tuple_cost = 0.005  # Processing one index entry     │     │
│  │  cpu_operator_cost = 0.0025 # Evaluating one operator           │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  WHY random_page_cost = 4.0?                                            │
│  • Sequential read: Head is already in position, just keep reading     │
│  • Random read: Head must seek to new position = ~4x slower on HDD     │
│  • On SSD: You might set this to 1.1 - 1.5 (seeks are nearly free)     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Sequential Scan Cost

```
┌─────────────────────────────────────────────────────────────────────────┐
│  COST CALCULATION: Sequential Scan                                       │
│  ═══════════════════════════════════                                     │
│                                                                          │
│  SELECT * FROM users WHERE status = 'active';                           │
│                                                                          │
│  Table stats:                                                            │
│  • relpages = 10,000 (80 MB of data)                                    │
│  • reltuples = 1,000,000 (1 million rows)                               │
│  • 'active' status appears in 50% of rows (from pg_statistic)          │
│                                                                          │
│  SEQUENTIAL SCAN COST:                                                   │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Disk I/O cost:                                                 │     │
│  │    10,000 pages × seq_page_cost (1.0) = 10,000                  │     │
│  │                                                                 │     │
│  │  CPU cost (check every row):                                    │     │
│  │    1,000,000 rows × cpu_tuple_cost (0.01) = 10,000              │     │
│  │                                                                 │     │
│  │  CPU cost (evaluate WHERE):                                     │     │
│  │    1,000,000 × cpu_operator_cost (0.0025) = 2,500               │     │
│  │                                                                 │     │
│  │  ─────────────────────────────────────────                      │     │
│  │  TOTAL COST: 22,500                                             │     │
│  │  Estimated rows returned: 500,000                               │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: Index Scan Cost

```
┌─────────────────────────────────────────────────────────────────────────┐
│  COST CALCULATION: Index Scan                                            │
│  ═══════════════════════════════                                         │
│                                                                          │
│  Same query, but now we have idx_users_status:                          │
│                                                                          │
│  SELECT * FROM users WHERE status = 'active';                           │
│                                                                          │
│  INDEX SCAN COST:                                                        │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Index traversal (B-tree depth ~4):                            │     │
│  │    4 pages × random_page_cost (4.0) = 16                        │     │
│  │                                                                 │     │
│  │  Index leaf pages to scan (500,000 matching entries):          │     │
│  │    ~2,000 pages × random_page_cost (4.0) = 8,000                │     │
│  │                                                                 │     │
│  │  Heap fetches (500,000 rows in random pages):                  │     │
│  │    500,000 × random_page_cost / rows_per_page                   │     │
│  │    ≈ 5,000 pages × 4.0 = 20,000                                 │     │
│  │                                                                 │     │
│  │  CPU costs: ~7,500                                              │     │
│  │                                                                 │     │
│  │  ─────────────────────────────────────────                      │     │
│  │  TOTAL COST: 35,516                                             │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ⚠️  SEQUENTIAL SCAN WINS!  (22,500 < 35,516)                           │
│                                                                          │
│  When selecting 50% of rows, reading the whole table sequentially       │
│  is faster than randomly hopping around with an index!                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: The Crossover Point

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE CROSSOVER POINT: When Index Beats Sequential                       │
│  ═══════════════════════════════════════════════                         │
│                                                                          │
│                                                                          │
│  Cost                                                                    │
│    │                                                                     │
│    │  Sequential Scan                                                   │
│    │  ═══════════════════════════════════════════════════════           │
│    │                                                                     │
│    │                     ╱                                               │
│    │                   ╱   Index Scan                                   │
│    │                 ╱                                                   │
│    │               ╱                                                     │
│    │             ╱                                                       │
│    │           ╱                                                         │
│    │         ╱                                                           │
│    │       ╱                                                             │
│    │     ╱                                                               │
│    │   ●────── Crossover (~5-15% selectivity)                           │
│    │ ╱                                                                   │
│    └───────────────────────────────────────────────────────▶            │
│      0%    5%    10%   15%   20%   ...   50%   ...   100%               │
│                       % of table selected                                │
│                                                                          │
│  RULE OF THUMB:                                                          │
│  • Selecting < 5-15% of rows: Index wins                                │
│  • Selecting > 15-20% of rows: Sequential often wins                    │
│  • Exact crossover depends on random_page_cost and data clustering     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 5: Why Bad Plans Happen

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHY THE PLANNER PICKS BAD PLANS                                         │
│  ═══════════════════════════════                                         │
│                                                                          │
│  1. STALE STATISTICS                                                     │
│  ───────────────────                                                     │
│  • Planner thinks table has 1,000 rows (old stats)                      │
│  • Actually has 1,000,000 rows (after bulk insert)                      │
│  • Picks index scan expecting 10 rows, gets 10,000                      │
│  • FIX: ANALYZE tablename;                                              │
│                                                                          │
│  2. WRONG COST PARAMETERS                                                │
│  ────────────────────────                                                │
│  • You have SSD, but random_page_cost = 4.0 (HDD default)               │
│  • Planner over-penalizes random I/O                                    │
│  • Avoids index scans that would actually be fast                       │
│  • FIX: SET random_page_cost = 1.1;                                     │
│                                                                          │
│  3. CORRELATION BLINDNESS                                                │
│  ────────────────────────                                                │
│  • Two columns are correlated (e.g., city and zip)                      │
│  • Planner assumes independence                                         │
│  • Estimates 100 rows, gets 10,000                                      │
│  • FIX: CREATE STATISTICS (columns)                                     │
│                                                                          │
│  4. PARAMETER SNIFFING (prepared statements)                            │
│  ───────────────────────────────────────────                             │
│  • First execution: WHERE status = 'rare' (0.1%)                        │
│  • Plan cached: Index scan                                              │
│  • Next execution: WHERE status = 'common' (50%)                        │
│  • Uses cached plan: Index scan (terrible!)                             │
│  • FIX: plan_cache_mode = force_custom_plan                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
