# 1.3 The Write Path (WAL & Durability)

> **The Question**: "What happens if power goes off right after my COMMIT?"

---

## Overview

This section explains how PostgreSQL guarantees data durability. By the end, users will understand:

- Why PostgreSQL doesn't write directly to table files
- What Write-Ahead Logging (WAL) is and why it exists
- The exact moment your data becomes "safe"
- How crash recovery works

---

## Visual Components

### Visual 1: The Naive Approach (Why It Fails)

**Type**: Animated failure scenario

**Description**: Show what would happen WITHOUT WAL

```
[VISUAL: The Dangerous Direct Write]

THE NAIVE APPROACH (What PostgreSQL does NOT do):

Step 1: User runs UPDATE
+------------------------------------------------------------------+
|  UPDATE accounts SET balance = 1000 WHERE id = 1;                |
+------------------------------------------------------------------+
                              |
                              v
Step 2: Modify page in memory
+------------------------------------------------------------------+
|  SHARED BUFFERS                                                   |
|  +------------------------------------------------------------+  |
|  |  Page 42: balance = 1000 (modified in RAM)                 |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                              |
                              v
Step 3: Write directly to table file
+------------------------------------------------------------------+
|  DISK - Table File                                                |
|  +------------------------------------------------------------+  |
|  |  Writing Page 42...                                         |  |
|  |  [████████████░░░░░░░░░░░░] 50% complete                    |  |
|  +------------------------------------------------------------+  |
|                              |                                    |
|                              | ⚡ POWER FAILURE!                  |
|                              v                                    |
|  +------------------------------------------------------------+  |
|  |  Page 42: CORRUPTED (half old data, half new data)         |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+

RESULT:
- Page is partially written
- Contains garbage (mix of old and new)
- Table is CORRUPTED
- Data is LOST

This is why PostgreSQL uses Write-Ahead Logging (WAL).
```

**Animation**:
- Show write starting
- Lightning bolt interrupts at 50%
- Page turns red (corrupted)
- Skull icon appears

---

### Visual 2: The Write Path (How It Actually Works)

**Type**: Step-by-step animated timeline

**Description**: The correct sequence of a PostgreSQL write

```
[VISUAL: PostgreSQL Write Path Timeline]

INTERACTIVE TIMELINE - Click any step to pause and explore

+------------------------------------------------------------------+
|  THE JOURNEY OF: UPDATE accounts SET balance = 1000 WHERE id = 1 |
+------------------------------------------------------------------+

STEP 1: Execute in Backend (T+0ms)
+------------------------------------------------------------------+
|  Backend Process                                                  |
|  +------------------------------------------------------------+  |
|  |  1. Find row (id = 1) in shared_buffers                    |  |
|  |  2. Create NEW tuple (MVCC - don't overwrite!)             |  |
|  |  3. Mark old tuple as dead (xmax = current_xid)            |  |
|  |  4. Page 42 is now DIRTY (RAM differs from disk)           |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  STATE:                                                           |
|  - RAM: Has new data      - DISK: Still has old data            |
|  - WAL Buffer: Empty      - WAL Disk: Empty                      |
+------------------------------------------------------------------+

STEP 2: Write to WAL Buffer (T+1ms)
+------------------------------------------------------------------+
|  Before releasing locks, write WAL record:                        |
|  +------------------------------------------------------------+  |
|  |  WAL RECORD:                                                |  |
|  |  - Transaction ID: 1847293                                  |  |
|  |  - Operation: HEAP_UPDATE                                   |  |
|  |  - Page: 42                                                 |  |
|  |  - Old tuple offset: 5                                      |  |
|  |  - New tuple data: {id: 1, balance: 1000}                   |  |
|  |  - LSN (Log Sequence Number): 0/15A3B2C0                    |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  STATE:                                                           |
|  - RAM: Has new data      - DISK: Still has old data            |
|  - WAL Buffer: HAS RECORD - WAL Disk: Empty                      |
+------------------------------------------------------------------+

STEP 3: User runs COMMIT (T+2ms)
+------------------------------------------------------------------+
|  COMMIT triggers:                                                 |
|  +------------------------------------------------------------+  |
|  |  1. Write COMMIT record to WAL Buffer                       |  |
|  |  2. FLUSH WAL Buffer to WAL Disk (fsync!)                   |  |
|  |  3. Wait for fsync to complete                              |  |
|  |  4. Only THEN return "COMMIT OK" to client                  |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  THE CRITICAL MOMENT:                                             |
|  fsync() forces the OS to write to PHYSICAL storage.             |
|  Not just OS cache. Actual disk platters or flash cells.         |
|                                                                   |
|  STATE:                                                           |
|  - RAM: Has new data      - DISK: STILL has old data! (!)       |
|  - WAL Buffer: Empty      - WAL Disk: HAS RECORD (SAFE!)         |
+------------------------------------------------------------------+

STEP 4: Return Success (T+3ms)
+------------------------------------------------------------------+
|  Client receives: "COMMIT OK"                                     |
|  +------------------------------------------------------------+  |
|  |  At this EXACT moment:                                      |  |
|  |                                                             |  |
|  |  - WAL on disk: Contains the change (DURABLE)               |  |
|  |  - Table file on disk: STILL HAS OLD DATA!                  |  |
|  |  - shared_buffers: Has new data (in RAM)                    |  |
|  |                                                             |  |
|  |  If power fails NOW: Data is SAFE. WAL has it.              |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+

STEP 5: Checkpoint (Minutes Later)
+------------------------------------------------------------------+
|  Background checkpointer runs:                                    |
|  +------------------------------------------------------------+  |
|  |  1. Scan shared_buffers for dirty pages                     |  |
|  |  2. Write dirty pages to table files                        |  |
|  |  3. Record checkpoint in WAL                                 |  |
|  |  4. Old WAL segments can now be recycled                    |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  NOW FINALLY:                                                     |
|  - Table file on disk: HAS NEW DATA                              |
|  - WAL: Can delete old records (no longer needed for recovery)   |
+------------------------------------------------------------------+
```

