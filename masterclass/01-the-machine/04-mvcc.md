# 1.4 MVCC: The Versioning System

> **The Question**: "How can multiple transactions read and write simultaneously without blocking each other?"

---

## Overview

This section explains PostgreSQL's secret weapon: Multi-Version Concurrency Control. By the end, users will understand:

- Why PostgreSQL creates new row versions instead of updating in place
- How transactions see different versions of the same data
- The visibility rules that determine "which version do I see?"
- Why VACUUM exists (to clean up old versions)

---

## Visual Components

### Visual 1: The Traditional Locking Problem

**Type**: Animated comparison

**Description**: Show why the old way (locking) is slow

```
[VISUAL: Traditional Locking vs MVCC]

TRADITIONAL APPROACH (MySQL MyISAM, early databases):
+------------------------------------------------------------------+
|  Time   |  Transaction A          |  Transaction B               |
+------------------------------------------------------------------+
|  T1     |  BEGIN                  |                              |
|  T2     |  SELECT * FROM users    |                              |
|         |  WHERE id = 1           |                              |
|         |  -> LOCK acquired       |                              |
|  T3     |  (reading...)           |  BEGIN                       |
|  T4     |  (reading...)           |  UPDATE users SET name='Bob' |
|         |                         |  WHERE id = 1                |
|         |                         |  -> BLOCKED! Waiting...      |
|  T5     |  (still reading...)     |  -> Still waiting...         |
|  T6     |  COMMIT                 |  -> Still waiting...         |
|         |  -> LOCK released       |                              |
|  T7     |                         |  -> NOW can proceed!         |
+------------------------------------------------------------------+

PROBLEM: Readers block writers. Writers block readers.
At high concurrency: Everyone is waiting. Throughput tanks.

+------------------------------------------------------------------+

POSTGRESQL (MVCC):
+------------------------------------------------------------------+
|  Time   |  Transaction A          |  Transaction B               |
+------------------------------------------------------------------+
|  T1     |  BEGIN                  |                              |
|  T2     |  SELECT * FROM users    |                              |
|         |  WHERE id = 1           |                              |
|         |  -> Sees version 1      |                              |
|  T3     |  (reading version 1...) |  BEGIN                       |
|  T4     |  (reading version 1...) |  UPDATE users SET name='Bob' |
|         |                         |  WHERE id = 1                |
|         |                         |  -> Creates version 2        |
|         |                         |  -> NO BLOCKING!             |
|  T5     |  (reading version 1...) |  COMMIT                      |
|  T6     |  Still sees version 1!  |  -> version 2 committed      |
|  T7     |  COMMIT                 |                              |
+------------------------------------------------------------------+

MAGIC: Both transactions run in parallel. No waiting.
A sees its snapshot. B sees its snapshot. Everyone is happy.
```

**Animation**:
- Show two timelines side by side
- Traditional: Red blocks, waiting indicators
- MVCC: Green flow, parallel execution

---

### Visual 2: Row Versioning Explained

**Type**: Interactive tuple version chain

**Description**: Show how updates create new versions

```
[VISUAL: Tuple Version Chain]

INITIAL STATE (after INSERT):
+------------------------------------------------------------------+
|  Page 42                                                          |
|  +--------------------------------------------------------------+ |
|  |  Tuple at position 5:                                        | |
|  |  +----------------------------------------------------------+| |
|  |  | DATA: {id: 1, name: 'Alice', balance: 1000}              || |
|  |  | xmin: 100  <- Created by transaction 100                 || |
|  |  | xmax: 0    <- Not deleted (0 = alive)                    || |
|  |  | ctid: (42, 5) <- Points to self                          || |
|  |  +----------------------------------------------------------+| |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+

AFTER UPDATE (transaction 200 runs: UPDATE SET balance = 1500):
+------------------------------------------------------------------+
|  Page 42                                                          |
|  +--------------------------------------------------------------+ |
|  |  Tuple at position 5 (OLD VERSION):                          | |
|  |  +----------------------------------------------------------+| |
|  |  | DATA: {id: 1, name: 'Alice', balance: 1000}              || |
|  |  | xmin: 100                                                 || |
|  |  | xmax: 200  <- MARKED DEAD by transaction 200             || |
|  |  | ctid: (42, 8) <- Points to NEW version!                  || |
|  |  +----------------------------------------------------------+| |
|  |                                                               | |
|  |  Tuple at position 8 (NEW VERSION):                          | |
|  |  +----------------------------------------------------------+| |
|  |  | DATA: {id: 1, name: 'Alice', balance: 1500}              || |
|  |  | xmin: 200  <- Created by transaction 200                 || |
|  |  | xmax: 0    <- Still alive                                 || |
|  |  | ctid: (42, 8) <- Points to self                          || |
|  |  +----------------------------------------------------------+| |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+

KEY INSIGHT:
- The OLD tuple is NOT deleted (other transactions might need it!)
- The OLD tuple's ctid now points to the NEW tuple (version chain)
- This is why updates = insert new + mark old as dead
- This is why tables grow even if row count stays the same
```

