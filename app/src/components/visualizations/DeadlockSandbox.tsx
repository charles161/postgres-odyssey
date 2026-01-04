import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

type Resource = 'users' | 'accounts';
type TxnId = 'A' | 'B';

interface LockState {
  resource: Resource;
  holder: TxnId | null;
  waiters: TxnId[];
}

interface TxnState {
  id: TxnId;
  status: 'idle' | 'running' | 'waiting' | 'completed' | 'victim';
  holding: Resource[];
  waitingFor: Resource | null;
  operations: Resource[];
}

const RESOURCES: Resource[] = ['users', 'accounts'];

const PRESETS = {
  safe: {
    name: 'Safe Order',
    description: 'Both acquire in same order',
    A: ['users', 'accounts'] as Resource[],
    B: ['users', 'accounts'] as Resource[],
  },
  deadlock: {
    name: 'Deadlock',
    description: 'Opposite acquisition order',
    A: ['users', 'accounts'] as Resource[],
    B: ['accounts', 'users'] as Resource[],
  },
};

type GuidedPhase = 'intro' | 'running-deadlock' | 'deadlock-resolved' | 'prompt-safe' | 'free-explore';

export function DeadlockSandbox() {
  const [guidedPhase, setGuidedPhase] = useState<GuidedPhase>('intro');

  const [txnA, setTxnA] = useState<TxnState>({
    id: 'A',
    status: 'idle',
    holding: [],
    waitingFor: null,
    operations: ['users', 'accounts'],
  });

  const [txnB, setTxnB] = useState<TxnState>({
    id: 'B',
    status: 'idle',
    holding: [],
    waitingFor: null,
    operations: ['accounts', 'users'],
  });

  const [locks, setLocks] = useState<Record<Resource, LockState>>({
    users: { resource: 'users', holder: null, waiters: [] },
    accounts: { resource: 'accounts', holder: null, waiters: [] },
  });

  const [isRunning, setIsRunning] = useState(false);
  const [deadlockDetected, setDeadlockDetected] = useState(false);
  const [message, setMessage] = useState('');

  // Auto-start guided experience
  useEffect(() => {
    if (guidedPhase === 'intro') {
      const timer = setTimeout(() => {
        // Start with deadlock scenario
        setTxnA(prev => ({ ...prev, operations: PRESETS.deadlock.A }));
        setTxnB(prev => ({ ...prev, operations: PRESETS.deadlock.B }));
        setGuidedPhase('running-deadlock');
        setIsRunning(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [guidedPhase]);

  // Check for deadlock
  const checkDeadlock = useCallback((): boolean => {
    // A is waiting for something B holds, and B is waiting for something A holds
    if (txnA.waitingFor && txnB.waitingFor) {
      const aWaitsForB = txnB.holding.includes(txnA.waitingFor);
      const bWaitsForA = txnA.holding.includes(txnB.waitingFor);
      return aWaitsForB && bWaitsForA;
    }
    return false;
  }, [txnA, txnB]);

  // Try to acquire a lock
  const tryAcquireLock = useCallback(
    (txnId: TxnId, resource: Resource): 'acquired' | 'waiting' => {
      const lock = locks[resource];

      if (lock.holder === null) {
        // Lock is free, acquire it
        setLocks((prev) => ({
          ...prev,
          [resource]: { ...prev[resource], holder: txnId },
        }));

        if (txnId === 'A') {
          setTxnA((prev) => ({
            ...prev,
            holding: [...prev.holding, resource],
            waitingFor: null,
            status: 'running',
          }));
        } else {
          setTxnB((prev) => ({
            ...prev,
            holding: [...prev.holding, resource],
            waitingFor: null,
            status: 'running',
          }));
        }

        return 'acquired';
      } else if (lock.holder !== txnId) {
        // Lock is held by someone else, wait
        setLocks((prev) => ({
          ...prev,
          [resource]: {
            ...prev[resource],
            waiters: [...prev[resource].waiters, txnId],
          },
        }));

        if (txnId === 'A') {
          setTxnA((prev) => ({ ...prev, waitingFor: resource, status: 'waiting' }));
        } else {
          setTxnB((prev) => ({ ...prev, waitingFor: resource, status: 'waiting' }));
        }

        return 'waiting';
      }

      return 'acquired';
    },
    [locks]
  );

  // Run simulation step
  const runStep = useCallback(() => {
    if (deadlockDetected) return;

    const aOps = txnA.operations;
    const bOps = txnB.operations;
    const aNext = aOps.findIndex(
      (r) => !txnA.holding.includes(r) && txnA.waitingFor !== r
    );
    const bNext = bOps.findIndex(
      (r) => !txnB.holding.includes(r) && txnB.waitingFor !== r
    );

    // If both are waiting, check for deadlock
    if (txnA.status === 'waiting' && txnB.status === 'waiting') {
      if (checkDeadlock()) {
        setDeadlockDetected(true);
        setMessage('DEADLOCK DETECTED! Terminating Transaction B...');
        return;
      }
    }

    // Try to progress each transaction
    if (aNext !== -1 && txnA.status !== 'waiting' && txnA.status !== 'completed') {
      const result = tryAcquireLock('A', aOps[aNext]);
      if (result === 'acquired') {
        setMessage(`TXN A acquired lock on ${aOps[aNext]}`);
      } else {
        setMessage(`TXN A waiting for ${aOps[aNext]} (held by TXN B)`);
      }
    } else if (aNext === -1 && txnA.holding.length === aOps.length) {
      setTxnA((prev) => ({ ...prev, status: 'completed' }));
      setMessage('TXN A completed successfully!');
    }

    if (bNext !== -1 && txnB.status !== 'waiting' && txnB.status !== 'completed') {
      const result = tryAcquireLock('B', bOps[bNext]);
      if (result === 'acquired') {
        setMessage(`TXN B acquired lock on ${bOps[bNext]}`);
      } else {
        setMessage(`TXN B waiting for ${bOps[bNext]} (held by TXN A)`);
      }
    } else if (bNext === -1 && txnB.holding.length === bOps.length) {
      setTxnB((prev) => ({ ...prev, status: 'completed' }));
      setMessage('TXN B completed successfully!');
    }

    }, [txnA, txnB, deadlockDetected, checkDeadlock, tryAcquireLock]);

  // Auto-run simulation
  useEffect(() => {
    if (!isRunning) return;

    if (txnA.status === 'completed' && txnB.status === 'completed') {
      setIsRunning(false);
      setMessage('Both transactions completed successfully!');
      return;
    }

    if (deadlockDetected) {
      // Terminate TXN B after showing deadlock
      const timer = setTimeout(() => {
        setTxnB((prev) => ({ ...prev, status: 'victim' }));
        setMessage('TXN B terminated. TXN A can now proceed.');

        // Release B's locks
        setLocks((prev) => {
          const newLocks = { ...prev };
          txnB.holding.forEach((r) => {
            if (newLocks[r].holder === 'B') {
              newLocks[r] = { ...newLocks[r], holder: null, waiters: [] };
            }
          });
          return newLocks;
        });

        // Let A proceed
        setTimeout(() => {
          if (txnA.waitingFor) {
            const resource = txnA.waitingFor;
            setLocks((prev) => ({
              ...prev,
              [resource]: { ...prev[resource], holder: 'A', waiters: [] },
            }));
            setTxnA((prev) => ({
              ...prev,
              holding: [...prev.holding, resource],
              waitingFor: null,
              status: 'completed',
            }));
            setMessage('TXN A completed after deadlock resolution.');
            setIsRunning(false);

            // Transition guided phase
            if (guidedPhase === 'running-deadlock') {
              setTimeout(() => {
                setGuidedPhase('deadlock-resolved');
                setTimeout(() => setGuidedPhase('prompt-safe'), 2000);
              }, 1500);
            }
          }
        }, 1000);
      }, 1500);

      return () => clearTimeout(timer);
    }

    const timer = setTimeout(runStep, 1200);
    return () => clearTimeout(timer);
  }, [isRunning, txnA, txnB, deadlockDetected, runStep]);

  // Reset simulation
  const reset = () => {
    setTxnA({
      id: 'A',
      status: 'idle',
      holding: [],
      waitingFor: null,
      operations: txnA.operations,
    });
    setTxnB({
      id: 'B',
      status: 'idle',
      holding: [],
      waitingFor: null,
      operations: txnB.operations,
    });
    setLocks({
      users: { resource: 'users', holder: null, waiters: [] },
      accounts: { resource: 'accounts', holder: null, waiters: [] },
    });
    setIsRunning(false);
    setDeadlockDetected(false);
    setMessage('');
  };

  // Load preset
  const loadPreset = (preset: keyof typeof PRESETS) => {
    reset();
    setTxnA((prev) => ({ ...prev, operations: PRESETS[preset].A }));
    setTxnB((prev) => ({ ...prev, operations: PRESETS[preset].B }));
  };

  // Swap operation order for a transaction
  const swapOrder = (txnId: TxnId) => {
    if (isRunning) return;
    if (txnId === 'A') {
      setTxnA((prev) => ({ ...prev, operations: [...prev.operations].reverse() }));
    } else {
      setTxnB((prev) => ({ ...prev, operations: [...prev.operations].reverse() }));
    }
  };

  const getStatusColor = (status: TxnState['status']) => {
    switch (status) {
      case 'running':
        return colors.glow.healthy;
      case 'waiting':
        return colors.glow.warning;
      case 'completed':
        return colors.glow.healthy;
      case 'victim':
        return colors.glow.critical;
      default:
        return colors.text.muted;
    }
  };

  // Handle loading safe order from prompt
  const handleTrySafeOrder = () => {
    reset();
    setTxnA(prev => ({ ...prev, operations: PRESETS.safe.A }));
    setTxnB(prev => ({ ...prev, operations: PRESETS.safe.B }));
    setGuidedPhase('free-explore');
    setTimeout(() => setIsRunning(true), 500);
  };

  return (
    <div className="space-y-6">
      {/* Guided intro overlay */}
      <AnimatePresence>
        {guidedPhase === 'intro' && (
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-xl" style={{ color: colors.text.secondary }}>
              What happens when two transactions each hold what the other needs?
            </p>
            <p className="text-sm mt-2" style={{ color: colors.text.muted }}>
              Watch...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt to try safe order */}
      <AnimatePresence>
        {guidedPhase === 'prompt-safe' && (
          <motion.div
            className="text-center py-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-lg mb-4" style={{ color: colors.text.secondary }}>
              That was a deadlock. But what if both transactions acquired locks in the{' '}
              <span style={{ color: colors.glow.healthy }}>same order</span>?
            </p>
            <motion.button
              className="px-6 py-3 rounded-lg font-medium"
              style={{
                background: colors.glow.healthy + '20',
                color: colors.glow.healthy,
                border: `1px solid ${colors.glow.healthy}40`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTrySafeOrder}
            >
              Try Safe Order
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls - only show in free-explore mode */}
      {guidedPhase === 'free-explore' && (
        <div
          className="flex flex-wrap items-center gap-4 p-4 rounded-xl"
          style={{ background: colors.oceanDark }}
        >
          <motion.button
            className="px-4 py-2 rounded-lg font-medium text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsRunning(!isRunning)}
            disabled={txnA.status === 'completed' && txnB.status === 'completed'}
            style={{
              background: isRunning ? colors.glow.warning + '30' : colors.glow.healthy + '30',
              color: isRunning ? colors.glow.warning : colors.glow.healthy,
              border: `1px solid ${isRunning ? colors.glow.warning : colors.glow.healthy}40`,
            }}
          >
            {isRunning ? 'Pause' : 'Run Simulation'}
          </motion.button>

          <motion.button
            className="px-4 py-2 rounded-lg font-medium text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={reset}
            style={{
              background: colors.oceanLight,
              color: colors.text.secondary,
            }}
          >
            Reset
          </motion.button>

          <div className="flex-1" />

          <div className="flex gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <motion.button
                key={key}
                className="px-3 py-1.5 rounded text-xs font-medium"
                whileHover={{ scale: 1.05 }}
                onClick={() => loadPreset(key as keyof typeof PRESETS)}
                style={{
                  background: colors.oceanLight,
                  color: key === 'deadlock' ? colors.glow.critical : colors.glow.healthy,
                  border: `1px solid ${key === 'deadlock' ? colors.glow.critical : colors.glow.healthy}40`,
                }}
              >
                {preset.name}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Main visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction A */}
        <div
          className="rounded-xl p-4"
          style={{
            background: colors.oceanDark,
            border: `2px solid ${getStatusColor(txnA.status)}40`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="font-mono text-lg font-bold"
              style={{ color: getStatusColor(txnA.status) }}
            >
              Transaction A
            </h3>
            <span
              className="text-xs px-2 py-1 rounded uppercase"
              style={{
                background: getStatusColor(txnA.status) + '20',
                color: getStatusColor(txnA.status),
              }}
            >
              {txnA.status}
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs" style={{ color: colors.text.muted }}>
              Lock acquisition order:
            </p>
            {txnA.operations.map((op, idx) => {
              const isHeld = txnA.holding.includes(op);
              const isWaiting = txnA.waitingFor === op;

              return (
                <motion.div
                  key={op}
                  className="p-3 rounded-lg flex items-center gap-3"
                  style={{
                    background: colors.oceanLight,
                    border: `1px solid ${
                      isHeld
                        ? colors.glow.healthy
                        : isWaiting
                        ? colors.glow.warning
                        : colors.text.muted
                    }40`,
                  }}
                  animate={{
                    x: isWaiting ? [0, 3, 0] : 0,
                  }}
                  transition={{
                    x: { duration: 0.4, repeat: isWaiting ? Infinity : 0 },
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono"
                    style={{
                      background: isHeld
                        ? colors.glow.healthy
                        : isWaiting
                        ? colors.glow.warning
                        : colors.text.muted + '40',
                      color: isHeld || isWaiting ? colors.oceanDark : colors.text.muted,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className="font-mono text-sm"
                    style={{
                      color: isHeld
                        ? colors.glow.healthy
                        : isWaiting
                        ? colors.glow.warning
                        : colors.text.secondary,
                    }}
                  >
                    Lock {op}
                  </span>
                  {isHeld && (
                    <span className="text-xs ml-auto" style={{ color: colors.glow.healthy }}>
                      ✓
                    </span>
                  )}
                  {isWaiting && (
                    <span className="text-xs ml-auto" style={{ color: colors.glow.warning }}>
                      waiting...
                    </span>
                  )}
                </motion.div>
              );
            })}

            <motion.button
              className="w-full py-2 rounded-lg text-xs font-medium mt-2"
              whileHover={{ scale: 1.02 }}
              onClick={() => swapOrder('A')}
              disabled={isRunning}
              style={{
                background: colors.oceanLight,
                color: isRunning ? colors.text.muted : colors.text.secondary,
                opacity: isRunning ? 0.5 : 1,
              }}
            >
              ↕ Swap Order
            </motion.button>
          </div>
        </div>

        {/* Lock Graph */}
        <div
          className="rounded-xl p-4"
          style={{
            background: colors.oceanDark,
            border: `1px solid ${deadlockDetected ? colors.glow.critical : colors.text.muted}20`,
          }}
        >
          <h3
            className="font-mono text-sm uppercase tracking-wider mb-4"
            style={{ color: colors.text.muted }}
          >
            Lock Graph
          </h3>

          <div className="relative h-64">
            {/* Resources */}
            {RESOURCES.map((resource, idx) => {
              const lock = locks[resource];
              const x = idx === 0 ? '30%' : '70%';

              return (
                <motion.div
                  key={resource}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-20 h-20 rounded-xl flex flex-col items-center justify-center"
                  style={{
                    left: x,
                    background: colors.oceanLight,
                    border: `2px solid ${
                      lock.holder
                        ? lock.holder === 'A'
                          ? colors.glow.healthy
                          : colors.glow.warning
                        : colors.text.muted
                    }`,
                  }}
                >
                  <span className="font-mono text-xs" style={{ color: colors.text.secondary }}>
                    {resource}
                  </span>
                  {lock.holder && (
                    <span
                      className="text-xs mt-1 font-bold"
                      style={{
                        color: lock.holder === 'A' ? colors.glow.healthy : colors.glow.warning,
                      }}
                    >
                      → {lock.holder}
                    </span>
                  )}
                </motion.div>
              );
            })}

            {/* Deadlock cycle */}
            <AnimatePresence>
              {deadlockDetected && (
                <motion.svg
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="60"
                    fill="none"
                    stroke={colors.glow.critical}
                    strokeWidth="3"
                    strokeDasharray="10 5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1, rotate: 360 }}
                    transition={{
                      pathLength: { duration: 0.8 },
                      rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
                    }}
                  />
                </motion.svg>
              )}
            </AnimatePresence>

            {/* Waiting arrows */}
            {txnA.waitingFor && (
              <motion.div
                className="absolute text-xs font-mono"
                style={{
                  top: '20%',
                  left: txnA.waitingFor === 'users' ? '25%' : '65%',
                  color: colors.glow.warning,
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                A waits →
              </motion.div>
            )}
            {txnB.waitingFor && (
              <motion.div
                className="absolute text-xs font-mono"
                style={{
                  bottom: '20%',
                  left: txnB.waitingFor === 'users' ? '25%' : '65%',
                  color: colors.glow.warning,
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                B waits →
              </motion.div>
            )}
          </div>

          {/* Message */}
          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                key={message}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 rounded-lg text-xs font-mono text-center"
                style={{
                  background: deadlockDetected
                    ? colors.glow.critical + '20'
                    : colors.oceanLight,
                  color: deadlockDetected ? colors.glow.critical : colors.text.secondary,
                  border: deadlockDetected
                    ? `1px solid ${colors.glow.critical}40`
                    : 'none',
                }}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Transaction B */}
        <div
          className="rounded-xl p-4"
          style={{
            background: colors.oceanDark,
            border: `2px solid ${getStatusColor(txnB.status)}40`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="font-mono text-lg font-bold"
              style={{ color: getStatusColor(txnB.status) }}
            >
              Transaction B
            </h3>
            <span
              className="text-xs px-2 py-1 rounded uppercase"
              style={{
                background: getStatusColor(txnB.status) + '20',
                color: getStatusColor(txnB.status),
              }}
            >
              {txnB.status}
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs" style={{ color: colors.text.muted }}>
              Lock acquisition order:
            </p>
            {txnB.operations.map((op, idx) => {
              const isHeld = txnB.holding.includes(op);
              const isWaiting = txnB.waitingFor === op;
              const isVictim = txnB.status === 'victim';

              return (
                <motion.div
                  key={op}
                  className="p-3 rounded-lg flex items-center gap-3"
                  style={{
                    background: colors.oceanLight,
                    border: `1px solid ${
                      isVictim
                        ? colors.glow.critical
                        : isHeld
                        ? colors.glow.healthy
                        : isWaiting
                        ? colors.glow.warning
                        : colors.text.muted
                    }40`,
                    opacity: isVictim ? 0.5 : 1,
                  }}
                  animate={{
                    x: isWaiting && !isVictim ? [0, 3, 0] : 0,
                  }}
                  transition={{
                    x: { duration: 0.4, repeat: isWaiting ? Infinity : 0 },
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono"
                    style={{
                      background: isVictim
                        ? colors.glow.critical
                        : isHeld
                        ? colors.glow.healthy
                        : isWaiting
                        ? colors.glow.warning
                        : colors.text.muted + '40',
                      color:
                        isHeld || isWaiting || isVictim ? colors.oceanDark : colors.text.muted,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className="font-mono text-sm"
                    style={{
                      color: isVictim
                        ? colors.glow.critical
                        : isHeld
                        ? colors.glow.healthy
                        : isWaiting
                        ? colors.glow.warning
                        : colors.text.secondary,
                      textDecoration: isVictim ? 'line-through' : 'none',
                    }}
                  >
                    Lock {op}
                  </span>
                  {isHeld && !isVictim && (
                    <span className="text-xs ml-auto" style={{ color: colors.glow.healthy }}>
                      ✓
                    </span>
                  )}
                  {isWaiting && !isVictim && (
                    <span className="text-xs ml-auto" style={{ color: colors.glow.warning }}>
                      waiting...
                    </span>
                  )}
                  {isVictim && (
                    <span className="text-xs ml-auto" style={{ color: colors.glow.critical }}>
                      ✗
                    </span>
                  )}
                </motion.div>
              );
            })}

            <motion.button
              className="w-full py-2 rounded-lg text-xs font-medium mt-2"
              whileHover={{ scale: 1.02 }}
              onClick={() => swapOrder('B')}
              disabled={isRunning}
              style={{
                background: colors.oceanLight,
                color: isRunning ? colors.text.muted : colors.text.secondary,
                opacity: isRunning ? 0.5 : 1,
              }}
            >
              ↕ Swap Order
            </motion.button>
          </div>
        </div>
      </div>

      {/* Insight */}
      <div
        className="p-4 rounded-lg text-sm"
        style={{
          background: colors.glow.healthy + '10',
          border: `1px solid ${colors.glow.healthy}30`,
          color: colors.text.secondary,
        }}
      >
        <strong style={{ color: colors.glow.healthy }}>The Solution:</strong>{' '}
        If both transactions acquire locks in the same order (users → accounts),
        deadlocks become impossible. This is called{' '}
        <strong>consistent lock ordering</strong>. Try clicking "Safe Order" and
        running the simulation to see.
      </div>
    </div>
  );
}