**Interactive Features**:
- Click any step to pause and see detailed state
- "Power Off" button at each step to simulate crash
- State diagram shows RAM/Disk/WAL contents at each point

---

### Visual 3: The Power Failure Simulator

**Type**: Interactive crash simulator

**Description**: Let users crash at each stage and see what survives

```
[VISUAL: Crash and Recovery Simulator]

+------------------------------------------------------------------+
|  CRASH SIMULATOR                                                  |
|                                                                   |
|  Transaction: UPDATE accounts SET balance = 1000 WHERE id = 1    |
|                                                                   |
|  TIMELINE:                                                        |
|  [Step1]---[Step2]---[Step3]---[Step4]---[Step5]                 |
|     |         |         |         |         |                     |
|     v         v         v         v         v                     |
|  [CRASH]   [CRASH]   [CRASH]   [CRASH]   [CRASH]                 |
|                                                                   |
|  Click any CRASH button to simulate power failure                 |
+------------------------------------------------------------------+

CRASH AT STEP 2 (Before COMMIT):
+------------------------------------------------------------------+
|  CRASH RESULT:                                                    |
|                                                                   |
|  - RAM: LOST (power = gone)                                      |
|  - WAL Disk: No COMMIT record                                    |
|  - Table Disk: Has old data (balance = 500)                      |
|                                                                   |
|  ON RECOVERY:                                                     |
|  1. PostgreSQL starts                                             |
|  2. Reads WAL from last checkpoint                               |
|  3. Sees transaction 1847293 in WAL                              |
|  4. But NO COMMIT record for 1847293                             |
|  5. Transaction is ROLLED BACK                                   |
|                                                                   |
|  FINAL STATE: balance = 500 (original value)                     |
|                                                                   |
|  USER EXPERIENCE:                                                 |
|  - They never saw "COMMIT OK"                                    |
|  - Their application knows the update didn't complete            |
|  - They can retry safely                                         |
|                                                                   |
|  VERDICT: DATA INTEGRITY MAINTAINED ✓                            |
+------------------------------------------------------------------+

CRASH AT STEP 4 (After COMMIT returned):
+------------------------------------------------------------------+
|  CRASH RESULT:                                                    |
|                                                                   |
|  - RAM: LOST (power = gone)                                      |
|  - WAL Disk: HAS COMMIT record for 1847293                       |
|  - Table Disk: Has OLD data (balance = 500)                      |
|                                                                   |
|  ON RECOVERY:                                                     |
|  1. PostgreSQL starts                                             |
|  2. Reads WAL from last checkpoint                               |
|  3. Sees UPDATE for transaction 1847293                          |
|  4. Sees COMMIT for transaction 1847293                          |
|  5. REPLAYS the update to table file                             |
|                                                                   |
|  FINAL STATE: balance = 1000 (new value)                         |
|                                                                   |
|  USER EXPERIENCE:                                                 |
|  - They saw "COMMIT OK"                                          |
|  - Their data is preserved                                       |
|  - System is consistent                                          |
|                                                                   |
|  VERDICT: DATA PRESERVED ✓ (The whole point of WAL!)            |
+------------------------------------------------------------------+
```

