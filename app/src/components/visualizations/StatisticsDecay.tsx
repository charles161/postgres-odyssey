import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

export function StatisticsDecay() {
  const [daysSinceAnalyze, setDaysSinceAnalyze] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Base stats at day 0
  const baseRows = 100000;
  const dailyInserts = 500;
  const dailyDeletes = 50;

  // Calculate current state
  const totalInserts = daysSinceAnalyze * dailyInserts;
  const totalDeletes = daysSinceAnalyze * dailyDeletes;
  const actualRows = baseRows + totalInserts - totalDeletes;
  const estimatedRows = hasAnalyzed ? actualRows : baseRows; // Frozen at last ANALYZE

  // Accuracy percentage
  const accuracy = Math.min(100, Math.round((estimatedRows / actualRows) * 100));
  const isAccurate = Math.abs(accuracy - 100) < 10;

  // Start simulation
  const startSimulation = useCallback(() => {
    setIsSimulating(true);
    setHasAnalyzed(false);
    setDaysSinceAnalyze(0);
  }, []);

  // Run ANALYZE
  const runAnalyze = useCallback(() => {
    setHasAnalyzed(true);
    setDaysSinceAnalyze(0);
  }, []);

  // Auto-increment days during simulation
  useEffect(() => {
    if (!isSimulating) return;

    const timer = setInterval(() => {
      setDaysSinceAnalyze((prev) => {
        if (prev >= 365) {
          setIsSimulating(false);
          return prev;
        }
        return prev + 1;
      });
    }, 50); // Fast for demo

    return () => clearInterval(timer);
  }, [isSimulating]);

  // Determine plan quality
  const getPlanQuality = () => {
    if (accuracy >= 90) return { label: 'Optimal', color: colors.glow.healthy };
    if (accuracy >= 70) return { label: 'Suboptimal', color: colors.glow.warning };
    if (accuracy >= 50) return { label: 'Poor', color: colors.glow.critical };
    return { label: 'Terrible', color: colors.glow.critical };
  };

  const planQuality = getPlanQuality();

  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: colors.oceanDark,
        border: `1px solid ${colors.text.muted}20`,
      }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-medium" style={{ color: colors.text.primary }}>
            Statistics Decay
          </h3>
          <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
            Watch how outdated statistics lead to bad query plans
          </p>
        </div>

        <div className="flex gap-2">
          <motion.button
            className="px-4 py-2 rounded-lg text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startSimulation}
            disabled={isSimulating}
            style={{
              background: `${colors.glow.warning}20`,
              color: colors.glow.warning,
              border: `1px solid ${colors.glow.warning}40`,
              cursor: isSimulating ? 'not-allowed' : 'pointer',
            }}
          >
            {isSimulating ? 'Simulating...' : 'Start Time'}
          </motion.button>
          <motion.button
            className="px-4 py-2 rounded-lg text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={runAnalyze}
            style={{
              background: `${colors.glow.healthy}20`,
              color: colors.glow.healthy,
              border: `1px solid ${colors.glow.healthy}40`,
            }}
          >
            Run ANALYZE
          </motion.button>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-6">
        <div className="flex justify-between text-xs mb-2" style={{ color: colors.text.muted }}>
          <span>Day 0</span>
          <span>Day {daysSinceAnalyze}</span>
          <span>Day 365</span>
        </div>
        <div
          className="h-3 rounded-full overflow-hidden"
          style={{ background: colors.ocean }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isAccurate
                ? colors.glow.healthy
                : accuracy >= 70
                ? colors.glow.warning
                : colors.glow.critical,
            }}
            animate={{ width: `${(daysSinceAnalyze / 365) * 100}%` }}
          />
        </div>
        <div className="text-center mt-2">
          <span className="text-sm" style={{ color: colors.text.secondary }}>
            Last ANALYZE: {daysSinceAnalyze === 0 ? 'Just now' : `${daysSinceAnalyze} days ago`}
          </span>
        </div>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* What the planner sees */}
        <div
          className="p-4 rounded-lg"
          style={{
            background: colors.ocean,
            border: `1px solid ${colors.glow.warning}40`,
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: colors.glow.warning }}
            />
            <span className="font-medium" style={{ color: colors.glow.warning }}>
              What the Planner Sees
            </span>
          </div>

          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span style={{ color: colors.text.muted }}>pg_class.reltuples</span>
              <span style={{ color: colors.text.primary }}>
                {estimatedRows.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: colors.text.muted }}>Last analyzed</span>
              <span style={{ color: colors.text.primary }}>
                {daysSinceAnalyze === 0 ? 'now' : `${daysSinceAnalyze}d ago`}
              </span>
            </div>
          </div>

          <p className="text-xs mt-4" style={{ color: colors.text.muted }}>
            Statistics are frozen from last ANALYZE
          </p>
        </div>

        {/* Reality */}
        <div
          className="p-4 rounded-lg"
          style={{
            background: colors.ocean,
            border: `1px solid ${colors.glow.healthy}40`,
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: colors.glow.healthy }}
            />
            <span className="font-medium" style={{ color: colors.glow.healthy }}>
              Reality
            </span>
          </div>

          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span style={{ color: colors.text.muted }}>Actual rows</span>
              <span style={{ color: colors.text.primary }}>
                {actualRows.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: colors.text.muted }}>Changes since ANALYZE</span>
              <span style={{ color: colors.glow.warning }}>
                +{totalInserts.toLocaleString()} / -{totalDeletes.toLocaleString()}
              </span>
            </div>
          </div>

          <p className="text-xs mt-4" style={{ color: colors.text.muted }}>
            The table keeps changing after ANALYZE
          </p>
        </div>
      </div>

      {/* Accuracy Gauge */}
      <div
        className="p-4 rounded-lg mb-6"
        style={{ background: colors.ocean }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium" style={{ color: colors.text.primary }}>
            Estimate Accuracy
          </span>
          <span
            className="px-3 py-1 rounded text-sm font-medium"
            style={{
              background: `${planQuality.color}20`,
              color: planQuality.color,
            }}
          >
            {planQuality.label} Plans
          </span>
        </div>

        {/* Accuracy bar */}
        <div className="relative h-8 rounded-lg overflow-hidden" style={{ background: colors.oceanDark }}>
          <motion.div
            className="absolute inset-y-0 left-0 rounded-lg"
            style={{ background: planQuality.color }}
            animate={{ width: `${accuracy}%` }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold"
            style={{ color: colors.ocean }}
          >
            {accuracy}%
          </div>
        </div>

        {/* Gap visualization */}
        <div className="mt-4 text-center">
          <p className="text-sm" style={{ color: colors.text.muted }}>
            Gap: <span style={{ color: planQuality.color }}>
              {Math.abs(actualRows - estimatedRows).toLocaleString()} rows
            </span>{' '}
            ({Math.abs(100 - accuracy)}% error)
          </p>
        </div>
      </div>

      {/* Impact explanation */}
      <AnimatePresence mode="wait">
        {accuracy < 70 && daysSinceAnalyze > 0 && (
          <motion.div
            className="p-4 rounded-lg"
            style={{
              background: `${colors.glow.critical}10`,
              border: `1px solid ${colors.glow.critical}40`,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <p className="font-medium" style={{ color: colors.glow.critical }}>
              Statistics are dangerously stale!
            </p>
            <p className="text-sm mt-2" style={{ color: colors.text.secondary }}>
              The planner thinks there are {estimatedRows.toLocaleString()} rows, but there are
              actually {actualRows.toLocaleString()}. This could cause:
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li style={{ color: colors.text.muted }}>
                • Choosing sequential scan when index would be faster
              </li>
              <li style={{ color: colors.text.muted }}>
                • Wrong join strategies (nested loop vs hash)
              </li>
              <li style={{ color: colors.text.muted }}>
                • Memory underallocation for sorts
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ANALYZE command */}
      <div
        className="mt-6 p-4 rounded-lg font-mono text-sm"
        style={{
          background: colors.ocean,
          border: `1px solid ${colors.text.muted}20`,
        }}
      >
        <div style={{ color: colors.text.muted }}>-- Refresh statistics for a table</div>
        <div>
          <span style={{ color: colors.glow.healthy }}>ANALYZE</span>
          <span style={{ color: colors.text.secondary }}> users;</span>
        </div>
        <div className="mt-2" style={{ color: colors.text.muted }}>
          -- Refresh all tables (autovacuum does this automatically)
        </div>
        <div>
          <span style={{ color: colors.glow.healthy }}>ANALYZE</span>
          <span style={{ color: colors.text.secondary }}>;</span>
        </div>
      </div>
    </div>
  );
}
