import { useState } from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

interface LockType {
  name: string;
  shortName: string;
  metaphor: string;
  color: string;
  examples: string[];
  blockedBy: string[];
  description: string;
}

const LOCK_TYPES: LockType[] = [
  {
    name: 'AccessShareLock',
    shortName: 'AS',
    metaphor: 'Observer',
    color: colors.glow.healthy,
    examples: ['SELECT', 'COPY TO'],
    blockedBy: ['AccessExclusiveLock'],
    description: 'The gentlest lock. Multiple readers can hold this simultaneously.',
  },
  {
    name: 'RowShareLock',
    shortName: 'RS',
    metaphor: 'Careful Reader',
    color: '#4dd4ac',
    examples: ['SELECT FOR UPDATE', 'SELECT FOR SHARE'],
    blockedBy: ['ExclusiveLock', 'AccessExclusiveLock'],
    description: 'For reads that plan to update. Blocks strong exclusive locks.',
  },
  {
    name: 'RowExclusiveLock',
    shortName: 'RX',
    metaphor: 'Writer',
    color: colors.glow.warning,
    examples: ['INSERT', 'UPDATE', 'DELETE'],
    blockedBy: ['ShareLock', 'ShareRowExclusiveLock', 'ExclusiveLock', 'AccessExclusiveLock'],
    description: 'The standard write lock. Coexists with other writers on different rows.',
  },
  {
    name: 'ShareLock',
    shortName: 'S',
    metaphor: 'Schema Reader',
    color: '#a78bfa',
    examples: ['CREATE INDEX (non-concurrent)'],
    blockedBy: ['RowExclusiveLock', 'ShareRowExclusiveLock', 'ExclusiveLock', 'AccessExclusiveLock'],
    description: 'Allows concurrent reads but blocks writes.',
  },
  {
    name: 'AccessExclusiveLock',
    shortName: 'AX',
    metaphor: 'Total Control',
    color: colors.glow.critical,
    examples: ['ALTER TABLE', 'DROP TABLE', 'TRUNCATE', 'VACUUM FULL'],
    blockedBy: ['Everything'],
    description: 'The nuclear option. Blocks ALL other locks. Use with extreme caution.',
  },
];

