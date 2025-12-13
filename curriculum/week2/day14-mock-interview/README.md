# Day 14: Mock Interview Preparation

> **Time:** 2 hours  
> **Goal:** Synthesize your learning and prepare for the interview  
> **Mode:** Practice articulating your knowledge confidently

---

## 🎯 What You'll Cover Today

```
┌─────────────────────────────────────────────────────────────┐
│                     DAY 14 ROADMAP                          │
├─────────────────────────────────────────────────────────────┤
│  1. System Design Scenarios          (45 min)               │
│  2. Technical Deep-Dive Questions    (30 min)               │
│  3. Leadership Questions             (25 min)               │
│  4. Your Story                       (20 min)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. System Design Scenarios

### Scenario 1: Design a Multi-Tenant Database Platform

> "Design a platform like Supabase that manages thousands of customer databases. How would you architect it?"

```
┌─────────────────────────────────────────────────────────────────────────┐
│           APPROACH FRAMEWORK                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. CLARIFY REQUIREMENTS                                               │
│      • How many databases? (1K? 100K? 1M?)                              │
│      • What's the SLA? (99.9%? 99.99%?)                                 │
│      • Geographic distribution needed?                                  │
│      • Self-service or managed?                                         │
│                                                                          │
│   2. HIGH-LEVEL ARCHITECTURE                                            │
│      ┌──────────────────────────────────────────────────────────────┐   │
│      │  Control Plane                                                │   │
│      │  • Provisioning API                                           │   │
│      │  • Monitoring                                                 │   │
│      │  • Billing integration                                        │   │
│      └───────────────────────┬──────────────────────────────────────┘   │
│                              │                                           │
│      ┌───────────────────────▼──────────────────────────────────────┐   │
│      │  Data Plane                                                   │   │
│      │  • Kubernetes clusters per region                            │   │
│      │  • Each tenant = isolated Postgres pod                        │   │
│      │  • Supavisor for connection pooling                          │   │
│      │  • Patroni for HA                                            │   │
│      └──────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   3. KEY DECISIONS TO DISCUSS                                           │
│      • Database per tenant vs. schema per tenant                        │
│      • Instance sizing tiers                                            │
│      • Pause/resume for inactive databases                              │
│      • Backup strategy (PITR)                                           │
│      • Upgrade strategy (rolling vs. blue-green)                        │
│                                                                          │
│   4. SCALING CONSIDERATIONS                                             │
│      • Control plane: Stateless, horizontally scalable                 │
│      • Data plane: Add K8s nodes/clusters as needed                    │
│      • Connection pooling: Supavisor handles multi-tenant              │
│                                                                          │
│   5. MONITORING & OPERATIONS                                            │
│      • Prometheus/Grafana for metrics                                  │
│      • Automated alerting on replication lag, disk, connections       │
│      • Automated failover via Patroni                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Scenario 2: Global E-commerce Database

> "Design the database architecture for an e-commerce platform serving users worldwide with <100ms latency requirements."

