# Consistent Hashing

> **The Question**: "How do I add a new shard without reshuffling all my data?"

---

## Visual 1: The Naive Approach Problem

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE NAIVE APPROACH: Simple Modulo                                       │
│  ══════════════════════════════════                                      │
│                                                                          │
│  shard = user_id % num_shards                                           │
│                                                                          │
│  With 4 shards:                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  user_id=1  → 1 % 4 = 1 → Shard 1                              │     │
│  │  user_id=2  → 2 % 4 = 2 → Shard 2                              │     │
│  │  user_id=3  → 3 % 4 = 3 → Shard 3                              │     │
│  │  user_id=4  → 4 % 4 = 0 → Shard 0                              │     │
│  │  user_id=5  → 5 % 4 = 1 → Shard 1                              │     │
│  │  ...                                                            │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  NOW ADD A 5TH SHARD:                                                    │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  user_id=1  → 1 % 5 = 1 → Shard 1 ✓ (same)                     │     │
│  │  user_id=2  → 2 % 5 = 2 → Shard 2 ✓ (same)                     │     │
│  │  user_id=3  → 3 % 5 = 3 → Shard 3 ✓ (same)                     │     │
│  │  user_id=4  → 4 % 5 = 4 → Shard 4 ✗ (MOVED from 0!)            │     │
│  │  user_id=5  → 5 % 5 = 0 → Shard 0 ✗ (MOVED from 1!)            │     │
│  │  user_id=6  → 6 % 5 = 1 → Shard 1 ✗ (MOVED from 2!)            │     │
│  │  ...                                                            │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  💥 ~80% OF DATA MUST MOVE!                                             │
│                                                                          │
│  With 1 billion rows, you need to move 800 million rows.               │
│  This takes days and risks data inconsistency.                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Consistent Hashing Ring

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CONSISTENT HASHING: The Ring                                            │
│  ════════════════════════════                                            │
│                                                                          │
│  Instead of modulo, map everything to a RING (0 to 2^32):              │
│                                                                          │
│                           0                                              │
│                      ╭────┴────╮                                         │
│                     ╱           ╲                                        │
│                   ╱               ╲                                      │
│                 ╱      Shard A      ╲                                    │
│               ╱      (handles        ╲                                   │
│              │       0 → 2^31)        │                                  │
│             │                          │                                 │
│    2^32-1  ─┤                          ├─ 2^31                           │
│             │                          │                                 │
│              │       Shard B          │                                  │
│               ╲     (handles         ╱                                   │
│                 ╲    2^31 → 2^32)  ╱                                     │
│                   ╲               ╱                                      │
│                     ╲           ╱                                        │
│                      ╰─────────╯                                         │
│                                                                          │
│  To find shard for user_id=12345:                                       │
│  1. hash(12345) → position on ring (e.g., 1234567890)                  │
│  2. Walk clockwise until you hit a shard                               │
│  3. That shard owns this key                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: Adding a Shard with Consistent Hashing

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ADDING A SHARD: Minimal Data Movement                                   │
│  ═════════════════════════════════════                                   │
│                                                                          │
│  BEFORE (2 shards):                                                      │
│                           0                                              │
│                      ╭────●────╮        ● = Shard A position            │
│                     ╱    A      ╲                                        │
│                   ╱               ╲                                      │
│                 ╱                   ╲                                    │
│                │   Shard A owns      │                                   │
│                │   this half         │                                   │
│   ─────────────┤                     ●─ Shard B position                │
│                │                     B                                   │
│                │   Shard B owns      │                                   │
│                 ╲  this half        ╱                                    │
│                   ╲               ╱                                      │
│                     ╲           ╱                                        │
│                      ╰─────────╯                                         │
│                                                                          │
│  AFTER (add Shard C):                                                    │
│                           0                                              │
│                      ╭────●────╮                                         │
│                     ╱    A      ╲                                        │
│                   ●               ╲                                      │
│                  C╲                 ╲                                    │
│                │   ╲                 │                                   │
│                │    Shard C takes    │                                   │
│   ─────────────┤    ONLY this slice  ●─ B                               │
│                │    from Shard A     │                                   │
│                │                     │                                   │
│                 ╲                   ╱                                    │
│                   ╲               ╱                                      │
│                     ╲           ╱                                        │
│                      ╰─────────╯                                         │
│                                                                          │
│  ONLY data in the slice between A and C moves!                          │
│  Shard B: unchanged                                                      │
│  Shard A: loses ~half to C                                               │
│  Total moved: ~33% (instead of ~66% with modulo)                        │
│                                                                          │
│  With many shards: adding 1 shard moves only 1/N of data!              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: Virtual Nodes

```
┌─────────────────────────────────────────────────────────────────────────┐
│  VIRTUAL NODES: Solving Uneven Distribution                             │
│  ═══════════════════════════════════════════                             │
│                                                                          │
│  PROBLEM: With few shards, distribution can be uneven.                 │
│                                                                          │
│                      ╭─────────╮                                         │
│                     ╱ ●        ╲                                         │
│                   ╱   A          ╲                                       │
│                 ╱       75% of    ╲                                      │
│                │        the ring!  │                                     │
│                │                   ●─ B                                  │
│                │                   │  only 25%!                         │
│                 ╲                 ╱                                      │
│                   ╲             ╱                                        │
│                     ╲         ╱                                          │
│                      ╰───────╯                                           │
│                                                                          │
│  SOLUTION: Each shard gets MANY positions (virtual nodes):             │
│                                                                          │
│                      ╭─────────╮                                         │
│                     ╱ ●A1  ●B1 ╲                                         │
│                   ●A3          ●B2                                       │
│                 ╱                 ╲                                      │
│                ●B3                 ●A2                                   │
│                │                   │                                     │
│                ●A4                 ●B4                                   │
│                 ╲                 ╱                                      │
│                   ●B5          ●A5                                       │
│                     ╲  ●A6●B6 ╱                                          │
│                      ╰───────╯                                           │
│                                                                          │
│  Each shard has 100+ virtual nodes scattered around the ring.          │
│  Statistically, each shard gets ~equal share of the ring.              │
│                                                                          │
│  Lookup: hash(key) → find nearest virtual node → real shard            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
