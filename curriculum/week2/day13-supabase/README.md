# Day 13: Supabase Platform Deep Dive

> **Time:** 2 hours  
> **Goal:** Understand Supabase's architecture and Postgres innovations  
> **Critical for:** Your interview! This is Supabase-specific knowledge

---

## 🎯 What You'll Learn Today

```
┌─────────────────────────────────────────────────────────────┐
│                     DAY 13 ROADMAP                          │
├─────────────────────────────────────────────────────────────┤
│  1. Supabase Architecture            (20 min)               │
│  2. Key Extensions                   (25 min)               │
│  3. Row Level Security               (20 min)               │
│  4. Edge Functions & pg_net          (15 min)               │
│  5. OrioleDB                         (25 min)               │
│  6. Supabase's Postgres Teams        (15 min)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Supabase Architecture

### The Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SUPABASE ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      Client SDK                                  │   │
│   │   JavaScript, Python, Dart, Swift, Kotlin                       │   │
│   └───────────────────────────┬─────────────────────────────────────┘   │
│                               │                                          │
│   ┌───────────────────────────▼─────────────────────────────────────┐   │
│   │                      Kong (API Gateway)                          │   │
│   │                                                                  │   │
│   │   • Rate limiting                                                │   │
│   │   • Authentication                                               │   │
│   │   • Request routing                                              │   │
│   └───────────────────────────┬─────────────────────────────────────┘   │
│                               │                                          │
│   ┌───────────────────────────┼──────────────────────────────────────┐  │
│   │                           ▼                                       │  │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │  │
│   │   │  PostgREST   │  │   GoTrue     │  │   Storage    │           │  │
│   │   │              │  │              │  │              │           │  │
│   │   │  REST API    │  │  Auth API    │  │  File API    │           │  │
│   │   │  Auto-gen    │  │  JWT tokens  │  │  S3-backed   │           │  │
│   │   │  from schema │  │  OAuth       │  │              │           │  │
│   │   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │  │
│   │          │                 │                  │                   │  │
│   │   ┌──────┴─────────────────┴──────────────────┴───────┐          │  │
│   │   │                                                    │          │  │
│   │   │                    PostgreSQL                      │          │  │
│   │   │                                                    │          │  │
│   │   │   ┌────────────────────────────────────────────┐  │          │  │
│   │   │   │  Extensions:                                │  │          │  │
│   │   │   │  • pg_graphql  • pgvector  • pg_net        │  │          │  │
│   │   │   │  • PostGIS     • pg_cron   • pgjwt         │  │          │  │
│   │   │   │  • plv8        • http      • pgsodium      │  │          │  │
│   │   │   └────────────────────────────────────────────┘  │          │  │
│   │   │                                                    │          │  │
│   │   └────────────────────────────────────────────────────┘          │  │
│   │                                                                   │  │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │  │
│   │   │   Realtime   │  │  Supavisor   │  │    Edge      │           │  │
│   │   │              │  │              │  │  Functions   │           │  │
│   │   │  WebSocket   │  │  Connection  │  │              │           │  │
│   │   │  broadcasts  │  │  Pooling     │  │  Deno-based  │           │  │
│   │   └──────────────┘  └──────────────┘  └──────────────┘           │  │
│   │                                                                   │  │
│   └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### What Each Component Does

| Component | Purpose | Technology |
|-----------|---------|------------|
| **PostgREST** | Auto-generate REST API from schema | Haskell |
| **GoTrue** | User auth, JWT tokens, OAuth | Go |
| **Storage** | File uploads with RLS | Go + S3 |
| **Realtime** | WebSocket subscriptions | Elixir |
| **Supavisor** | Connection pooling | Elixir |
| **Edge Functions** | Serverless functions | Deno |
| **Kong** | API gateway, rate limiting | Lua |
| **PostgreSQL** | The database! | C |

### Postgres-First Philosophy

```
┌─────────────────────────────────────────────────────────────────────────┐
│               SUPABASE'S POSTGRES-FIRST APPROACH                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Traditional Backend-as-a-Service:                                     │
│   • Custom query language or proprietary API                            │
│   • Data locked in vendor format                                        │
│   • Limited to what vendor supports                                     │
│                                                                          │
│   Supabase:                                                              │
│   • Standard SQL (no lock-in!)                                          │
│   • Direct Postgres connection available                                │
│   • 50+ standard extensions                                             │
│   • Can migrate to/from any Postgres                                    │
│                                                                          │
│   "Postgres does X? So does Supabase."                                  │
│                                                                          │
│   All features built ON TOP of Postgres:                                │
│   • Auth → Postgres tables + RLS                                        │
│   • Storage → Postgres metadata + S3                                    │
│   • Realtime → Postgres logical replication                             │
│   • Edge Functions → Can query Postgres                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Extensions

### pg_graphql