**Interactive Features**:
- Run UPDATE button to animate the transition
- Hover to see xmin/xmax explanations
- Follow the ctid pointer visually

---

### Visual 3: The Visibility Rules

**Type**: Flowchart with interactive examples

**Description**: How PostgreSQL decides which version you see

```
[VISUAL: Visibility Decision Tree]

QUESTION: "Can my transaction (XID: 300) see this tuple?"

                    +------------------+
                    | Is xmin visible? |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
         xmin = 100                    xmin = 350
         (committed                    (in future!)
          before me)                        |
              |                             v
              v                       NOT VISIBLE
    +-------------------+
    | Is xmax set?      |
    +---------+---------+
              |
    +---------+---------+
    |                   |
  xmax = 0           xmax = 200
  (not deleted)      (deleted)
    |                   |
    v                   v
 VISIBLE!        +------------------+
                 | Is xmax visible? |
                 +--------+---------+
                          |
               +----------+----------+
               |                     |
          xmax = 200            xmax = 350
          (committed            (not yet
           before me)            committed)
               |                     |
               v                     v
         NOT VISIBLE            VISIBLE!
         (deleted before        (deleter hasn't
          I started)             committed yet)


SUMMARY TABLE:
+------------------------------------------------------------------+
|  Tuple State            | xmin     | xmax     | Visible to 300? |
+------------------------------------------------------------------+
|  Created before me,     | 100 (C)  | 0        | YES             |
|  not deleted            |          |          |                 |
+------------------------------------------------------------------+
|  Created before me,     | 100 (C)  | 200 (C)  | NO              |
|  deleted before me      |          |          | (it's dead)     |
+------------------------------------------------------------------+
|  Created before me,     | 100 (C)  | 350 (IP) | YES             |
|  being deleted (uncommit)|          |          | (deleter uncommit)|
+------------------------------------------------------------------+
|  Created after me       | 350 (IP) | 0        | NO              |
|  (in the future!)       |          |          | (doesn't exist) |
+------------------------------------------------------------------+

C = Committed, IP = In Progress
```

**Interactive Features**:
- Input: "Your transaction ID"
- Input: "Tuple xmin" and "xmax"
- Output: "VISIBLE" or "NOT VISIBLE" with explanation

---

### Visual 4: Transaction Snapshots

**Type**: Timeline visualization

**Description**: Show how snapshots capture a moment in time

```
[VISUAL: Snapshot Concept]

When your transaction starts, it takes a SNAPSHOT:
+------------------------------------------------------------------+
|  SNAPSHOT for Transaction 300:                                    |
|  +--------------------------------------------------------------+ |
|  | xmin: 250      <- Oldest active transaction when I started   | |
|  | xmax: 300      <- My transaction ID                          | |
|  | xip_list: [275, 283, 291]  <- Transactions that were         | |
|  |                               in-progress when I started      | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+

WHAT THIS MEANS:
+------------------------------------------------------------------+
|  Transaction ID  |  Status when 300 started  |  Visible to 300?  |
+------------------------------------------------------------------+
|  200             |  Committed                |  YES              |
|  249             |  Committed                |  YES              |
|  250             |  Active (in xip_list)     |  NO (might abort) |
|  275             |  Active (in xip_list)     |  NO               |
|  283             |  Active (in xip_list)     |  NO               |
|  291             |  Active (in xip_list)     |  NO               |
|  299             |  Committed                |  YES              |
|  300             |  That's me!               |  YES (my own)     |
|  301+            |  Started after me         |  NO (future)      |
+------------------------------------------------------------------+

THE MAGIC:
Even if transaction 275 commits AFTER I started,
I will NEVER see its changes (in REPEATABLE READ).
My snapshot is FROZEN at the moment I began.
```

---

### Visual 5: MVCC Time Machine

**Type**: Interactive time scrubber

**Description**: See data as different transactions see it