**Interactive Features**:
- Click any crash button
- See animated recovery process
- Compare state before and after recovery

---

### Visual 4: WAL Segment Files

**Type**: File system visualization

**Description**: Show the physical WAL files on disk

```
[VISUAL: WAL Segment Files]

pg_wal/ directory:
+------------------------------------------------------------------+
|                                                                   |
|  +----------------------+  Status: CURRENT (being written)       |
|  | 0000000100000000     |  Size: 16 MB (default segment size)   |
|  | 0000000A             |  LSN Range: 0/A0000000 - 0/B0000000   |
|  | [████████████████]   |  Usage: 100% full                      |
|  +----------------------+                                        |
|                                                                   |
|  +----------------------+  Status: CURRENT (being written)       |
|  | 0000000100000000     |                                        |
|  | 0000000B             |  <- We are HERE                        |
|  | [████████░░░░░░░░]   |  Usage: 47% full                       |
|  +----------------------+                                        |
|                                                                   |
|  +----------------------+  Status: RESERVED (pre-allocated)      |
|  | 0000000100000000     |                                        |
|  | 0000000C             |                                        |
|  | [░░░░░░░░░░░░░░░░]   |  Usage: Empty                          |
|  +----------------------+                                        |
|                                                                   |
|  OLDER SEGMENTS:                                                  |
|  [ARCHIVED] 000000010000000000000001 through 000000000000000009  |
|             (Sent to backup storage, can be deleted locally)     |
|                                                                   |
+------------------------------------------------------------------+

WAL SEGMENT LIFECYCLE:
1. Pre-allocated (empty, ready for use)
2. Current (being written to)
3. Full (waiting for checkpoint)
4. After checkpoint: Recycled or Archived
```

---

### Visual 5: The LSN (Log Sequence Number)

**Type**: Explanatory diagram with examples

**Description**: Explain how LSN tracks position in WAL

```
[VISUAL: Understanding LSN]

LSN = Log Sequence Number
Format: Segment/Offset (e.g., 0/15A3B2C0)

+------------------------------------------------------------------+
|  LSN: 0/15A3B2C0                                                  |
|       |  |                                                        |
|       |  +-------> Byte offset within segment: 0x15A3B2C0        |
|       |            = 363,348,672 bytes into the segment          |
|       |                                                           |
|       +----------> Segment number: 0                              |
|                    (increases as segments fill up)               |
+------------------------------------------------------------------+

EVERY PAGE KNOWS ITS LSN:
+------------------------------------------------------------------+
|  Page Header                                                      |
|  +------------------------------------------------------------+  |
|  |  pd_lsn: 0/15A3B2C0                                        |  |
|  |                                                             |  |
|  |  "The last WAL record that modified this page              |  |
|  |   is at position 0/15A3B2C0 in the WAL"                    |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+

WHY THIS MATTERS:
- During recovery, compare page LSN to WAL LSN
- If page LSN < WAL LSN: Page is old, needs replay
- If page LSN >= WAL LSN: Page is current, skip
- This makes recovery efficient (don't redo already-applied changes)
```

---

### Visual 6: Checkpoint Explained

**Type**: Animated process diagram

**Description**: Show what happens during a checkpoint

