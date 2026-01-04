import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface Tuple {
  id: number;
  x: number;
  y: number;
  isDead: boolean;
  age: number;
}

export function BloatMonitor() {
  const [tuples, setTuples] = useState<Tuple[]>([]);
  const [writeRate, setWriteRate] = useState(3); // updates per second
  const [isRunning, setIsRunning] = useState(false);
  const [isVacuuming, setIsVacuuming] = useState(false);
  const [autovacuumEnabled, setAutovacuumEnabled] = useState(false);
  const [vacuumSweepY, setVacuumSweepY] = useState(-1);
  const nextIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate stats
  const liveTuples = tuples.filter((t) => !t.isDead).length;
  const deadTuples = tuples.filter((t) => t.isDead).length;
  const bloatPercentage = tuples.length > 0 ? Math.round((deadTuples / tuples.length) * 100) : 0;
  const tableSize = Math.max(200, 200 + tuples.length * 2);

  // Write simulation
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTuples((prev) => {
        // Mark a random live tuple as dead (simulating UPDATE)
        const liveTupleIndices = prev
          .map((t, i) => (t.isDead ? -1 : i))
          .filter((i) => i !== -1);

        let updated = [...prev];

        if (liveTupleIndices.length > 0 && Math.random() > 0.3) {
          const randomIndex = liveTupleIndices[Math.floor(Math.random() * liveTupleIndices.length)];
          updated[randomIndex] = { ...updated[randomIndex], isDead: true };
        }

        // Add new tuple
        const newTuple: Tuple = {
          id: nextIdRef.current++,
          x: Math.random() * 280 - 140,
          y: Math.random() * 100 - 50,
          isDead: false,
          age: 0,
        };

        return [...updated, newTuple];
      });
    }, 1000 / writeRate);

    return () => clearInterval(interval);
  }, [isRunning, writeRate]);

  // Autovacuum check
  useEffect(() => {
    if (!autovacuumEnabled || isVacuuming) return;

    // Trigger autovacuum when dead tuples > 20% of total
    if (bloatPercentage > 20 && tuples.length > 10) {
      runVacuum();
    }
  }, [autovacuumEnabled, bloatPercentage, tuples.length, isVacuuming]);

  const runVacuum = () => {
    if (isVacuuming) return;

    setIsVacuuming(true);
    setVacuumSweepY(0);

    // Animate sweep
    const duration = 2000;
    const startTime = Date.now();

    const animateSweep = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setVacuumSweepY(progress * 100);

      if (progress < 1) {
        requestAnimationFrame(animateSweep);
      } else {
        // Remove dead tuples
        setTuples((prev) => prev.filter((t) => !t.isDead));
        setVacuumSweepY(-1);
        setIsVacuuming(false);
      }
    };

    requestAnimationFrame(animateSweep);
  };

  const reset = () => {
    setIsRunning(false);
    setTuples([]);
    nextIdRef.current = 0;
    setIsVacuuming(false);
    setVacuumSweepY(-1);
  };

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 justify-center">
        <div
          className="px-4 py-2 rounded-lg"
          style={{ background: colors.oceanDark, border: `1px solid ${colors.glow.healthy}40` }}
        >
          <span className="text-sm" style={{ color: colors.text.muted }}>
            Live tuples:{' '}
          </span>
          <span className="font-mono font-bold" style={{ color: colors.glow.healthy }}>
            {liveTuples}
          </span>
        </div>

        <div
          className="px-4 py-2 rounded-lg"
          style={{ background: colors.oceanDark, border: `1px solid #4a4a6a` }}
        >
          <span className="text-sm" style={{ color: colors.text.muted }}>
            Dead tuples:{' '}
          </span>
          <span className="font-mono font-bold" style={{ color: '#6b6b8a' }}>
            {deadTuples}
          </span>
        </div>

        <div
          className="px-4 py-2 rounded-lg"
          style={{
            background: colors.oceanDark,
            border: `1px solid ${
              bloatPercentage > 50
                ? colors.glow.critical
                : bloatPercentage > 20
                ? colors.glow.warning
                : colors.text.muted
            }40`,
          }}
        >
          <span className="text-sm" style={{ color: colors.text.muted }}>
            Bloat:{' '}
          </span>
          <span
            className="font-mono font-bold"
            style={{
              color:
                bloatPercentage > 50
                  ? colors.glow.critical
                  : bloatPercentage > 20
                  ? colors.glow.warning
                  : colors.text.secondary,
            }}
          >
            {bloatPercentage}%
          </span>
        </div>

        <div
          className="px-4 py-2 rounded-lg"
          style={{ background: colors.oceanDark, border: `1px solid ${colors.text.muted}40` }}
        >
          <span className="text-sm" style={{ color: colors.text.muted }}>
            Table size:{' '}
          </span>
          <span className="font-mono font-bold" style={{ color: colors.text.secondary }}>
            {tableSize}KB
          </span>
        </div>
      </div>

      {/* Visualization */}
      <div
        ref={containerRef}
        className="relative mx-auto rounded-xl overflow-hidden"
        style={{
          background: colors.oceanLight,
          border: `2px solid ${
            bloatPercentage > 50
              ? colors.glow.critical
              : bloatPercentage > 20
              ? colors.glow.warning
              : colors.glow.healthy
          }`,
          width: Math.min(tableSize, 500),
          height: 200,
          transition: 'width 0.3s ease-out, border-color 0.3s',
        }}
      >
        {/* Table label */}
        <div
          className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-mono"
          style={{ background: colors.oceanDark, color: colors.text.muted }}
        >
          users
        </div>

        {/* Tuples */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence>
            {tuples.map((tuple) => (
              <motion.div
                key={tuple.id}
                className="absolute w-4 h-3 rounded-sm"
                style={{
                  left: `calc(50% + ${tuple.x}px)`,
                  top: `calc(50% + ${tuple.y}px)`,
                  background: tuple.isDead ? '#4a4a6a' : colors.glow.healthy,
                  border: `1px solid ${tuple.isDead ? '#6b6b8a' : colors.glow.healthy}`,
                  filter: tuple.isDead ? 'grayscale(40%) brightness(0.7)' : 'none',
                  opacity: tuple.isDead ? 0.5 : 1,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: tuple.isDead ? 0.5 : 1 }}
                exit={{
                  scale: 0,
                  opacity: 0,
                  filter: 'blur(4px)',
                  transition: { duration: 0.3 },
                }}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* VACUUM sweep line */}
        {vacuumSweepY >= 0 && (
          <motion.div
            className="absolute left-0 right-0 h-8 pointer-events-none"
            style={{
              top: `${vacuumSweepY}%`,
              background: `linear-gradient(180deg, transparent, ${colors.glow.healthy}60, transparent)`,
            }}
          />
        )}

        {/* Breathing animation indicator */}
        {isRunning && !isVacuuming && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{ border: `2px solid ${colors.glow.healthy}` }}
            animate={{
              opacity: [0, 0.3, 0],
              scale: [1, 1.01, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 justify-center items-center">
        {/* Write rate slider */}
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: colors.text.muted }}>
            Write rate:
          </span>
          <input
            type="range"
            min="1"
            max="10"
            value={writeRate}
            onChange={(e) => setWriteRate(Number(e.target.value))}
            className="w-24"
          />
          <span className="font-mono text-sm w-8" style={{ color: colors.text.secondary }}>
            {writeRate}/s
          </span>
        </div>

        {/* Autovacuum toggle */}
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: autovacuumEnabled ? `${colors.glow.healthy}20` : colors.oceanDark,
            color: autovacuumEnabled ? colors.glow.healthy : colors.text.muted,
            border: `1px solid ${autovacuumEnabled ? colors.glow.healthy : colors.text.muted}40`,
          }}
          onClick={() => setAutovacuumEnabled(!autovacuumEnabled)}
        >
          Autovacuum: {autovacuumEnabled ? 'ON' : 'OFF'}
        </button>

        {/* Start/Stop */}
        <motion.button
          className="px-6 py-2 rounded-lg font-medium"
          style={{
            background: isRunning ? colors.glow.warning : colors.glow.healthy,
            color: colors.oceanDark,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? 'Pause' : 'Start'} Writes
        </motion.button>

        {/* Manual VACUUM */}
        <motion.button
          className="px-6 py-2 rounded-lg font-medium"
          style={{
            background: isVacuuming ? colors.oceanDark : `${colors.glow.healthy}20`,
            color: isVacuuming ? colors.text.muted : colors.glow.healthy,
            border: `1px solid ${colors.glow.healthy}40`,
            cursor: isVacuuming ? 'not-allowed' : 'pointer',
          }}
          whileHover={isVacuuming ? {} : { scale: 1.05 }}
          whileTap={isVacuuming ? {} : { scale: 0.95 }}
          onClick={() => !isVacuuming && runVacuum()}
          disabled={isVacuuming}
        >
          {isVacuuming ? 'Vacuuming...' : 'Run VACUUM'}
        </motion.button>

        {/* Reset */}
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

      {/* Insight */}
      <div
        className="p-4 rounded-lg text-center max-w-xl mx-auto"
        style={{ background: colors.oceanDark, border: `1px solid ${colors.text.muted}20` }}
      >
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          {bloatPercentage > 50 ? (
            <>
              <span style={{ color: colors.glow.critical }}>Critical bloat!</span> Your table is
              more than half dead space. Queries are scanning through ghosts.
            </>
          ) : bloatPercentage > 20 ? (
            <>
              <span style={{ color: colors.glow.warning }}>Bloat building.</span> Without VACUUM,
              this table will keep growing even with the same data.
            </>
          ) : isVacuuming ? (
            <>
              <span style={{ color: colors.glow.healthy }}>VACUUM running...</span> Dead tuples
              being reclaimed. Space marked as reusable.
            </>
          ) : (
            <>
              Watch the table grow. Each <code className="px-1 rounded" style={{ background: colors.ocean }}>UPDATE</code>{' '}
              creates a ghost tuple. Hit VACUUM to see the cleanup.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
