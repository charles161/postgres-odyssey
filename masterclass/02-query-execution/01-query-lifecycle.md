# The Query Lifecycle: Parse → Plan → Execute

> **The Question**: "What actually happens between typing a query and getting results?"

---

## Visual 1: The Journey of a Query

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE LIFE OF A QUERY                                                     │
│  ═══════════════════                                                     │
│                                                                          │
│  SELECT * FROM users WHERE email = 'alice@example.com';                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    │     │
│  │   │  PARSE  │───▶│ ANALYZE │───▶│ REWRITE │───▶│  PLAN   │    │     │
│  │   └─────────┘    └─────────┘    └─────────┘    └─────────┘    │     │
│  │        │                                            │          │     │
│  │        ▼                                            ▼          │     │
│  │   Raw Parse      Semantic        Rule           Query Plan     │     │
│  │   Tree           Validation      Expansion      (cheapest)     │     │
│  │                                                                 │     │
│  │                                       │                         │     │
│  │                                       ▼                         │     │
│  │                                  ┌─────────┐                    │     │
│  │                                  │ EXECUTE │                    │     │
│  │                                  └─────────┘                    │     │
│  │                                       │                         │     │
│  │                                       ▼                         │     │
│  │                                   Results                       │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Parser - Syntax Check

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STAGE 1: PARSER                                                         │
│  ═══════════════                                                         │
│                                                                          │
│  Input: "SELECT * FROM users WHERE email = 'alice@example.com'"         │
│                                                                          │
│  The Parser:                                                             │
│  • Tokenizes the SQL string                                              │
│  • Checks syntax (grammar rules)                                         │
│  • Builds a raw parse tree                                               │
│  • Does NOT check if tables/columns exist                                │
│                                                                          │
│  TOKENIZATION:                                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ SELECT │ * │ FROM │ users │ WHERE │ email │ = │ 'alice@...' │ ; │    │
│  │ ────── │ ─ │ ──── │ ───── │ ───── │ ───── │ ─ │ ─────────── │ ─ │    │
│  │ keyword│sym│keywrd│ident  │keyword│ ident │op │   string    │end│    │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  RAW PARSE TREE:                                                         │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                        SelectStmt                               │     │
│  │                       ╱    │    ╲                               │     │
│  │                      ╱     │     ╲                              │     │
│  │              targetList  fromClause  whereClause               │     │
│  │                 │           │            │                      │     │
│  │               [*]       [users]      A_Expr(=)                 │     │
│  │                                      ╱       ╲                  │     │
│  │                                 email    'alice@...'            │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  At this point: "SELECT * FROM unicorns" would still pass!             │
│  Parser doesn't know unicorns table doesn't exist.                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: Analyzer - Semantic Check

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STAGE 2: ANALYZER (Semantic Analysis)                                   │
│  ═════════════════════════════════════                                   │
│                                                                          │
│  The Analyzer:                                                           │
│  • Looks up tables in system catalogs (pg_class)                        │
│  • Looks up columns in system catalogs (pg_attribute)                   │
│  • Resolves types and checks type compatibility                         │
│  • Expands * to actual column list                                      │
│  • Adds implicit casts if needed                                        │
│                                                                          │
│  CATALOG LOOKUPS:                                                        │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  "Does table 'users' exist?"                                   │     │
│  │  ──────────▶ pg_class ──────────▶ Yes! OID: 16384              │     │
│  │                                                                 │     │
│  │  "What columns does users have?"                               │     │
│  │  ──────────▶ pg_attribute ──────▶ id (int4), email (text), ... │     │
│  │                                                                 │     │
│  │  "Is email = 'alice@...' valid?"                               │     │
│  │  ──────────▶ Check: text = text ──────────▶ Yes!               │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  OUTPUT: Query Tree (semantically validated parse tree)                 │
│                                                                          │
│  NOW if you write "SELECT * FROM unicorns":                             │
│  ERROR: relation "unicorns" does not exist                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: Rewriter - Rule Expansion

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STAGE 3: REWRITER                                                       │
│  ═════════════════                                                       │
│                                                                          │
│  The Rewriter:                                                           │
│  • Expands VIEWs into their underlying queries                          │
│  • Applies rules (like INSTEAD OF triggers)                             │
│  • Usually invisible to you                                              │
│                                                                          │
│  EXAMPLE: Querying a View                                                │
│  ─────────────────────────                                               │
│                                                                          │
│  CREATE VIEW active_users AS                                            │
│    SELECT * FROM users WHERE status = 'active';                         │
│                                                                          │
│  You write:   SELECT * FROM active_users WHERE age > 25;                │
│                                                                          │
│  Rewriter expands to:                                                    │
│    SELECT * FROM (                                                       │
│      SELECT * FROM users WHERE status = 'active'                        │
│    ) AS active_users                                                     │
│    WHERE age > 25;                                                       │
│                                                                          │
│  Actually optimizes to:                                                  │
│    SELECT * FROM users                                                   │
│    WHERE status = 'active' AND age > 25;                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 5: Planner - The Decision Maker

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STAGE 4: PLANNER / OPTIMIZER                                            │
│  ═══════════════════════════                                             │
│                                                                          │
│  The Planner:                                                            │
│  • Generates ALL possible execution strategies                          │
│  • Estimates cost of each strategy                                      │
│  • Picks the cheapest one                                               │
│                                                                          │
│  For: SELECT * FROM users WHERE email = 'alice@example.com'             │
│                                                                          │
│  POSSIBLE STRATEGIES:                                                    │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Option A: Sequential Scan                                      │     │
│  │  ─────────────────────────                                      │     │
│  │  • Read every page of users table                               │     │
│  │  • Check each row for email match                               │     │
│  │  • Cost: 1,000,000 rows × 0.01 = 10,000                         │     │
│  │                                                                 │     │
│  │  Option B: Index Scan (if idx_users_email exists)               │     │
│  │  ────────────────────────────────────────────                   │     │
│  │  • Look up 'alice@example.com' in B-tree                        │     │
│  │  • Follow pointer to heap page                                  │     │
│  │  • Cost: log(1,000,000) × 4.0 + 1 = 81                          │     │
│  │                                                                 │     │
│  │  WINNER: Option B (81 vs 10,000)                                │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  The planner uses STATISTICS (pg_statistic) to estimate row counts,    │
│  selectivity, and distribution. Stale stats = bad plans!               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 6: Executor - Running the Plan

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STAGE 5: EXECUTOR                                                       │
│  ═════════════════                                                       │
│                                                                          │
│  The Executor:                                                           │
│  • Takes the chosen plan                                                 │
│  • Actually fetches data from disk/memory                               │
│  • Processes nodes in the plan tree                                     │
│  • Returns results                                                       │
│                                                                          │
│  EXECUTION (volcano/iterator model):                                    │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Client asks: "Give me next row"                               │     │
│  │        │                                                        │     │
│  │        ▼                                                        │     │
│  │  ┌──────────────┐                                              │     │
│  │  │   Result     │  ◄─── "Give me next row"                     │     │
│  │  └──────┬───────┘                                              │     │
│  │         │                                                       │     │
│  │         ▼                                                       │     │
│  │  ┌──────────────┐                                              │     │
│  │  │ Index Scan   │  ◄─── Look up in idx_users_email             │     │
│  │  │ (users)      │       Fetch from heap                         │     │
│  │  └──────────────┘                                              │     │
│  │         │                                                       │     │
│  │         ▼                                                       │     │
│  │  Return row to client                                          │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  Each node pulls from nodes below it (demand-driven, lazy evaluation). │
│  This is why LIMIT 10 can be fast even on huge tables!                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