```
┌─────────────────────────────────────────────────────────────────────────┐
│           SOLUTION APPROACH                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ARCHITECTURE:                                                          │
│                                                                          │
│   US-EAST (Primary)     US-WEST         EU            ASIA              │
│   ┌────────────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐      │
│   │ Primary        │   │ Read     │   │ Read     │   │ Read     │      │
│   │ (writes)       │──▶│ Replica  │──▶│ Replica  │──▶│ Replica  │      │
│   └────────────────┘   └──────────┘   └──────────┘   └──────────┘      │
│                                                                          │
│   KEY COMPONENTS:                                                        │
│                                                                          │
│   1. Write Path                                                         │
│      • All writes to primary in US-EAST                                │
│      • Async replication to all regions                                │
│      • Latency: Cross-region round-trip (~100-200ms)                   │
│      • Mitigation: Queue writes, confirm async, read-your-writes       │
│                                                                          │
│   2. Read Path                                                          │
│      • Route to nearest replica                                         │
│      • Edge caching for product catalog                                │
│      • <50ms for cached reads                                          │
│                                                                          │
│   3. Caching Strategy                                                   │
│      • Redis cluster per region                                        │
│      • CDN for static product images                                   │
│      • Cache invalidation via CDC                                      │
│                                                                          │
│   4. Data Modeling                                                      │
│      • Partition orders by date (BRIN indexes)                         │
│      • Denormalize for read performance                                │
│      • Product catalog: Heavily cached, eventually consistent OK       │
│      • Orders: Strong consistency required                             │
│                                                                          │
│   5. Failover Strategy                                                  │
│      • Patroni cluster in primary region                               │
│      • Promote US-WEST replica if US-EAST down                        │
│      • DNS failover or load balancer health checks                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Scenario 3: Real-Time Analytics

> "We need real-time dashboards that update as users interact with our product. Design the data pipeline."

```
┌─────────────────────────────────────────────────────────────────────────┐
│           SOLUTION APPROACH                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ARCHITECTURE:                                                          │
│                                                                          │
│   App ─▶ Postgres ─▶ CDC ─▶ Stream Processing ─▶ Dashboard             │
│                                                                          │
│   1. SOURCE                                                             │
│      • Postgres as source of truth                                     │
│      • Events table with append-only pattern                           │
│      • Logical replication enabled                                     │
│                                                                          │
│   2. CDC LAYER                                                          │
│      Options:                                                           │
│      • Debezium → Kafka (enterprise scale)                             │
│      • Supabase Realtime → WebSocket (simpler)                        │
│      • Direct logical replication consumer                             │
│                                                                          │
│   3. PROCESSING                                                         │
│      Options:                                                           │
│      • Materialized views in Postgres (simplest)                       │
│      • Kafka Streams / Flink (complex aggregations)                    │
│      • ClickHouse for OLAP queries                                     │
│                                                                          │
│   4. SERVING                                                            │
│      • WebSocket for live updates                                      │
│      • Supabase Realtime perfect for this                              │
│      • Client subscribes to channel, receives updates                  │
│                                                                          │
│   5. CONSIDERATIONS                                                     │
│      • Latency budget: 1-2 seconds acceptable                          │
│      • Aggregation complexity determines stack                          │
│      • Simple counts/sums: Postgres is fine                            │
│      • Complex analytics: Consider dedicated OLAP                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technical Deep-Dive Questions

### Category: Postgres Internals

**Q: Explain what happens when you execute a query from connection to result.**

> "The client connects to postmaster which forks a backend process. The query goes through parsing (lexical analysis, syntax tree), analysis (semantic checks, permissions), rewriting (view expansion, rules), planning (generate and cost plans, pick cheapest), and execution (access methods, buffer manager). Results flow back through the backend to the client. All data access goes through shared buffers, with dirty pages eventually flushed by bgwriter or checkpoint."

**Q: How does MVCC work and what problem does it solve?**

> "MVCC keeps multiple versions of each row using xmin (creating transaction) and xmax (deleting transaction) markers. When you UPDATE, Postgres creates a new tuple and marks the old one dead. Readers see a consistent snapshot based on their transaction ID - they ignore tuples created after their start or deleted before. This means readers never block writers and vice versa. The tradeoff is dead tuples accumulate and need VACUUM to reclaim space."

**Q: What's the difference between B-tree and GIN indexes?**

> "B-tree indexes are balanced trees for single values - perfect for equality, ranges, and sorting. GIN (Generalized Inverted Index) is for containment queries on composite types. It creates an inverted index where each element points to rows containing it. Use B-tree for 'find user with id=5', GIN for 'find products where tags contains electronics' or 'find documents where JSONB contains key=value'."

### Category: Replication & HA

**Q: When would you choose synchronous vs asynchronous replication?**

