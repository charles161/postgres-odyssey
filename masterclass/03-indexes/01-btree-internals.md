# B-tree Internals: Page Splits & Rebalancing

> **The Question**: "What happens inside an index when I insert data?"

---

## Visual 1: B-tree Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  B-TREE STRUCTURE - A Self-Balancing Tree                                │
│  ════════════════════════════════════════                                │
│                                                                          │
│  A B-tree index is a BALANCED tree:                                     │
│  • All leaf nodes are at the same depth                                 │
│  • Each node (page) is at least ~50% full                               │
│  • Lookups are always O(log n) - guaranteed                             │
│                                                                          │
│  EXAMPLE: Index on user_id (1 to 1000)                                  │
│                                                                          │
│                         [Root: 500]                                      │
│                        ╱           ╲                                     │
│                       ╱             ╲                                    │
│              [250]                    [750]                              │
│             ╱     ╲                  ╱     ╲                             │
│            ╱       ╲                ╱       ╲                            │
│     [1-249]      [251-499]    [501-749]    [751-1000]                   │
│     (leaf)        (leaf)       (leaf)        (leaf)                     │
│                                                                          │
│  Height = 3 levels. Any lookup = 3 page reads. Balanced! ✓              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Page Split on INSERT

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PAGE SPLIT: What happens when a page is FULL                           │
│  ════════════════════════════════════════════                            │
│                                                                          │
│  SCENARIO: Leaf page [251-499] has 200 entries. Max is 200.             │
│            INSERT user_id = 275.                                         │
│            No room!                                                      │
│                                                                          │
│  This triggers a PAGE SPLIT:                                            │
│                                                                          │
│  BEFORE:                                                                 │
│              [250]                                                       │
│             ╱     ╲                                                      │
│     [1-249]       [251-499] ← FULL!                                     │
│                                                                          │
│  AFTER (page split):                                                    │
│              [250, 375]    ← Parent updated with new pointer            │
│             ╱     │     ╲                                                │
│     [1-249] [251-374] [375-499]                                         │
│                   ↑                                                      │
│             NEW PAGE CREATED                                             │
│             (half the data moved here)                                   │
│                                                                          │
│  PostgreSQL:                                                             │
│  1. Allocates a new page                                                │
│  2. Moves half the entries to the new page                              │
│  3. Updates the parent node with the new pointer                        │
│  4. If parent is full too, splits propagate upward                      │
│                                                                          │
│  This is "rebalancing" - keeping the tree balanced after inserts.       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: Sequential Inserts Problem

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SEQUENTIAL INSERTS (worst case for page splits):                       │
│  ═══════════════════════════════════════════════                         │
│                                                                          │
│  INSERT 1:   [1]                                                        │
│  INSERT 2:   [1, 2]                                                     │
│  INSERT 3:   [1, 2, 3]                                                  │
│  ...                                                                     │
│  INSERT 100: [1, 2, 3, ... 100] ← Page getting full                     │
│  INSERT 101: PAGE SPLIT!                                                │
│              [1-50] [51-101]                                            │
│  INSERT 102: [1-50] [51-102] ← New insert goes to right page           │
│  INSERT 103: [1-50] [51-103]                                            │
│  ...                                                                     │
│  INSERT 150: [1-50] [51-150] ← Right page full again                    │
│  INSERT 151: PAGE SPLIT!                                                │
│              [1-50] [51-100] [101-151]                                  │
│                                                                          │
│  PATTERN: Sequential inserts cause splits at the rightmost page.       │
│           Left pages become "dead weight" - never updated again.        │
│           Index grows rightward.                                        │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│  FILL FACTOR: Controlling split behavior                                │
│  ─────────────────────────────────────                                   │
│                                                                          │
│  CREATE INDEX idx ON users(id) WITH (fillfactor = 70);                  │
│                                                                          │
│  fillfactor = 70 means: Only fill pages to 70% during initial build.  │
│  Leaves 30% room for future inserts before splits are needed.          │
│                                                                          │
│  Use lower fillfactor when:                                              │
│  • Index is on a column that gets many UPDATEs                          │
│  • Index has sequential insert patterns                                 │
│                                                                          │
│  Use higher fillfactor (90-100) when:                                   │
│  • Index is mostly read-only                                            │
│  • You want smaller index size                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
