# Section 8.4: Shard Rebalancing - The Tax You Pay Forever

> **The Question**: "We sharded our database. Now what?"

---

## Visual 1: Why You Need to Rebalance

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REBALANCING - WHY SHARDING IS A MARRIAGE, NOT A DATE                    │
│  ════════════════════════════════════════════════════                    │
│                                                                          │
│  You sharded your database. Congratulations! Now the real work begins.  │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│  SCENARIO: 6 MONTHS AFTER SHARDING                                      │
│  ─────────────────────────────────                                       │
│                                                                          │
│  You sharded by user_id. 4 shards. Nice and even... at first.          │
│                                                                          │
│  MONTH 1:                                                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │  Shard A    │ │  Shard B    │ │  Shard C    │ │  Shard D    │        │
│  │  25% data   │ │  25% data   │ │  25% data   │ │  25% data   │        │
│  │  25% traffic│ │  25% traffic│ │  25% traffic│ │  25% traffic│        │
│  │  CPU: 40%   │ │  CPU: 40%   │ │  CPU: 40%   │ │  CPU: 40%   │        │
│  │  ████░░░░░░ │ │  ████░░░░░░ │ │  ████░░░░░░ │ │  ████░░░░░░ │        │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │
│  Perfect! Balanced! Ship it!                                            │
│                                                                          │
│  MONTH 6:                                                                │
│  A viral TikTok creator joins. They're on Shard B.                      │
│  Their 10 million followers all sign up. All go to Shard B.             │
│                                                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │  Shard A    │ │  Shard B    │ │  Shard C    │ │  Shard D    │        │
│  │  15% data   │ │  55% data   │ │  15% data   │ │  15% data   │        │
│  │  10% traffic│ │  70% traffic│ │  10% traffic│ │  10% traffic│        │
│  │  CPU: 20%   │ │  CPU: 98%   │ │  CPU: 20%   │ │  CPU: 20%   │        │
│  │  ██░░░░░░░░ │ │  █████████▓ │ │  ██░░░░░░░░ │ │  ██░░░░░░░░ │        │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │
│                       ↑                                                  │
│                  HOT SHARD! 🔥                                           │
│                  On-call at 3 AM!                                        │
│                                                                          │
│  You need to REBALANCE.                                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: The Five Horsemen of Rebalancing

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE FIVE HORSEMEN OF REBALANCING                                        │
│  ════════════════════════════════                                        │
│                                                                          │
│  1. HOT SHARDS (Uneven Traffic)                                         │
│     ─────────────────────────────                                        │
│     Some users are more active than others.                             │
│     A celebrity joins? Their shard gets hammered.                       │
│     A gaming clan? They're all on one shard, playing together.          │
│                                                                          │
│  2. DATA SKEW (Uneven Size)                                             │
│     ────────────────────────                                             │
│     Some users have 10 posts. Some have 10 million.                     │
│     Shard by user_id? Power users bloat their shard.                    │
│     One shard runs out of disk while others are empty.                  │
│                                                                          │
│  3. ADDING CAPACITY (Scaling Out)                                       │
│     ──────────────────────────────                                       │
│     4 shards aren't enough anymore. Need 8.                             │
│     Where do the new shards get data from?                              │
│     How do you split existing shards?                                   │
│                                                                          │
│  4. REMOVING CAPACITY (Scaling In)                                      │
│     ───────────────────────────────                                      │
│     Traffic dropped. 8 shards are wasteful.                             │
│     Consolidate to 4. Move data. Shut down servers.                     │
│     (Rare, but happens during cost optimization)                        │
│                                                                          │
│  5. BAD SHARD KEY (You Made a Mistake)                                  │
│     ──────────────────────────────────                                   │
│     Sharded by created_date? All new users hit the latest shard.       │
│     Sharded by country? USA shard is 10x bigger than others.            │
│     You need to re-shard with a better key.                             │
│     This is THE WORST case. Essentially a full migration.               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: Why Rebalancing is Terrifying

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHY REBALANCING IS TERRIFYING                                           │
│  ═════════════════════════════                                           │
│                                                                          │
│  THE PROBLEM:                                                            │
│  You need to move 50GB of data from Shard B to Shard E.                 │
│  Your system is handling 10,000 requests/second.                        │
│  You cannot have downtime.                                               │
│  You cannot lose data.                                                   │
│  You cannot have inconsistencies.                                        │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│  THE COMPLICATIONS:                                                      │
│                                                                          │
│  1. DATA IS BEING WRITTEN DURING THE MOVE                               │
│     ─────────────────────────────────────                                │
│     You start copying user 12345 from Shard B to Shard E.               │
│     While copying, user 12345 updates their profile on Shard B.         │
│     Your copy is now stale. What do you do?                             │
│                                                                          │
│  2. THE ROUTING TABLE IS CHANGING                                        │
│     ────────────────────────────────                                     │
│     Your app needs to know: "user 12345 → which shard?"                 │
│     During migration: is user 12345 on B or E? Or both?                 │
│     All app servers need consistent routing. At the same moment.        │
│                                                                          │
│  3. THE DATA MIGHT BE INCONSISTENT                                      │
│     ──────────────────────────────                                       │
│     User 12345's profile is on Shard E now.                             │
│     But their posts are still on Shard B (being moved).                 │
│     Query joins profile + posts: Incomplete results!                    │
│                                                                          │
│  4. ROLLBACK IS HARD                                                     │
│     ─────────────────                                                    │
│     You moved 40GB. Something went wrong. Roll back?                    │
│     The source shard got new writes. The target got new writes.         │
│     Which is the source of truth now?                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: Strategy - Dual Writes (The Safe Way)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STRATEGY 2: DUAL WRITES (The Safe Way)                                  │
│  ══════════════════════════════════════                                  │
│                                                                          │
│  PHASE 1: Start dual-writing                                            │
│  ────────────────────────────                                            │
│  • New writes for users being moved go to BOTH shards                   │
│  • Shard B (source) AND Shard E (destination)                           │
│                                                                          │
│       ┌─────────────┐                                                    │
│       │    WRITE    │                                                    │
│       │  (user 123) │                                                    │
│       └──────┬──────┘                                                    │
│              │                                                           │
│              ├─────────────────────┐                                     │
│              ▼                     ▼                                     │
│       ┌─────────────┐       ┌─────────────┐                             │
│       │  Shard B    │       │  Shard E    │                             │
│       │  (source)   │       │  (target)   │                             │
│       │   WRITE ✓   │       │   WRITE ✓   │                             │
│       └─────────────┘       └─────────────┘                             │
│                                                                          │
│  PHASE 2: Backfill historical data                                      │
│  ─────────────────────────────────                                       │
│  • Copy old data from B to E in background                              │
│  • New writes already going to both, so we're catching up               │
│                                                                          │
│  PHASE 3: Verify consistency                                            │
│  ───────────────────────────                                             │
│  • Compare checksums between B and E for migrated users                 │
│  • Run validation queries                                               │
│                                                                          │
│  PHASE 4: Switch reads                                                  │
│  ─────────────────────                                                   │
│  • Update routing: reads for user 123 now go to E                       │
│  • Writes still going to both (safety net)                              │
│                                                                          │
│  PHASE 5: Stop dual writes                                              │
│  ─────────────────────────                                               │
│  • Confident everything works? Stop writing to B                        │
│  • Delete data from B (optional, reclaim space)                         │
│                                                                          │
│  Timeline:                                                               │
│  ──────────────────────────────────────────────────────────────────     │
│  Day 1         Day 2         Day 3         Day 4         Day 5          │
│    │             │             │             │             │             │
│    ▼             ▼             ▼             ▼             ▼             │
│  DUAL        BACKFILL      VERIFY       SWITCH        CLEANUP           │
│  WRITE       (50GB)                     READS                           │
│    │             │             │             │             │             │
│    │◄────────────┴─────────────┴─────────────┴─────────────┤             │
│    │               ZERO DOWNTIME! 🎉                       │             │
│    │         (but 5 days of careful work)                  │             │
│                                                                          │
│  Complexity: HIGH                                                        │
│  Safety: HIGH                                                            │
│  Downtime: ZERO                                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 5: Consistent Hashing - Minimize Rebalancing Pain

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CONSISTENT HASHING - SMART SHARD ASSIGNMENT                             │
│  ═══════════════════════════════════════════                             │
│                                                                          │
│  THE NAIVE APPROACH (Modulo Hashing):                                   │
│  ────────────────────────────────────                                    │
│                                                                          │
│  shard = user_id % num_shards                                           │
│                                                                          │
│  With 4 shards:                                                          │
│  • user_id 1  → 1 % 4 = 1 → Shard B                                     │
│  • user_id 5  → 5 % 4 = 1 → Shard B                                     │
│  • user_id 9  → 9 % 4 = 1 → Shard B                                     │
│  • user_id 10 → 10 % 4 = 2 → Shard C                                    │
│                                                                          │
│  THE DISASTER: Adding a 5th shard                                       │
│  ────────────────────────────────                                        │
│                                                                          │
│  Now with 5 shards:                                                      │
│  • user_id 1  → 1 % 5 = 1 → Shard B (same)                              │
│  • user_id 5  → 5 % 5 = 0 → Shard A (MOVED!)                            │
│  • user_id 9  → 9 % 5 = 4 → Shard E (MOVED!)                            │
│  • user_id 10 → 10 % 5 = 0 → Shard A (MOVED!)                           │
│                                                                          │
│  Adding ONE shard causes ~80% of data to move!                          │
│  This is catastrophic.                                                   │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│  CONSISTENT HASHING (The Smart Way):                                    │
│  ───────────────────────────────────                                     │
│                                                                          │
│  Imagine a circle (hash ring) from 0 to 2^32:                           │
│                                                                          │
│                           0                                              │
│                           │                                              │
│                      ┌────┴────┐                                        │
│                    ╱            ╲                                       │
│                  ╱    Shard A    ╲                                      │
│                 │    (owns this   │                                      │
│                 │     arc)        │                                      │
│        Shard D  │                 │  Shard B                            │
│                 │                 │                                      │
│                  ╲               ╱                                       │
│                    ╲           ╱                                        │
│                      ╲───┬───╱                                          │
│                          │                                               │
│                       Shard C                                            │
│                                                                          │
│  Each shard "owns" a portion of the ring.                               │
│  user_id hashes to a point on the ring.                                 │
│  Walk clockwise to find the first shard. That's your shard.             │
│                                                                          │
│  ADDING A NEW SHARD (Shard E):                                          │
│  ─────────────────────────────                                           │
│                                                                          │
│  Shard E takes a slice from Shard A ONLY.                               │
│  Shards B, C, D are completely unaffected.                              │
│                                                                          │
│  Data movement: ~20% (only from adjacent shard)                         │
│  NOT 80% like with modulo hashing!                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Note: B-tree Rebalancing is DIFFERENT

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TWO TYPES OF "REBALANCING" - DON'T CONFUSE THEM                        │
│  ═══════════════════════════════════════════════                         │
│                                                                          │
│  ┌───────────────────────┬──────────────────────┬──────────────────────┐│
│  │                       │ B-TREE REBALANCING   │ SHARD REBALANCING    ││
│  ├───────────────────────┼──────────────────────┼──────────────────────┤│
│  │ Scale                 │ Single index         │ Entire database      ││
│  │                       │ (one table)          │ (across servers)     ││
│  ├───────────────────────┼──────────────────────┼──────────────────────┤│
│  │ Trigger               │ Every INSERT/DELETE  │ Manual decision or   ││
│  │                       │ (automatic)          │ monitoring alert     ││
│  ├───────────────────────┼──────────────────────┼──────────────────────┤│
│  │ Data movement         │ Entries within pages │ GB/TB across network ││
│  │                       │ (microseconds)       │ (hours/days)         ││
│  ├───────────────────────┼──────────────────────┼──────────────────────┤│
│  │ Downtime              │ None                 │ Possible (if done    ││
│  │                       │ (transparent)        │ wrong)               ││
│  ├───────────────────────┼──────────────────────┼──────────────────────┤│
│  │ Your involvement      │ None required        │ You plan and execute ││
│  │                       │ (auto-managed)       │ (or use Citus)       ││
│  └───────────────────────┴──────────────────────┴──────────────────────┘│
│                                                                          │
│  B-tree: PostgreSQL's problem (you just REINDEX occasionally)           │
│  Shard: YOUR problem (you build the migration pipeline)                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