```sql
-- GraphQL from your schema, automatically!
-- No code generation, no additional server

-- Enable
CREATE EXTENSION pg_graphql;

-- It introspects your schema and generates a GraphQL API
-- POST to /graphql endpoint:

-- Query:
{
  ordersCollection(first: 10) {
    edges {
      node {
        id
        status
        user {
          username
        }
      }
    }
  }
}

-- Mutations work too!
mutation {
  insertIntoOrdersCollection(objects: [{
    userId: 1,
    status: "pending",
    totalAmount: 99.99
  }]) {
    affectedCount
    records {
      id
    }
  }
}
```

### pgvector (Vector Search)

```sql
-- Enable vector extension
CREATE EXTENSION vector;

-- Store embeddings
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  content TEXT,
  embedding vector(1536)  -- OpenAI embedding size
);

-- Insert with embedding (from your AI model)
INSERT INTO documents (content, embedding) VALUES (
  'Introduction to PostgreSQL',
  '[0.1, 0.2, 0.3, ...]'::vector
);

-- Similarity search (cosine distance)
SELECT content, 1 - (embedding <=> query_embedding) AS similarity
FROM documents
ORDER BY embedding <=> '[0.15, 0.22, 0.28, ...]'::vector
LIMIT 10;

-- Create index for speed
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### pg_cron (Scheduled Jobs)

```sql
-- Enable
CREATE EXTENSION pg_cron;

-- Schedule a job
SELECT cron.schedule(
  'cleanup-old-sessions',
  '0 3 * * *',  -- Every day at 3 AM
  $$DELETE FROM sessions WHERE expires_at < NOW() - INTERVAL '7 days'$$
);