> "Async is default - transactions commit without waiting for replicas. Faster but risks data loss if primary fails before replica catches up. Sync commits wait for replica acknowledgment, guaranteeing zero data loss (RPO=0) but adding network latency to every write. Use sync for financial transactions or when you can't lose any data. Use async for most other cases where brief data loss is acceptable and performance matters more."

**Q: How would you handle split-brain in a HA setup?**

> "Split-brain is when network partition causes two nodes to both think they're primary. Prevention: use distributed consensus like etcd with Patroni - you need majority quorum to hold the leader lock. If you're partitioned from majority, you can't become leader. Additionally, implement fencing (STONITH) to force-stop the old primary. Never rely on just two nodes - always have odd number or a witness node for quorum."

### Category: Performance

**Q: A query is slow. Walk me through your debugging process.**

> "First, EXPLAIN ANALYZE with BUFFERS to see actual execution. I look for: estimates vs actuals mismatch (stale stats → ANALYZE), sequential scans with high rows removed (missing index), hash joins with batches > 1 (need more work_mem), nested loops with seq scan inner (missing join index). Then I check if the query can be rewritten - avoid functions on indexed columns, use EXISTS vs IN for large subqueries, select only needed columns. Finally verify the fix doesn't regress other queries."

**Q: How do you handle a table that's getting too large?**

> "First, assess: is it query performance, maintenance (VACUUM), or storage? For queries: ensure indexes are optimal, consider partial indexes. For maintenance: tune autovacuum specifically for that table. For scale: partitioning by time for append-only data, can DROP old partitions instantly instead of DELETE. If single-node isn't enough: sharding with Citus or application-level. Partitioning is usually the first step - it helps maintenance, queries (partition pruning), and operations."

---

## 3. Leadership Questions

### Team Management

**Q: How do you align multiple teams toward shared goals?**

> "I establish clear quarterly roadmaps tied to company priorities, with each team owning specific outcomes. Regular cross-team syncs surface dependencies early. I create shared OKRs where teams contribute to each other's success. For technical decisions that span teams, I use RFCs that require review from affected teams. Most importantly, I build relationships so leads communicate directly when issues arise, not just through me."

**Q: How do you handle a team member who's underperforming?**

> "First, I diagnose: is it skills, motivation, personal issues, or role mismatch? I have a direct conversation about observations and impact, not accusations. We create a clear improvement plan with specific metrics and timeline. I increase 1:1 frequency for coaching and remove blockers. If it's a skills gap, I pair them with strong teammates. If no improvement after earnest effort, I have an honest conversation about whether this role is right for them."

### Technical Direction

**Q: How do you balance innovation with reliability?**

> "We can't innovate if we're firefighting incidents, but we can't just maintain forever. I allocate roughly 70% to product work, 20% to technical debt and reliability, 10% to innovation. For major innovations like OrioleDB integration, we start with opt-in beta, gather data, then expand. Feature flags let us ship fast and roll back if needed. On-call burden is a key metric - if it's high, we invest in reliability until it's manageable."

**Q: How would you approach integrating OrioleDB into Supabase?**

> "Phased approach. First, internal testing on non-critical workloads to understand operational characteristics. Then, opt-in beta for customers who want to try it, with clear documentation on what's different. Monitor for issues we didn't anticipate. Create migration tooling and documentation. Eventually, make it an option at database creation. I wouldn't make it default until it's battle-tested and we can confidently support it at scale."

### Your Leadership Style

**Q: Describe your management philosophy.**

> "Context over control. I hire smart people and give them the context they need - company strategy, customer needs, technical constraints - then let them figure out solutions. I'm hands-on technically but not a micromanager. I believe in written communication for async teams, short sync meetings for decisions, and radical transparency about what's working and what's not. I protect my team's focus from distractions and take responsibility for their failures while giving them credit for successes."

---

## 4. Your Story

### Framing Your Background

