import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

type QueryScenario = 'good' | 'bad_seqscan' | 'bad_estimate';

interface ExplainLine {
  text: string;
  indent: number;
  highlight?: 'good' | 'warning' | 'critical';
  annotation?: string;
}

interface Scenario {
  name: string;
  query: string;
  explain: ExplainLine[];
  diagnosis: string;
  fix: string;
}

const scenarios: Record<QueryScenario, Scenario> = {
  good: {
    name: 'Good Query (Index Used)',
    query: `SELECT * FROM orders
WHERE user_id = 42
ORDER BY created_at DESC
LIMIT 10;`,
    explain: [
      {
        text: 'Limit  (cost=0.42..28.56 rows=10 width=120) (actual time=0.045..0.089 rows=10 loops=1)',
        indent: 0,
        highlight: 'good',
        annotation: 'Actual time: 0.089ms. Very fast!',
      },
      {
        text: '->  Index Scan using idx_orders_user_created on orders  (cost=0.42..156.23 rows=55 width=120)',
        indent: 1,
        highlight: 'good',
        annotation: 'Using index scan, not sequential scan',
      },
      {
        text: '     (actual time=0.043..0.082 rows=10 loops=1)',
        indent: 1,
      },
      {
        text: '     Index Cond: (user_id = 42)',
        indent: 2,
      },
      {
        text: 'Planning Time: 0.156 ms',
        indent: 0,
      },
      {
        text: 'Execution Time: 0.112 ms',
        indent: 0,
        highlight: 'good',
        annotation: 'Total: 0.112ms',
      },
    ],
    diagnosis: 'This query is well-optimized. The planner uses an index scan on idx_orders_user_created which covers both the WHERE clause (user_id) and the ORDER BY (created_at).',
    fix: 'No fix needed. This is what good performance looks like.',
  },
  bad_seqscan: {
    name: 'Sequential Scan (Missing Index)',
    query: `SELECT * FROM orders
WHERE status = 'pending'
ORDER BY created_at DESC;`,
    explain: [
      {
        text: 'Sort  (cost=89234.56..89456.78 rows=89000 width=120) (actual time=1245.678..1289.123 rows=87543 loops=1)',
        indent: 0,
        highlight: 'warning',
        annotation: 'Sort operation - expensive for large result sets',
      },
      {
        text: '  Sort Key: created_at DESC',
        indent: 1,
      },
      {
        text: '  Sort Method: external merge  Disk: 12456kB',
        indent: 1,
        highlight: 'critical',
        annotation: 'Spilling to disk! Not enough work_mem',
      },
      {
        text: '  ->  Seq Scan on orders  (cost=0.00..45678.00 rows=89000 width=120)',
        indent: 1,
        highlight: 'critical',
        annotation: 'Sequential scan on 1M row table!',
      },
      {
        text: '       (actual time=0.023..456.789 rows=87543 loops=1)',
        indent: 1,
      },
      {
        text: '       Filter: (status = \'pending\'::text)',
        indent: 2,
      },
      {
        text: '       Rows Removed by Filter: 912457',
        indent: 2,
        highlight: 'warning',
        annotation: 'Scanned 1M rows, kept only 87K',
      },
      {
        text: 'Planning Time: 0.234 ms',
        indent: 0,
      },
      {
        text: 'Execution Time: 1356.789 ms',
        indent: 0,
        highlight: 'critical',
        annotation: '1.3 seconds! Way too slow',
      },
    ],
    diagnosis: 'The planner chose a sequential scan because there\'s no index on the status column. It\'s scanning all 1M rows and filtering down to 87K, then sorting in memory (spilling to disk).',
    fix: 'CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC) WHERE status = \'pending\';',
  },
  bad_estimate: {
    name: 'Bad Row Estimate (Stale Statistics)',
    query: `SELECT * FROM products
WHERE category_id = 15
AND price < 100;`,
    explain: [
      {
        text: 'Nested Loop  (cost=0.56..234.67 rows=10 width=80) (actual time=0.045..567.890 rows=45678 loops=1)',
        indent: 0,
        highlight: 'critical',
        annotation: 'Estimated 10 rows, got 45,678! 4500x off',
      },
      {
        text: '  ->  Index Scan using idx_products_category on products  (cost=0.42..45.67 rows=10 width=80)',
        indent: 1,
        highlight: 'warning',
        annotation: 'Planner thought this would return ~10 rows',
      },
      {
        text: '       (actual time=0.034..234.567 rows=45678 loops=1)',
        indent: 1,
      },
      {
        text: '       Index Cond: (category_id = 15)',
        indent: 2,
      },
      {
        text: '       Filter: (price < 100)',
        indent: 2,
      },
      {
        text: '  ->  Index Scan using idx_inventory_product on inventory  (cost=0.14..18.90 rows=1 width=8)',
        indent: 1,
      },
      {
        text: '       (actual time=0.005..0.007 rows=1 loops=45678)',
        indent: 1,
        highlight: 'critical',
        annotation: '45,678 index lookups instead of expected 10',
      },
      {
        text: 'Planning Time: 0.345 ms',
        indent: 0,
      },
      {
        text: 'Execution Time: 678.901 ms',
        indent: 0,
        highlight: 'critical',
        annotation: 'Slow due to wrong join strategy',
      },
    ],
    diagnosis: 'The planner estimated 10 rows but got 45,678. This massive underestimate caused it to choose a Nested Loop join (good for small result sets) instead of a Hash Join (better for large result sets).',
    fix: 'ANALYZE products; -- Refresh statistics\n-- Or if category 15 is special:\nALTER TABLE products ALTER COLUMN category_id SET STATISTICS 1000;\nANALYZE products;',
  },
};

