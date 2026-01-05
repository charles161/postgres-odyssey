import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

type StatView = 'pg_class' | 'pg_stats' | 'pg_stat_user_tables';

interface StatInfo {
  name: string;
  description: string;
  query: string;
  columns: { name: string; description: string; example: string }[];
  insight: string;
}

const statViews: Record<StatView, StatInfo> = {
  pg_class: {
    name: 'pg_class',
    description: 'Basic table metadata - row count and page count estimates.',
    query: `SELECT relname, reltuples, relpages
FROM pg_class
WHERE relname = 'orders';`,
    columns: [
      { name: 'reltuples', description: 'Estimated number of rows', example: '1,234,567' },
      { name: 'relpages', description: 'Number of disk pages', example: '45,678' },
    ],
    insight: 'The planner uses reltuples to estimate result sizes. If this is wrong, plans will be wrong.',
  },
  pg_stats: {
    name: 'pg_stats',
    description: 'Column-level statistics including distribution and common values.',
    query: `SELECT attname, null_frac, n_distinct,
       most_common_vals, histogram_bounds
FROM pg_stats
WHERE tablename = 'orders'
  AND attname = 'status';`,
    columns: [
      { name: 'null_frac', description: 'Fraction of NULL values', example: '0.02' },
      { name: 'n_distinct', description: 'Number of distinct values (negative = fraction)', example: '5' },
      { name: 'most_common_vals', description: 'Most frequent values', example: '{pending,shipped,delivered}' },
      { name: 'most_common_freqs', description: 'Frequency of common values', example: '{0.45,0.35,0.15}' },
      { name: 'histogram_bounds', description: 'Distribution boundaries', example: '{10,50,100,500,1000}' },
    ],
    insight: 'This is HOW the planner estimates "WHERE status = \'pending\'" will return 45% of rows.',
  },
  pg_stat_user_tables: {
    name: 'pg_stat_user_tables',
    description: 'Runtime statistics - scans, tuple reads, modifications.',
    query: `SELECT relname, seq_scan, idx_scan,
       n_tup_ins, n_tup_upd, n_tup_del,
       n_dead_tup, last_analyze
FROM pg_stat_user_tables
WHERE relname = 'orders';`,
    columns: [
      { name: 'seq_scan', description: 'Number of sequential scans', example: '1,234' },
      { name: 'idx_scan', description: 'Number of index scans', example: '5,678,901' },
      { name: 'n_tup_ins', description: 'Rows inserted', example: '100,000' },
      { name: 'n_dead_tup', description: 'Dead tuples (need VACUUM)', example: '5,432' },
      { name: 'last_analyze', description: 'Last ANALYZE time', example: '2025-01-03 14:30:00' },
    ],
    insight: 'If seq_scan >> idx_scan on a large table, you probably need an index.',
  },
};

export function StatisticsExplorer() {
  const [activeView, setActiveView] = useState<StatView>('pg_class');
  const info = statViews[activeView];

  return (
    <div className="w-full">
      {/* View tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(Object.keys(statViews) as StatView[]).map((view) => (
          <button
            key={view}
            className="px-4 py-2 rounded-lg text-sm font-mono transition-all"
            style={{
              background: activeView === view ? colors.glow.healthy + '20' : 'transparent',
              color: activeView === view ? colors.glow.healthy : colors.text.muted,
              border: `1px solid ${activeView === view ? colors.glow.healthy : colors.text.muted}40`,
            }}
            onClick={() => setActiveView(view)}
          >
            {statViews[view].name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {/* Description */}
          <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
            {info.description}
          </p>

          {/* Query */}
          <div className="mb-4">
            <div className="text-xs font-mono mb-2" style={{ color: colors.text.muted }}>
              Query:
            </div>
            <pre
              className="p-4 rounded-lg text-sm font-mono overflow-x-auto"
              style={{ background: colors.oceanDark, color: colors.glow.healthy }}
            >
              {info.query}
            </pre>
          </div>

          {/* Columns */}
          <div
            className="p-4 rounded-xl mb-4"
            style={{
              background: colors.oceanLight,
              border: `1px solid ${colors.text.muted}30`,
            }}
          >
            <div className="text-xs font-mono mb-3" style={{ color: colors.text.muted }}>
              Key columns:
            </div>
            <div className="space-y-3">
              {info.columns.map((col) => (
                <div key={col.name} className="flex items-start gap-4">
                  <code
                    className="px-2 py-1 rounded text-xs flex-shrink-0"
                    style={{ background: colors.oceanDark, color: colors.glow.warning }}
                  >
                    {col.name}
                  </code>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      {col.description}
                    </p>
                    <p className="text-xs font-mono mt-1" style={{ color: colors.text.muted }}>
                      Example: {col.example}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insight */}
          <div
            className="p-4 rounded-lg"
            style={{
              background: colors.glow.healthy + '10',
              border: `1px solid ${colors.glow.healthy}30`,
            }}
          >
            <p className="text-sm" style={{ color: colors.glow.healthy }}>
              <strong>Key insight:</strong> {info.insight}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
