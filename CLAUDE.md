# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A PostgreSQL masterclass designed to transform frontend engineers (or anyone) into database experts. The philosophy: build deep understanding through curiosity, simulations, and answering "why?" questions—not just tutorials.

The goal is real-world readiness: knowing what to optimize, why things are slow, and what to check when debugging production systems.

## Commands

### Docker Lab Environment

```bash
# Start Postgres environment (primary + replica + pgAdmin)
cd docker && docker-compose up -d

# Connect to primary Postgres
docker exec -it postgres-primary psql -U postgres -d learn

# Connect to replica (port 5433)
docker exec -it postgres-replica psql -U postgres

# pgAdmin: http://localhost:8080 (admin@learn.local / admin)
```

### Visualization App

```bash
cd visualization/app
npm install
npm run dev      # Development server
npm run build    # Production build (tsc && vite build)
npm run preview  # Preview production build
```

## Architecture

### Content Organization

- `masterclass/` - Core curriculum: 9 stages from storage internals to distributed systems
- `curriculum/` - 14-day structured learning path
- `cheatsheets/` - Quick reference guides
- `interview-prep/` - Questions and system design scenarios

### Visualization App (`visualization/app/`)

Vanilla TypeScript/Vite app (no React). Interactive simulations and visualizations.

- `src/main.ts` - Main entry point (~137K lines of app logic)
- `src/curriculum.ts` - Curriculum data structures
- `src/labs/` - Interactive lab components
- `src/types.ts` - Type definitions

Stack: framer-motion, lucide-react, tailwind-merge, canvas-confetti

### Docker Setup

Multi-node Postgres 16 with:
- **postgres-primary** (5432) - Logical replication enabled, pg_stat_statements
- **postgres-replica** (5433) - For replication exercises
- **pgadmin** (8080) - Web admin interface

## Masterclass Stages

1. **The Machine** - Storage (pages, tuples), memory hierarchy, WAL, MVCC, ACID
2. **Query Execution** - Parse/plan/execute lifecycle, cost model, statistics, join algorithms
3. **Indexes** - B-tree internals, index-only scans, GIN/GiST/BRIN, bloat
4. **Transactions & Locking** - Isolation levels, lock queues, deadlocks
5. **First Bottlenecks** - Connection pooling, vacuum, XID wraparound
6. **Scaling Reads** - Replicas, WAL streaming, replication lag, query routing
7. **Scaling Writes** - Partitioning, checkpoint storms
8. **Sharding** - Shard key selection, consistent hashing, rebalancing, Citus
9. **PostgreSQL vs World** - CAP theorem, NoSQL tradeoffs, polyglot persistence

## Content Philosophy

When creating or editing content:
- Answer every "but why?" question—don't just show what happens, explain why
- Use interactive simulations where concepts benefit from hands-on exploration
- Include before/after comparisons (e.g., with index vs without)
- Relate concepts to frontend analogies where helpful (MVCC ≈ git branches, WAL ≈ Redux action log)
