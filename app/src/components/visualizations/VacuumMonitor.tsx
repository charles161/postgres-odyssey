import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface TableStats {
  id: string;
  relname: string;
  n_live_tup: number;
  n_dead_tup: number;
  last_autovacuum: string | null;
  autovacuum_count: number;
  bloatRatio: number;
  health: 'healthy' | 'warning' | 'critical';
}

// Simulated table stats
const SAMPLE_TABLES: TableStats[] = [
  {
    id: '1',
    relname: 'users',
    n_live_tup: 1250000,
    n_dead_tup: 45000,
    last_autovacuum: '2 hours ago',
    autovacuum_count: 342,
    bloatRatio: 3.6,
    health: 'healthy',
  },
  {
    id: '2',
    relname: 'orders',
    n_live_tup: 8750000,
    n_dead_tup: 2150000,
    last_autovacuum: '6 hours ago',
    autovacuum_count: 89,
    bloatRatio: 24.6,
    health: 'warning',
  },
  {
    id: '3',
    relname: 'sessions',
    n_live_tup: 450000,
    n_dead_tup: 890000,
    last_autovacuum: '3 days ago',
    autovacuum_count: 12,
    bloatRatio: 197.8,
    health: 'critical',
  },
  {
    id: '4',
    relname: 'products',
    n_live_tup: 15000,
    n_dead_tup: 200,
    last_autovacuum: '1 day ago',
    autovacuum_count: 156,
    bloatRatio: 1.3,
    health: 'healthy',
  },
  {
    id: '5',
    relname: 'audit_logs',
    n_live_tup: 25000000,
    n_dead_tup: 4500000,
    last_autovacuum: '12 hours ago',
    autovacuum_count: 45,
    bloatRatio: 18.0,
    health: 'warning',
  },
];

const MONITORING_QUERY = `SELECT
  relname,
  n_dead_tup,
  n_live_tup,
  last_autovacuum,
  autovacuum_count
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;`;

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function HealthIndicator({ health }: { health: TableStats['health'] }) {
  const colorMap = {
    healthy: colors.glow.healthy,
    warning: colors.glow.warning,
    critical: colors.glow.critical,
  };

  return (
    <motion.div
      className="w-3 h-3 rounded-full"
      style={{ background: colorMap[health] }}
      animate={
        health === 'critical'
          ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }
          : health === 'warning'
          ? { opacity: [0.8, 1, 0.8] }
          : {}
      }
      transition={{ duration: 1, repeat: Infinity }}
    />
  );
}

function TableRow({
  table,
  isSelected,
  onSelect,
}: {
  table: TableStats;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.tr
      className="cursor-pointer transition-colors"
      style={{
        background: isSelected ? `${colors.glow.healthy}10` : 'transparent',
      }}
      whileHover={{ background: `${colors.text.muted}10` }}
      onClick={onSelect}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <HealthIndicator health={table.health} />
          <span className="font-mono" style={{ color: colors.text.primary }}>
            {table.relname}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-right" style={{ color: colors.glow.healthy }}>
        {formatNumber(table.n_live_tup)}
      </td>
      <td
        className="px-4 py-3 font-mono text-right"
        style={{
          color:
            table.health === 'critical'
              ? colors.glow.critical
              : table.health === 'warning'
              ? colors.glow.warning
              : colors.text.muted,
        }}
      >
        {formatNumber(table.n_dead_tup)}
      </td>
      <td
        className="px-4 py-3 text-sm text-right"
        style={{
          color: table.last_autovacuum?.includes('day') ? colors.glow.warning : colors.text.muted,
        }}
      >
        {table.last_autovacuum || 'Never'}
      </td>
      <td className="px-4 py-3 font-mono text-right" style={{ color: colors.text.muted }}>
        {table.autovacuum_count}
      </td>
    </motion.tr>
  );
}

