import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface VacuumVariant {
  id: string;
  name: string;
  command: string;
  description: string;
  locks: string;
  lockSeverity: 'none' | 'warning' | 'critical';
  useCase: string;
  warning?: string;
  isExtension?: boolean;
}

const VARIANTS: VacuumVariant[] = [
  {
    id: 'vacuum',
    name: 'VACUUM',
    command: 'VACUUM table_name;',
    description: 'Marks dead tuple space as reusable. Does not return space to OS.',
    locks: 'None (concurrent reads/writes OK)',
    lockSeverity: 'none',
    useCase: 'Regular maintenance. Run frequently.',
  },
  {
    id: 'vacuum-full',
    name: 'VACUUM FULL',
    command: 'VACUUM FULL table_name;',
    description: 'Rewrites entire table, compacting and returning space to OS.',
    locks: 'AccessExclusiveLock (blocks everything)',
    lockSeverity: 'critical',
    useCase: 'When you absolutely need to reclaim disk space.',
    warning: 'Blocks all queries! Use only during maintenance windows.',
  },
  {
    id: 'vacuum-analyze',
    name: 'VACUUM ANALYZE',
    command: 'VACUUM ANALYZE table_name;',
    description: 'VACUUM + updates table statistics for query planner.',
    locks: 'None (concurrent reads/writes OK)',
    lockSeverity: 'none',
    useCase: 'After bulk data loads or major updates.',
  },
  {
    id: 'pg-repack',
    name: 'pg_repack',
    command: 'pg_repack -t table_name',
    description: 'Rebuilds table online without blocking. Like VACUUM FULL but safe.',
    locks: 'Brief lock at end only',
    lockSeverity: 'warning',
    useCase: 'When you need VACUUM FULL behavior without downtime.',
    isExtension: true,
  },
];

