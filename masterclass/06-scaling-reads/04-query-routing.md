# Query Routing Strategies

> **The Question**: "How do I send reads to replicas and writes to primary?"

---

## Visual 1: The Routing Challenge

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE QUERY ROUTING CHALLENGE                                             │
│  ═══════════════════════════                                             │
│                                                                          │
│  You have:                                                               │
│  • 1 Primary (accepts writes)                                           │
│  • 3 Replicas (read-only, slightly behind)                              │
│                                                                          │
│  You need:                                                               │
│  • Writes → Primary                                                      │
│  • Reads → Replicas (usually)                                           │
│  • Reads after writes → Primary (to avoid stale data)                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                        Application                              │     │
│  │                             │                                   │     │
│  │              ┌──────────────┴──────────────┐                   │     │
│  │              │       ROUTER / PROXY         │                   │     │
│  │              │                              │                   │     │
│  │              │  Which server handles this   │                   │     │
│  │              │  query?                      │                   │     │
│  │              └──────────────┬──────────────┘                   │     │
│  │                             │                                   │     │
│  │     ┌───────────┬───────────┼───────────┬───────────┐          │     │
│  │     │           │           │           │           │          │     │
│  │     ▼           ▼           ▼           ▼           ▼          │     │
│  │  PRIMARY    REPLICA 1   REPLICA 2   REPLICA 3   REPLICA N     │     │
│  │  (writes)    (reads)     (reads)     (reads)     (reads)      │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Application-Level Routing

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STRATEGY 1: Application-Level Routing                                   │
│  ═════════════════════════════════════                                   │
│                                                                          │
│  Your application knows which queries are reads/writes.                 │
│  Configure two connection pools:                                         │
│                                                                          │
│  PYTHON (SQLAlchemy) EXAMPLE:                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  from sqlalchemy import create_engine                           │     │
│  │                                                                 │     │
│  │  primary = create_engine("postgresql://primary:5432/db")        │     │
│  │  replica = create_engine("postgresql://replica:5432/db")        │     │
│  │                                                                 │     │
│  │  def get_user(user_id):                                         │     │
│  │      with replica.connect() as conn:  # ← Read from replica    │     │
│  │          return conn.execute(                                   │     │
│  │              "SELECT * FROM users WHERE id = %s", user_id       │     │
│  │          ).fetchone()                                           │     │
│  │                                                                 │     │
│  │  def create_user(email):                                        │     │
│  │      with primary.connect() as conn:  # ← Write to primary     │     │
│  │          return conn.execute(                                   │     │
│  │              "INSERT INTO users (email) VALUES (%s)", email     │     │
│  │          )                                                      │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  PROS: Simple, explicit control                                         │
│  CONS: Must modify all database code, easy to make mistakes             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: Proxy-Based Routing

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STRATEGY 2: Proxy-Based Routing (PgBouncer, ProxySQL, PgPool)          │
│  ═════════════════════════════════════════════════════════════           │
│                                                                          │
│  A middleware parses queries and routes automatically:                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Application ──▶ Proxy ──┬──▶ SELECT * FROM... ──▶ Replica    │     │
│  │                          │                                      │     │
│  │                          ├──▶ INSERT INTO... ───▶ Primary      │     │
│  │                          │                                      │     │
│  │                          ├──▶ UPDATE ... ───────▶ Primary      │     │
│  │                          │                                      │     │
│  │                          └──▶ DELETE ... ───────▶ Primary      │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  PGPOOL-II EXAMPLE CONFIG:                                              │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  backend_hostname0 = 'primary'                                  │     │
│  │  backend_port0 = 5432                                           │     │
│  │  backend_weight0 = 1                                            │     │
│  │  backend_flag0 = 'ALWAYS_PRIMARY'                              │     │
│  │                                                                 │     │
│  │  backend_hostname1 = 'replica1'                                 │     │
│  │  backend_port1 = 5432                                           │     │
│  │  backend_weight1 = 2  # Gets 2x the read traffic               │     │
│  │                                                                 │     │
│  │  load_balance_mode = on                                         │     │
│  │  statement_level_load_balance = on                              │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  PROS: Transparent to application, automatic                            │
│  CONS: Another component to manage, some queries hard to classify       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: Read-Your-Writes Consistency

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE READ-YOUR-WRITES PROBLEM (again!)                                   │
│  ═════════════════════════════════════                                   │
│                                                                          │
│  User saves profile → immediately loads profile → sees old data!       │
│                                                                          │
│  SOLUTION 1: Sticky Sessions (simple but limited)                       │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  After any WRITE:                                               │     │
│  │    session["use_primary_until"] = now() + 5 seconds            │     │
│  │                                                                 │     │
│  │  On any READ:                                                   │     │
│  │    if now() < session["use_primary_until"]:                    │     │
│  │        use primary  # Still in "sticky" window                 │     │
│  │    else:                                                        │     │
│  │        use replica                                              │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  SOLUTION 2: LSN-Based Routing (precise but complex)                    │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  After WRITE:                                                   │     │
│  │    lsn = SELECT pg_current_wal_lsn();  # e.g., 0/16B4D28       │     │
│  │    session["min_lsn"] = lsn                                     │     │
│  │                                                                 │     │
│  │  Before READ:                                                   │     │
│  │    for replica in replicas:                                     │     │
│  │        replica_lsn = SELECT pg_last_wal_replay_lsn();          │     │
│  │        if replica_lsn >= session["min_lsn"]:                   │     │
│  │            use this replica  # It's caught up!                 │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  SOLUTION 3: Just Use Primary for That User's Data                     │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  • Read MY profile → Primary (always fresh)                    │     │
│  │  • Read OTHER profiles → Replica (slight lag OK)              │     │
│  │  • Read product catalog → Replica (shared data, lag OK)       │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