```
[VISUAL: Checkpoint Process]

BEFORE CHECKPOINT:
+------------------------------------------------------------------+
|  SHARED BUFFERS                                                   |
|  +----+----+----+----+----+----+----+----+----+----+             |
|  | D  | C  | D  | C  | D  | D  | C  | D  | C  | D  |             |
|  +----+----+----+----+----+----+----+----+----+----+             |
|    D = Dirty (modified, not on disk)                              |
|    C = Clean (matches disk)                                       |
|                                                                   |
|  WAL on disk:                                                     |
|  [Record1][Record2][Record3]...[Record1000]                       |
|   <- Oldest                      Newest ->                        |
|   Can't delete! Needed for recovery if we crash.                  |
+------------------------------------------------------------------+

CHECKPOINT PROCESS:
+------------------------------------------------------------------+
|  1. Write checkpoint START record to WAL                          |
|  2. Flush ALL dirty pages to disk                                 |
|     [████████████████████████████░░░░░░░░░░] 70%                  |
|     (This can take seconds to minutes for large caches)           |
|  3. Write checkpoint END record to WAL                            |
|  4. Update pg_control file with checkpoint location               |
+------------------------------------------------------------------+

AFTER CHECKPOINT:
+------------------------------------------------------------------+
|  SHARED BUFFERS                                                   |
|  +----+----+----+----+----+----+----+----+----+----+             |
|  | C  | C  | C  | C  | C  | C  | C  | C  | C  | C  |             |
|  +----+----+----+----+----+----+----+----+----+----+             |
|    All pages now CLEAN (match disk)                               |
|                                                                   |
|  WAL on disk:                                                     |
|  [Recycled][Recycled][Recycled]...[Checkpoint][New Records]       |
|   <- Can delete these!              Recovery starts here          |
+------------------------------------------------------------------+

RECOVERY NOW ONLY NEEDS:
- WAL from this checkpoint forward
- Much faster recovery!
```

---

## Key Takeaways Panel

```
+------------------------------------------------------------------+
|  KEY TAKEAWAYS                                                    |
+------------------------------------------------------------------+
|                                                                   |
|  1. WAL = WRITE-AHEAD LOGGING                                    |
|     "Write to the log BEFORE writing to the data file"           |
|     This is the foundation of durability.                        |
|                                                                   |
|  2. COMMIT = FSYNC TO WAL                                        |
|     When you see "COMMIT OK", WAL is on disk.                    |
|     Table files might still have old data!                       |
|     This is fine - WAL can reconstruct everything.               |
|                                                                   |
|  3. CHECKPOINT = SYNC RAM TO DISK                                |
|     Periodically writes dirty pages to table files.              |
|     Allows old WAL segments to be recycled.                      |
|     Makes recovery faster (less WAL to replay).                  |
|                                                                   |
|  4. RECOVERY = REPLAY WAL                                        |
|     On crash: Read WAL from last checkpoint.                     |
|     Replay committed transactions.                               |
|     Rollback uncommitted transactions.                           |
|                                                                   |
+------------------------------------------------------------------+
```

---

## Common Questions Answered

### "Is my data safe if I saw COMMIT?"

```
YES, with caveats:

1. If synchronous_commit = on (default): YES, absolutely safe.
   WAL is fsync'd to disk before COMMIT returns.

2. If synchronous_commit = off: MOSTLY safe.
   WAL is written but not necessarily fsync'd.
   Up to ~600ms of recent transactions could be lost on crash.
   (Tradeoff: 2-3x faster commits, small data loss risk)

3. HARDWARE CAVEAT:
   Some cheap SSDs lie about fsync.
   They say "written!" but data is in volatile cache.
   Power loss = data loss. Use enterprise storage.
```

### "Why not write directly to table files?"

```
PERFORMANCE + SAFETY:

1. WAL writes are SEQUENTIAL (fast!)
   Table file writes are RANDOM (slow!)
   Writing to WAL first = fewer disk seeks.

2. WAL is APPEND-ONLY
   Never modifies existing data.
   A partial write = incomplete record (detectable).
   Table file = partial write could corrupt page.

3. BATCHING
   Multiple transactions' WAL records written together.
   One fsync covers many commits.
   Much more efficient than fsync per table update.
```

---

## Connection to Next Section

```
NOW YOU KNOW: 
- How PostgreSQL writes data (WAL first, table files later)
- Why COMMIT means "safe on disk"
- How crash recovery works

NEXT QUESTION: 
Wait, if PostgreSQL keeps OLD versions of rows around 
(we mentioned MVCC)... how does that work exactly?

NEXT SECTION: 1.4 MVCC: The Versioning System
- Why updates create new rows
- How transactions see different versions
- The visibility rules
```

---

## Technical Implementation Notes

### UI Components Needed

1. **TimelineAnimator**: Step-by-step animated sequence
2. **CrashSimulator**: Interactive failure injection
3. **StateComparison**: Side-by-side RAM/Disk/WAL state
4. **FileSystemView**: Visual representation of WAL files
5. **ProgressBar**: For checkpoint progress

### Animations

- Write path: 400ms between steps, auto-advance or click
- Crash: Lightning bolt animation, 200ms
- Recovery: Replay animation with fast-forward option
- Checkpoint: Progress bar with page-by-page updates

### Data Requirements

- Sample WAL record structure
- Checkpoint timing examples
- Recovery log examples
