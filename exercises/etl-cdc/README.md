# ETL & CDC Exercises

Hands-on labs for data movement and change data capture.

## Prerequisites

- Docker environment running
- Familiarity with Day 11 (ETL) and Day 12 (CDC) lessons

## Exercise Files

- `01-bulk-loading.sql` - COPY command exercises
- `02-logical-replication.sql` - Set up publication/subscription
- `03-cdc-consumer.sql` - Build a simple CDC consumer

## Lab Setup

The Docker environment includes:
- Primary Postgres (port 5432) - Publisher
- Replica Postgres (port 5433) - Can be used as subscriber

