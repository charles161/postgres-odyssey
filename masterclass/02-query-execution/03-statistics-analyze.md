# Statistics and ANALYZE

> **The Question**: "What does ANALYZE actually do? Why does it fix slow queries?"

---

## Visual 1: Statistics - The Planner's Crystal Ball

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STATISTICS: THE PLANNER'S CRYSTAL BALL                                  │
│  ═══════════════════════════════════════                                 │
│                                                                          │
│  The planner never actually looks at your data.                         │
│  It looks at STATISTICS ABOUT your data.                                │
│                                                                          │
│  WHERE ARE STATS STORED?                                                 │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  pg_class (table-level stats):                                  │     │
│  │  ├── relpages: Number of disk pages                            │     │
│  │  ├── reltuples: Estimated number of rows                       │     │
│  │  └── relallvisible: Pages where all tuples are visible         │     │
│  │                                                                 │     │
│  │  pg_statistic (column-level stats):                            │     │
│  │  ├── null_frac: Fraction of NULLs                              │     │
│  │  ├── n_distinct: Number of distinct values                     │     │
│  │  ├── most_common_vals: Most frequent values                    │     │
│  │  ├── most_common_freqs: How frequent each MCV is               │     │
│  │  ├── histogram_bounds: Distribution of other values            │     │
│  │  └── correlation: Physical vs logical ordering                 │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: What ANALYZE Collects

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHAT ANALYZE COLLECTS                                                   │
│  ═════════════════════                                                   │
│                                                                          │
│  ANALYZE users;                                                          │
│                                                                          │
│  PostgreSQL samples ~30,000 rows (default_statistics_target × 300).    │
│                                                                          │
│  For column "status":                                                    │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  null_frac = 0.02  (2% are NULL)                               │     │
│  │                                                                 │     │
│  │  n_distinct = 5  (5 unique values)                             │     │
│  │                                                                 │     │
│  │  most_common_vals:   ['active', 'inactive', 'pending']         │     │
│  │  most_common_freqs:  [0.65,     0.25,       0.08]              │     │
│  │                       ↑                                         │     │
│  │                    65% of rows are 'active'                     │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  For column "created_at" (timestamp):                                   │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  n_distinct = -0.95  (negative = fraction of rows are unique)  │     │
│  │                       95% of rows have unique values           │     │
│  │                                                                 │     │
│  │  histogram_bounds:                                              │     │
│  │  [2020-01-01, 2021-03-15, 2022-06-30, 2023-09-12, 2024-12-01]  │     │
│  │       │           │           │           │           │         │     │
│  │      20%         40%         60%         80%        100%        │     │
│  │                                                                 │     │
│  │  correlation = 0.98  (highly ordered on disk)                  │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: How Stale Stats Cause Bad Plans

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STALE STATS = BAD PLANS                                                 │
│  ════════════════════════                                                │
│                                                                          │
│  SCENARIO:                                                               │
│  • Yesterday: 10,000 users, stats show reltuples = 10,000               │
│  • Today: Bulk import added 990,000 users                               │
│  • Stats still show: reltuples = 10,000 (stale!)                        │
│                                                                          │
│  Query: SELECT * FROM users WHERE country = 'US';                       │
│                                                                          │
│  PLANNER'S (WRONG) THINKING:                                            │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  "There are 10,000 rows total."                                │     │
│  │  "country = 'US' probably matches 10% = 1,000 rows."           │     │
│  │  "Index scan on idx_country: Cost = 500"                       │     │
│  │  "Sequential scan: Cost = 100"                                  │     │
│  │                                                                 │     │
│  │  "I'll use sequential scan!"                                   │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  REALITY:                                                                │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Actually 1,000,000 rows.                                      │     │
│  │  Sequential scan reads ALL 1 million rows.                     │     │
│  │  Takes 30 seconds instead of 0.5 seconds.                      │     │
│  │                                                                 │     │
│  │  FIX: ANALYZE users;  (takes ~5 seconds)                       │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: Autovacuum and Auto-ANALYZE

```
┌─────────────────────────────────────────────────────────────────────────┐
│  AUTOVACUUM ALSO RUNS AUTO-ANALYZE                                       │
│  ═════════════════════════════════                                       │
│                                                                          │
│  Auto-analyze triggers when:                                             │
│  changed_rows > threshold + (scale_factor × table_rows)                 │
│              = 50 + (0.1 × 1,000,000)                                   │
│              = 100,050 rows changed                                     │
│                                                                          │
│  TIMELINE:                                                               │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  T=0:    Stats current, 1M rows                                │     │
│  │  T=1hr:  50,000 inserts (not enough to trigger)                │     │
│  │  T=2hr:  50,000 more inserts (threshold crossed!)              │     │
│  │  T=2hr+: Autovacuum notices, schedules auto-analyze            │     │
│  │  T=2hr+30s: Auto-analyze runs, stats updated                   │     │
│  │                                                                 │     │
│  │  POTENTIAL WINDOW: 2 hours of stale stats!                     │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  FOR CRITICAL TABLES, run ANALYZE manually after bulk operations:       │
│  • After ETL jobs                                                        │
│  • After large imports                                                   │
│  • After partition creation                                              │
│                                                                          │
│  TUNING:                                                                 │
│  ALTER TABLE hot_table SET (autovacuum_analyze_scale_factor = 0.01);   │
│  (Trigger analyze after 1% change instead of 10%)                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
