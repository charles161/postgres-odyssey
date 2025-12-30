# PostgreSQL Masterclass: The Scaling Journey

> An interactive visualization that takes you from "SELECT * FROM users" to understanding how to scale PostgreSQL to millions of users.

---

## Purpose

This is not a traditional tutorial. It is an **interactive journey** through PostgreSQL internals that answers the "why" behind every concept.

---

## The Journey Structure

### STAGE 0: Understanding the Machine
- Why PostgreSQL is Fast (Memory Hierarchy)
- The Cost of Reading Data (Index Math)
- What Happens When Power Goes Off (WAL and Durability)
- How Updates Really Work (MVCC Deep Dive)

### STAGE 1: The First Bottlenecks
- Why Queries Are Slow (Missing Indexes)
- Connection Limits (Why Pooling Matters)
- Table Bloat (The Vacuum Story)
- Lock Contention (When Queries Block Each Other)

### STAGE 2: Scaling Reads
- Why Read Replicas (CPU Saturation)
- Replication Internals (WAL Streaming)
- Replication Lag (The Consistency Tradeoff)
- Query Routing (Read Your Own Writes)

### STAGE 3: Scaling Writes
- Partitioning (Splitting Tables Locally)
- Write Optimization (Batch Inserts, COPY)
- Checkpoint Tuning (Reducing I/O Spikes)

### STAGE 4: Breaking the Single Node
- Why Sharding (The Single Primary Ceiling)
- Shard Key Selection (The Most Important Decision)
- Consistent Hashing (Minimizing Data Movement)
- Rebalancing (The Tax You Pay Forever)

### STAGE 5: Deep Dives
- ACID in Practice (Real Examples)
- Transaction Isolation Levels
- Index Deep Dive (B-tree Internals, GIN, GiST)
- Query Planning (How PostgreSQL Chooses)
- JOIN Algorithms (Nested Loop, Hash, Merge)
- PostgreSQL vs NoSQL (Understanding Tradeoffs)