```
[VISUAL: Time Machine - See Data Through Different Eyes]

DATA: accounts table, row id = 1

VERSION HISTORY:
+------------------------------------------------------------------+
|  Timeline                                                         |
|  ========                                                         |
|                                                                   |
|  XID 100: INSERT (balance = 1000)                                |
|     |                                                             |
|     v                                                             |
|  ---●-------------------------------------------------->          |
|     |                                                             |
|  XID 200: UPDATE (balance = 1500)                                |
|            |                                                      |
|            v                                                      |
|  ---------●----------------------------------------->             |
|            |                                                      |
|  XID 250: UPDATE (balance = 2000)                                |
|                    |                                              |
|                    v                                              |
|  -----------------●------------------------------>                |
|                                                                   |
+------------------------------------------------------------------+

TIME SCRUBBER: [=====|==============] Position: XID 220

+------------------------------------------------------------------+
|  WHAT TRANSACTION 220 SEES:                                       |
|                                                                   |
|  accounts table:                                                  |
|  +----------------------------------------------------------+    |
|  |  id  |  balance  |  (visible version)                    |    |
|  +------+-----------+----------------------------------------+   |
|  |  1   |  1500     |  <- XID 200 committed before 220      |    |
|  +------+-----------+----------------------------------------+   |
|                                                                   |
|  XID 100's version (balance=1000): DEAD (superseded by 200)     |
|  XID 200's version (balance=1500): VISIBLE                       |
|  XID 250's version (balance=2000): NOT VISIBLE (future)         |
+------------------------------------------------------------------+

[Scrub to different XID to see how visibility changes]
```

**Interactive Features**:
- Slider to move through "time" (transaction IDs)
- Table updates to show what that transaction sees
- Highlight which version is visible and why

---

### Visual 6: Why VACUUM Exists

**Type**: Before/After visualization

**Description**: Show dead tuple accumulation and cleanup

```
[VISUAL: The VACUUM Necessity]

AFTER MANY UPDATES (No VACUUM):
+------------------------------------------------------------------+
|  Page 42                                                          |
|  +--------------------------------------------------------------+ |
|  | DEAD: {id:1, balance:1000} xmax=200                          | |
|  | DEAD: {id:1, balance:1500} xmax=250                          | |
|  | DEAD: {id:1, balance:2000} xmax=300                          | |
|  | DEAD: {id:1, balance:2500} xmax=350                          | |
|  | LIVE: {id:1, balance:3000} xmax=0                            | |
|  +--------------------------------------------------------------+ |
|                                                                   |
|  5 versions of the same row!                                     |
|  4 are dead (can never be seen by any transaction)              |
|  Only 1 is live                                                  |
|  But all 5 consume disk space!                                   |
+------------------------------------------------------------------+

PROBLEM:
- Table keeps growing even though only 1M rows
- Queries scan dead tuples too (wasted I/O)
- Eventually: disk full

AFTER VACUUM:
+------------------------------------------------------------------+
|  Page 42                                                          |
|  +--------------------------------------------------------------+ |
|  | FREE SPACE (was dead tuples)                                 | |
|  | LIVE: {id:1, balance:3000} xmax=0                            | |
|  | FREE SPACE (was dead tuples)                                 | |
|  +--------------------------------------------------------------+ |
|                                                                   |
|  Dead tuples removed!                                            |
|  Space marked as reusable for new inserts                        |
|  (Note: File size doesn't shrink - use VACUUM FULL for that)    |
+------------------------------------------------------------------+
```

---

## Key Takeaways Panel

```
+------------------------------------------------------------------+
|  KEY TAKEAWAYS                                                    |
+------------------------------------------------------------------+
|                                                                   |
|  1. MVCC = MULTIPLE VERSIONS OF EACH ROW                         |
|     Updates don't overwrite. They create new versions.           |
|     Old versions kept for concurrent readers.                    |
|                                                                   |
|  2. xmin/xmax = BIRTH AND DEATH CERTIFICATES                     |
|     xmin: Transaction that created this version                  |
|     xmax: Transaction that deleted/updated this version          |
|     xmax = 0 means "still alive"                                 |
|                                                                   |
|  3. SNAPSHOTS = FROZEN VIEWS                                     |
|     Each transaction sees data as of its start time.             |
|     Changes by others are invisible (isolation!).                |
|                                                                   |
|  4. DEAD TUPLES ACCUMULATE                                       |
|     Old versions stay until VACUUM removes them.                 |
|     This is "bloat". VACUUM is essential.                        |
|                                                                   |
|  5. NO READ LOCKS NEEDED!                                        |
|     Readers see their snapshot.                                  |
|     Writers create new versions.                                 |
|     They never conflict. This is why PostgreSQL scales.          |
|                                                                   |
+------------------------------------------------------------------+
```

---

## Connection to Next Section

```
NOW YOU KNOW: 
- How PostgreSQL maintains multiple versions (MVCC)
- How snapshots provide isolation
- Why VACUUM is necessary

NEXT QUESTION: 
How does all this come together to provide ACID guarantees?
What does "isolation level" really mean?

NEXT SECTION: 1.5 ACID: Real Examples
- Atomicity in practice
- Consistency with constraints
- Isolation levels compared
- Durability (we covered this in WAL!)
```