-- Schedule aggregate refresh
SELECT cron.schedule(
  'refresh-stats',
  '*/15 * * * *',  -- Every 15 minutes
  'REFRESH MATERIALIZED VIEW CONCURRENTLY order_stats'
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- Unschedule
SELECT cron.unschedule('cleanup-old-sessions');
```

### pg_net (HTTP from SQL)

```sql
-- Make HTTP requests from within Postgres!
-- Async by default (non-blocking)

-- POST to webhook
SELECT net.http_post(
  url := 'https://api.example.com/webhook',
  headers := '{"Authorization": "Bearer token123"}'::jsonb,
  body := '{"event": "order_created", "order_id": 123}'::jsonb
);

-- Check response
SELECT * FROM net._http_response WHERE id = <request_id>;

-- Common use cases:
-- • Trigger external services on data changes
-- • Send notifications
-- • Call AI APIs
```

### pgsodium (Encryption)

```sql
-- Server-side encryption with key management
CREATE EXTENSION pgsodium;

-- Create an encrypted column
CREATE TABLE secrets (
  id SERIAL PRIMARY KEY,
  encrypted_data bytea
);

-- Encrypt data
INSERT INTO secrets (encrypted_data)
VALUES (pgsodium.crypto_secretbox(
  'sensitive data',
  pgsodium.crypto_secretbox_noncegen(),
  (SELECT id FROM pgsodium.key WHERE name = 'my_key')
));
```

---

## 3. Row Level Security (RLS)

### The Core Security Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   ROW LEVEL SECURITY                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Traditional authorization:                                            │
│   App → Check permissions → Query database                              │
│   (Security in application layer)                                       │
│                                                                          │
│   Supabase with RLS:                                                    │
│   App → Query database → Postgres enforces permissions                  │
│   (Security in database layer!)                                         │
│                                                                          │
│   Benefits:                                                              │
│   ✓ Security can't be bypassed by API bugs                             │
│   ✓ Works with any client (REST, GraphQL, direct)                      │
│   ✓ Single source of truth for permissions                             │
│   ✓ Auditable SQL policies                                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### RLS Policies

```sql
-- Enable RLS on table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own orders
CREATE POLICY "Users see own orders" ON orders
  FOR SELECT
  USING (user_id = auth.uid());  -- auth.uid() from Supabase Auth

-- Users can insert orders for themselves
CREATE POLICY "Users create own orders" ON orders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own pending orders
CREATE POLICY "Users update own pending orders" ON orders
  FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins full access" ON orders
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
```

### RLS with Auth Context

```sql
-- Supabase sets these automatically from JWT
-- auth.uid()  - Current user's UUID
-- auth.jwt()  - Full JWT claims
-- auth.role() - Current role

-- Example: Multi-tenant RLS
CREATE POLICY "Tenant isolation" ON orders
  FOR ALL
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Example: Role-based access
CREATE POLICY "Managers see team orders" ON orders
  FOR SELECT
  USING (
    user_id = auth.uid()  -- Own orders
    OR EXISTS (           -- Or team member orders
      SELECT 1 FROM team_members 
      WHERE manager_id = auth.uid() 
      AND member_id = orders.user_id
    )
  );
```

---

## 4. Edge Functions & pg_net

### Edge Functions Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    EDGE FUNCTIONS                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   • Serverless functions running at the edge                            │
│   • Deno runtime (TypeScript/JavaScript)                                │
│   • Direct database access                                              │
│   • Global deployment (low latency)                                     │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  // supabase/functions/process-order/index.ts                    │   │
│   │                                                                  │   │
│   │  import { createClient } from '@supabase/supabase-js'           │   │
│   │                                                                  │   │
│   │  Deno.serve(async (req) => {                                    │   │
│   │    const supabase = createClient(                               │   │
│   │      Deno.env.get('SUPABASE_URL')!,                            │   │
│   │      Deno.env.get('SUPABASE_SERVICE_KEY')!                      │   │
│   │    )                                                             │   │
│   │                                                                  │   │
│   │    const { orderId } = await req.json()                         │   │
│   │                                                                  │   │
│   │    // Direct database access!                                   │   │
│   │    const { data: order } = await supabase                       │   │
│   │      .from('orders')                                            │   │
│   │      .update({ status: 'processed' })                           │   │
│   │      .eq('id', orderId)                                         │   │
│   │      .single()                                                   │   │
│   │                                                                  │   │
│   │    // Call external API                                          │   │
│   │    await fetch('https://shipping.api/create', { ... })          │   │
│   │                                                                  │   │
│   │    return new Response(JSON.stringify(order))                   │   │
│   │  })                                                              │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Database Webhooks with pg_net

```sql
-- Trigger external webhook when order is created
CREATE OR REPLACE FUNCTION notify_order_webhook()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://api.example.com/orders/webhook',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.webhook_secret')
    ),
    body := jsonb_build_object(
      'event', 'order.created',
      'order_id', NEW.id,
      'user_id', NEW.user_id,
      'total', NEW.total_amount
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_created_webhook
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_webhook();
```

---

## 5. OrioleDB

### What is OrioleDB?

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ORIOLEDB                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Next-generation storage engine for PostgreSQL                         │
│   Developed by OrioleDB team, heavily invested by Supabase              │
│                                                                          │
│   Current Postgres Storage:                                              │
│   • Heap-based (MVCC tuples everywhere)                                 │
│   • Table bloat from dead tuples                                        │
│   • Requires regular VACUUM                                             │
│   • 32-byte tuple header overhead                                       │
│                                                                          │
│   OrioleDB:                                                              │
│   • Row-level WAL (more efficient)                                      │
│   • Undo log instead of in-place MVCC                                   │
│   • No more table bloat!                                                │
│   • No more VACUUM for bloat!                                           │
│   • Index-organized tables option                                       │
│   • Copy-on-write checkpoints                                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### How OrioleDB Differs

```
┌─────────────────────────────────────────────────────────────────────────┐
│           TRADITIONAL POSTGRES vs ORIOLEDB                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   UPDATE users SET name = 'New' WHERE id = 1;                           │
│                                                                          │
│   TRADITIONAL POSTGRES:                                                 │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  Heap Page                                                     │    │
│   │  ┌─────────────────────────────────────────────────────────┐  │    │
│   │  │ Old tuple (id=1, name='Old')  [xmax set, DEAD]          │  │    │
│   │  │ New tuple (id=1, name='New')  [xmin set, LIVE]          │  │    │
│   │  └─────────────────────────────────────────────────────────┘  │    │
│   │  ↑ Both versions in heap until VACUUM!                        │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                          │
│   ORIOLEDB:                                                             │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  Data Page                    Undo Log                        │    │
│   │  ┌─────────────────────┐     ┌─────────────────────┐         │    │
│   │  │ (id=1, name='New')  │     │ Old value: 'Old'    │         │    │
│   │  │ [Only current ver]  │     │ [For rollback]      │         │    │
│   │  └─────────────────────┘     └─────────────────────┘         │    │
│   │  ↑ No bloat! Undo expires automatically                       │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                          │
│   Benefits:                                                              │
│   • 2-5x better write performance                                       │
│   • Stable performance (no bloat)                                       │
│   • Less storage space                                                  │
│   • No VACUUM overhead                                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### OrioleDB Status

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ORIOLEDB ROADMAP                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Currently: Postgres extension (CREATE EXTENSION orioledb)             │
│   Goal: Merge into PostgreSQL core                                      │
│                                                                          │
│   Supabase investment:                                                   │
│   • Major sponsor of OrioleDB development                               │
│   • Planning to offer as storage engine option                          │
│   • Will particularly help write-heavy workloads                        │
│                                                                          │
│   Timeline:                                                              │
│   • Extension available now for testing                                 │
│   • Production readiness ongoing                                        │
│   • Postgres core inclusion: Multi-year effort                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Supabase's Postgres Teams

### Understanding the Role You're Applying For

```
┌─────────────────────────────────────────────────────────────────────────┐
│           POSTGRES ENGINEERING AT SUPABASE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Teams you'd lead (from job description):                              │
│                                                                          │
│   1. MULTIGRES                                                          │
│      • Multi-tenant Postgres infrastructure                             │
│      • Managing millions of databases                                   │
│      • Automated provisioning and scaling                               │
│                                                                          │
│   2. ORIOLEDB                                                           │
│      • Next-gen storage engine                                          │
│      • Performance improvements                                         │
│      • Integration into Supabase                                        │
│                                                                          │
│   3. ETL                                                                │
│      • Data import/export                                               │
│      • Wrappers (FDW framework)                                         │
│      • Integration with external services                               │
│                                                                          │
│   4. STORAGE                                                            │
│      • File storage service                                             │
│      • S3 integration                                                   │
│      • RLS for files                                                    │
│                                                                          │
│   5. WRAPPERS                                                           │
│      • Supabase Wrappers (Stripe, Firebase, etc.)                      │
│      • FDW development                                                  │
│      • External data integration                                        │
│                                                                          │
│   6. POSTGRES                                                           │
│      • Core Postgres features                                           │
│      • Extensions                                                       │
│      • Performance optimization                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Technical Challenges

```
┌─────────────────────────────────────────────────────────────────────────┐
│           TECHNICAL CHALLENGES AT SCALE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. MULTI-TENANT SCALE                                                 │
│      • Hundreds of thousands of databases                               │
│      • Automated provisioning in seconds                                │
│      • Pause/resume for inactive databases                              │
│      • Efficient resource utilization                                   │
│                                                                          │
│   2. GLOBAL DISTRIBUTION                                                │
│      • Multiple regions worldwide                                       │
│      • Edge function deployment                                         │
│      • Latency optimization                                             │
│      • Cross-region replication                                         │
│                                                                          │
│   3. RELIABILITY                                                        │
│      • 99.9%+ uptime target                                            │
│      • Automated failover                                               │
│      • Point-in-time recovery                                           │
│      • Disaster recovery                                                │
│                                                                          │
│   4. DEVELOPER EXPERIENCE                                               │
│      • Instant database creation                                        │
│      • Migration handling                                               │
│      • Dashboard experience                                             │
│      • Local development (supabase start)                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎤 Interview Angle

**Q: "Why is Supabase built on Postgres instead of building a custom database?"**

> "Postgres is the most extensible database in the world. Instead of reinventing the wheel, Supabase builds on 30+ years of Postgres development. Users get standard SQL - no vendor lock-in. All the features (Auth, Realtime, Storage) use Postgres as the source of truth. Supabase extends Postgres rather than replacing it, which means users can always take their data and run it on any Postgres."

**Q: "How would you explain Row Level Security to a developer new to it?"**

> "RLS moves authorization from your application layer into the database. Instead of checking 'can this user see this order?' in your API code, you write a Postgres policy like 'users can SELECT orders WHERE user_id = auth.uid()'. This means security is enforced regardless of how you access the data - REST API, GraphQL, or direct SQL. One policy, consistent enforcement everywhere."

**Q: "What excites you about OrioleDB?"**

> "OrioleDB addresses Postgres's biggest operational headache: VACUUM and table bloat. By using an undo log instead of keeping dead tuples in-place, it eliminates bloat entirely. For write-heavy workloads, this means stable performance without the operational complexity of vacuum tuning. If it becomes production-ready and merges into Postgres core, it could be the biggest Postgres improvement in years."

---

## 🧠 Key Takeaways

```
┌─────────────────────────────────────────────────────────────┐
│         SUPABASE KNOWLEDGE FOR INTERVIEW                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ARCHITECTURE:                                              │
│  • Postgres-first: Everything built on Postgres             │
│  • PostgREST: Auto-generated REST from schema               │
│  • GoTrue: Auth with RLS integration                        │
│  • Realtime: WebSocket via logical replication              │
│                                                              │
│  KEY EXTENSIONS:                                            │
│  • pg_graphql: GraphQL from schema                          │
│  • pgvector: AI/embedding search                            │
│  • pg_net: HTTP from SQL                                    │
│  • pg_cron: Scheduled jobs                                  │
│                                                              │
│  SECURITY:                                                  │
│  • RLS: Database-level authorization                        │
│  • JWT integration via auth.uid()                           │
│  • Policies define access rules                             │
│                                                              │
│  FUTURE:                                                    │
│  • OrioleDB for better write performance                    │
│  • Supabase Wrappers for external data                     │
│  • Continued Postgres ecosystem investment                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏭️ Tomorrow: Day 14

**Mock Interview Preparation** - System design scenarios, common questions, and how to present yourself as a future Head of Postgres!

