import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

type JoinType = 'nested_loop' | 'hash' | 'merge';

interface JoinInfo {
  name: string;
  description: string;
  bestFor: string;
  complexity: string;
  plannerHint: string;
}

const joinInfo: Record<JoinType, JoinInfo> = {
  nested_loop: {
    name: 'Nested Loop Join',
    description: 'For each row in outer table, scan inner table for matches.',
    bestFor: 'Small tables or index lookups (inner table has index on join column)',
    complexity: 'O(n × m) - can be slow for large tables without index',
    plannerHint: 'Chosen when one table is small or inner table has an index',
  },
  hash: {
    name: 'Hash Join',
    description: 'Build hash table from smaller table, probe with larger table.',
    bestFor: 'Equality joins on large tables without useful indexes',
    complexity: 'O(n + m) - linear time, but needs memory for hash table',
    plannerHint: 'Chosen for equality joins when tables are too large for nested loop',
  },
  merge: {
    name: 'Merge Join',
    description: 'Sort both tables, then merge like a zipper.',
    bestFor: 'Large tables that are already sorted (index on join column)',
    complexity: 'O(n log n + m log m) for sort, O(n + m) for merge',
    plannerHint: 'Chosen when both inputs are already sorted or will be sorted anyway',
  },
};

// Sample data for visualization
const usersData = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Carol' },
  { id: 4, name: 'Dave' },
];

const ordersData = [
  { id: 101, user_id: 2, amount: 50 },
  { id: 102, user_id: 1, amount: 30 },
  { id: 103, user_id: 3, amount: 75 },
  { id: 104, user_id: 1, amount: 20 },
  { id: 105, user_id: 4, amount: 100 },
];

