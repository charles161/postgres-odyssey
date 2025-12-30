# When to Use What Database

> **The Question**: "Should I use PostgreSQL, MongoDB, DynamoDB, Redis, or...?"

---

## Visual 1: The Database Landscape

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE DATABASE LANDSCAPE                                                  │
│  ══════════════════════                                                  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                                                                  │    │
│  │   RELATIONAL (SQL)              DOCUMENT (NoSQL)                 │    │
│  │   ┌─────────────────┐          ┌─────────────────┐              │    │
│  │   │ PostgreSQL      │          │ MongoDB         │              │    │
│  │   │ MySQL           │          │ CouchDB         │              │    │
│  │   │ SQL Server      │          │ Firestore       │              │    │
│  │   └─────────────────┘          └─────────────────┘              │    │
│  │                                                                  │    │
│  │   KEY-VALUE                     WIDE-COLUMN                     │    │
│  │   ┌─────────────────┐          ┌─────────────────┐              │    │
│  │   │ Redis           │          │ Cassandra       │              │    │
│  │   │ DynamoDB        │          │ ScyllaDB        │              │    │
│  │   │ Memcached       │          │ HBase           │              │    │
│  │   └─────────────────┘          └─────────────────┘              │    │
│  │                                                                  │    │
│  │   GRAPH                         TIME-SERIES                     │    │
│  │   ┌─────────────────┐          ┌─────────────────┐              │    │
│  │   │ Neo4j           │          │ TimescaleDB     │              │    │
│  │   │ Amazon Neptune  │          │ InfluxDB        │              │    │
│  │   │ Dgraph          │          │ Prometheus      │              │    │
│  │   └─────────────────┘          └─────────────────┘              │    │
│  │                                                                  │    │
│  │   SEARCH                        VECTOR                          │    │
│  │   ┌─────────────────┐          ┌─────────────────┐              │    │
│  │   │ Elasticsearch   │          │ Pinecone        │              │    │
│  │   │ Algolia         │          │ pgvector        │              │    │
│  │   │ Meilisearch     │          │ Weaviate        │              │    │
│  │   └─────────────────┘          └─────────────────┘              │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Decision Matrix

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHEN TO USE WHAT                                                        │
│  ════════════════                                                        │
│                                                                          │
│  USE POSTGRESQL WHEN:                                                    │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  ✓ You need ACID transactions                                  │     │
│  │  ✓ Data has relationships (JOINs)                              │     │
│  │  ✓ Schema is known and relatively stable                       │     │
│  │  ✓ Complex queries (aggregations, window functions)            │     │
│  │  ✓ You want ONE database that does most things                 │     │
│  │  ✓ Default choice for most applications!                       │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  USE MONGODB WHEN:                                                       │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  ✓ Schema is truly unknown or highly variable                  │     │
│  │  ✓ Documents are self-contained (no JOINs needed)              │     │
│  │  ✓ Rapid prototyping with changing requirements               │     │
│  │  ✓ Nested data structures that would be awkward in tables     │     │
│  │  ✗ Avoid if: Need transactions across documents               │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  USE REDIS WHEN:                                                         │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  ✓ Caching (session, API responses, computed values)          │     │
│  │  ✓ Real-time leaderboards, counters                           │     │
│  │  ✓ Pub/sub messaging                                           │     │
│  │  ✓ Rate limiting                                                │     │
│  │  ✓ Sub-millisecond latency required                            │     │
│  │  ✗ Avoid if: Data must survive restarts (use as cache only)   │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  USE DYNAMODB/CASSANDRA WHEN:                                           │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  ✓ Massive scale (millions of requests/second)                 │     │
│  │  ✓ Simple access patterns (get by key, limited queries)       │     │
│  │  ✓ Global distribution required                                │     │
│  │  ✓ High availability more important than consistency          │     │
│  │  ✗ Avoid if: Complex queries, JOINs, changing access patterns │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  USE ELASTICSEARCH WHEN:                                                 │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  ✓ Full-text search with relevance ranking                    │     │
│  │  ✓ Log aggregation and analytics                               │     │
│  │  ✓ Faceted search (filtering + counting)                       │     │
│  │  ✗ Avoid if: Primary data store (use alongside PostgreSQL)    │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: The "Just Use PostgreSQL" Argument

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE "JUST USE POSTGRESQL" ARGUMENT                                      │
│  ══════════════════════════════════                                      │
│                                                                          │
│  PostgreSQL can do MORE than you think:                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  "I need document storage"                                     │     │
│  │  → PostgreSQL has JSONB with indexing (GIN)                   │     │
│  │                                                                 │     │
│  │  "I need full-text search"                                     │     │
│  │  → PostgreSQL has tsvector/tsquery (built-in!)               │     │
│  │                                                                 │     │
│  │  "I need time-series data"                                     │     │
│  │  → PostgreSQL + TimescaleDB extension                         │     │
│  │                                                                 │     │
│  │  "I need vector similarity search"                             │     │
│  │  → PostgreSQL + pgvector extension                            │     │
│  │                                                                 │     │
│  │  "I need geospatial queries"                                   │     │
│  │  → PostgreSQL + PostGIS extension                             │     │
│  │                                                                 │     │
│  │  "I need a job queue"                                          │     │
│  │  → PostgreSQL + pgq or SKIP LOCKED                            │     │
│  │                                                                 │     │
│  │  "I need pub/sub"                                               │     │
│  │  → PostgreSQL has LISTEN/NOTIFY                               │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  BENEFIT OF ONE DATABASE:                                                │
│  • One backup strategy                                                   │
│  • One monitoring system                                                 │
│  • One set of credentials                                                │
│  • One operational playbook                                              │
│  • Data stays consistent (transactions!)                                │
│  • Less infrastructure complexity                                        │
│                                                                          │
│  ADD SPECIALIZED DATABASES ONLY WHEN PostgreSQL genuinely can't work.  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: When NOT to Use PostgreSQL

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHEN POSTGRESQL GENUINELY ISN'T ENOUGH                                  │
│  ═══════════════════════════════════════                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  1. SUB-MILLISECOND LATENCY REQUIRED                          │     │
│  │     PostgreSQL: ~1-5ms per query                               │     │
│  │     Redis: ~0.1-0.5ms per query                                │     │
│  │     → Use Redis as a cache in front of PostgreSQL             │     │
│  │                                                                 │     │
│  │  2. TRULY MASSIVE WRITE THROUGHPUT                            │     │
│  │     PostgreSQL (single primary): ~50K writes/sec              │     │
│  │     Cassandra (cluster): 1M+ writes/sec                        │     │
│  │     → Consider Cassandra/ScyllaDB for write-heavy workloads   │     │
│  │                                                                 │     │
│  │  3. GRAPH TRAVERSALS                                           │     │
│  │     "Find all friends-of-friends-of-friends"                  │     │
│  │     PostgreSQL: Recursive CTEs work, but slow for deep graphs │     │
│  │     Neo4j: Optimized for exactly this                          │     │
│  │     → Use Neo4j for highly connected graph queries            │     │
│  │                                                                 │     │
│  │  4. GLOBAL DISTRIBUTION WITH ACTIVE-ACTIVE                    │     │
│  │     Users in Asia write to Asia, users in US write to US      │     │
│  │     PostgreSQL: Primary-replica, writes go to one place       │     │
│  │     Cassandra/Spanner: Multi-region writes                    │     │
│  │     → Use distributed database for true multi-region writes   │     │
│  │                                                                 │     │
│  │  5. SPECIALIZED ANALYTICS                                      │     │
│  │     Petabyte-scale analytical queries                          │     │
│  │     PostgreSQL: OLTP-optimized, analytics can be slow         │     │
│  │     ClickHouse/BigQuery: Columnar, massively parallel         │     │
│  │     → Use OLAP database for heavy analytics                   │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