function MiniAnimation({ variant }: { variant: VacuumVariant }) {
  const [phase, setPhase] = useState<'before' | 'during' | 'after'>('before');

  const animate = () => {
    setPhase('during');
    setTimeout(() => setPhase('after'), 1500);
    setTimeout(() => setPhase('before'), 3000);
  };

  if (variant.id === 'vacuum') {
    return (
      <div className="relative h-16 flex items-center justify-center gap-2" onClick={animate}>
        {/* Dead tuples becoming available space */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-8 h-8 rounded flex items-center justify-center text-xs font-mono"
            style={{
              background: phase === 'after' ? `${colors.glow.healthy}20` : '#4a4a6a',
              border: `2px solid ${phase === 'after' ? colors.glow.healthy : '#6b6b8a'}`,
              color: phase === 'after' ? colors.glow.healthy : '#6b6b8a',
            }}
            animate={{
              scale: phase === 'during' ? [1, 0.8, 1] : 1,
              opacity: phase === 'during' ? [1, 0.5, 1] : 1,
            }}
            transition={{ delay: i * 0.2 }}
          >
            {phase === 'after' ? '∅' : '✗'}
          </motion.div>
        ))}
        <span
          className="absolute -bottom-1 text-xs"
          style={{ color: phase === 'after' ? colors.glow.healthy : colors.text.muted }}
        >
          {phase === 'after' ? 'Space reusable' : 'Click to run'}
        </span>
      </div>
    );
  }

  if (variant.id === 'vacuum-full') {
    return (
      <div className="relative h-16 flex items-center justify-center" onClick={animate}>
        {/* Table shrinking */}
        <motion.div
          className="flex items-center justify-center rounded"
          style={{
            background: colors.oceanLight,
            border: `2px solid ${phase === 'during' ? colors.glow.critical : colors.text.muted}`,
            boxShadow: phase === 'during' ? `0 0 20px ${colors.glow.critical}40` : 'none',
          }}
          animate={{
            width: phase === 'after' ? 60 : 120,
            height: 40,
          }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xs font-mono" style={{ color: colors.text.muted }}>
            {phase === 'during' ? '🔒' : 'users'}
          </span>
        </motion.div>
        <span
          className="absolute -bottom-1 text-xs"
          style={{ color: phase === 'during' ? colors.glow.critical : colors.text.muted }}
        >
          {phase === 'during' ? 'BLOCKING!' : phase === 'after' ? 'Compacted' : 'Click to run'}
        </span>
      </div>
    );
  }

  if (variant.id === 'vacuum-analyze') {
    return (
      <div className="relative h-16 flex items-center justify-center gap-4" onClick={animate}>
        {/* VACUUM + Stats */}
        <motion.div
          className="w-10 h-10 rounded flex items-center justify-center"
          style={{
            background: phase === 'after' ? `${colors.glow.healthy}20` : colors.oceanLight,
            border: `2px solid ${phase === 'after' ? colors.glow.healthy : colors.text.muted}`,
          }}
          animate={{ scale: phase === 'during' ? [1, 1.1, 1] : 1 }}
        >
          <span className="text-lg">🧹</span>
        </motion.div>
        <motion.div
          className="text-lg"
          animate={{ opacity: phase === 'during' ? [1, 0.5, 1] : 1 }}
        >
          +
        </motion.div>
        <motion.div
          className="w-10 h-10 rounded flex items-center justify-center"
          style={{
            background: phase === 'after' ? `${colors.glow.healthy}20` : colors.oceanLight,
            border: `2px solid ${phase === 'after' ? colors.glow.healthy : colors.text.muted}`,
          }}
          animate={{ scale: phase === 'during' ? [1, 1.1, 1] : 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-lg">📊</span>
        </motion.div>
        <span className="absolute -bottom-1 text-xs" style={{ color: colors.text.muted }}>
          {phase === 'after' ? 'Stats updated' : 'Click to run'}
        </span>
      </div>
    );
  }

  // pg_repack
  return (
    <div className="relative h-16 flex items-center justify-center gap-2" onClick={animate}>
      {/* Online rebuild */}
      <motion.div
        className="w-12 h-10 rounded flex items-center justify-center"
        style={{
          background: colors.oceanLight,
          border: `2px solid ${colors.text.muted}`,
        }}
      >
        <span className="text-xs font-mono" style={{ color: colors.text.muted }}>old</span>
      </motion.div>
      <motion.div
        className="text-lg"
        animate={{ x: phase === 'during' ? [0, 5, 0] : 0 }}
        transition={{ repeat: Infinity, duration: 0.3 }}
      >
        →
      </motion.div>
      <motion.div
        className="rounded flex items-center justify-center"
        style={{
          background: phase === 'after' ? `${colors.glow.healthy}20` : colors.oceanDark,
          border: `2px solid ${phase === 'after' ? colors.glow.healthy : colors.text.muted}`,
        }}
        animate={{
          width: phase === 'during' || phase === 'after' ? 60 : 48,
          height: 40,
        }}
      >
        <span className="text-xs font-mono" style={{ color: phase === 'after' ? colors.glow.healthy : colors.text.muted }}>
          {phase === 'after' ? 'new ✓' : 'new'}
        </span>
      </motion.div>
      <span className="absolute -bottom-1 text-xs" style={{ color: colors.text.muted }}>
        {phase === 'during' ? 'Copying...' : phase === 'after' ? 'No downtime!' : 'Click to run'}
      </span>
    </div>
  );
}

function VariantCard({ variant, isExpanded, onToggle }: {
  variant: VacuumVariant;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      className="rounded-xl overflow-hidden cursor-pointer"
      style={{
        background: colors.oceanDark,
        border: `1px solid ${
          variant.lockSeverity === 'critical'
            ? colors.glow.critical
            : variant.lockSeverity === 'warning'
            ? colors.glow.warning
            : colors.glow.healthy
        }30`,
      }}
      onClick={onToggle}
      whileHover={{ scale: 1.02 }}
      layout
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              background:
                variant.lockSeverity === 'critical'
                  ? colors.glow.critical
                  : variant.lockSeverity === 'warning'
                  ? colors.glow.warning
                  : colors.glow.healthy,
            }}
          />
          <h3 className="font-mono font-bold" style={{ color: colors.text.primary }}>
            {variant.name}
          </h3>
          {variant.isExtension && (
            <span
              className="px-2 py-0.5 rounded text-xs"
              style={{ background: '#a78bfa30', color: '#a78bfa' }}
            >
              Extension
            </span>
          )}
        </div>
        <motion.span
          style={{ color: colors.text.muted }}
          animate={{ rotate: isExpanded ? 180 : 0 }}
        >
          ▼
        </motion.span>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Animation */}
            <div className="p-4" style={{ background: colors.oceanLight }}>
              <MiniAnimation variant={variant} />
            </div>

            {/* Details */}
            <div className="p-4 space-y-3">
              {/* Command */}
              <code
                className="block p-2 rounded text-sm font-mono"
                style={{ background: colors.ocean, color: colors.glow.healthy }}
              >
                {variant.command}
              </code>

              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {variant.description}
              </p>

              {/* Locks */}
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase" style={{ color: colors.text.muted }}>
                  Locks:
                </span>
                <span
                  className="text-sm"
                  style={{
                    color:
                      variant.lockSeverity === 'critical'
                        ? colors.glow.critical
                        : variant.lockSeverity === 'warning'
                        ? colors.glow.warning
                        : colors.glow.healthy,
                  }}
                >
                  {variant.locks}
                </span>
              </div>

              {/* Use case */}
              <div>
                <span className="text-xs uppercase" style={{ color: colors.text.muted }}>
                  Use when:
                </span>
                <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                  {variant.useCase}
                </p>
              </div>

              {/* Warning */}
              {variant.warning && (
                <div
                  className="p-3 rounded-lg"
                  style={{ background: `${colors.glow.critical}10`, border: `1px solid ${colors.glow.critical}40` }}
                >
                  <p className="text-sm" style={{ color: colors.glow.critical }}>
                    ⚠️ {variant.warning}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function VacuumSpectrum() {
  const [expandedId, setExpandedId] = useState<string | null>('vacuum');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {VARIANTS.map((variant) => (
        <VariantCard
          key={variant.id}
          variant={variant}
          isExpanded={expandedId === variant.id}
          onToggle={() => setExpandedId(expandedId === variant.id ? null : variant.id)}
        />
      ))}
    </div>
  );
}
