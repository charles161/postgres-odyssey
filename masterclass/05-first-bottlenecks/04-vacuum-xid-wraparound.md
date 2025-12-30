# The Vacuum Underworld & XID Wraparound

> **The Question**: "Why is my 10GB table using 100GB on disk?"

---

## Visual 1: The Bloat Story

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE BLOAT STORY                                                         │
│  ═══════════════                                                         │
│                                                                          │
│  Day 1: You create a table with 1 million rows. Size: 100 MB.           │
│                                                                          │
│  Day 30: You've done 10 million updates.                                │
│          Each UPDATE creates a new tuple version.                       │
│          Old versions aren't deleted - they're marked dead.             │
│                                                                          │
│  WHAT THE TABLE LOOKS LIKE NOW:                                         │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ ░░▓░░░▓▓░░░░░▓░░░░░░▓▓░░░░░░░▓░░░░░░░░░░░▓░░░░░░░░░░░░░▓░░░░░│     │
│  │ ░░░░░▓░░░░░░░░░▓░░░░░░░░░░░░░░░▓░░░░░░░░░░░░░░▓░░░░░░░░░░░░░░│     │
│  │ ░▓░░░░░░░░▓░░░░░░░░░▓░░░░░░░░░░░░▓░░░░░░░░░░░░░░░▓░░░░░░░░░░░│     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  Legend: ▓ = Live row (1 million)   ░ = Dead row (9 million!)           │
│                                                                          │
│  Table size: 1 GB (but only 100 MB is useful data!)                     │
│  This is BLOAT.                                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Why Autovacuum Can't Keep Up

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHY AUTOVACUUM CAN'T KEEP UP                                           │
│  ────────────────────────────                                            │
│                                                                          │
│  Default autovacuum triggers when:                                       │
│  dead_tuples > threshold + (scale_factor × live_tuples)                 │
│                         = 50 + (0.2 × 1,000,000)                        │
│                         = 200,050 dead tuples                           │
│                                                                          │
│  But your app is creating 100,000 dead tuples per minute.               │
│  Autovacuum takes 10 minutes to run on your table.                      │
│  By the time it finishes, there are 1,000,000 new dead tuples.          │
│                                                                          │
│  THE DEATH SPIRAL:                                                       │
│  • More bloat → Larger table → Slower scans → Slower vacuum             │
│  • Slower vacuum → More bloat accumulates → Even slower vacuum          │
│  • Eventually: Disk full, or XID wraparound shutdown                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: XID Wraparound Crisis

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚠️  TRANSACTION ID WRAPAROUND CRISIS SIMULATOR  ⚠️                      │
│  ═══════════════════════════════════════════════                         │
│                                                                          │
│  Transaction IDs are 32-bit integers: 0 to 4,294,967,295                │
│                                                                          │
│  XID SPACE VISUALIZATION (circular):                                    │
│                                                                          │
│                     FUTURE                                               │
│                   ▲                                                      │
│              ╱─────────╲                                                 │
│           ╱       │       ╲                                              │
│         ╱    2B ahead     ╲                                              │
│        │    of current     │                                             │
│  PAST ─┤◄──── YOU ────►    ├─ PAST                                      │
│        │   xid: 3.9B       │                                             │
│         ╲                 ╱                                              │
│           ╲             ╱                                                │
│              ╲───────╱                                                   │
│                   ▼                                                      │
│                 DANGER                                                   │
│                                                                          │
│  Current XID: 3,900,000,000                                             │
│  Oldest unfrozen: 3,400,000,000                                         │
│  XIDs until wraparound: 394,967,296                                     │
│  Estimated time: ~3 months at current rate                              │
│                                                                          │
│  ⚠️  STATUS: URGENT - Autovacuum to prevent freeze struggling           │
│                                                                          │
│  THE DISASTER:                                                           │
│  If oldest unfrozen XID gets too far behind, it wraps into              │
│  "future" territory. Suddenly your data becomes INVISIBLE.              │
│                                                                          │
│  PostgreSQL's response: SHUT DOWN to prevent data corruption.           │
│  Message: "database is not accepting commands to avoid                  │
│            wraparound data loss"                                         │
│                                                                          │
│  This is a PREVENTABLE DISASTER. Monitor autovacuum. Tune it.          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
