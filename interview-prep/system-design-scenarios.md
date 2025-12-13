# System Design Scenarios

## Scenario 1: Multi-Tenant Database Platform

**Question:** "Design a platform like Supabase that manages thousands of customer databases."

### Clarifying Questions
- Scale: How many databases? (10K? 100K? 1M?)
- SLA requirements (99.9%? 99.99%?)
- Global distribution needed?
- Self-service provisioning?

### Architecture

```
┌─────────────────────────────────────────────────────┐
│ Control Plane (Stateless)                           │
│ • Provisioning API                                  │
│ • User Dashboard                                    │
│ • Billing Integration                               │
│ • Monitoring & Alerting                             │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│ Data Plane (Per Region)                             │
│ • Kubernetes cluster                                │
│ • Each tenant = Postgres pod                        │
│ • Patroni for HA                                    │
│ • Supavisor for pooling                             │
│ • Automated backups to S3                           │
└─────────────────────────────────────────────────────┘
```

### Key Decisions
1. **Isolation model:** Database per tenant (full isolation, Supabase approach)
2. **Sizing tiers:** Starter (shared), Pro (dedicated small), Enterprise (dedicated large)
3. **Pause/resume:** Inactive databases pause to save resources
4. **Upgrades:** Rolling upgrades with Patroni switchover

---

## Scenario 2: Global E-commerce Database

**Question:** "Design database architecture for worldwide e-commerce with <100ms latency."

### Architecture

```
                    US-EAST (Primary)
                    ┌─────────────┐
                    │  Primary    │
                    │  (writes)   │
                    └─────┬───────┘
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ US-WEST     │ │ EU          │ │ ASIA        │
    │ Read Replica│ │ Read Replica│ │ Read Replica│
    │ + Redis     │ │ + Redis     │ │ + Redis     │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### Key Design Points
- **Writes:** All to primary, accept cross-region latency (100-200ms)
- **Reads:** Route to nearest replica, cache heavily
- **Consistency:** Product catalog = eventual OK, Orders = strong required
- **Caching:** Redis per region, invalidate via CDC
- **Failover:** Patroni in primary region, promote other region if needed

---

## Scenario 3: Real-Time Analytics Dashboard

**Question:** "Design system for real-time dashboards that update as events occur."

### Architecture Options

**Simple (Postgres-only):**
```
App → Postgres → Materialized View → Supabase Realtime → Dashboard
         ↓
    pg_cron refresh
```

**Complex (High volume):**
```
App → Postgres → Debezium → Kafka → Stream Processing → Dashboard
                    ↓
              ClickHouse (OLAP)
```

### Decision Criteria
- < 10K events/sec: Postgres materialized views + Realtime
- > 100K events/sec: Kafka + dedicated OLAP (ClickHouse)
- Latency requirement: 1-2 sec acceptable for most dashboards

---

## Scenario 4: Event-Driven Microservices

**Question:** "Design reliable event publishing from Postgres to other services."

### Transactional Outbox Pattern

```sql
-- Business transaction + event in same transaction
BEGIN;
INSERT INTO orders (user_id, amount) VALUES (1, 99.99);
INSERT INTO outbox (aggregate_id, event_type, payload)
VALUES (currval('orders_id_seq'), 'order.created', '{"amount": 99.99}');
COMMIT;
```

```
Postgres → CDC (logical replication) → Kafka → Consumers
    ↓
 outbox table polled or streamed
```

### Benefits
- Guaranteed delivery (event in same transaction as data)
- At-least-once semantics
- Consumers can replay from Kafka

---

## General Framework for System Design

```
1. CLARIFY
   - Scale (users, data volume, QPS)
   - Latency requirements
   - Consistency requirements
   - Geographic distribution

2. HIGH-LEVEL DESIGN
   - Draw major components
   - Identify data flows
   - Choose between simple vs. distributed

3. DIVE DEEP on key areas
   - Data model and access patterns
   - Scaling bottlenecks
   - Failure modes

4. DISCUSS TRADEOFFS
   - Why this approach vs. alternatives
   - What we're optimizing for
   - What we're sacrificing
```

