import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

// XID limit is ~2 billion
const XID_MAX = 2147483647;

interface TimelineState {
  currentXid: number;
  oldestUnfrozenXid: number;
  frozenXid: number;
  hasLongRunningTx: boolean;
  longRunningTxXid: number;
}

export function XIDTimeline() {
  const [state, setState] = useState<TimelineState>({
    currentXid: 1000000000, // Start at 1 billion
    oldestUnfrozenXid: 900000000,
    frozenXid: 800000000,
    hasLongRunningTx: false,
    longRunningTxXid: 0,
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [showFreezingExplainer, setShowFreezingExplainer] = useState(true);
  const [isVacuuming, setIsVacuuming] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate danger metrics
  const xidRemaining = XID_MAX - state.currentXid;
  const xidUsed = state.currentXid - (state.hasLongRunningTx ? state.longRunningTxXid : state.oldestUnfrozenXid);
  const percentUsed = (xidUsed / XID_MAX) * 100;
  const isDanger = xidRemaining < 200000000; // Less than 200M remaining
  const isCritical = xidRemaining < 50000000; // Less than 50M remaining

  // Simulation: XID advances
  useEffect(() => {
    if (!isSimulating) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        const newCurrentXid = prev.currentXid + 10000000; // 10M per tick

        // If we hit wraparound, stop simulation
        if (newCurrentXid >= XID_MAX) {
          setIsSimulating(false);
          return prev;
        }

        return {
          ...prev,
          currentXid: newCurrentXid,
        };
      });
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSimulating]);

  const startLongRunningTx = () => {
    setState((prev) => ({
      ...prev,
      hasLongRunningTx: true,
      longRunningTxXid: prev.currentXid,
    }));
  };

  const endLongRunningTx = () => {
    setState((prev) => ({
      ...prev,
      hasLongRunningTx: false,
      longRunningTxXid: 0,
    }));
  };

  const runVacuumFreeze = () => {
    if (isVacuuming) return;

    setIsVacuuming(true);

    // Simulate VACUUM freeze
    setTimeout(() => {
      setState((prev) => {
        // Can only freeze up to the long-running tx
        const newFrozenXid = prev.hasLongRunningTx
          ? Math.min(prev.longRunningTxXid, prev.currentXid - 100000000)
          : prev.currentXid - 100000000;

        return {
          ...prev,
          frozenXid: newFrozenXid,
          oldestUnfrozenXid: newFrozenXid,
        };
      });
      setIsVacuuming(false);
    }, 1500);
  };

  const reset = () => {
    setIsSimulating(false);
    setState({
      currentXid: 1000000000,
      oldestUnfrozenXid: 900000000,
      frozenXid: 800000000,
      hasLongRunningTx: false,
      longRunningTxXid: 0,
    });
  };

  const formatXid = (xid: number) => {
    if (xid >= 1000000000) return `${(xid / 1000000000).toFixed(2)}B`;
    if (xid >= 1000000) return `${(xid / 1000000).toFixed(0)}M`;
    return xid.toString();
  };

  return (
    <div className="space-y-8">
      {/* Freezing Explainer */}
      <AnimatePresence>
        {showFreezingExplainer && (
          <motion.div
            initial={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl overflow-hidden"
            style={{ background: colors.oceanDark, border: `1px solid ${colors.glow.healthy}30` }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono font-bold" style={{ color: colors.glow.healthy }}>
                  First: What is Freezing?
                </h3>
                <button
                  className="text-sm px-3 py-1 rounded"
                  style={{ background: colors.oceanLight, color: colors.text.muted }}
                  onClick={() => setShowFreezingExplainer(false)}
                >
                  Got it, show timeline
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Normal tuple */}
                <div className="p-4 rounded-lg" style={{ background: colors.ocean }}>
                  <p className="text-sm font-medium mb-3" style={{ color: colors.text.primary }}>
                    Normal Tuple
                  </p>
                  <div className="flex items-center gap-4">
                    <div
                      className="px-4 py-3 rounded font-mono"
                      style={{ background: colors.oceanLight, border: `2px solid ${colors.text.muted}` }}
                    >
                      <span style={{ color: colors.text.muted }}>xmin: </span>
                      <span style={{ color: colors.glow.warning }}>1,234,567</span>
                    </div>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      Has a specific transaction ID
                    </p>
                  </div>
                  <p className="text-xs mt-3" style={{ color: colors.text.muted }}>
                    Visibility depends on comparing this XID to the current transaction
                  </p>
                </div>

                {/* Frozen tuple */}
                <div className="p-4 rounded-lg" style={{ background: colors.ocean }}>
                  <p className="text-sm font-medium mb-3" style={{ color: colors.text.primary }}>
                    Frozen Tuple
                  </p>
                  <div className="flex items-center gap-4">
                    <div
                      className="px-4 py-3 rounded font-mono"
                      style={{
                        background: `${colors.glow.healthy}20`,
                        border: `2px solid ${colors.glow.healthy}`,
                      }}
                    >
                      <span style={{ color: colors.text.muted }}>xmin: </span>
                      <span style={{ color: colors.glow.healthy }}>FrozenXID (2)</span>
                    </div>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      Special value
                    </p>
                  </div>
                  <p className="text-xs mt-3" style={{ color: colors.glow.healthy }}>
                    "Visible to everyone, forever" - no comparison needed
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-lg" style={{ background: `${colors.glow.warning}10` }}>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  <span style={{ color: colors.glow.warning }}>Why it matters:</span> PostgreSQL uses 32-bit transaction IDs.
                  At ~2 billion transactions, XIDs wrap around. Without freezing old tuples,
                  they'd suddenly appear to be from the "future"—invisible and corrupted.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* XID Timeline */}
      <div
        className="p-6 rounded-xl"
        style={{
          background: colors.oceanDark,
          border: `2px solid ${isCritical ? colors.glow.critical : isDanger ? colors.glow.warning : colors.text.muted}30`,
          boxShadow: isCritical ? `0 0 30px ${colors.glow.critical}20` : 'none',
        }}
      >
        {/* Stats */}
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <div
            className="px-4 py-2 rounded-lg"
            style={{ background: colors.ocean, border: `1px solid ${colors.glow.healthy}40` }}
          >
            <span className="text-sm" style={{ color: colors.text.muted }}>
              Current XID:{' '}
            </span>
            <span className="font-mono font-bold" style={{ color: colors.glow.healthy }}>
              {formatXid(state.currentXid)}
            </span>
          </div>

          <div
            className="px-4 py-2 rounded-lg"
            style={{
              background: colors.ocean,
              border: `1px solid ${state.hasLongRunningTx ? colors.glow.critical : colors.text.muted}40`,
            }}
          >
            <span className="text-sm" style={{ color: colors.text.muted }}>
              Oldest Unfrozen:{' '}
            </span>
            <span
              className="font-mono font-bold"
              style={{ color: state.hasLongRunningTx ? colors.glow.critical : colors.text.secondary }}
            >
              {formatXid(state.hasLongRunningTx ? state.longRunningTxXid : state.oldestUnfrozenXid)}
            </span>
          </div>

          <div
            className="px-4 py-2 rounded-lg"
            style={{
              background: colors.ocean,
              border: `1px solid ${isCritical ? colors.glow.critical : isDanger ? colors.glow.warning : colors.text.muted}40`,
            }}
          >
            <span className="text-sm" style={{ color: colors.text.muted }}>
              XIDs Remaining:{' '}
            </span>
            <span
              className="font-mono font-bold"
              style={{
                color: isCritical ? colors.glow.critical : isDanger ? colors.glow.warning : colors.text.secondary,
              }}
            >
              {formatXid(xidRemaining)}
            </span>
          </div>
        </div>

        {/* Visual Timeline */}
        <div className="relative h-16 mb-4">
          {/* Base bar */}
          <div
            className="absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 rounded-full overflow-hidden"
            style={{ background: colors.ocean }}
          >
            {/* Used XIDs */}
            <motion.div
              className="absolute inset-y-0 left-0"
              style={{ background: colors.glow.healthy }}
              animate={{ width: `${Math.min(100, percentUsed)}%` }}
              transition={{ duration: 0.3 }}
            />

            {/* Danger zone */}
            <div
              className="absolute inset-y-0 right-0"
              style={{
                width: '10%',
                background: `linear-gradient(90deg, transparent, ${colors.glow.warning}40)`,
              }}
            />

            {/* Critical zone */}
            <div
              className="absolute inset-y-0 right-0"
              style={{
                width: '2.5%',
                background: colors.glow.critical,
              }}
            />
          </div>

          {/* Current XID marker */}
          <motion.div
            className="absolute top-0 w-1 h-full"
            style={{ background: colors.glow.healthy }}
            animate={{ left: `${(state.currentXid / XID_MAX) * 100}%` }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-mono whitespace-nowrap"
              style={{ background: colors.glow.healthy, color: colors.oceanDark }}
            >
              Current
            </div>
          </motion.div>

          {/* Oldest unfrozen marker (anchor) */}
          <motion.div
            className="absolute top-0 w-1 h-full"
            style={{
              background: state.hasLongRunningTx ? colors.glow.critical : colors.text.muted,
            }}
            animate={{
              left: `${((state.hasLongRunningTx ? state.longRunningTxXid : state.oldestUnfrozenXid) / XID_MAX) * 100}%`,
            }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-mono whitespace-nowrap"
              style={{
                background: state.hasLongRunningTx ? colors.glow.critical : colors.oceanLight,
                color: state.hasLongRunningTx ? colors.oceanDark : colors.text.muted,
              }}
            >
              {state.hasLongRunningTx ? 'Blocked!' : 'Anchor'}
            </div>
          </motion.div>

          {/* Wraparound marker */}
          <div
            className="absolute top-0 right-0 w-1 h-full"
            style={{ background: colors.glow.critical }}
          >
            <div
              className="absolute -top-6 right-0 px-2 py-1 rounded text-xs font-mono"
              style={{ background: colors.glow.critical, color: colors.oceanDark }}
            >
              Wraparound
            </div>
          </div>
        </div>

        {/* Scale labels */}
        <div className="flex justify-between text-xs" style={{ color: colors.text.muted }}>
          <span>0</span>
          <span>~2.1 Billion</span>
        </div>

        {/* Long-running transaction indicator */}
        {state.hasLongRunningTx && (
          <motion.div
            className="mt-4 p-4 rounded-lg"
            style={{
              background: `${colors.glow.critical}10`,
              border: `1px solid ${colors.glow.critical}40`,
            }}
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <p className="text-sm" style={{ color: colors.glow.critical }}>
              <strong>Long-running transaction blocking VACUUM!</strong> The anchor cannot move past XID{' '}
              {formatXid(state.longRunningTxXid)}. XIDs are being consumed but nothing can be frozen.
            </p>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 justify-center">
        <motion.button
          className="px-6 py-2 rounded-lg font-medium"
          style={{
            background: isSimulating ? colors.glow.warning : colors.glow.healthy,
            color: colors.oceanDark,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSimulating(!isSimulating)}
        >
          {isSimulating ? 'Pause Simulation' : 'Start Simulation'}
        </motion.button>

        <motion.button
          className="px-6 py-2 rounded-lg font-medium"
          style={{
            background: isVacuuming
              ? colors.oceanDark
              : state.hasLongRunningTx
              ? `${colors.glow.warning}20`
              : `${colors.glow.healthy}20`,
            color: isVacuuming
              ? colors.text.muted
              : state.hasLongRunningTx
              ? colors.glow.warning
              : colors.glow.healthy,
            border: `1px solid ${state.hasLongRunningTx ? colors.glow.warning : colors.glow.healthy}40`,
          }}
          whileHover={!isVacuuming ? { scale: 1.05 } : {}}
          whileTap={!isVacuuming ? { scale: 0.95 } : {}}
          onClick={runVacuumFreeze}
          disabled={isVacuuming}
        >
          {isVacuuming ? 'Freezing...' : 'Run VACUUM FREEZE'}
        </motion.button>

        <motion.button
          className="px-6 py-2 rounded-lg font-medium"
          style={{
            background: state.hasLongRunningTx ? `${colors.glow.critical}20` : colors.oceanDark,
            color: state.hasLongRunningTx ? colors.glow.critical : colors.text.secondary,
            border: `1px solid ${state.hasLongRunningTx ? colors.glow.critical : colors.text.muted}40`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={state.hasLongRunningTx ? endLongRunningTx : startLongRunningTx}
        >
          {state.hasLongRunningTx ? 'End Long-Running TX' : 'Start Long-Running TX'}
        </motion.button>

        <motion.button
          className="px-4 py-2 rounded-lg text-sm"
          style={{
            background: colors.oceanDark,
            color: colors.text.muted,
            border: `1px solid ${colors.text.muted}40`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={reset}
        >
          Reset
        </motion.button>
      </div>

      {/* Critical warning overlay */}
      <AnimatePresence>
        {isCritical && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-6 rounded-xl text-center"
            style={{
              background: `${colors.glow.critical}10`,
              border: `2px solid ${colors.glow.critical}`,
              boxShadow: `0 0 30px ${colors.glow.critical}40`,
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <p className="text-xl font-bold mb-2" style={{ color: colors.glow.critical }}>
                CRITICAL: Approaching Wraparound
              </p>
            </motion.div>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              PostgreSQL will refuse new transactions to prevent data corruption.
              Only VACUUM can save us now.
            </p>
            <p className="text-xs mt-4 font-mono" style={{ color: colors.glow.critical }}>
              ERROR: database is not accepting commands to avoid wraparound data loss
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insight */}
      <div
        className="p-4 rounded-lg text-center max-w-2xl mx-auto"
        style={{ background: colors.oceanDark, border: `1px solid ${colors.text.muted}20` }}
      >
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          {state.hasLongRunningTx ? (
            <>
              <span style={{ color: colors.glow.critical }}>Long-running transactions are dangerous.</span>{' '}
              They prevent VACUUM from freezing old tuples, holding back the "anchor" and consuming XIDs.
            </>
          ) : isSimulating ? (
            <>
              XIDs are being consumed. Without VACUUM FREEZE, we'll eventually hit the 2 billion limit.
              The "anchor" (oldest unfrozen XID) determines how much runway we have.
            </>
          ) : (
            <>
              Try starting a long-running transaction to see how it blocks VACUUM.
              In production, monitor <code className="px-1 rounded" style={{ background: colors.ocean }}>age(datfrozenxid)</code>.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
