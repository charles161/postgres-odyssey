# 🐘 Postgres Mastery: 14-Day Interview Prep

> **Goal:** Prepare for Head of Postgres interview at Supabase  
> **Time Commitment:** 2 hours/day for 14 days  
> **Starting Level:** SQL 0 → Target: System Design Ready

---

## 📊 Progress Tracker

| Day | Topic | Status | Time |
|-----|-------|--------|------|
| 1 | SQL Fundamentals | ⬜ | 2h |
| 2 | How Postgres Stores Data | ⬜ | 2h |
| 3 | Process & Memory Architecture | ⬜ | 2h |
| 4 | Indexing Deep Dive | ⬜ | 2h |
| 5 | EXPLAIN ANALYZE Mastery | ⬜ | 2h |
| 6 | Query Optimization Techniques | ⬜ | 2h |
| 7 | Real-World Scenarios | ⬜ | 2h |
| 8 | Replication Fundamentals | ⬜ | 2h |
| 9 | High Availability Patterns | ⬜ | 2h |
| 10 | Scaling Postgres | ⬜ | 2h |
| 11 | ETL & Foreign Data Wrappers | ⬜ | 2h |
| 12 | Change Data Capture | ⬜ | 2h |
| 13 | Supabase Platform Deep Dive | ⬜ | 2h |
| 14 | Mock Interview & Synthesis | ⬜ | 2h |

**Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Complete

---

## 🚀 Quick Start

### 1. Start Your Postgres Environment

```bash
cd docker
docker-compose up -d
```

### 2. Connect to Postgres

```bash
docker exec -it postgres-primary psql -U postgres
```

### 3. Begin Day 1

Open `curriculum/week1/day1-sql-basics/README.md` and start learning!

---

## 📁 Repository Structure

```
postgres/
├── curriculum/           # Daily lesson content
│   ├── week1/           # Days 1-7: Foundations + Optimization
│   └── week2/           # Days 8-14: Advanced + Interview
├── exercises/           # Hands-on practice files
├── diagrams/            # Visual references
├── interview-prep/      # Interview questions & scenarios
├── cheatsheets/         # Quick reference guides
└── docker/              # Lab environment setup
```

---

## 🎯 Daily Study Rhythm

| Time | Activity |
|------|----------|
| 0:00-0:20 | Visual concept introduction |
| 0:20-0:50 | Deep dive reading |
| 0:50-1:20 | Hands-on Docker exercises |
| 1:20-1:40 | Practice explaining concepts aloud |
| 1:40-2:00 | Review & note takeaways |

---

## 💡 Frontend Analogies Used Throughout

As a frontend engineer, you'll find familiar concepts:

| Postgres Concept | Frontend Analogy |
|------------------|------------------|
| Shared Buffers | React's Virtual DOM |
| Query Planning | Webpack's build optimization |
| Indexes | Browser's DOM indexing |
| MVCC | Git branches (concurrent versions) |
| WAL | Redux action log |
| Connection Pooling | HTTP/2 multiplexing |
| Vacuum | Garbage collection |

---

## 🎤 Interview Focus Areas (Supabase-Specific)

1. **Postgres Internals** - How queries flow from client to disk
2. **Replication & HA** - Multi-region, failover strategies
3. **FDWs & Wrappers** - Supabase's specialty
4. **OrioleDB** - Their next-gen storage engine investment
5. **Multi-tenant Architecture** - Database per tenant model
6. **System Design** - Scale a database platform

---

Good luck! 🐘

