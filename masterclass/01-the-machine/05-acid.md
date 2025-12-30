# 1.5 ACID: Real Examples

> **The Question**: "What does ACID actually mean in practice?"

---

## Overview

This section brings ACID to life with real scenarios. By the end, users will understand:

- How Atomicity saves you from partial updates
- How Consistency enforces business rules
- How Isolation levels affect what you see (with real anomalies)
- How Durability works (covered in WAL section, summarized here)

---

## Visual Components

### Visual 1: ACID Overview

**Type**: Four-quadrant hero visual

**Description**: Quick overview of all four properties

```
[VISUAL: ACID at a Glance]

+--------------------------------+--------------------------------+
|                                |                                |
|     A - ATOMICITY              |     C - CONSISTENCY            |
|     "All or Nothing"           |     "Rules are Obeyed"         |
|                                |                                |
|  BEGIN;                        |  CONSTRAINT: balance >= 0      |
|    UPDATE accounts             |                                |
|      SET balance -= 100        |  UPDATE accounts               |
|      WHERE id = 1;             |    SET balance = -50           |
|    UPDATE accounts             |    WHERE id = 1;               |
|      SET balance += 100        |                                |
|      WHERE id = 2;             |  ERROR: violates check         |
|  COMMIT;                       |  constraint!                   |
|                                |                                |
|  Either BOTH happen            |  Database prevents invalid     |
|  or NEITHER happens.           |  states.                       |
|                                |                                |
+--------------------------------+--------------------------------+
|                                |                                |
|     I - ISOLATION              |     D - DURABILITY             |
|     "Transactions are Private" |     "Committed = Permanent"    |
|                                |                                |
|  Transaction A:                |  Client sees: "COMMIT OK"      |
|    UPDATE balance = 500        |                                |
|    (not committed yet)         |  At that moment:               |
|                                |  - WAL is on disk              |
|  Transaction B:                |  - Data is SAFE                |
|    SELECT balance              |  - Even if power fails         |
|    -> Still sees old value!    |  - Recovery will restore       |
|                                |                                |
|  B cannot see A's uncommitted  |  If you saw OK, your data      |
|  changes.                      |  survives any crash.           |
|                                |                                |
+--------------------------------+--------------------------------+
```

---

### Visual 2: Atomicity in Action

**Type**: Interactive transaction simulator

**Description**: Show all-or-nothing with bank transfer

```
[VISUAL: Bank Transfer Simulator]

SCENARIO: Transfer $100 from Alice to Bob

+------------------------------------------------------------------+
|  TRANSACTION                                                      |
|  +--------------------------------------------------------------+ |
|  |  BEGIN;                                                       | |
|  |                                                               | |
|  |  -- Step 1: Deduct from Alice                                 | |
|  |  UPDATE accounts SET balance = balance - 100 WHERE name='Alice';|
|  |  -- Alice: $1000 -> $900                                      | |
|  |                                                               | |
|  |  -- Step 2: Add to Bob                                        | |
|  |  UPDATE accounts SET balance = balance + 100 WHERE name='Bob';| |
|  |  -- Bob: $500 -> $600                                         | |
|  |                                                               | |
|  |  COMMIT;                                                      | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+

SIMULATION CONTROLS:
[ Execute Step 1 ]  [ Execute Step 2 ]  [ Commit ]  [ Crash! ]

CURRENT STATE:
+------------------------------------------------------------------+
|  Name   |  Balance (Disk)  |  Balance (RAM)  |  Status           |
+------------------------------------------------------------------+
|  Alice  |  $1000           |  $900           |  Uncommitted      |
|  Bob    |  $500            |  $500           |  Not updated yet  |
+------------------------------------------------------------------+

                        [ CRASH NOW! ]
                             |
                             v

AFTER CRASH AND RECOVERY:
+------------------------------------------------------------------+
|  Name   |  Balance  |  Explanation                               |
+------------------------------------------------------------------+
|  Alice  |  $1000    |  Transaction never committed.              |
|  Bob    |  $500     |  Both changes rolled back.                 |
+------------------------------------------------------------------+

ATOMICITY PRESERVED:
- Alice did NOT lose $100 permanently
- Bob did NOT gain $100 incorrectly  
- No money appeared or disappeared
- System is consistent
```

**Interactive Features**:
- Step-by-step execution buttons
- Crash button at any point
- Shows recovery process
- Balance display updates in real-time

---

### Visual 3: Consistency with Constraints

**Type**: Constraint enforcement demo

**Description**: Show how PostgreSQL prevents invalid data

