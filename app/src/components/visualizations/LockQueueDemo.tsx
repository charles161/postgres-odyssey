import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface Transaction {
  id: number;
  type: 'select' | 'insert' | 'update' | 'alter';
  status: 'running' | 'waiting' | 'blocked' | 'completed' | 'timeout';
  waitTime: number;
  lockType: 'AccessShare' | 'RowExclusive' | 'AccessExclusive';
}

const LOCK_COLORS = {
  AccessShare: colors.glow.healthy,
  RowExclusive: colors.glow.warning,
  AccessExclusive: colors.glow.critical,
};

const QUERY_TEMPLATES = [
  { type: 'select', lockType: 'AccessShare' },
  { type: 'select', lockType: 'AccessShare' },
  { type: 'insert', lockType: 'RowExclusive' },
  { type: 'update', lockType: 'RowExclusive' },
  { type: 'select', lockType: 'AccessShare' },
] as const;

type Phase = 'idle' | 'analytics' | 'alter-arrives' | 'queue-growing' | 'cascade' | 'done';

export function LockQueueDemo() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analyticsProgress, setAnalyticsProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lockTimeout, setLockTimeout] = useState(false);
  const nextIdRef = useRef(1);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const clearAllIntervals = () => {
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
  };

  // Play the scenario
  const playScenario = () => {
    if (isPlaying) return;

    // Reset
    clearAllIntervals();
    setIsPlaying(true);
    setPhase('idle');
    setTransactions([]);
    setAnalyticsProgress(0);
    nextIdRef.current = 1;

    // Timeline
    setTimeout(() => {
      setPhase('analytics');
      setTransactions([{
        id: 0,
        type: 'select',
        status: 'running',
        waitTime: 0,
        lockType: 'AccessShare',
      }]);

      // Progress the analytics query
      const progressInterval = setInterval(() => {
        setAnalyticsProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 2;
        });
      }, 150);
      intervalsRef.current.push(progressInterval);
    }, 500);

    // ALTER TABLE arrives at 30%
    setTimeout(() => {
      setPhase('alter-arrives');
      setTransactions(prev => [...prev, {
        id: -1,
        type: 'alter',
        status: 'waiting',
        waitTime: 0,
        lockType: 'AccessExclusive',
      }]);
    }, 2500);

    // Queue starts growing
    setTimeout(() => {
      setPhase('queue-growing');
      const queueInterval = setInterval(() => {
        setTransactions(prev => {
          if (prev.length >= 15) {
            clearInterval(queueInterval);
            return prev;
          }
          const template = QUERY_TEMPLATES[Math.floor(Math.random() * QUERY_TEMPLATES.length)];
          return [...prev, {
            id: nextIdRef.current++,
            type: template.type as Transaction['type'],
            status: 'blocked',
            waitTime: 0,
            lockType: template.lockType as Transaction['lockType'],
          }];
        });
      }, 300);
      intervalsRef.current.push(queueInterval);
    }, 3000);

    // Cascade release
    setTimeout(() => {
      setPhase('cascade');
      setTransactions(prev => prev.map(t => ({ ...t, status: 'completed' })));
    }, 8000);

    setTimeout(() => {
      setPhase('done');
      setIsPlaying(false);
    }, 9500);
  };

  // Update wait times during queue-growing phase
  useEffect(() => {
    if (phase !== 'alter-arrives' && phase !== 'queue-growing') return;

    const interval = setInterval(() => {
      setTransactions(prev =>
        prev.map(txn => {
          if (txn.status === 'waiting' || txn.status === 'blocked') {
            const newWaitTime = txn.waitTime + 0.5;

            // With lock_timeout, timeout the ALTER after 3s
            if (lockTimeout && txn.type === 'alter' && newWaitTime >= 3) {
              return { ...txn, status: 'timeout', waitTime: newWaitTime };
            }

            return { ...txn, waitTime: newWaitTime };
          }
          return txn;
        })
      );
    }, 500);

    return () => clearInterval(interval);
  }, [phase, lockTimeout]);

  // Handle lock_timeout - release queue early
  useEffect(() => {
    const alterTxn = transactions.find(t => t.type === 'alter');
    if (alterTxn?.status === 'timeout') {
      setTimeout(() => {
        setTransactions(prev =>
          prev.filter(t => t.type !== 'alter')
            .map(t => t.status === 'blocked' ? { ...t, status: 'running' } : t)
        );
        setPhase('done');
        setIsPlaying(false);
      }, 1000);
    }
  }, [transactions]);

  const reset = () => {
    clearAllIntervals();
    setIsPlaying(false);
    setPhase('idle');
    setTransactions([]);
    setAnalyticsProgress(0);
    nextIdRef.current = 1;
  };

  const waitingCount = transactions.filter(
    t => t.status === 'waiting' || t.status === 'blocked'
  ).length;

  const alterTxn = transactions.find(t => t.type === 'alter');

  const getNarration = () => {
    switch (phase) {
      case 'idle':
        return 'Watch what happens when a database change arrives at the wrong time...';
      case 'analytics':
        return 'A long analytics query is running, holding a light lock...';
      case 'alter-arrives':
        return 'A developer runs ALTER TABLE — it needs exclusive access!';
      case 'queue-growing':
        return 'New queries arrive, but they must wait behind the ALTER TABLE...';
      case 'cascade':
        return 'Analytics finishes → ALTER runs → everyone else finally proceeds!';
      case 'done':
        return lockTimeout
          ? 'With lock_timeout, the ALTER gave up early — preventing the cascade!'
          : 'One slow query + one DDL = dozens blocked. This is "the fever."';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Narration bar */}
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            className="text-lg px-4 py-3 rounded-lg inline-block"
            style={{
              background: colors.oceanDark,
              color: phase === 'done' ? colors.glow.warning : colors.text.secondary,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {getNarration()}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Main visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lock holder */}
        <div
          className="rounded-xl p-4"
          style={{
            background: colors.oceanDark,
            border: `1px solid ${colors.glow.healthy}20`,
          }}
        >
          <h3
            className="font-mono text-sm uppercase tracking-wider mb-4"
            style={{ color: colors.text.muted }}
          >
            Lock Holder
          </h3>

          <AnimatePresence>
            {transactions.find(t => t.id === 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-4 rounded-lg"
                style={{
                  background: colors.oceanLight,
                  border: `2px solid ${colors.glow.healthy}`,
                  boxShadow: phase === 'analytics' || phase === 'alter-arrives' || phase === 'queue-growing'
                    ? `0 0 20px ${colors.glow.healthy}30`
                    : 'none',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: phase !== 'idle' && phase !== 'done' ? colors.glow.healthy : colors.text.muted,
                    }}
                  />
                  <span className="font-mono text-xs" style={{ color: colors.glow.healthy }}>
                    AccessShareLock
                  </span>
                </div>
                <p className="font-mono text-xs" style={{ color: colors.text.secondary }}>
                  Analytics query
                </p>
                {(phase === 'analytics' || phase === 'alter-arrives' || phase === 'queue-growing') && (
                  <div className="mt-3">
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{ background: colors.oceanDark }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: colors.glow.healthy }}
                        animate={{ width: `${analyticsProgress}%` }}
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                      {analyticsProgress}% complete
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ALTER TABLE (blocker) */}
        <div
          className="rounded-xl p-4"
          style={{
            background: colors.oceanDark,
            border: `1px solid ${colors.glow.critical}20`,
          }}
        >
          <h3
            className="font-mono text-sm uppercase tracking-wider mb-4"
            style={{ color: colors.text.muted }}
          >
            Waiting for Lock
          </h3>

          <AnimatePresence>
            {alterTxn && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="p-4 rounded-lg relative overflow-hidden"
                style={{
                  background: colors.oceanLight,
                  border: `2px solid ${
                    alterTxn.status === 'timeout'
                      ? colors.text.muted
                      : colors.glow.critical
                  }`,
                }}
              >
                {alterTxn.status === 'waiting' && (
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at center, ${colors.glow.critical}10 0%, transparent 70%)`,
                    }}
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}

                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background:
                          alterTxn.status === 'timeout'
                            ? colors.text.muted
                            : colors.glow.critical,
                      }}
                    />
                    <span
                      className="font-mono text-xs"
                      style={{
                        color:
                          alterTxn.status === 'timeout'
                            ? colors.text.muted
                            : colors.glow.critical,
                      }}
                    >
                      AccessExclusiveLock
                    </span>
                  </div>
                  <p className="font-mono text-xs" style={{ color: colors.text.secondary }}>
                    ALTER TABLE users
                  </p>
                  <p
                    className="text-xs mt-2"
                    style={{
                      color:
                        alterTxn.status === 'timeout'
                          ? colors.glow.critical
                          : colors.glow.warning,
                    }}
                  >
                    {alterTxn.status === 'timeout'
                      ? 'TIMEOUT - Lock not acquired'
                      : alterTxn.status === 'completed'
                      ? 'Completed!'
                      : `Waiting ${alterTxn.waitTime.toFixed(1)}s...`}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!alterTxn && (
            <p className="text-sm" style={{ color: colors.text.muted }}>
              No DDL waiting
            </p>
          )}
        </div>

        {/* Stats */}
        <div
          className="rounded-xl p-4"
          style={{
            background: colors.oceanDark,
            border: `1px solid ${colors.glow.warning}20`,
          }}
        >
          <h3
            className="font-mono text-sm uppercase tracking-wider mb-4"
            style={{ color: colors.text.muted }}
          >
            Queue Stats
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs" style={{ color: colors.text.muted }}>
                Waiting Queries
              </p>
              <motion.p
                className="text-4xl font-bold font-mono"
                style={{
                  color:
                    waitingCount > 10
                      ? colors.glow.critical
                      : waitingCount > 5
                      ? colors.glow.warning
                      : colors.glow.healthy,
                }}
                animate={{ scale: waitingCount > 0 ? [1, 1.02, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                {waitingCount}
              </motion.p>
            </div>

            {lockTimeout && alterTxn?.status === 'waiting' && (
              <div
                className="p-3 rounded-lg"
                style={{
                  background: colors.glow.warning + '10',
                  border: `1px solid ${colors.glow.warning}30`,
                }}
              >
                <p className="text-xs" style={{ color: colors.glow.warning }}>
                  lock_timeout in{' '}
                  {Math.max(0, 3 - alterTxn.waitTime).toFixed(1)}s
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blocked queue */}
      <div
        className="rounded-xl p-4"
        style={{
          background: colors.oceanDark,
          border: `1px solid ${colors.glow.warning}20`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className="font-mono text-sm uppercase tracking-wider"
            style={{ color: colors.text.muted }}
          >
            Blocked Queue (FIFO)
          </h3>
          {waitingCount > 0 && (
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                background: colors.glow.warning + '20',
                color: colors.glow.warning,
              }}
            >
              All waiting behind ALTER TABLE
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {transactions
              .filter((t) => t.status === 'blocked' || (t.status === 'completed' && t.id > 0))
              .map((txn) => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    x: txn.status === 'blocked' ? [0, 3, 0] : 0,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    duration: 0.3,
                    x: { duration: 0.3, repeat: txn.status === 'blocked' ? 2 : 0 },
                  }}
                  className="px-3 py-2 rounded-lg font-mono text-xs"
                  style={{
                    background:
                      txn.status === 'completed'
                        ? colors.glow.healthy + '20'
                        : colors.oceanLight,
                    border: `1px solid ${
                      txn.status === 'completed'
                        ? colors.glow.healthy
                        : txn.waitTime > 5
                        ? colors.glow.critical
                        : colors.glow.warning
                    }40`,
                    color:
                      txn.status === 'completed'
                        ? colors.glow.healthy
                        : colors.text.secondary,
                  }}
                >
                  <span style={{ color: LOCK_COLORS[txn.lockType] }}>
                    {txn.type.toUpperCase()}
                  </span>
                  {txn.status === 'blocked' && (
                    <span style={{ color: colors.text.muted }}>
                      {' '}
                      ({txn.waitTime.toFixed(0)}s)
                    </span>
                  )}
                </motion.div>
              ))}
          </AnimatePresence>

          {waitingCount === 0 && transactions.length === 0 && (
            <p className="text-sm" style={{ color: colors.text.muted }}>
              No blocked queries
            </p>
          )}
        </div>
      </div>

      {/* Insight - only show when done */}
      <AnimatePresence>
        {phase === 'done' && (
          <motion.div
            className="p-4 rounded-lg text-sm"
            style={{
              background: colors.glow.warning + '10',
              border: `1px solid ${colors.glow.warning}30`,
              color: colors.text.secondary,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <strong style={{ color: colors.glow.warning }}>The Cascade:</strong>{' '}
            Even though the blocked SELECTs only need AccessShareLock (which doesn't
            conflict with the analytics query), they queue{' '}
            <strong>behind the ALTER TABLE</strong>. This is FIFO lock queuing—the
            cause of most "everything is slow" incidents.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simple controls */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {phase === 'idle' && (
          <motion.button
            className="px-8 py-4 rounded-xl font-medium text-lg"
            style={{
              background: `linear-gradient(135deg, ${colors.glow.warning} 0%, ${colors.glow.warning}cc 100%)`,
              color: colors.oceanDark,
              boxShadow: `0 0 30px ${colors.glow.warning}40`,
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 40px ${colors.glow.warning}60` }}
            whileTap={{ scale: 0.98 }}
            onClick={playScenario}
          >
            ▶ Watch the Cascade
          </motion.button>
        )}

        {phase !== 'idle' && (
          <>
            <motion.button
              className="px-6 py-2 rounded-lg font-medium text-sm"
              style={{
                background: isPlaying ? colors.oceanLight : colors.glow.warning + '20',
                color: isPlaying ? colors.text.muted : colors.glow.warning,
                border: `1px solid ${isPlaying ? colors.text.muted : colors.glow.warning}40`,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={playScenario}
              disabled={isPlaying}
            >
              {isPlaying ? 'Playing...' : 'Replay'}
            </motion.button>

            <motion.button
              className="px-6 py-2 rounded-lg font-medium text-sm"
              style={{
                background: colors.oceanLight,
                color: colors.text.secondary,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={reset}
            >
              Reset
            </motion.button>
          </>
        )}

        <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg"
          style={{ background: colors.oceanDark }}
        >
          <input
            type="checkbox"
            checked={lockTimeout}
            onChange={(e) => setLockTimeout(e.target.checked)}
            aria-label="Enable lock timeout of 3 seconds"
            className="rounded"
          />
          <span className="text-sm" style={{ color: lockTimeout ? colors.glow.healthy : colors.text.muted }}>
            Enable lock_timeout = 3s
          </span>
        </label>
      </div>
    </div>
  );
}
