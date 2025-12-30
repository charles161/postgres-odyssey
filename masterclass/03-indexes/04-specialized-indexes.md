# Specialized Indexes: GIN, GiST, BRIN

> **The Question**: "Why doesn't B-tree work for my array/JSON/full-text/range queries?"

---

## Visual 1: The Right Tool for the Job

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SPECIALIZED INDEXES: The Right Tool for the Job                         │
│  ═══════════════════════════════════════════════                         │
│                                                                          │
│  B-tree is amazing for: =, <, >, <=, >=, BETWEEN, LIKE 'prefix%'       │
│  B-tree CANNOT help with:                                                │
│  • Array contains: tags @> ARRAY['urgent']                              │
│  • JSON containment: data @> '{"status": "active"}'                     │
│  • Full-text search: to_tsvector(body) @@ to_tsquery('postgresql')     │
│  • Geometric: point <@ box (point inside box)                           │
│  • Range overlap: daterange && '[2024-01-01, 2024-03-01]'              │
│                                                                          │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐               │
│  │      GIN       │ │      GiST      │ │      BRIN      │               │
│  │ ════════════   │ │ ════════════   │ │ ════════════   │               │
│  │                │ │                │ │                │               │
│  │ Inverted Index │ │ Generalized    │ │ Block Range   │               │
│  │ "What rows     │ │ Search Tree    │ │ Index         │               │
│  │  contain X?"   │ │ "Overlaps,     │ │ "Min/max per  │               │
│  │                │ │  nearest"      │ │  block range" │               │
│  │                │ │                │ │                │               │
│  │ Best for:      │ │ Best for:      │ │ Best for:      │               │
│  │ • Arrays       │ │ • Geometry     │ │ • Append-only │               │
│  │ • JSONB        │ │ • Ranges       │ │ • Time series │               │
│  │ • Full-text    │ │ • Full-text    │ │ • Large tables│               │
│  │ • Trigrams     │ │ • Nearest-N    │ │ • Sorted data │               │
│  └────────────────┘ └────────────────┘ └────────────────┘               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: GIN - Generalized Inverted Index

```
┌─────────────────────────────────────────────────────────────────────────┐
│  GIN: GENERALIZED INVERTED INDEX                                         │
│  ═══════════════════════════════                                         │
│                                                                          │
│  "What rows contain element X?"                                          │
│                                                                          │
│  EXAMPLE: Blog posts with tags                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  posts table:                                                   │     │
│  │  id=1: tags = ['postgresql', 'database']                       │     │
│  │  id=2: tags = ['postgresql', 'performance']                    │     │
│  │  id=3: tags = ['mysql', 'database']                            │     │
│  │  id=4: tags = ['postgresql', 'scaling']                        │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  GIN INDEX STRUCTURE (inverted):                                        │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  'database'    ──────▶ [1, 3]                                  │     │
│  │  'mysql'       ──────▶ [3]                                     │     │
│  │  'performance' ──────▶ [2]                                     │     │
│  │  'postgresql'  ──────▶ [1, 2, 4]                               │     │
│  │  'scaling'     ──────▶ [4]                                     │     │
│  │                                                                 │     │
│  │  Query: tags @> ARRAY['postgresql']                            │     │
│  │  Answer: Look up 'postgresql' → [1, 2, 4] ← instant!           │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  CREATE INDEX idx_posts_tags ON posts USING GIN(tags);                  │
│                                                                          │
│  ALSO GREAT FOR:                                                         │
│  • JSONB: CREATE INDEX ON docs USING GIN(data jsonb_path_ops);          │
│  • Full-text: CREATE INDEX ON posts USING GIN(to_tsvector(body));       │
│  • Trigrams: CREATE INDEX ON users USING GIN(name gin_trgm_ops);        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: GiST - Generalized Search Tree

```
┌─────────────────────────────────────────────────────────────────────────┐
│  GiST: GENERALIZED SEARCH TREE                                           │
│  ══════════════════════════════                                          │
│                                                                          │
│  "Find things that overlap, intersect, or are near"                     │
│                                                                          │
│  EXAMPLE: Find all stores within 5km of a point                         │
│                                                                          │
│  GiST divides space into bounding boxes:                                │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │   ┌─────────────────────────────────────────────────────────┐  │     │
│  │   │                                                          │  │     │
│  │   │   ┌───────────────┐      ┌───────────────┐              │  │     │
│  │   │   │ ● store1      │      │               │              │  │     │
│  │   │   │   ● store2    │      │  ● store4     │              │  │     │
│  │   │   │               │      │       ● store5│              │  │     │
│  │   │   └───────────────┘      └───────────────┘              │  │     │
│  │   │                                                          │  │     │
│  │   │   ┌───────────────┐                                     │  │     │
│  │   │   │    ● store3   │   ◉ ← Your location                │  │     │
│  │   │   │               │      (searching 5km radius)         │  │     │
│  │   │   └───────────────┘                                     │  │     │
│  │   │                                                          │  │     │
│  │   └─────────────────────────────────────────────────────────┘  │     │
│  │                                                                 │     │
│  │   GiST can quickly prune: "Box 1 doesn't overlap search area, │     │
│  │   skip all stores in it. Box 3 does overlap, check store3."   │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  CREATE INDEX idx_stores_location ON stores USING GiST(location);       │
│  SELECT * FROM stores WHERE location <-> point(x,y) < 5000;             │
│                                                                          │
│  ALSO GREAT FOR:                                                         │
│  • Range types: date ranges, numeric ranges                             │
│  • Full-text (alternative to GIN, better for updates)                   │
│  • inet/cidr (IP addresses)                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: BRIN - Block Range Index

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BRIN: BLOCK RANGE INDEX                                                 │
│  ═══════════════════════                                                 │
│                                                                          │
│  The TINY index for HUGE tables (when data is naturally ordered)        │
│                                                                          │
│  SCENARIO: 10TB of time-series data, ordered by timestamp              │
│  • B-tree index: ~200GB                                                  │
│  • BRIN index: ~10MB (20,000x smaller!)                                 │
│                                                                          │
│  HOW BRIN WORKS:                                                         │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Table stored in blocks (128 pages per range by default):      │     │
│  │                                                                 │     │
│  │  Block Range 0 (pages 0-127):   min=2024-01-01, max=2024-01-15 │     │
│  │  Block Range 1 (pages 128-255): min=2024-01-15, max=2024-01-31 │     │
│  │  Block Range 2 (pages 256-383): min=2024-02-01, max=2024-02-14 │     │
│  │  Block Range 3 (pages 384-511): min=2024-02-15, max=2024-02-28 │     │
│  │  ...                                                            │     │
│  │                                                                 │     │
│  │  BRIN stores only: [range_id, min_value, max_value]            │     │
│  │  That's it! One row per 128 pages!                             │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  Query: WHERE created_at BETWEEN '2024-02-01' AND '2024-02-10'          │
│                                                                          │
│  BRIN says: "Only Block Range 2 could have this data.                   │
│              Skip ranges 0, 1, 3, ...1000. Read only range 2."          │
│                                                                          │
│  CREATE INDEX idx_events_time ON events USING BRIN(created_at);         │
│                                                                          │
│  ⚠️  REQUIREMENT: Data must be physically ordered!                       │
│      If you insert random timestamps, BRIN is useless.                  │
│      Every block range would have min=earliest, max=latest.             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