function TableDetail({ table }: { table: TableStats }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-6 rounded-xl"
      style={{ background: colors.oceanDark, border: `1px solid ${colors.text.muted}30` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <HealthIndicator health={table.health} />
        <h3 className="font-mono text-xl font-bold" style={{ color: colors.text.primary }}>
          {table.relname}
        </h3>
        <span
          className="px-2 py-0.5 rounded text-xs uppercase"
          style={{
            background:
              table.health === 'critical'
                ? `${colors.glow.critical}20`
                : table.health === 'warning'
                ? `${colors.glow.warning}20`
                : `${colors.glow.healthy}20`,
            color:
              table.health === 'critical'
                ? colors.glow.critical
                : table.health === 'warning'
                ? colors.glow.warning
                : colors.glow.healthy,
          }}
        >
          {table.health}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Live tuples */}
        <div className="p-4 rounded-lg" style={{ background: colors.ocean }}>
          <p className="text-xs uppercase mb-1" style={{ color: colors.text.muted }}>
            Live Tuples
          </p>
          <p className="font-mono text-2xl" style={{ color: colors.glow.healthy }}>
            {formatNumber(table.n_live_tup)}
          </p>
        </div>

        {/* Dead tuples */}
        <div className="p-4 rounded-lg" style={{ background: colors.ocean }}>
          <p className="text-xs uppercase mb-1" style={{ color: colors.text.muted }}>
            Dead Tuples
          </p>
          <p
            className="font-mono text-2xl"
            style={{
              color:
                table.health === 'critical'
                  ? colors.glow.critical
                  : table.health === 'warning'
                  ? colors.glow.warning
                  : colors.text.secondary,
            }}
          >
            {formatNumber(table.n_dead_tup)}
          </p>
        </div>

        {/* Bloat ratio */}
        <div className="p-4 rounded-lg" style={{ background: colors.ocean }}>
          <p className="text-xs uppercase mb-1" style={{ color: colors.text.muted }}>
            Bloat Ratio
          </p>
          <p
            className="font-mono text-2xl"
            style={{
              color:
                table.bloatRatio > 50
                  ? colors.glow.critical
                  : table.bloatRatio > 10
                  ? colors.glow.warning
                  : colors.text.secondary,
            }}
          >
            {table.bloatRatio.toFixed(1)}%
          </p>
        </div>

        {/* Autovacuum runs */}
        <div className="p-4 rounded-lg" style={{ background: colors.ocean }}>
          <p className="text-xs uppercase mb-1" style={{ color: colors.text.muted }}>
            Autovacuum Runs
          </p>
          <p
            className="font-mono text-2xl"
            style={{
              color: table.autovacuum_count === 0 ? colors.glow.critical : colors.text.secondary,
            }}
          >
            {table.autovacuum_count}
          </p>
        </div>
      </div>

      {/* Bloat bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1" style={{ color: colors.text.muted }}>
          <span>Dead vs Live ratio</span>
          <span>{((table.n_dead_tup / (table.n_live_tup + table.n_dead_tup)) * 100).toFixed(1)}% dead</span>
        </div>
        <div className="h-4 rounded-full overflow-hidden flex" style={{ background: colors.ocean }}>
          <motion.div
            className="h-full"
            style={{ background: colors.glow.healthy }}
            initial={{ width: 0 }}
            animate={{
              width: `${(table.n_live_tup / (table.n_live_tup + table.n_dead_tup)) * 100}%`,
            }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
          <motion.div
            className="h-full"
            style={{
              background:
                table.health === 'critical'
                  ? colors.glow.critical
                  : table.health === 'warning'
                  ? colors.glow.warning
                  : colors.text.muted,
            }}
            initial={{ width: 0 }}
            animate={{
              width: `${(table.n_dead_tup / (table.n_live_tup + table.n_dead_tup)) * 100}%`,
            }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        </div>
      </div>

      {/* Recommendation */}
      {table.health !== 'healthy' && (
        <div
          className="mt-4 p-4 rounded-lg"
          style={{
            background:
              table.health === 'critical' ? `${colors.glow.critical}10` : `${colors.glow.warning}10`,
            border: `1px solid ${
              table.health === 'critical' ? colors.glow.critical : colors.glow.warning
            }20`,
          }}
        >
          <p
            className="text-sm"
            style={{
              color: table.health === 'critical' ? colors.glow.critical : colors.glow.warning,
            }}
          >
            {table.health === 'critical' ? (
              <>
                <strong>Critical:</strong> Dead tuples exceed live tuples. Run{' '}
                <code className="px-1 rounded" style={{ background: colors.ocean }}>
                  VACUUM ANALYZE {table.relname};
                </code>{' '}
                immediately and check autovacuum settings.
              </>
            ) : (
              <>
                <strong>Warning:</strong> High dead tuple ratio. Consider tuning autovacuum_vacuum_scale_factor for this table.
              </>
            )}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export function VacuumMonitor() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selected = SAMPLE_TABLES.find((t) => t.id === selectedTable);

  const copyQuery = async () => {
    try {
      await navigator.clipboard.writeText(MONITORING_QUERY);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* The key query */}
      <div
        className="p-4 rounded-xl"
        style={{ background: colors.oceanDark, border: `1px solid ${colors.glow.healthy}30` }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
            The monitoring query you need to know:
          </p>
          <motion.button
            className="px-3 py-1 rounded text-sm font-medium"
            style={{
              background: copied ? colors.glow.healthy : colors.oceanLight,
              color: copied ? colors.oceanDark : colors.text.secondary,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={copyQuery}
          >
            {copied ? 'Copied!' : 'Copy'}
          </motion.button>
        </div>
        <pre
          className="p-4 rounded-lg overflow-x-auto text-sm font-mono"
          style={{ background: colors.ocean, color: colors.glow.healthy }}
        >
          {MONITORING_QUERY}
        </pre>
      </div>

      {/* Dashboard header */}
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-lg" style={{ color: colors.text.primary }}>
          pg_stat_user_tables
        </h3>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: colors.glow.healthy }} />
            <span style={{ color: colors.text.muted }}>Healthy</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: colors.glow.warning }} />
            <span style={{ color: colors.text.muted }}>Warning (10%+ dead)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: colors.glow.critical }} />
            <span style={{ color: colors.text.muted }}>Critical (50%+ dead)</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: colors.oceanDark, border: `1px solid ${colors.text.muted}30` }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.text.muted}20` }}>
              <th
                className="px-4 py-3 text-left text-xs uppercase"
                style={{ color: colors.text.muted }}
              >
                Table
              </th>
              <th
                className="px-4 py-3 text-right text-xs uppercase"
                style={{ color: colors.text.muted }}
              >
                n_live_tup
              </th>
              <th
                className="px-4 py-3 text-right text-xs uppercase"
                style={{ color: colors.text.muted }}
              >
                n_dead_tup
              </th>
              <th
                className="px-4 py-3 text-right text-xs uppercase"
                style={{ color: colors.text.muted }}
              >
                last_autovacuum
              </th>
              <th
                className="px-4 py-3 text-right text-xs uppercase"
                style={{ color: colors.text.muted }}
              >
                autovacuum_count
              </th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_TABLES.map((table) => (
              <TableRow
                key={table.id}
                table={table}
                isSelected={selectedTable === table.id}
                onSelect={() => setSelectedTable(selectedTable === table.id ? null : table.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected table detail */}
      <AnimatePresence mode="wait">
        {selected && <TableDetail key={selected.id} table={selected} />}
      </AnimatePresence>

      {/* Insight */}
      <div
        className="p-4 rounded-lg text-center"
        style={{ background: colors.oceanDark, border: `1px solid ${colors.text.muted}20` }}
      >
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          Click any table above to see detailed breakdown. In production, run this query regularly and alert when{' '}
          <code className="px-1 rounded" style={{ background: colors.ocean }}>n_dead_tup</code> exceeds 10% of{' '}
          <code className="px-1 rounded" style={{ background: colors.ocean }}>n_live_tup</code>.
        </p>
      </div>
    </div>
  );
}