function NestedLoopAnimation() {
  const [outerIdx, setOuterIdx] = useState(0);
  const [innerIdx, setInnerIdx] = useState(0);
  const [matches, setMatches] = useState<{ user: typeof usersData[0]; order: typeof ordersData[0] }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    setOuterIdx(0);
    setInnerIdx(0);
    setMatches([]);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const start = () => {
    reset();
    setIsRunning(true);
  };

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setInnerIdx((prevInner) => {
        const currentOuter = outerIdx;
        const currentUser = usersData[currentOuter];
        const currentOrder = ordersData[prevInner];

        // Check for match
        if (currentOrder && currentUser && currentOrder.user_id === currentUser.id) {
          setMatches((prev) => [...prev, { user: currentUser, order: currentOrder }]);
        }

        // Move to next
        if (prevInner >= ordersData.length - 1) {
          // Done with inner loop, move outer
          setOuterIdx((prevOuter) => {
            if (prevOuter >= usersData.length - 1) {
              // Done!
              setIsRunning(false);
              return prevOuter;
            }
            return prevOuter + 1;
          });
          return 0;
        }
        return prevInner + 1;
      });
    }, 400);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, outerIdx]);

  const done = outerIdx >= usersData.length - 1 && innerIdx >= ordersData.length - 1 && !isRunning && matches.length > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {/* Users table (outer) */}
        <div className="p-3 rounded-lg" style={{ background: colors.oceanDark }}>
          <div className="text-xs font-mono mb-2" style={{ color: colors.glow.healthy }}>
            users (outer)
          </div>
          <div className="space-y-1">
            {usersData.map((user, i) => (
              <motion.div
                key={user.id}
                className="px-2 py-1 rounded text-xs font-mono"
                animate={{
                  background: i === outerIdx && isRunning ? colors.glow.healthy + '40' : 'transparent',
                  borderColor: i === outerIdx ? colors.glow.healthy : 'transparent',
                }}
                style={{
                  border: '1px solid',
                  color: colors.text.secondary,
                }}
              >
                id: {user.id}, {user.name}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Orders table (inner) */}
        <div className="p-3 rounded-lg" style={{ background: colors.oceanDark }}>
          <div className="text-xs font-mono mb-2" style={{ color: colors.glow.warning }}>
            orders (inner)
          </div>
          <div className="space-y-1">
            {ordersData.map((order, i) => (
              <motion.div
                key={order.id}
                className="px-2 py-1 rounded text-xs font-mono"
                animate={{
                  background: i === innerIdx && isRunning ? colors.glow.warning + '40' : 'transparent',
                  borderColor: i === innerIdx && isRunning ? colors.glow.warning : 'transparent',
                }}
                style={{
                  border: '1px solid',
                  color: colors.text.secondary,
                }}
              >
                user_id: {order.user_id}, ${order.amount}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Matches */}
        <div className="p-3 rounded-lg" style={{ background: colors.oceanDark }}>
          <div className="text-xs font-mono mb-2" style={{ color: colors.glow.critical }}>
            result
          </div>
          <div className="space-y-1">
            <AnimatePresence>
              {matches.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="px-2 py-1 rounded text-xs font-mono"
                  style={{
                    background: colors.glow.critical + '20',
                    color: colors.glow.critical,
                  }}
                >
                  {m.user.name}: ${m.order.amount}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={start}
          disabled={isRunning}
          className="px-3 py-1 rounded text-xs font-mono"
          style={{
            background: isRunning ? colors.text.muted + '20' : colors.glow.healthy + '20',
            color: isRunning ? colors.text.muted : colors.glow.healthy,
            border: `1px solid ${isRunning ? colors.text.muted : colors.glow.healthy}40`,
          }}
        >
          {done ? 'Run Again' : 'Start'}
        </button>
        <button
          onClick={reset}
          className="px-3 py-1 rounded text-xs font-mono"
          style={{
            background: colors.text.muted + '20',
            color: colors.text.muted,
            border: `1px solid ${colors.text.muted}40`,
          }}
        >
          Reset
        </button>
        <span className="text-xs font-mono self-center" style={{ color: colors.text.muted }}>
          Comparisons: {isRunning || done ? (outerIdx * ordersData.length + innerIdx + 1) : 0} / {usersData.length * ordersData.length}
        </span>
      </div>
    </div>
  );
}

function HashJoinAnimation() {
  const [phase, setPhase] = useState<'idle' | 'building' | 'probing' | 'done'>('idle');
  const [hashTable, setHashTable] = useState<Map<number, typeof usersData[0]>>(new Map());
  const [buildIdx, setBuildIdx] = useState(0);
  const [probeIdx, setProbeIdx] = useState(0);
  const [matches, setMatches] = useState<{ user: typeof usersData[0]; order: typeof ordersData[0] }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    setPhase('idle');
    setHashTable(new Map());
    setBuildIdx(0);
    setProbeIdx(0);
    setMatches([]);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const start = () => {
    reset();
    setPhase('building');
  };

  useEffect(() => {
    if (phase === 'building') {
      intervalRef.current = setInterval(() => {
        setBuildIdx((prev) => {
          if (prev >= usersData.length) {
            setPhase('probing');
            return prev;
          }
          const user = usersData[prev];
          setHashTable((ht) => new Map(ht).set(user.id, user));
          return prev + 1;
        });
      }, 300);
    } else if (phase === 'probing') {
      intervalRef.current = setInterval(() => {
        setProbeIdx((prev) => {
          if (prev >= ordersData.length) {
            setPhase('done');
            return prev;
          }
          const order = ordersData[prev];
          const user = hashTable.get(order.user_id);
          if (user) {
            setMatches((m) => [...m, { user, order }]);
          }
          return prev + 1;
        });
      }, 300);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, hashTable]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {/* Build phase - users */}
        <div className="p-3 rounded-lg" style={{ background: colors.oceanDark }}>
          <div className="text-xs font-mono mb-2" style={{ color: colors.glow.healthy }}>
            users (build hash)
          </div>
          <div className="space-y-1">
            {usersData.map((user, i) => (
              <motion.div
                key={user.id}
                className="px-2 py-1 rounded text-xs font-mono"
                animate={{
                  background: i === buildIdx - 1 && phase === 'building' ? colors.glow.healthy + '40' : 'transparent',
                  opacity: i < buildIdx ? 0.5 : 1,
                }}
                style={{
                  border: '1px solid transparent',
                  color: colors.text.secondary,
                }}
              >
                id: {user.id}, {user.name}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Hash table */}
        <div className="p-3 rounded-lg" style={{ background: colors.oceanDark }}>
          <div className="text-xs font-mono mb-2" style={{ color: colors.glow.warning }}>
            hash table
          </div>
          <div className="space-y-1">
            {[1, 2, 3, 4].map((bucket) => (
              <div
                key={bucket}
                className="px-2 py-1 rounded text-xs font-mono"
                style={{
                  background: hashTable.has(bucket) ? colors.glow.warning + '20' : 'transparent',
                  color: hashTable.has(bucket) ? colors.glow.warning : colors.text.muted,
                  border: `1px solid ${colors.text.muted}20`,
                }}
              >
                [{bucket}]: {hashTable.has(bucket) ? hashTable.get(bucket)?.name : '(empty)'}
              </div>
            ))}
          </div>
        </div>

        {/* Probe phase - orders */}
        <div className="p-3 rounded-lg" style={{ background: colors.oceanDark }}>
          <div className="text-xs font-mono mb-2" style={{ color: colors.glow.critical }}>
            orders (probe)
          </div>
          <div className="space-y-1">
            {ordersData.map((order, i) => (
              <motion.div
                key={order.id}
                className="px-2 py-1 rounded text-xs font-mono"
                animate={{
                  background: i === probeIdx && phase === 'probing' ? colors.glow.critical + '40' : 'transparent',
                }}
                style={{
                  border: '1px solid transparent',
                  color: colors.text.secondary,
                }}
              >
                user_id: {order.user_id}, ${order.amount}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="p-3 rounded-lg" style={{ background: colors.oceanDark }}>
        <div className="text-xs font-mono mb-2" style={{ color: colors.text.muted }}>
          result ({matches.length} matches)
        </div>
        <div className="flex flex-wrap gap-2">
          {matches.map((m, i) => (
            <span
              key={i}
              className="px-2 py-1 rounded text-xs font-mono"
              style={{ background: colors.glow.healthy + '20', color: colors.glow.healthy }}
            >
              {m.user.name}: ${m.order.amount}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <button
          onClick={start}
          disabled={phase === 'building' || phase === 'probing'}
          className="px-3 py-1 rounded text-xs font-mono"
          style={{
            background: colors.glow.healthy + '20',
            color: colors.glow.healthy,
            border: `1px solid ${colors.glow.healthy}40`,
          }}
        >
          Start
        </button>
        <button
          onClick={reset}
          className="px-3 py-1 rounded text-xs font-mono"
          style={{
            background: colors.text.muted + '20',
            color: colors.text.muted,
            border: `1px solid ${colors.text.muted}40`,
          }}
        >
          Reset
        </button>
        <span className="text-xs font-mono" style={{ color: colors.text.muted }}>
          Phase: {phase === 'idle' ? 'Ready' : phase === 'building' ? 'Building hash table...' : phase === 'probing' ? 'Probing...' : 'Done!'}
        </span>
      </div>
    </div>
  );
}

function MergeJoinAnimation() {
  const [phase, setPhase] = useState<'idle' | 'sorting' | 'merging' | 'done'>('idle');
  const [sortedUsers, setSortedUsers] = useState<typeof usersData>([]);
  const [sortedOrders, setSortedOrders] = useState<typeof ordersData>([]);
  const [userPtr, setUserPtr] = useState(0);
  const [orderPtr, setOrderPtr] = useState(0);
  const [matches, setMatches] = useState<{ user: typeof usersData[0]; order: typeof ordersData[0] }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    setPhase('idle');
    setSortedUsers([]);
    setSortedOrders([]);
    setUserPtr(0);
    setOrderPtr(0);
    setMatches([]);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const start = () => {
    reset();
    setPhase('sorting');
    // Sort both arrays
    setTimeout(() => {
      setSortedUsers([...usersData].sort((a, b) => a.id - b.id));
      setSortedOrders([...ordersData].sort((a, b) => a.user_id - b.user_id));
      setPhase('merging');
    }, 500);
  };

  useEffect(() => {
    if (phase !== 'merging') return;

    intervalRef.current = setInterval(() => {
      if (userPtr >= sortedUsers.length || orderPtr >= sortedOrders.length) {
        setPhase('done');
        return;
      }

      const user = sortedUsers[userPtr];
      const order = sortedOrders[orderPtr];

      if (user.id === order.user_id) {
        setMatches((m) => [...m, { user, order }]);
        setOrderPtr((p) => p + 1);
      } else if (user.id < order.user_id) {
        setUserPtr((p) => p + 1);
      } else {
        setOrderPtr((p) => p + 1);
      }
    }, 400);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, userPtr, orderPtr, sortedUsers, sortedOrders]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {/* Sorted users */}
        <div className="p-3 rounded-lg" style={{ background: colors.oceanDark }}>
          <div className="text-xs font-mono mb-2" style={{ color: colors.glow.healthy }}>
            users (sorted)
          </div>
          <div className="space-y-1">
            {(sortedUsers.length > 0 ? sortedUsers : usersData).map((user, i) => (
              <motion.div
                key={user.id}
                className="px-2 py-1 rounded text-xs font-mono"
                animate={{
                  background: i === userPtr && phase === 'merging' ? colors.glow.healthy + '40' : 'transparent',
                }}
                style={{
                  border: '1px solid transparent',
                  color: colors.text.secondary,
                }}
              >
                id: {user.id}, {user.name}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sorted orders */}
        <div className="p-3 rounded-lg" style={{ background: colors.oceanDark }}>
          <div className="text-xs font-mono mb-2" style={{ color: colors.glow.warning }}>
            orders (sorted by user_id)
          </div>
          <div className="space-y-1">
            {(sortedOrders.length > 0 ? sortedOrders : ordersData).map((order, i) => (
              <motion.div
                key={order.id}
                className="px-2 py-1 rounded text-xs font-mono"
                animate={{
                  background: i === orderPtr && phase === 'merging' ? colors.glow.warning + '40' : 'transparent',
                }}
                style={{
                  border: '1px solid transparent',
                  color: colors.text.secondary,
                }}
              >
                user_id: {order.user_id}, ${order.amount}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="p-3 rounded-lg" style={{ background: colors.oceanDark }}>
          <div className="text-xs font-mono mb-2" style={{ color: colors.glow.critical }}>
            result
          </div>
          <div className="space-y-1">
            <AnimatePresence>
              {matches.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="px-2 py-1 rounded text-xs font-mono"
                  style={{
                    background: colors.glow.critical + '20',
                    color: colors.glow.critical,
                  }}
                >
                  {m.user.name}: ${m.order.amount}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <button
          onClick={start}
          disabled={phase === 'sorting' || phase === 'merging'}
          className="px-3 py-1 rounded text-xs font-mono"
          style={{
            background: colors.glow.healthy + '20',
            color: colors.glow.healthy,
            border: `1px solid ${colors.glow.healthy}40`,
          }}
        >
          Start
        </button>
        <button
          onClick={reset}
          className="px-3 py-1 rounded text-xs font-mono"
          style={{
            background: colors.text.muted + '20',
            color: colors.text.muted,
            border: `1px solid ${colors.text.muted}40`,
          }}
        >
          Reset
        </button>
        <span className="text-xs font-mono" style={{ color: colors.text.muted }}>
          Phase: {phase === 'idle' ? 'Ready' : phase === 'sorting' ? 'Sorting...' : phase === 'merging' ? 'Merging...' : 'Done!'}
        </span>
      </div>
    </div>
  );
}

export function JoinAlgorithmDemo() {
  const [activeJoin, setActiveJoin] = useState<JoinType>('nested_loop');
  const info = joinInfo[activeJoin];

  return (
    <div className="w-full">
      {/* Join type tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(Object.keys(joinInfo) as JoinType[]).map((type) => (
          <button
            key={type}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeJoin === type ? colors.glow.healthy + '20' : 'transparent',
              color: activeJoin === type ? colors.glow.healthy : colors.text.muted,
              border: `1px solid ${activeJoin === type ? colors.glow.healthy : colors.text.muted}40`,
            }}
            onClick={() => setActiveJoin(type)}
          >
            {joinInfo[type].name}
          </button>
        ))}
      </div>

      {/* Info panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeJoin}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="p-6 rounded-xl mb-6"
            style={{
              background: colors.oceanLight,
              border: `1px solid ${colors.text.muted}30`,
            }}
          >
            <h4 className="text-xl font-semibold mb-2" style={{ color: colors.glow.healthy }}>
              {info.name}
            </h4>
            <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
              {info.description}
            </p>

            <div className="grid md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded" style={{ background: colors.oceanDark }}>
                <div className="font-mono mb-1" style={{ color: colors.glow.healthy }}>
                  Best For
                </div>
                <p style={{ color: colors.text.muted }}>{info.bestFor}</p>
              </div>
              <div className="p-3 rounded" style={{ background: colors.oceanDark }}>
                <div className="font-mono mb-1" style={{ color: colors.glow.warning }}>
                  Complexity
                </div>
                <p style={{ color: colors.text.muted }}>{info.complexity}</p>
              </div>
              <div className="p-3 rounded" style={{ background: colors.oceanDark }}>
                <div className="font-mono mb-1" style={{ color: colors.glow.critical }}>
                  Planner Chooses When
                </div>
                <p style={{ color: colors.text.muted }}>{info.plannerHint}</p>
              </div>
            </div>
          </div>

          {/* Animation */}
          <div
            className="p-6 rounded-xl"
            style={{
              background: colors.oceanLight,
              border: `1px solid ${colors.text.muted}30`,
            }}
          >
            <h5 className="text-sm font-mono mb-4" style={{ color: colors.text.muted }}>
              SELECT * FROM users JOIN orders ON users.id = orders.user_id
            </h5>
            {activeJoin === 'nested_loop' && <NestedLoopAnimation />}
            {activeJoin === 'hash' && <HashJoinAnimation />}
            {activeJoin === 'merge' && <MergeJoinAnimation />}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
