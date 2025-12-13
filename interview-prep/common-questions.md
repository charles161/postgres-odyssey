# Common Interview Questions

## Postgres Internals

### Q: What is MVCC and why does Postgres use it?
**A:** Multi-Version Concurrency Control keeps multiple versions of rows using xmin/xmax transaction IDs. Updates create new tuples instead of modifying in-place. This allows readers to never block writers (they see their consistent snapshot) and writers to never block readers. The tradeoff is dead tuples need VACUUM cleanup.

### Q: Explain the query execution pipeline
**A:** Query → Parser (syntax check, parse tree) → Analyzer (semantic check, permissions) → Rewriter (view expansion, rules) → Planner (generate plans, estimate costs, pick cheapest) → Executor (access methods, buffer manager, return results).

### Q: What's the difference between shared_buffers and OS file cache?
**A:** Shared_buffers is Postgres-controlled page cache with knowledge of access patterns and dirty page tracking. OS cache is general-purpose. Postgres double-reads through both, which is why shared_buffers is typically capped at 25% of RAM - let OS cache do the rest. Effective_cache_size hints to planner about total available cache.

---

## Performance

### Q: How do you identify a slow query?
**A:** Enable pg_stat_statements, look for high total_time queries. Use EXPLAIN ANALYZE BUFFERS to see the plan. Red flags: row estimate mismatches (run ANALYZE), seq scans with high rows removed (add index), hash batches > 1 (increase work_mem), nested loop with seq scan inner (add join index).

### Q: When would you NOT add an index?
**A:** When write overhead exceeds read benefit (write-heavy tables), small tables where seq scan is faster anyway, low-cardinality columns where planner ignores index, rarely-run queries where occasional slowness is acceptable.

### Q: Explain different index types
**A:** B-tree (default): equality, ranges, sorting. GIN: containment on arrays/JSONB/fulltext. GiST: geometric, ranges, proximity. BRIN: huge tables with naturally ordered data (time-series). Hash: equality only, rarely needed over B-tree.

---

## Replication & HA

### Q: Physical vs Logical replication?
**A:** Physical streams raw WAL bytes - exact binary copy, same version required, replica read-only, all-or-nothing. Logical decodes to row changes - cross-version possible, selective tables, subscriber can be writable, powers CDC. Use physical for HA/failover, logical for CDC/migrations/selective sync.

### Q: How do you prevent split-brain?
**A:** Distributed consensus (etcd/Consul) with quorum - need majority to hold leader lock. Fencing (STONITH) to kill old primary. Never use just two nodes without witness. Patroni handles this with its leader lock mechanism.

### Q: Sync vs Async replication trade-offs?
**A:** Async: fast commits, slight data loss risk on failover. Sync: zero data loss (RPO=0), adds network latency to every commit, availability risk if replica fails. Use sync for critical data, async for most workloads with good monitoring.

---

## Scaling

### Q: How do you scale Postgres writes?
**A:** Harder than reads. First: optimize queries, connection pool, batch writes. Then: partitioning for better maintenance and query performance. Finally: sharding (Citus for transparent, or application-level). For multi-region writes, each region gets a primary with async replication between (eventual consistency).

### Q: Connection pooling - why and how?
**A:** Each Postgres connection is a process (~10MB+ RAM). Poolers (PgBouncer) multiplex many client connections over fewer database connections. Transaction mode: connection borrowed per transaction (recommended). Session mode: per session (for stateful apps). Enables serverless patterns with thousands of ephemeral connections.

---

## Supabase Specific

### Q: How does Row Level Security work?
**A:** RLS policies define access rules at database level. USING clause filters reads, WITH CHECK validates writes. Supabase integrates auth.uid() from JWT to identify current user. Security enforced regardless of access method (REST, GraphQL, direct SQL).

### Q: What excites you about OrioleDB?
**A:** Eliminates table bloat and VACUUM overhead by using undo log instead of in-place MVCC. Stable performance on write-heavy workloads. If it matures and merges into core Postgres, it addresses one of Postgres's biggest operational challenges.

### Q: Why build on Postgres instead of custom database?
**A:** Postgres is most extensible database. 30+ years of development, huge ecosystem. No vendor lock-in - standard SQL. All features built ON Postgres (Auth uses tables+RLS, Realtime uses logical replication). Customers can take data anywhere.