```
[VISUAL: Constraint Enforcement]

TABLE DEFINITION:
+------------------------------------------------------------------+
|  CREATE TABLE accounts (                                          |
|    id SERIAL PRIMARY KEY,                                        |
|    name TEXT NOT NULL,                                           |
|    email TEXT UNIQUE,                                            |
|    balance DECIMAL CHECK (balance >= 0),                         |
|    account_type TEXT CHECK (account_type IN ('checking','savings'))
|  );                                                               |
+------------------------------------------------------------------+

TRY THESE OPERATIONS:
+------------------------------------------------------------------+
|  Operation                        |  Result                      |
+------------------------------------------------------------------+
|  INSERT INTO accounts             |                              |
|    (name, balance)                |  ERROR: null value in        |
|    VALUES (NULL, 100);            |  column "name" violates      |
|                                   |  not-null constraint         |
|  [Try It]                         |                              |
+------------------------------------------------------------------+
|  INSERT INTO accounts             |                              |
|    (name, email, balance)         |  ERROR: duplicate key        |
|    VALUES ('Bob', 'alice@x.com',  |  violates unique constraint  |
|            500);                  |  (email already exists)      |
|  [Try It]                         |                              |
+------------------------------------------------------------------+
|  UPDATE accounts                  |                              |
|    SET balance = -50              |  ERROR: new row violates     |
|    WHERE name = 'Alice';          |  check constraint            |
|                                   |  "accounts_balance_check"    |
|  [Try It]                         |                              |
+------------------------------------------------------------------+
|  INSERT INTO accounts             |                              |
|    (name, balance, account_type)  |  ERROR: new row violates     |
|    VALUES ('Carol', 100,          |  check constraint            |
|            'invalid_type');       |  (must be checking/savings)  |
|  [Try It]                         |                              |
+------------------------------------------------------------------+

THE POINT:
Even if your application has bugs, the DATABASE enforces rules.
Invalid data CANNOT enter. This is the "C" in ACID.
```

---

### Visual 4: Isolation Levels Compared

**Type**: Multi-transaction simulation

**Description**: Show different anomalies at different isolation levels

```
[VISUAL: Isolation Level Theater]

CHOOSE ISOLATION LEVEL:
[Read Uncommitted] [Read Committed] [Repeatable Read] [Serializable]
      (PG treats as Read Committed)

+------------------------------------------------------------------+
|  TWO PARALLEL TRANSACTIONS                                        |
+------------------------------------------------------------------+

TIME    TRANSACTION A              TRANSACTION B
        (SELECT queries)           (UPDATE queries)
----    ----------------           ----------------

T1      BEGIN;                     
        SET TRANSACTION ISOLATION
        LEVEL REPEATABLE READ;
        
T2      SELECT balance FROM        BEGIN;
        accounts WHERE id=1;
        -> Returns: $1000
        
T3                                 UPDATE accounts
                                   SET balance = 500
                                   WHERE id = 1;
                                   
T4                                 COMMIT;
                                   (balance is now $500 on disk)
        
T5      SELECT balance FROM        
        accounts WHERE id=1;
        -> Returns: ???

+------------------------------------------------------------------+
|  WHAT DOES TRANSACTION A SEE AT T5?                              |
+------------------------------------------------------------------+

READ COMMITTED (default):
+------------------------------------------------------------------+
|  T5 Returns: $500                                                 |
|                                                                   |
|  WHY: Each SELECT sees latest committed data.                    |
|  B committed at T4, so A sees the new value.                     |
|                                                                   |
|  ANOMALY: "Non-Repeatable Read"                                  |
|  Same query, different results within one transaction.           |
|  Might be unexpected for some applications!                      |
+------------------------------------------------------------------+

REPEATABLE READ:
+------------------------------------------------------------------+
|  T5 Returns: $1000                                                |
|                                                                   |
|  WHY: Snapshot taken at T2 (first query).                        |
|  A sees data as of T2, regardless of B's commit.                 |
|  Consistent view throughout the transaction.                      |
|                                                                   |
|  BENEFIT: Predictable. Same query = same result.                 |
|  COST: Might act on "stale" data.                                |
+------------------------------------------------------------------+
```

**Interactive Features**:
- Toggle between isolation levels
- Step through time
- Show what each transaction sees
- Highlight the anomaly when it occurs

---

### Visual 5: The Anomaly Gallery

**Type**: Illustrated examples of each anomaly

**Description**: Visual representation of isolation anomalies

