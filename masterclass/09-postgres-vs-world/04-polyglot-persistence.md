# Polyglot Persistence

> **The Question**: "Can I use multiple databases together? How?"

---

## Visual 1: The Polyglot Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  POLYGLOT PERSISTENCE: Right Tool for Each Job                          │
│  ═════════════════════════════════════════════                           │
│                                                                          │
│  Instead of forcing everything into one database, use specialized      │
│  databases for each use case:                                           │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                         APPLICATION                            │     │
│  │                             │                                   │     │
│  │     ┌───────────┬──────────┼──────────┬───────────┐           │     │
│  │     │           │          │          │           │           │     │
│  │     ▼           ▼          ▼          ▼           ▼           │     │
│  │ ┌───────┐  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐     │     │
│  │ │Postgres│  │ Redis  │ │Elastic │ │ S3     │ │ ClickHse│     │     │
│  │ │       │  │        │ │ search │ │        │ │          │     │     │
│  │ │Users  │  │Sessions│ │Product │ │ Files  │ │Analytics│     │     │
│  │ │Orders │  │Cache   │ │Search  │ │ Images │ │ Events  │     │     │
│  │ │Payment│  │Counters│ │Logs    │ │ Docs   │ │ Metrics │     │     │
│  │ └───────┘  └────────┘ └────────┘ └────────┘ └──────────┘     │     │
│  │                                                                 │     │
│  │  Source of   Speed     Full-text   Blob      OLAP              │     │
│  │  truth       layer     queries     storage   queries           │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  PostgreSQL remains the source of truth.                                │
│  Other databases serve specific purposes.                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Data Flow Patterns

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DATA FLOW PATTERNS                                                      │
│  ══════════════════                                                      │
│                                                                          │
│  PATTERN 1: Cache-Aside                                                 │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  App ──▶ Check Redis cache                                     │     │
│  │          │                                                      │     │
│  │          ├── HIT: Return cached data                           │     │
│  │          │                                                      │     │
│  │          └── MISS: Query PostgreSQL                            │     │
│  │                    Store in Redis                               │     │
│  │                    Return data                                  │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  PATTERN 2: Event-Driven Sync                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  PostgreSQL ──trigger──▶ Message Queue ──consumer──▶ Elastic  │     │
│  │                          (Kafka, RabbitMQ)                      │     │
│  │                                                                 │     │
│  │  When product updated in PostgreSQL:                           │     │
│  │  1. Trigger publishes event to queue                           │     │
│  │  2. Consumer reads event                                        │     │
│  │  3. Consumer updates Elasticsearch index                       │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  PATTERN 3: CDC (Change Data Capture)                                   │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  PostgreSQL ──WAL──▶ Debezium ──stream──▶ Kafka ──▶ ClickHouse│     │
│  │                                                                 │     │
│  │  Every change in PostgreSQL automatically flows to analytics.  │     │
│  │  No application code needed - reads from WAL directly.        │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: The Challenges

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE CHALLENGES OF POLYGLOT                                              │
│  ══════════════════════════                                              │
│                                                                          │
│  1. CONSISTENCY                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  PostgreSQL says: product.price = $100                         │     │
│  │  Elasticsearch says: product.price = $90 (stale!)              │     │
│  │  Redis says: product.price = $95 (even more stale!)            │     │
│  │                                                                 │     │
│  │  Which is correct? How do you keep them in sync?              │     │
│  │                                                                 │     │
│  │  SOLUTIONS:                                                     │     │
│  │  • Accept eventual consistency (document lag tolerances)       │     │
│  │  • Use CDC for near-real-time sync                             │     │
│  │  • Cache with short TTLs                                        │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  2. OPERATIONAL COMPLEXITY                                              │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Each database needs:                                          │     │
│  │  • Backups and restore procedures                              │     │
│  │  • Monitoring and alerting                                      │     │
│  │  • Security configuration                                       │     │
│  │  • Upgrade procedures                                           │     │
│  │  • Capacity planning                                            │     │
│  │  • Team expertise                                               │     │
│  │                                                                 │     │
│  │  5 databases = 5x operational burden                           │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  3. DEBUGGING                                                            │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  "Why is the wrong data showing?"                              │     │
│  │                                                                 │     │
│  │  Could be:                                                      │     │
│  │  • PostgreSQL has old data                                      │     │
│  │  • Kafka consumer is lagging                                   │     │
│  │  • Elasticsearch indexing failed                               │     │
│  │  • Redis cache not invalidated                                 │     │
│  │  • Application read from wrong source                          │     │
│  │                                                                 │     │
│  │  Distributed tracing becomes essential.                        │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: When Polyglot Makes Sense

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHEN POLYGLOT MAKES SENSE                                               │
│  ═════════════════════════                                               │
│                                                                          │
│  ✓ GOOD REASONS:                                                         │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  1. FUNDAMENTALLY DIFFERENT WORKLOADS                          │     │
│  │     OLTP (PostgreSQL) + OLAP (ClickHouse)                      │     │
│  │     Transactional data + Analytics at scale                    │     │
│  │                                                                 │     │
│  │  2. PERFORMANCE REQUIREMENTS THAT CAN'T BE MET                 │     │
│  │     PostgreSQL can't do sub-millisecond? Add Redis cache.     │     │
│  │     PostgreSQL search too slow? Add Elasticsearch.            │     │
│  │                                                                 │     │
│  │  3. SPECIALIZED CAPABILITIES                                   │     │
│  │     Graph traversals → Neo4j                                   │     │
│  │     Geospatial at scale → PostGIS or specialized              │     │
│  │     ML embeddings → Vector database                            │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ✗ BAD REASONS:                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  • "MongoDB is trendy" (PostgreSQL JSONB works fine)          │     │
│  │  • "Redis is faster" (for what? is latency actually a problem?)│     │
│  │  • "We might need it" (YAGNI)                                  │     │
│  │  • "The team wants to learn it" (not a business reason)       │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  RULE: Start with PostgreSQL. Add databases only when you have        │
│        concrete requirements that PostgreSQL cannot meet.               │
│                                                                          │
│  Each new database is a MARRIAGE, not a DATE.                          │
│  You'll be operating it for years.                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
