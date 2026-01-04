import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface Strategy {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  estimatedRows: number;
  actualCost: (estimatedRows: number, actualRows: number) => number;
}

const strategies: Strategy[] = [
  {
    id: 'seq-scan',
    name: 'Sequential Scan',
    description: 'Read every page, check every row',
    baseCost: 1,
    estimatedRows: 0,
    actualCost: (_, actualRows) => actualRows, // O(n)
  },
  {
    id: 'index-scan',
    name: 'Index Scan',
    description: 'Navigate B-tree, hop to heap',
    baseCost: 4,
    estimatedRows: 0,
    actualCost: (est) => Math.log2(est + 1) * 4 + est * 2, // O(log n) + heap hops
  },
  {
    id: 'index-only',
    name: 'Index-Only Scan',
    description: 'All data in index, no heap hop',
    baseCost: 3,
    estimatedRows: 0,
    actualCost: (est) => Math.log2(est + 1) * 3, // O(log n), no heap
  },
];

export function CostArena() {
  const [tableSize] = useState(1000000);
  const [estimatedSelectivity, setEstimatedSelectivity] = useState(0.001);
  const [actualSelectivity, setActualSelectivity] = useState(0.001);
  const [showActual, setShowActual] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const estimatedRows = Math.floor(tableSize * estimatedSelectivity);
  const actualRows = Math.floor(tableSize * actualSelectivity);

  // Calculate costs
  const costs = strategies.map((s) => ({
    ...s,
    estimated: s.actualCost(estimatedRows, actualRows),
    actual: s.actualCost(actualRows, actualRows),
  }));

  // Find winners
  const estimatedWinner = costs.reduce((min, c) =>
    c.estimated < min.estimated ? c : min
  );
  const actualWinner = costs.reduce((min, c) => (c.actual < min.actual ? c : min));

  const runComparison = useCallback(() => {
    setShowActual(false);
    setIsAnimating(true);
    setTimeout(() => {
      setShowActual(true);
      setIsAnimating(false);
    }, 1500);
  }, []);

  // Stale stats preset
  const setStaleStats = useCallback(() => {
    setEstimatedSelectivity(0.00001); // Planner thinks 10 rows
    setActualSelectivity(0.1); // Actually 100,000 rows
    setShowActual(false);
  }, []);

  // Fresh stats preset
  const setFreshStats = useCallback(() => {
    setEstimatedSelectivity(0.001);
    setActualSelectivity(0.001);
    setShowActual(false);
  }, []);

  const maxCost = Math.max(...costs.map((c) => Math.max(c.estimated, c.actual)));

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
            The Cost Arena
          </h3>
          <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
            Watch strategies compete based on cost estimates
          </p>
        </div>

        <div className="flex gap-2">
          <motion.button
            className="px-3 py-1 rounded text-xs font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={setStaleStats}
            style={{
              background: `${colors.glow.critical}20`,
              color: colors.glow.critical,
              border: `1px solid ${colors.glow.critical}40`,
            }}
          >
            Stale Stats
          </motion.button>
          <motion.button
            className="px-3 py-1 rounded text-xs font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={setFreshStats}
            style={{
              background: `${colors.glow.healthy}20`,
              color: colors.glow.healthy,
              border: `1px solid ${colors.glow.healthy}40`,
            }}
          >
            Fresh Stats
          </motion.button>
        </div>
      </div>

      {/* Stats Display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 rounded-lg" style={{ background: colors.ocean }}>
          <div className="text-xs" style={{ color: colors.text.muted }}>
            Table Size
          </div>
          <div className="text-lg font-mono" style={{ color: colors.text.primary }}>
            {tableSize.toLocaleString()}
          </div>
        </div>
        <div className="p-3 rounded-lg" style={{ background: colors.ocean }}>
          <div className="text-xs" style={{ color: colors.text.muted }}>
            Estimated Rows
          </div>
          <div
            className="text-lg font-mono"
            style={{ color: colors.glow.warning }}
          >
            {estimatedRows.toLocaleString()}
          </div>
        </div>
        <div className="p-3 rounded-lg" style={{ background: colors.ocean }}>
          <div className="text-xs" style={{ color: colors.text.muted }}>
            Actual Rows
          </div>
          <div
            className="text-lg font-mono"
            style={{
              color: showActual
                ? actualRows === estimatedRows
                  ? colors.glow.healthy
                  : colors.glow.critical
                : colors.text.muted,
            }}
          >
            {showActual ? actualRows.toLocaleString() : '???'}
          </div>
        </div>
        <div className="p-3 rounded-lg" style={{ background: colors.ocean }}>
          <div className="text-xs" style={{ color: colors.text.muted }}>
            Estimate Accuracy
          </div>
          <div
            className="text-lg font-mono"
            style={{
              color: showActual
                ? Math.abs(actualRows - estimatedRows) / actualRows < 0.1
                  ? colors.glow.healthy
                  : colors.glow.critical
                : colors.text.muted,
            }}
          >
            {showActual
              ? `${Math.round((estimatedRows / actualRows) * 100)}%`
              : '???'}
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs" style={{ color: colors.text.muted }}>
            Planner's Estimate (selectivity): {(estimatedSelectivity * 100).toFixed(4)}%
          </label>
          <input
            type="range"
            min="-6"
            max="-1"
            step="0.1"
            value={Math.log10(estimatedSelectivity)}
            onChange={(e) => setEstimatedSelectivity(Math.pow(10, parseFloat(e.target.value)))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ background: colors.ocean }}
          />
        </div>
        <div>
          <label className="text-xs" style={{ color: colors.text.muted }}>
            Actual Reality (selectivity): {(actualSelectivity * 100).toFixed(4)}%
          </label>
          <input
            type="range"
            min="-6"
            max="-1"
            step="0.1"
            value={Math.log10(actualSelectivity)}
            onChange={(e) => setActualSelectivity(Math.pow(10, parseFloat(e.target.value)))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ background: colors.ocean }}
          />
        </div>
      </div>

      {/* Strategy Bars */}
      <div className="space-y-4 mb-6">
        {costs.map((strategy) => {
          const isEstimatedWinner = strategy.id === estimatedWinner.id;
          const isActualWinner = strategy.id === actualWinner.id;
          const estimatedWidth = (strategy.estimated / maxCost) * 100;
          const actualWidth = (strategy.actual / maxCost) * 100;

          return (
            <div key={strategy.id}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="font-medium text-sm"
                    style={{ color: colors.text.primary }}
                  >
                    {strategy.name}
                  </span>
                  {isEstimatedWinner && (
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: `${colors.glow.warning}20`,
                        color: colors.glow.warning,
                      }}
                    >
                      Chosen
                    </span>
                  )}
                  {showActual && isActualWinner && !isEstimatedWinner && (
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: `${colors.glow.healthy}20`,
                        color: colors.glow.healthy,
                      }}
                    >
                      Should've been
                    </span>
                  )}
                </div>
                <span className="text-xs" style={{ color: colors.text.muted }}>
                  {strategy.description}
                </span>
              </div>

              <div className="relative h-8">
                {/* Estimated cost bar */}
                <motion.div
                  className="absolute top-0 h-4 rounded"
                  style={{
                    background: isEstimatedWinner
                      ? colors.glow.warning
                      : colors.text.muted,
                    opacity: showActual ? 0.3 : 1,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${estimatedWidth}%` }}
                  transition={{ duration: 0.5 }}
                />

                {/* Actual cost bar */}
                <AnimatePresence>
                  {showActual && (
                    <motion.div
                      className="absolute top-4 h-4 rounded"
                      style={{
                        background: isActualWinner
                          ? colors.glow.healthy
                          : colors.glow.critical,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${actualWidth}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </AnimatePresence>

                {/* Cost labels */}
                <div
                  className="absolute right-0 top-0 text-xs font-mono"
                  style={{ color: colors.text.muted }}
                >
                  Est: {Math.round(strategy.estimated).toLocaleString()}
                </div>
                {showActual && (
                  <motion.div
                    className="absolute right-0 top-4 text-xs font-mono"
                    style={{
                      color: isActualWinner ? colors.glow.healthy : colors.glow.critical,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Act: {Math.round(strategy.actual).toLocaleString()}
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Run button */}
      <motion.button
        className="w-full px-4 py-3 rounded-lg text-sm font-medium"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={runComparison}
        disabled={isAnimating}
        style={{
          background: `${colors.glow.healthy}20`,
          color: colors.glow.healthy,
          border: `1px solid ${colors.glow.healthy}40`,
        }}
      >
        {isAnimating ? 'Executing...' : showActual ? 'Run Again' : 'Execute Query (Reveal Actual)'}
      </motion.button>

      {/* Result insight */}
      <AnimatePresence>
        {showActual && estimatedWinner.id !== actualWinner.id && (
          <motion.div
            className="mt-4 p-4 rounded-lg"
            style={{
              background: `${colors.glow.critical}10`,
              border: `1px solid ${colors.glow.critical}40`,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="font-medium" style={{ color: colors.glow.critical }}>
              Wrong Strategy Chosen!
            </p>
            <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
              The planner chose <strong>{estimatedWinner.name}</strong> but{' '}
              <strong>{actualWinner.name}</strong> would have been{' '}
              {Math.round(
                (costs.find((c) => c.id === estimatedWinner.id)!.actual /
                  costs.find((c) => c.id === actualWinner.id)!.actual) *
                  100
              ) / 100}
              x faster.
            </p>
            <p className="text-sm mt-2" style={{ color: colors.text.muted }}>
              This happens when statistics are stale. Run{' '}
              <code
                className="px-1 rounded"
                style={{ background: colors.oceanDark, color: colors.glow.healthy }}
              >
                ANALYZE
              </code>{' '}
              to fix it.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