export function ExplainAnalyzeViewer() {
  const [activeScenario, setActiveScenario] = useState<QueryScenario>('good');
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const scenario = scenarios[activeScenario];

  const highlightColor = (type?: 'good' | 'warning' | 'critical') => {
    switch (type) {
      case 'good':
        return colors.glow.healthy;
      case 'warning':
        return colors.glow.warning;
      case 'critical':
        return colors.glow.critical;
      default:
        return colors.text.secondary;
    }
  };

  return (
    <div className="w-full">
      {/* Scenario tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(Object.keys(scenarios) as QueryScenario[]).map((key) => (
          <button
            key={key}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeScenario === key ? colors.glow.healthy + '20' : 'transparent',
              color: activeScenario === key ? colors.glow.healthy : colors.text.muted,
              border: `1px solid ${activeScenario === key ? colors.glow.healthy : colors.text.muted}40`,
            }}
            onClick={() => setActiveScenario(key)}
          >
            {scenarios[key].name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeScenario}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {/* Query */}
          <div className="mb-4">
            <div className="text-xs font-mono mb-2" style={{ color: colors.text.muted }}>
              Query:
            </div>
            <pre
              className="p-4 rounded-lg text-sm font-mono overflow-x-auto"
              style={{ background: colors.oceanDark, color: colors.glow.healthy }}
            >
              {scenario.query}
            </pre>
          </div>

          {/* EXPLAIN ANALYZE output */}
          <div
            className="p-4 rounded-xl mb-4"
            style={{
              background: colors.oceanLight,
              border: `1px solid ${colors.text.muted}30`,
            }}
          >
            <div className="text-xs font-mono mb-3" style={{ color: colors.text.muted }}>
              EXPLAIN ANALYZE output:
            </div>
            <div className="space-y-1 font-mono text-sm">
              {scenario.explain.map((line, i) => (
                <div
                  key={i}
                  className="relative group cursor-pointer"
                  onMouseEnter={() => setHoveredLine(i)}
                  onMouseLeave={() => setHoveredLine(null)}
                >
                  <div
                    className="px-2 py-1 rounded transition-colors"
                    style={{
                      paddingLeft: `${line.indent * 20 + 8}px`,
                      background: hoveredLine === i && line.annotation ? colors.oceanDark : 'transparent',
                      color: highlightColor(line.highlight),
                    }}
                  >
                    {line.text}
                    {line.highlight && (
                      <span
                        className="inline-block w-2 h-2 rounded-full ml-2"
                        style={{ background: highlightColor(line.highlight) }}
                      />
                    )}
                  </div>

                  {/* Annotation tooltip */}
                  <AnimatePresence>
                    {hoveredLine === i && line.annotation && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="absolute left-full top-0 ml-4 px-3 py-2 rounded-lg text-xs whitespace-nowrap z-10"
                        style={{
                          background: colors.oceanDark,
                          border: `1px solid ${highlightColor(line.highlight)}40`,
                          color: highlightColor(line.highlight),
                        }}
                      >
                        {line.annotation}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnosis */}
          <div className="grid md:grid-cols-2 gap-4">
            <div
              className="p-4 rounded-xl"
              style={{
                background: colors.oceanLight,
                border: `1px solid ${colors.glow.warning}30`,
              }}
            >
              <h5 className="text-sm font-semibold mb-2" style={{ color: colors.glow.warning }}>
                Diagnosis
              </h5>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {scenario.diagnosis}
              </p>
            </div>

            <div
              className="p-4 rounded-xl"
              style={{
                background: colors.oceanLight,
                border: `1px solid ${colors.glow.healthy}30`,
              }}
            >
              <h5 className="text-sm font-semibold mb-2" style={{ color: colors.glow.healthy }}>
                Fix
              </h5>
              <pre
                className="text-xs font-mono overflow-x-auto p-2 rounded"
                style={{ background: colors.oceanDark, color: colors.glow.healthy }}
              >
                {scenario.fix}
              </pre>
            </div>
          </div>

          {/* Key metrics to watch */}
          <div
            className="mt-4 p-4 rounded-xl"
            style={{
              background: colors.oceanDark,
              border: `1px solid ${colors.text.muted}20`,
            }}
          >
            <h5 className="text-sm font-semibold mb-3" style={{ color: colors.text.primary }}>
              Key Metrics to Watch
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="font-mono mb-1" style={{ color: colors.glow.critical }}>
                  rows= vs actual rows=
                </div>
                <p style={{ color: colors.text.muted }}>
                  If actual is 10x+ different, run ANALYZE
                </p>
              </div>
              <div>
                <div className="font-mono mb-1" style={{ color: colors.glow.warning }}>
                  Seq Scan
                </div>
                <p style={{ color: colors.text.muted }}>
                  On large tables, usually means missing index
                </p>
              </div>
              <div>
                <div className="font-mono mb-1" style={{ color: colors.glow.healthy }}>
                  Buffers: shared hit
                </div>
                <p style={{ color: colors.text.muted }}>
                  Good! Data was in cache
                </p>
              </div>
              <div>
                <div className="font-mono mb-1" style={{ color: colors.glow.critical }}>
                  Buffers: shared read
                </div>
                <p style={{ color: colors.text.muted }}>
                  Had to read from disk
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