```
┌─────────────────────────────────────────────────────────────────────────┐
│           POSITIONING YOUR FRONTEND BACKGROUND                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   DON'T SAY:                                                            │
│   "I'm a frontend developer trying to learn backend"                    │
│                                                                          │
│   DO SAY:                                                                │
│   "I bring strong systems thinking from building complex frontend       │
│   applications. I understand performance optimization, caching,         │
│   state management, and user experience - all of which translate        │
│   to database platform development. I've deliberately invested in       │
│   deep-diving on Postgres because I see it as the foundation of         │
│   the modern data stack."                                               │
│                                                                          │
│   TRANSFERABLE SKILLS:                                                  │
│   • Performance optimization (React → Query optimization)              │
│   • State management (Redux → MVCC, transactions)                      │
│   • API design (REST/GraphQL → PostgREST, pg_graphql)                  │
│   • Developer experience (UI/UX → Database platform UX)                │
│   • Debugging complex systems (DevTools → EXPLAIN ANALYZE)             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Addressing the Learning Gap Honestly

**Q: You started learning SQL recently. Why should we consider you for Head of Databases?**

> "I'm a fast learner with a strong technical foundation. In two weeks, I've gone from SQL basics to understanding MVCC, WAL, replication, and Supabase's architecture. What I bring is leadership experience, developer empathy from building products, and fresh perspective. I won't pretend to know everything, but I'll hire people who do, learn from them rapidly, and provide the organizational leadership to ship great products. The technical skills I can acquire; the judgment and leadership approach take years to develop."

### What You're Excited About

**Q: Why Supabase specifically?**

> "Three things. First, Postgres itself - it's eating the database world and Supabase is leading that charge. Second, the Postgres-first philosophy - you're not building a proprietary database, you're making Postgres accessible, which means no vendor lock-in and massive ecosystem leverage. Third, the specific technical bets like OrioleDB and Wrappers - you're investing in the future of Postgres, not just using it as-is. I want to be part of that."

---

## 🧠 Final Synthesis

### What You've Learned in 14 Days

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    YOUR POSTGRES KNOWLEDGE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   FUNDAMENTALS:                                                          │
│   ✓ SQL from zero to competent                                          │
│   ✓ How Postgres stores data (pages, tuples, MVCC)                      │
│   ✓ Process and memory architecture                                    │
│   ✓ All index types and when to use each                               │
│                                                                          │
│   PERFORMANCE:                                                           │
│   ✓ Reading EXPLAIN ANALYZE                                             │
│   ✓ Query optimization techniques                                       │
│   ✓ Real-world patterns (N+1, pagination, pooling)                      │
│                                                                          │
│   OPERATIONS:                                                            │
│   ✓ Replication (physical and logical)                                  │
│   ✓ High availability (Patroni, failover)                               │
│   ✓ Scaling strategies                                                  │
│   ✓ ETL and CDC                                                         │
│                                                                          │
│   SUPABASE-SPECIFIC:                                                    │
│   ✓ Architecture and key components                                    │
│   ✓ Extensions (pg_graphql, pgvector, pg_net)                          │
│   ✓ Row Level Security                                                  │
│   ✓ OrioleDB and future direction                                       │
│   ✓ Understanding of the teams you'd lead                               │
│                                                                          │
│   You can now have intelligent conversations about Postgres             │
│   architecture, operations, and Supabase's platform!                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interview Day Checklist

```
□ Review cheatsheets morning of interview
□ Have examples ready for each technical concept
□ Prepare 3 questions to ask them
□ Be honest about what you don't know
□ Show enthusiasm for learning
□ Demonstrate leadership experience clearly
□ Connect your frontend background to relevant skills
□ Be specific about what excites you about Supabase
```

---

## Good Luck! 🐘

You've built a strong foundation. The key now is confidence - you know more about Postgres than you did two weeks ago, and your leadership skills and learning velocity are real assets. Go show them what you've got!

