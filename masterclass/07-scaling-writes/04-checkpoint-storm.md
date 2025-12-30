# The Checkpoint Storm

> **The Question**: "Why does my database get slow every 5 minutes?"

---

## Visual 1: The Pattern

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHY YOUR DATABASE GETS SLOW EVERY 5 MINUTES                             │
│  ═══════════════════════════════════════════                             │
│                                                                          │
│  You notice a pattern: Every 5 minutes, latency spikes.                 │
│  Graphs show it clearly:                                                │
│                                                                          │
│  Latency (ms)                                                            │
│      │                                                                   │
│  100 │    ▲           ▲           ▲           ▲                         │
│   80 │   ╱│╲         ╱│╲         ╱│╲         ╱│╲                        │
│   60 │  ╱ │ ╲       ╱ │ ╲       ╱ │ ╲       ╱ │ ╲                       │
│   40 │ ╱  │  ╲     ╱  │  ╲     ╱  │  ╲     ╱  │  ╲                      │
│   20 │╱   │   ╲───╱   │   ╲───╱   │   ╲───╱   │   ╲                     │
│    0 └────┴─────────┴─────────┴─────────┴──────▶ Time                   │
│         5min        10min       15min       20min                        │
│                                                                          │
│  THIS IS A CHECKPOINT.                                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: What's Happening

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHAT'S HAPPENING:                                                       │
│  ════════════════                                                        │
│                                                                          │
│  Remember: When you COMMIT, data goes to WAL, not the table files.     │
│  Table files still have old data. The pages in memory are "dirty."     │
│                                                                          │
│  A CHECKPOINT is when PostgreSQL says:                                  │
│  "Time to write all those dirty pages to the actual table files."      │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                                                                   │    │
│  │  shared_buffers: 8GB of dirty pages accumulated                  │    │
│  │                                                                   │    │
│  │  Checkpoint begins:                                               │    │
│  │  ├── Scan all buffers for dirty pages                           │    │
│  │  ├── Write each 8KB page to disk (fsync)                         │    │
│  │  ├── 8GB ÷ 8KB = 1,000,000 pages to write!                       │    │
│  │  └── At 100 MB/s disk throughput: 80 seconds of I/O              │    │
│  │                                                                   │    │
│  │  During this time:                                                │    │
│  │  • Disk is busy writing                                          │    │
│  │  • New reads compete for disk I/O                                │    │
│  │  • Latency increases                                              │    │
│  │                                                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: The Fix

```
┌─────────────────────────────────────────────────────────────────────────┐
│  THE FIX: SPREAD THE PAIN                                                │
│  ════════════════════════                                                │
│                                                                          │
│  checkpoint_completion_target = 0.9  (default: 0.9)                     │
│                                                                          │
│  This tells PostgreSQL:                                                  │
│  "Take 90% of the time between checkpoints to finish writing."         │
│                                                                          │
│  Instead of:  │████████████│░░░░░░░░░░░░░░░░░░░░░│ (burst)              │
│  Do this:     │██░░██░░██░░██░░██░░██░░██░░██░░██│ (spread)             │
│                                                                          │
│  Also consider:                                                          │
│  • Increase checkpoint_timeout (less frequent checkpoints)              │
│  • Increase max_wal_size (allow more WAL before forcing checkpoint)    │
│  • Use faster disks (NVMe makes this less painful)                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
