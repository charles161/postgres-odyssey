# Section 9.1: PostgreSQL vs NoSQL - The Real Tradeoffs

> **The Question**: "When should I use PostgreSQL vs MongoDB vs Redis vs Cassandra?"

---

## The Core Insight

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHY NOSQL EXISTS: UNDERSTANDING THE TRADEOFFS                           │
│  ═════════════════════════════════════════════                           │
│                                                                          │
│  NoSQL didn't appear because "SQL is bad."                              │
│  It appeared because DIFFERENT PROBLEMS need DIFFERENT SOLUTIONS.       │
│                                                                          │
│  Let's understand the MECHANICS behind each tradeoff.                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tradeoff 1: Schema Flexibility vs Query Power

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TRADEOFF 1: SCHEMA FLEXIBILITY vs QUERY POWER                           │
│  ═════════════════════════════════════════════                           │
│                                                                          │
│  POSTGRESQL (Relational):                                               │
│  ─────────────────────────                                               │
│                                                                          │
│  CREATE TABLE users (                                                    │
│    id SERIAL PRIMARY KEY,                                               │
│    name TEXT NOT NULL,                                                  │
│    email TEXT UNIQUE NOT NULL,                                          │
│    age INT CHECK (age >= 0)                                             │
│  );                                                                      │
│                                                                          │
│  • Schema is FIXED at table creation                                    │
│  • Every row has the same columns                                       │
│  • Types are enforced (can't put "hello" in age)                        │
│  • Constraints are enforced (age >= 0)                                  │
│                                                                          │
│  WHY THIS MATTERS FOR QUERIES:                                          │
│  • PostgreSQL KNOWS the structure of every row                          │
│  • It can build indexes on any column                                   │
│  • It can JOIN tables because relationships are explicit                │
│  • Query planner can optimize because schema is known                   │
│                                                                          │
│  ───────────────────────────────────────────────────────────────────    │
│                                                                          │
│  MONGODB (Document):                                                    │
│  ───────────────────                                                     │
│                                                                          │
│  db.users.insertOne({                                                   │
│    name: "Alice",                                                       │
│    email: "alice@test.com",                                             │
│    age: 30,                                                             │
│    favoriteColors: ["blue", "green"],  // Array? Sure!                  │
│    address: {                           // Nested object? Sure!         │
│      city: "Tokyo",                                                     │
│      zip: "100-0001"                                                    │
│    }                                                                    │
│  });                                                                     │
│                                                                          │
│  db.users.insertOne({                                                   │
│    name: "Bob",                                                         │
│    email: "bob@test.com"                                                │
│    // No age? No problem!                                               │
│    // Different structure? That's fine!                                 │
│  });                                                                     │
│                                                                          │
│  • Schema is FLEXIBLE (schemaless)                                      │
│  • Each document can have different fields                              │
│  • Nested objects and arrays are natural                                │
│  • No ALTER TABLE needed to add fields                                  │
│                                                                          │
│  WHY THIS LIMITS QUERIES:                                               │
│  • MongoDB doesn't know what fields exist until it reads                │
│  • JOINs are expensive (no foreign keys, must fetch separately)         │
│  • Aggregations across inconsistent schemas are tricky                  │
│  • Query planner has less information to optimize                       │
│                                                                          │
│  ───────────────────────────────────────────────────────────────────    │
│                                                                          │
│  THE REAL QUESTION: Do you know your schema upfront?                    │
│                                                                          │
│  ┌──────────────────────────────┬──────────────────────────────┐        │
│  │ SCHEMA KNOWN (Use Postgres)  │ SCHEMA EVOLVING (Use Mongo)  │        │
│  ├──────────────────────────────┼──────────────────────────────┤        │
│  │ Banking transactions         │ IoT sensor data (varies)     │        │
│  │ E-commerce orders            │ User preferences (flexible)  │        │
│  │ HR employee records          │ CMS content (arbitrary)      │        │
│  │ Inventory management         │ Event logging (varies)       │        │
│  └──────────────────────────────┴──────────────────────────────┘        │
│                                                                          │
│  PLOT TWIST: PostgreSQL has JSONB!                                      │
│  ────────────────────────────────                                        │
│  You can have BOTH in PostgreSQL:                                       │
│                                                                          │
│  CREATE TABLE events (                                                   │
│    id SERIAL PRIMARY KEY,                                               │
│    event_type TEXT,         -- Structured                               │
│    created_at TIMESTAMP,    -- Structured                               │
│    payload JSONB            -- Flexible! Store anything!                │
│  );                                                                      │
│                                                                          │
│  Best of both worlds? Sometimes.                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tradeoff 2: Consistency vs Availability (CAP Theorem)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TRADEOFF 2: CONSISTENCY vs AVAILABILITY (CAP Theorem)                   │
│  ═════════════════════════════════════════════════════                   │
│                                                                          │
│  THE CAP THEOREM (Simplified):                                          │
│  ─────────────────────────────                                           │
│                                                                          │
│  In a distributed system, when a NETWORK PARTITION happens,             │
│  you can only have TWO of these three:                                  │
│                                                                          │
│  • Consistency: Every read sees the latest write                        │
│  • Availability: Every request gets a response                          │
│  • Partition tolerance: System works despite network failures           │
│                                                                          │
│  Partition tolerance is NOT optional in distributed systems.            │
│  Networks WILL fail. So you choose: Consistency OR Availability.        │
│                                                                          │
│  ───────────────────────────────────────────────────────────────────    │
│                                                                          │
│  POSTGRESQL: Chooses CONSISTENCY (CP)                                   │
│  ────────────────────────────────────                                    │
│                                                                          │
│  Scenario: Primary in US, Replica in Europe. Network breaks.            │
│                                                                          │
│  ┌────────────────────┐         XXXXX         ┌────────────────────┐    │
│  │     PRIMARY        │        NETWORK        │     REPLICA        │    │
│  │    (US East)       │◄───── PARTITION ─────►│    (EU West)       │    │
│  │                    │         XXXXX         │                    │    │
│  │  Can accept writes │                       │  Can't receive     │    │
│  │  Authoritative     │                       │  WAL stream        │    │
│  └────────────────────┘                       └────────────────────┘    │
│                                                                          │
│  PostgreSQL's choice:                                                    │
│  • Primary: Continues accepting writes (it's the source of truth)       │
│  • Replica: STOPS serving reads (might be stale, unsafe)                │
│  • OR: Replica serves reads but with WARNING (lagging)                  │
│                                                                          │
│  Result: Consistent data, but EU users might lose availability.         │
│                                                                          │
│  ───────────────────────────────────────────────────────────────────    │
│                                                                          │
│  CASSANDRA/DYNAMODB: Choose AVAILABILITY (AP)                           │
│  ─────────────────────────────────────────────                           │
│                                                                          │
│  Same scenario: Nodes in US and EU. Network breaks.                     │
│                                                                          │
│  ┌────────────────────┐         XXXXX         ┌────────────────────┐    │
│  │     NODE A         │        NETWORK        │     NODE B         │    │
│  │    (US East)       │◄───── PARTITION ─────►│    (EU West)       │    │
│  │                    │         XXXXX         │                    │    │
│  │  Accepts writes!   │                       │  Accepts writes!   │    │
│  │  Serves reads!     │                       │  Serves reads!     │    │
│  └────────────────────┘                       └────────────────────┘    │
│                                                                          │
│  Cassandra's choice:                                                     │
│  • Both nodes continue working independently                            │
│  • Users in US write to Node A                                          │
│  • Users in EU write to Node B                                          │
│  • Everyone stays available!                                            │
│                                                                          │
│  But wait... what if BOTH nodes receive conflicting writes?             │
│                                                                          │
│  US User: UPDATE user SET name = 'Alice' WHERE id = 1;                  │
│  EU User: UPDATE user SET name = 'Alicia' WHERE id = 1;                 │
│                                                                          │
│  When network heals:                                                     │
│  • Node A has name = 'Alice'                                            │
│  • Node B has name = 'Alicia'                                           │
│  • CONFLICT! Which is correct?                                          │
│                                                                          │
│  Cassandra's resolution: LAST WRITE WINS (by timestamp)                 │
│  • If EU write was 1ms later: name = 'Alicia' everywhere                │
│  • US write is silently lost                                            │
│  • No error. No notification. Just gone.                                │
│                                                                          │
│  This is "eventual consistency." Data EVENTUALLY converges.             │
│  But in the meantime, different users see different data.               │
│                                                                          │
│  ───────────────────────────────────────────────────────────────────    │
│                                                                          │
│  WHEN TO CHOOSE WHAT:                                                   │
│                                                                          │
│  ┌────────────────────────────────┬────────────────────────────────┐    │
│  │ CONSISTENCY (PostgreSQL)       │ AVAILABILITY (Cassandra/Dynamo)│    │
│  ├────────────────────────────────┼────────────────────────────────┤    │
│  │ Bank transactions              │ Social media likes             │    │
│  │ Inventory counts               │ View counters                  │    │
│  │ Medical records                │ Shopping cart (can retry)      │    │
│  │ Financial reporting            │ Session storage                │    │
│  │ Booking systems (no overbooking│ Sensor data ingestion          │    │
│  └────────────────────────────────┴────────────────────────────────┘    │
│                                                                          │
│  Rule: "Can I lose or duplicate this data occasionally?"               │
│  Yes → AP system might work                                             │
│  No → You need CP (PostgreSQL)                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tradeoff 3: Write Speed vs Query Flexibility

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TRADEOFF 3: WRITE SPEED vs QUERY FLEXIBILITY (Data Model)              │
│  ══════════════════════════════════════════════════════════              │
│                                                                          │
│  KEY-VALUE STORES (Redis, DynamoDB):                                    │
│  ───────────────────────────────────                                     │
│                                                                          │
│  Data model: key → value                                                │
│                                                                          │
│  SET user:123 '{"name":"Alice","email":"alice@test.com"}'               │
│  GET user:123                                                           │
│                                                                          │
│  INTERNALLY:                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                                                                   │    │
│  │  Hash table (in-memory or on-disk):                              │    │
│  │                                                                   │    │
│  │  "user:123" ──hash──► bucket 42 ──► {"name":"Alice",...}        │    │
│  │  "user:456" ──hash──► bucket 17 ──► {"name":"Bob",...}          │    │
│  │  "user:789" ──hash──► bucket 91 ──► {"name":"Carol",...}        │    │
│  │                                                                   │    │
│  │  GET by key: O(1) - compute hash, go directly to bucket          │    │
│  │  SET by key: O(1) - compute hash, write to bucket                │    │
│  │                                                                   │    │
│  │  BLAZING FAST for key access!                                    │    │
│  │                                                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  But what if you want to query by email?                                │
│                                                                          │
│  "Find user where email = 'alice@test.com'"                             │
│                                                                          │
│  You CAN'T. There's no index on email. Only on key.                     │
│  You'd have to scan ALL keys, parse ALL values, filter.                 │
│  O(n) where n = millions of users. Disaster.                            │
│                                                                          │
│  WORKAROUND: Maintain a secondary index yourself!                       │
│  SET email:alice@test.com "123"  -- email → user_id mapping            │
│  Now you can: GET email:alice@test.com → "123" → GET user:123          │
│                                                                          │
│  But now YOU manage consistency between the two keys.                   │
│  If you update email, you must update both. Atomically? Hard.           │
│                                                                          │
│  ───────────────────────────────────────────────────────────────────    │
│                                                                          │
│  POSTGRESQL:                                                            │
│  ───────────                                                             │
│                                                                          │
│  CREATE INDEX idx_users_email ON users(email);                          │
│  SELECT * FROM users WHERE email = 'alice@test.com';                    │
│                                                                          │
│  PostgreSQL manages the index FOR you.                                  │
│  Update email? Index is automatically updated.                          │
│  Atomic. Consistent. No extra work.                                     │
│                                                                          │
│  Trade-off: Writes are SLOWER because indexes must be updated.          │
│  A table with 10 indexes = 11 writes per INSERT (table + 10 indexes).   │
│                                                                          │
│  ───────────────────────────────────────────────────────────────────    │
│                                                                          │
│  THE FUNDAMENTAL INSIGHT:                                               │
│  ─────────────────────────                                               │
│                                                                          │
│  NoSQL databases are FAST because they do LESS.                         │
│                                                                          │
│  • No schema validation? Faster writes (no type checking)               │
│  • No indexes (except primary key)? Faster writes (less to update)      │
│  • No foreign keys? Faster writes (no constraint checking)              │
│  • No transactions? Faster writes (no WAL, no locks)                    │
│  • No JOINs? Store denormalized data (bigger, but one read)             │
│                                                                          │
│  They're not magic. They just make different tradeoffs.                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tradeoff 4: Normalized vs Denormalized Data

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TRADEOFF 4: NORMALIZED vs DENORMALIZED DATA                            │
│  ═══════════════════════════════════════════                             │
│                                                                          │
│  POSTGRESQL (Normalized - 3NF):                                         │
│  ───────────────────────────────                                         │
│                                                                          │
│  users:           orders:               products:                       │
│  ┌────┬───────┐   ┌────┬─────┬─────┐   ┌────┬────────┐                 │
│  │ id │ name  │   │ id │user │prod │   │ id │  name  │                 │
│  ├────┼───────┤   ├────┼─────┼─────┤   ├────┼────────┤                 │
│  │ 1  │ Alice │   │ 1  │  1  │  1  │   │ 1  │ Widget │                 │
│  │ 2  │ Bob   │   │ 2  │  1  │  2  │   │ 2  │ Gadget │                 │
│  └────┴───────┘   │ 3  │  2  │  1  │   └────┴────────┘                 │
│                   └────┴─────┴─────┘                                    │
│                                                                          │
│  PROS:                                                                   │
│  • Change user name once, reflected everywhere                          │
│  • No duplicate data, smaller storage                                   │
│  • Consistency guaranteed                                                │
│                                                                          │
│  CONS:                                                                   │
│  • JOINs have overhead                                                   │
│  • Multiple disk reads possible                                         │
│  • Harder to shard (data is spread across tables)                       │
│                                                                          │
│  ───────────────────────────────────────────────────────────────────    │
│                                                                          │
│  MONGODB (Denormalized - Embedded):                                     │
│  ───────────────────────────────────                                     │
│                                                                          │
│  orders collection:                                                      │
│  {                                                                       │
│    _id: 1,                                                              │
│    user: { name: "Alice", email: "alice@test.com" },  // Embedded!     │
│    product: { name: "Widget", price: 99.99 },         // Embedded!     │
│    quantity: 2                                                          │
│  }                                                                       │
│                                                                          │
│  Query: "Get all orders with user and product info"                     │
│  db.orders.find({})  // That's it. All data in one document.           │
│                                                                          │
│  No JOINs. One read. Fast.                                              │
│                                                                          │
│  PROS:                                                                   │
│  • Single read gets everything                                          │
│  • No JOINs needed                                                       │
│  • Easy to shard (order is self-contained)                              │
│                                                                          │
│  CONS:                                                                   │
│  • Alice changes her name? Update EVERY order with her embedded data   │
│  • Duplicate data everywhere (storage bloat)                            │
│  • Inconsistency risk (some orders have old name, some have new)        │
│                                                                          │
│  ───────────────────────────────────────────────────────────────────    │
│                                                                          │
│  THE TRADEOFF VISUALIZED:                                               │
│                                                                          │
│    NORMALIZED (PostgreSQL)          DENORMALIZED (MongoDB)              │
│                                                                          │
│    Write once,                      Write everywhere,                   │
│    JOIN on read                     read anywhere                       │
│                                                                          │
│    ┌─────┐                          ┌─────────────────────┐             │
│    │User │──┐                       │ Order 1             │             │
│    │Alice│  │                       │ • user: "Alice"     │             │
│    └─────┘  │  ┌──────┐             │ • product: "Widget" │             │
│             ├─►│Order1│             └─────────────────────┘             │
│             │  └──────┘             ┌─────────────────────┐             │
│             │  ┌──────┐             │ Order 2             │             │
│             └─►│Order2│             │ • user: "Alice"     │◄── Duplicate│
│                └──────┘             │ • product: "Gadget" │             │
│                                     └─────────────────────┘             │
│                                                                          │
│    UPDATE users                     UPDATE orders (ALL of them!)        │
│    SET name='Alicia'                SET user.name='Alicia'              │
│    WHERE id=1;                      WHERE user.email='alice@test.com';  │
│    (1 row updated)                  (could be millions of rows!)        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