export function LockTypeMatrix() {
  const [selectedLock, setSelectedLock] = useState<LockType | null>(null);
  const [hoveredLock, setHoveredLock] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Lock type cards */}
      <div className="space-y-4">
        {LOCK_TYPES.map((lock, index) => {
          const isSelected = selectedLock?.name === lock.name;
          const isHovered = hoveredLock === lock.name;

          return (
            <motion.div
              key={lock.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl cursor-pointer relative overflow-hidden"
              style={{
                background: colors.oceanLight,
                border: `2px solid ${isSelected || isHovered ? lock.color : lock.color + '30'}`,
                boxShadow: isSelected ? `0 0 20px ${lock.color}30` : 'none',
              }}
              onClick={() => setSelectedLock(isSelected ? null : lock)}
              onMouseEnter={() => setHoveredLock(lock.name)}
              onMouseLeave={() => setHoveredLock(null)}
            >
              {/* Color indicator */}
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ background: lock.color }}
              />

              <div className="flex items-center gap-4 pl-3">
                {/* Badge */}
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center font-mono text-sm font-bold"
                  style={{
                    background: lock.color + '20',
                    color: lock.color,
                  }}
                >
                  {lock.shortName}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className="font-mono text-sm"
                      style={{ color: colors.text.primary }}
                    >
                      {lock.name}
                    </h4>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: lock.color + '20',
                        color: lock.color,
                      }}
                    >
                      {lock.metaphor}
                    </span>
                  </div>
                  <p
                    className="text-xs mt-1"
                    style={{ color: colors.text.muted }}
                  >
                    {lock.examples.join(', ')}
                  </p>
                </div>

                {/* Expand indicator */}
                <motion.div
                  animate={{ rotate: isSelected ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ color: colors.text.muted }}
                >
                  ▼
                </motion.div>
              </div>

              {/* Expanded details */}
              <motion.div
                initial={false}
                animate={{
                  height: isSelected ? 'auto' : 0,
                  opacity: isSelected ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 pl-3 mt-4 border-t" style={{ borderColor: lock.color + '20' }}>
                  <p className="text-sm mb-3" style={{ color: colors.text.secondary }}>
                    {lock.description}
                  </p>
                  <div>
                    <p className="text-xs font-mono mb-2" style={{ color: colors.text.muted }}>
                      Blocked by:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {lock.blockedBy.map((blocker) => (
                        <span
                          key={blocker}
                          className="text-xs px-2 py-1 rounded font-mono"
                          style={{
                            background: colors.glow.critical + '20',
                            color: colors.glow.critical,
                          }}
                        >
                          {blocker}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Conflict visualization */}
      <div
        className="rounded-xl p-6 lg:sticky lg:top-8"
        style={{
          background: colors.oceanDark,
          border: `1px solid ${colors.text.muted}20`,
        }}
      >
        <h3
          className="font-mono text-sm uppercase tracking-wider mb-6"
          style={{ color: colors.text.muted }}
        >
          Lock Strength Hierarchy
        </h3>

        {/* Visual hierarchy */}
        <div className="relative">
          {LOCK_TYPES.map((lock, index) => {
            const width = 100 - index * 15;
            const isSelected = selectedLock?.name === lock.name;

            return (
              <motion.div
                key={lock.name}
                className="relative mb-3"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                style={{ originX: 0 }}
              >
                <motion.div
                  className="h-10 rounded-lg flex items-center px-4 cursor-pointer"
                  style={{
                    width: `${width}%`,
                    background: `linear-gradient(90deg, ${lock.color}30 0%, ${lock.color}10 100%)`,
                    border: `2px solid ${isSelected ? lock.color : lock.color + '40'}`,
                    boxShadow: isSelected ? `0 0 15px ${lock.color}40` : 'none',
                  }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedLock(lock)}
                >
                  <span
                    className="font-mono text-xs font-medium"
                    style={{ color: lock.color }}
                  >
                    {lock.shortName}
                  </span>
                  <span
                    className="ml-2 text-xs hidden sm:inline"
                    style={{ color: colors.text.secondary }}
                  >
                    {lock.metaphor}
                  </span>
                </motion.div>

                {/* Arrow showing increasing strength */}
                {index < LOCK_TYPES.length - 1 && (
                  <div
                    className="absolute -bottom-2 left-4 text-xs"
                    style={{ color: colors.text.muted }}
                  >
                    ↓
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div
          className="mt-8 p-4 rounded-lg"
          style={{ background: colors.oceanLight }}
        >
          <p className="text-xs mb-3" style={{ color: colors.text.muted }}>
            Stronger locks block more operations:
          </p>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ background: colors.glow.healthy }}
              />
              <span style={{ color: colors.text.secondary }}>Weak (coexists)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ background: colors.glow.warning }}
              />
              <span style={{ color: colors.text.secondary }}>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ background: colors.glow.critical }}
              />
              <span style={{ color: colors.text.secondary }}>Strong (blocks all)</span>
            </div>
          </div>
        </div>

        {/* Key insight */}
        <div
          className="mt-4 p-3 rounded-lg text-xs"
          style={{
            background: colors.glow.critical + '10',
            border: `1px solid ${colors.glow.critical}30`,
            color: colors.text.secondary,
          }}
        >
          <strong style={{ color: colors.glow.critical }}>Key insight:</strong>{' '}
          AccessExclusiveLock (used by ALTER TABLE) conflicts with everything—even
          simple SELECTs. That's why DDL is dangerous in production.
        </div>
      </div>
    </div>
  );
}
