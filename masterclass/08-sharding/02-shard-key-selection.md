# Shard Key Selection

> **The Question**: "What column should I shard by? This seems really important."

---

## Visual 1: The Shard Key Is Everything

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE SHARD KEY IS EVERYTHING                                             │
│  ═══════════════════════════                                             │
│                                                                          │
│  The shard key determines which server each row lives on.               │
│  Choose wrong, and your system is fundamentally broken.                 │
│  You cannot easily change it later.                                     │
│                                                                          │
│  EXAMPLE: E-commerce database                                           │
│                                                                          │
│  Option A: Shard by order_id                                            │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Shard 1: orders 1-1M                                          │     │
│  │  Shard 2: orders 1M-2M                                         │     │
│  │  Shard 3: orders 2M-3M                                         │     │
│  │                                                                 │     │
│  │  ✓ "Get order 1234567" → goes to one shard                    │     │
│  │  ✗ "Get all orders for user 42" → must query ALL shards!      │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  Option B: Shard by user_id                                             │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Shard 1: users 1-100K and all their orders                    │     │
│  │  Shard 2: users 100K-200K and all their orders                 │     │
│  │  Shard 3: users 200K-300K and all their orders                 │     │
│  │                                                                 │     │
│  │  ✓ "Get all orders for user 42" → goes to one shard           │     │
│  │  ✓ "Get order 1234567" → need user_id, then one shard         │     │
│  │  ✓ User's orders can JOIN with user's profile (same shard!)   │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  Option B is almost always better for user-centric applications!       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Good vs Bad Shard Keys

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SHARD KEY REQUIREMENTS                                                  │
│  ═════════════════════                                                   │
│                                                                          │
│  A GOOD shard key:                                                       │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  1. HIGH CARDINALITY                                           │     │
│  │     Many distinct values to distribute evenly.                 │     │
│  │     ✓ user_id (millions of users)                              │     │
│  │     ✗ country (only ~200 values, uneven distribution)          │     │
│  │                                                                 │     │
│  │  2. EVEN DISTRIBUTION                                          │     │
│  │     Each value roughly equal data size.                        │     │
│  │     ✓ user_id (most users similar activity)                    │     │
│  │     ✗ company_id (one company might be 50% of data)           │     │
│  │                                                                 │     │
│  │  3. QUERY LOCALITY                                              │     │
│  │     Most queries include the shard key.                        │     │
│  │     ✓ user_id (almost all queries are "for this user")        │     │
│  │     ✗ random_id (queries don't filter by it)                  │     │
│  │                                                                 │     │
│  │  4. IMMUTABLE                                                   │     │
│  │     The value doesn't change.                                  │     │
│  │     ✓ user_id (users don't change their ID)                   │     │
│  │     ✗ email (users can change email, requires re-sharding!)   │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: Common Shard Key Patterns

```
┌─────────────────────────────────────────────────────────────────────────┐
│  COMMON SHARD KEY PATTERNS                                               │
│  ═════════════════════════                                               │
│                                                                          │
│  PATTERN 1: User-centric (SaaS, Social)                                 │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Shard by: user_id                                              │     │
│  │                                                                 │     │
│  │  users:        sharded by id                                    │     │
│  │  posts:        sharded by user_id (author)                     │     │
│  │  comments:     sharded by user_id (commenter)                  │     │
│  │  messages:     sharded by user_id (sender or recipient?)      │     │
│  │                                                                 │     │
│  │  ⚠️  Challenge: What about messages between users on           │     │
│  │      different shards?                                          │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  PATTERN 2: Tenant-centric (Multi-tenant SaaS)                         │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Shard by: tenant_id (company_id, org_id)                      │     │
│  │                                                                 │     │
│  │  All tables include tenant_id                                  │     │
│  │  One tenant's data never touches another's                    │     │
│  │                                                                 │     │
│  │  ⚠️  Challenge: One massive tenant dominates a shard          │     │
│  │      ("noisy neighbor")                                        │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  PATTERN 3: Time-centric (Analytics, Logs)                             │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Shard by: timestamp (bucketed)                                 │     │
│  │                                                                 │     │
│  │  events_2024_q1: Jan-Mar data                                   │     │
│  │  events_2024_q2: Apr-Jun data                                   │     │
│  │                                                                 │     │
│  │  ✓ Easy to drop old data                                       │     │
│  │  ✓ Queries usually time-bounded                                │     │
│  │  ✗ Latest shard is "hot" (all writes go there)                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  PATTERN 4: Geographic (Global apps)                                   │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Shard by: region                                               │     │
│  │                                                                 │     │
│  │  US shard (us-east-1)                                          │     │
│  │  EU shard (eu-west-1)                                          │     │
│  │  Asia shard (ap-southeast-1)                                   │     │
│  │                                                                 │     │
│  │  ✓ Data locality (GDPR, latency)                               │     │
│  │  ✗ Uneven distribution if one region dominates                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: The Hot Shard Problem

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE HOT SHARD PROBLEM                                                   │
│  ═════════════════════                                                   │
│                                                                          │
│  Bad shard key leads to uneven load:                                    │
│                                                                          │
│  Sharded by: first letter of username                                  │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  Shard A:  ████████████████████████████████ (25% of users)     │     │
│  │  Shard B:  ██████████████ (10%)                                │     │
│  │  Shard C:  ████████ (6%)                                       │     │
│  │  ...                                                            │     │
│  │  Shard S:  ████████████████████████████████████████ (35%!)     │     │
│  │  Shard Z:  ██ (1%)                                              │     │
│  │                                                                 │     │
│  │  Shard S is a "hot shard" - it's overloaded!                   │     │
│  │  Other shards are underutilized.                               │     │
│  │  You have 26 servers but the capacity of ~2.                   │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  Better: Hash the user_id to distribute evenly:                        │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                                                                 │     │
│  │  shard = hash(user_id) % num_shards                            │     │
│  │                                                                 │     │
│  │  Shard 0:  ████████████████████████ (24%)                      │     │
│  │  Shard 1:  ██████████████████████████ (26%)                    │     │
│  │  Shard 2:  ████████████████████████ (24%)                      │     │
│  │  Shard 3:  ██████████████████████████ (26%)                    │     │
│  │                                                                 │     │
│  │  Even distribution! All shards similarly loaded.               │     │
│  │                                                                 │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
