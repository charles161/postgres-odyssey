# Isolation Levels: Real Anomalies

> **The Question**: "What's the difference between Read Committed and Repeatable Read?"

---

## Visual 1: The Isolation Spectrum

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ISOLATION LEVELS: How Much Chaos Do You Tolerate?                       │
│  ═════════════════════════════════════════════════                       │
│                                                                          │
│  Weaker ◄─────────────────────────────────────────────────────► Stronger │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ READ        │  │ READ        │  │ REPEATABLE  │  │ SERIALIZABLE│     │
│  │ UNCOMMITTED │  │ COMMITTED   │  │ READ        │  │             │     │
│  │             │  │             │  │             │  │             │     │
│  │ See dirty   │  │ See only    │  │ Snapshot    │  │ As if run   │     │
│  │ writes      │  │ committed   │  │ frozen at   │  │ one at a    │     │
│  │             │  │ data        │  │ txn start   │  │ time        │     │
│  │             │  │             │  │             │  │             │     │
│  │ (PostgreSQL │  │ (DEFAULT)   │  │             │  │             │     │
│  │  treats as  │  │             │  │             │  │             │     │
│  │  Read Comm.)│  │             │  │             │  │             │     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                                          │
│  ANOMALIES POSSIBLE:                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    │ Dirty │ Non-Repeat │ Phantom │ Serializ. │    │
│  │                    │ Read  │ Read       │ Read    │ Anomaly   │    │
│  │ ───────────────────┼───────┼────────────┼─────────┼───────────│    │
│  │ Read Uncommitted   │  ✗    │     ✗      │    ✗    │    ✗     │    │
│  │ Read Committed     │  ✓    │     ✗      │    ✗    │    ✗     │    │
│  │ Repeatable Read    │  ✓    │     ✓      │    ✓*   │    ✗     │    │
│  │ Serializable       │  ✓    │     ✓      │    ✓    │    ✓     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ✓ = Protected against   ✗ = Can happen                                 │
│  * PostgreSQL's MVCC prevents phantoms even at Repeatable Read          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 2: Dirty Read (Prevented in PostgreSQL)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DIRTY READ: Seeing uncommitted data                                     │
│  ═══════════════════════════════════                                     │
│                                                                          │
│  SCENARIO: Bank transfer                                                 │
│                                                                          │
│  Account A: $1000    Account B: $0                                       │
│                                                                          │
│  ┌──────────────────────────┐  ┌──────────────────────────┐             │
│  │ Transaction 1 (Transfer) │  │ Transaction 2 (Report)   │             │
│  │                          │  │                          │             │
│  │ BEGIN                    │  │                          │             │
│  │                          │  │                          │             │
│  │ UPDATE accounts          │  │                          │             │
│  │ SET balance = 500        │  │                          │             │
│  │ WHERE id = 'A';          │  │                          │             │
│  │                          │  │ BEGIN                    │             │
│  │                          │  │                          │             │
│  │ -- Not committed yet!    │  │ SELECT SUM(balance)      │             │
│  │                          │  │ FROM accounts;           │             │
│  │                          │  │                          │             │
│  │                          │  │ -- Dirty read would see: │             │
│  │                          │  │ -- A=500, B=0 → $500!    │             │
│  │                          │  │ -- Where did $500 go?!   │             │
│  │                          │  │                          │             │
│  │ ROLLBACK                 │  │ COMMIT                   │             │
│  │ -- A is back to $1000    │  │ -- Report is WRONG!      │             │
│  └──────────────────────────┘  └──────────────────────────┘             │
│                                                                          │
│  ✓ PostgreSQL NEVER allows dirty reads (even at Read Uncommitted)       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 3: Non-Repeatable Read

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NON-REPEATABLE READ: Same query, different results                      │
│  ══════════════════════════════════════════════════                      │
│                                                                          │
│  SCENARIO: Checking balance twice in same transaction                   │
│                                                                          │
│  ┌──────────────────────────┐  ┌──────────────────────────┐             │
│  │ Transaction 1 (Report)   │  │ Transaction 2 (Deposit)  │             │
│  │                          │  │                          │             │
│  │ BEGIN                    │  │                          │             │
│  │                          │  │                          │             │
│  │ SELECT balance           │  │                          │             │
│  │ FROM accounts            │  │                          │             │
│  │ WHERE id = 'A';          │  │                          │             │
│  │ -- Returns: $1000        │  │                          │             │
│  │                          │  │ BEGIN                    │             │
│  │                          │  │ UPDATE accounts          │             │
│  │                          │  │ SET balance = 1500       │             │
│  │                          │  │ WHERE id = 'A';          │             │
│  │                          │  │ COMMIT                   │             │
│  │                          │  │                          │             │
│  │ SELECT balance           │  │                          │             │
│  │ FROM accounts            │  │                          │             │
│  │ WHERE id = 'A';          │  │                          │             │
│  │ -- Returns: $1500 !!!    │  │                          │             │
│  │                          │  │                          │             │
│  │ -- Same query, different │  │                          │             │
│  │ -- result in same txn!   │  │                          │             │
│  │ COMMIT                   │  │                          │             │
│  └──────────────────────────┘  └──────────────────────────┘             │
│                                                                          │
│  READ COMMITTED: This CAN happen (you see committed changes)            │
│  REPEATABLE READ: This is PREVENTED (snapshot is frozen)                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Visual 4: Serialization Anomaly

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SERIALIZATION ANOMALY: Logically impossible results                    │
│  ════════════════════════════════════════════════════                    │
│                                                                          │
│  SCENARIO: Two doctors each check if they're the only one on-call      │
│                                                                          │
│  Rule: At least one doctor must be on-call                              │
│                                                                          │
│  Initial: doctor_a.on_call = TRUE, doctor_b.on_call = TRUE              │
│                                                                          │
│  ┌──────────────────────────┐  ┌──────────────────────────┐             │
│  │ Transaction 1 (Alice)    │  │ Transaction 2 (Bob)      │             │
│  │                          │  │                          │             │
│  │ BEGIN ISOLATION LEVEL    │  │ BEGIN ISOLATION LEVEL    │             │
│  │ REPEATABLE READ          │  │ REPEATABLE READ          │             │
│  │                          │  │                          │             │
│  │ SELECT on_call           │  │ SELECT on_call           │             │
│  │ FROM doctors             │  │ FROM doctors             │             │
│  │ WHERE name = 'Bob';      │  │ WHERE name = 'Alice';    │             │
│  │ -- Returns: TRUE         │  │ -- Returns: TRUE         │             │
│  │                          │  │                          │             │
│  │ -- "Bob is on-call,      │  │ -- "Alice is on-call,    │             │
│  │ -- I can sign off"       │  │ -- I can sign off"       │             │
│  │                          │  │                          │             │
│  │ UPDATE doctors           │  │ UPDATE doctors           │             │
│  │ SET on_call = FALSE      │  │ SET on_call = FALSE      │             │
│  │ WHERE name = 'Alice';    │  │ WHERE name = 'Bob';      │             │
│  │                          │  │                          │             │
│  │ COMMIT                   │  │ COMMIT                   │             │
│  └──────────────────────────┘  └──────────────────────────┘             │
│                                                                          │
│  RESULT: Both doctors are off-call! No one is on duty!                  │
│                                                                          │
│  This couldn't happen if they ran one after the other.                  │
│  → SERIALIZATION ANOMALY                                                 │
│                                                                          │
│  SERIALIZABLE level: One transaction would be aborted with              │
│  "could not serialize access due to read/write dependencies"            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