```
[VISUAL: Anomaly Gallery]

+------------------------------------------------------------------+
|  ANOMALY 1: DIRTY READ                                            |
|  (Prevented in PostgreSQL - even at Read Committed)              |
+------------------------------------------------------------------+
|                                                                   |
|  Transaction A:                   Transaction B:                  |
|  UPDATE balance = 500             SELECT balance                  |
|  (not committed)                  -> Sees 500? NO!                |
|  ROLLBACK                         -> Would be reading            |
|                                      "dirty" (uncommitted) data   |
|                                                                   |
|  PostgreSQL NEVER allows this. Other DBs might in "Read Uncommit"|
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|  ANOMALY 2: NON-REPEATABLE READ                                   |
|  (Possible in Read Committed, prevented in Repeatable Read)      |
+------------------------------------------------------------------+
|                                                                   |
|  Transaction A:                   Transaction B:                  |
|  SELECT balance -> $1000                                          |
|  (thinking...)                    UPDATE balance = 500            |
|                                   COMMIT                          |
|  SELECT balance -> $500 (!!)                                      |
|                                                                   |
|  Same query, different results. Your calculation might be wrong! |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|  ANOMALY 3: PHANTOM READ                                          |
|  (Possible in Read Committed, prevented in Repeatable Read)      |
+------------------------------------------------------------------+
|                                                                   |
|  Transaction A:                   Transaction B:                  |
|  SELECT COUNT(*) FROM users       INSERT INTO users               |
|    WHERE age > 30                   VALUES ('New', 35)            |
|  -> Returns: 100                  COMMIT                          |
|  (doing work...)                                                  |
|  SELECT COUNT(*) FROM users                                       |
|    WHERE age > 30                                                 |
|  -> Returns: 101 (!!)                                             |
|                                                                   |
|  A new row appeared! Your report might be inconsistent.          |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|  ANOMALY 4: SERIALIZATION ANOMALY                                 |
|  (Possible in Repeatable Read, only prevented in Serializable)  |
+------------------------------------------------------------------+
|                                                                   |
|  Transaction A:                   Transaction B:                  |
|  SELECT SUM(value) FROM t1        SELECT SUM(value) FROM t2      |
|  -> $1000                         -> $500                         |
|  INSERT INTO t2 (value)           INSERT INTO t1 (value)         |
|    SELECT SUM(value) FROM t1        SELECT SUM(value) FROM t2    |
|  (inserts $1000)                  (inserts $500)                 |
|  COMMIT                           COMMIT                          |
|                                                                   |
|  If these ran serially: t1 or t2 would have both sums.          |
|  But they ran concurrently: Neither sees the other's insert.    |
|  Result is impossible from any serial execution!                 |
+------------------------------------------------------------------+
```

---

### Visual 6: Isolation Level Decision Guide

**Type**: Decision tree with use cases

**Description**: Help users choose the right isolation level

```
[VISUAL: Choosing Your Isolation Level]

+------------------------------------------------------------------+
|  DECISION GUIDE                                                   |
+------------------------------------------------------------------+

START HERE: What does your application need?
                    |
                    v
    +-------------------------------+
    | Do you run multi-statement    |
    | transactions that must see    |
    | consistent data?              |
    +-------------------------------+
           |                |
          YES              NO
           |                |
           v                v
    +-------------+   +---------------------+
    | REPEATABLE  |   | READ COMMITTED      |
    | READ        |   | (default)           |
    +-------------+   +---------------------+
           |                |
           v                |
    +-------------------------------+      |
    | Do you need results identical |      |
    | to SOME serial execution?     |      |
    | (financial, inventory)        |      |
    +-------------------------------+      |
           |                |              |
          YES              NO              |
           |                |              |
           v                |              |
    +-------------+         |              |
    | SERIALIZABLE|         |              |
    +-------------+         |              |
                            |              |
                            v              v
                      [Use Repeatable] [Use Read Committed]

+------------------------------------------------------------------+
|  SUMMARY TABLE                                                    |
+------------------------------------------------------------------+
|  Level           | Performance | Safety  | Use Case              |
+------------------------------------------------------------------+
|  Read Committed  | Best        | Basic   | Most web apps         |
|  (default)       |             |         | Simple CRUD           |
+------------------------------------------------------------------+
|  Repeatable Read | Good        | Better  | Reports, analytics    |
|                  |             |         | Multi-query reads     |
+------------------------------------------------------------------+
|  Serializable    | Slower      | Highest | Financial txns        |
|                  | (can fail)  |         | Inventory management  |
|                  |             |         | Must handle retries!  |
+------------------------------------------------------------------+
```

---

## Key Takeaways Panel

```
+------------------------------------------------------------------+
|  KEY TAKEAWAYS                                                    |
+------------------------------------------------------------------+
|                                                                   |
|  A - ATOMICITY                                                   |
|  Implemented via: WAL + Transaction rollback                     |
|  Guarantee: All statements succeed or all fail together          |
|                                                                   |
|  C - CONSISTENCY                                                 |
|  Implemented via: Constraints (CHECK, UNIQUE, FK, NOT NULL)     |
|  Guarantee: Only valid data enters the database                  |
|                                                                   |
|  I - ISOLATION                                                   |
|  Implemented via: MVCC + Snapshots                               |
|  Guarantee: Transactions don't interfere                         |
|  Choice: Read Committed (default) vs Repeatable Read vs Serial.  |
|                                                                   |
|  D - DURABILITY                                                  |
|  Implemented via: WAL + fsync                                    |
|  Guarantee: COMMIT OK = data survives crashes                    |
|                                                                   |
+------------------------------------------------------------------+
```

---

## Connection to Next Section

```
NOW YOU KNOW: 
- How ACID properties work in PostgreSQL
- Real scenarios for each property
- How to choose isolation levels

PART 1 COMPLETE!
You now understand The Machine:
- How data is stored (pages, tuples, heap)
- How memory caching works (shared_buffers)
- How writes are durable (WAL)
- How concurrency works (MVCC)
- How ACID is implemented

NEXT: PART 2 - Query Execution
How does PostgreSQL actually process your SQL?
What is a query plan? How does the optimizer choose?
```
