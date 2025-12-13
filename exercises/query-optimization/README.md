# Query Optimization Exercises

Progressive exercises to practice query optimization skills.

## How to Use

1. Start your Docker environment: `cd docker && docker-compose up -d`
2. Connect: `docker exec -it postgres-primary psql -U postgres -d learn`
3. Work through exercises in order
4. Use `EXPLAIN ANALYZE` to verify your optimizations

## Exercise Files

- `01-index-selection.sql` - Choosing the right index
- `02-query-rewriting.sql` - Rewriting slow queries
- `03-join-optimization.sql` - Optimizing JOINs
- `04-aggregation.sql` - Efficient aggregations

See the `solutions/` folder after attempting each exercise.

