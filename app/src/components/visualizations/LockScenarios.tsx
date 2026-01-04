import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface Scenario {
  id: string;
  title: string;
  story: string;
  lockType: string;
  lockColor: string;
  blocks: string[];
  allowsConcurrent: string[];
  realWorld: string;
  animation: 'dashboard' | 'booking' | 'checkout' | 'migration' | 'index';
}

const SCENARIOS: Scenario[] = [
  {
    id: 'dashboard',
    title: 'The Dashboard',
    story: '100 users load their analytics dashboards simultaneously. Each runs a SELECT query.',
    lockType: 'AccessShareLock',
    lockColor: colors.glow.healthy,
    blocks: ['Schema changes (DROP, ALTER)'],
    allowsConcurrent: ['Other SELECTs', 'INSERTs', 'UPDATEs', 'DELETEs'],
    realWorld: 'SELECT * FROM orders WHERE user_id = 123',
    animation: 'dashboard',
  },
  {
    id: 'booking',
    title: 'The Concert Ticket',
    story: 'Two users click "Book Now" on the last available seat at the exact same moment.',
    lockType: 'RowExclusiveLock + FOR UPDATE',
    lockColor: colors.glow.warning,
    blocks: ['Other FOR UPDATE on same row'],
    allowsConcurrent: ['SELECTs (they see old data)', 'Changes to other rows'],
    realWorld: 'SELECT * FROM seats WHERE id = 42 FOR UPDATE',
    animation: 'booking',
  },
  {
    id: 'checkout',
    title: 'The Checkout',
    story: 'A customer completes purchase. You need to: create order, update inventory, charge payment.',
    lockType: 'RowExclusiveLock',
    lockColor: colors.glow.warning,
    blocks: ['Nothing at table level (row-level only)'],
    allowsConcurrent: ['SELECTs', 'Changes to other rows', 'INSERTs'],
    realWorld: 'UPDATE inventory SET stock = stock - 1 WHERE product_id = 99',
    animation: 'checkout',
  },
  {
    id: 'migration',
    title: 'The Migration',
    story: 'Deploy adds a NOT NULL column. ALTER TABLE runs during peak traffic. Everything freezes.',
    lockType: 'AccessExclusiveLock',
    lockColor: colors.glow.critical,
    blocks: ['EVERYTHING - all queries wait'],
    allowsConcurrent: ['Nothing. The table is completely locked.'],
    realWorld: 'ALTER TABLE users ADD COLUMN verified BOOLEAN NOT NULL DEFAULT false',
    animation: 'migration',
  },
  {
    id: 'index',
    title: 'The Smart DBA',
    story: 'Need to add an index on a 10M row table. Regular CREATE INDEX would block all writes.',
    lockType: 'ShareUpdateExclusiveLock',
    lockColor: '#a78bfa',
    blocks: ['Other schema changes', 'VACUUM'],
    allowsConcurrent: ['SELECTs', 'INSERTs', 'UPDATEs', 'DELETEs'],
    realWorld: 'CREATE INDEX CONCURRENTLY idx_email ON users(email)',
    animation: 'index',
  },
];

// Mini animations for each scenario
function DashboardAnimation({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative h-32 flex items-center justify-center gap-2">
      {/* Multiple SELECT queries coexisting happily */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0.3, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <motion.div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
            style={{
              background: colors.glow.healthy + '30',
              border: `2px solid ${colors.glow.healthy}`,
            }}
            animate={isActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ delay: i * 0.2, duration: 0.5, repeat: isActive ? Infinity : 0, repeatDelay: 1 }}
          >
            👤
          </motion.div>
          <span className="text-xs font-mono" style={{ color: colors.glow.healthy }}>
            SELECT
          </span>
        </motion.div>
      ))}

      {/* Central table - peaceful */}
      <motion.div
        className="absolute -bottom-2 w-full h-2 rounded"
        style={{ background: colors.glow.healthy + '40' }}
        animate={isActive ? { opacity: [0.4, 0.8, 0.4] } : { opacity: 0.2 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
}

function BookingAnimation({ isActive }: { isActive: boolean }) {
  const [phase, setPhase] = useState<'both-try' | 'one-wins' | 'other-waits'>('both-try');

  useState(() => {
    if (!isActive) return;
    const timers = [
      setTimeout(() => setPhase('one-wins'), 1000),
      setTimeout(() => setPhase('other-waits'), 2000),
      setTimeout(() => setPhase('both-try'), 4000),
    ];
    const interval = setInterval(() => {
      setPhase('both-try');
      setTimeout(() => setPhase('one-wins'), 1000);
      setTimeout(() => setPhase('other-waits'), 2000);
    }, 4500);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  });

  return (
    <div className="relative h-32 flex items-center justify-center gap-8">
      {/* User A */}
      <motion.div
        className="flex flex-col items-center gap-2"
        animate={{
          x: phase === 'one-wins' ? 20 : 0,
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: phase === 'one-wins' || phase === 'other-waits'
              ? colors.glow.healthy + '30'
              : colors.glow.warning + '30',
            border: `2px solid ${phase === 'one-wins' || phase === 'other-waits' ? colors.glow.healthy : colors.glow.warning}`,
          }}
        >
          👩
        </div>
        <span
          className="text-xs font-mono"
          style={{ color: phase === 'one-wins' || phase === 'other-waits' ? colors.glow.healthy : colors.text.muted }}
        >
          {phase === 'one-wins' || phase === 'other-waits' ? 'GOT LOCK' : 'FOR UPDATE'}
        </span>
      </motion.div>

      {/* The seat */}
      <motion.div
        className="w-16 h-16 rounded-lg flex flex-col items-center justify-center"
        style={{
          background: colors.oceanLight,
          border: `2px solid ${phase === 'one-wins' || phase === 'other-waits' ? colors.glow.healthy : colors.glow.warning}`,
        }}
        animate={{
          boxShadow: phase === 'one-wins' || phase === 'other-waits'
            ? `0 0 20px ${colors.glow.healthy}40`
            : `0 0 10px ${colors.glow.warning}20`,
        }}
      >
        <span className="text-lg">💺</span>
        <span className="text-xs font-mono" style={{ color: colors.text.muted }}>A-42</span>
      </motion.div>

      {/* User B */}
      <motion.div
        className="flex flex-col items-center gap-2"
        animate={{
          x: phase === 'other-waits' ? -10 : 0,
          opacity: phase === 'other-waits' ? 0.5 : 1,
        }}
      >
        <motion.div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: phase === 'other-waits'
              ? colors.glow.critical + '30'
              : colors.glow.warning + '30',
            border: `2px solid ${phase === 'other-waits' ? colors.glow.critical : colors.glow.warning}`,
          }}
          animate={phase === 'other-waits' ? { x: [0, 3, 0] } : {}}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          👨
        </motion.div>
        <span
          className="text-xs font-mono"
          style={{ color: phase === 'other-waits' ? colors.glow.critical : colors.text.muted }}
        >
          {phase === 'other-waits' ? 'WAITING...' : 'FOR UPDATE'}
        </span>
      </motion.div>
    </div>
  );
}

function CheckoutAnimation({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative h-32 flex items-center justify-center gap-4">
      {/* Transaction steps */}
      {['📦 Inventory', '💳 Payment', '📧 Confirm'].map((step, i) => (
        <motion.div
          key={step}
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 1 } : { opacity: 0.3 }}
          transition={{ delay: i * 0.3 }}
        >
          <motion.div
            className="w-14 h-14 rounded-lg flex items-center justify-center text-xl"
            style={{
              background: colors.oceanLight,
              border: `2px solid ${colors.glow.warning}`,
            }}
            animate={isActive ? {
              borderColor: [colors.glow.warning, colors.glow.healthy, colors.glow.warning],
            } : {}}
            transition={{ delay: i * 0.5, duration: 1.5, repeat: Infinity }}
          >
            {step.split(' ')[0]}
          </motion.div>
          <span className="text-xs" style={{ color: colors.text.muted }}>{step.split(' ')[1]}</span>
        </motion.div>
      ))}

      {/* Row lock indicator */}
      <motion.div
        className="absolute -bottom-1 text-xs font-mono px-2 py-0.5 rounded"
        style={{ background: colors.glow.warning + '20', color: colors.glow.warning }}
        animate={isActive ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.3 }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Row-level locks only
      </motion.div>
    </div>
  );
}

function MigrationAnimation({ isActive }: { isActive: boolean }) {
  const [phase, setPhase] = useState<'running' | 'blocked' | 'queue'>('running');

  useState(() => {
    if (!isActive) return;
    const timers = [
      setTimeout(() => setPhase('blocked'), 800),
      setTimeout(() => setPhase('queue'), 1600),
      setTimeout(() => setPhase('running'), 4000),
    ];
    const interval = setInterval(() => {
      setPhase('running');
      setTimeout(() => setPhase('blocked'), 800);
      setTimeout(() => setPhase('queue'), 1600);
    }, 4500);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  });

  return (
    <div className="relative h-32 flex items-center justify-center">
      {/* The ALTER TABLE */}
      <motion.div
        className="absolute left-4 flex flex-col items-center"
        animate={{ x: phase === 'blocked' || phase === 'queue' ? 40 : 0 }}
      >
        <motion.div
          className="w-12 h-12 rounded flex items-center justify-center"
          style={{
            background: colors.glow.critical + '30',
            border: `2px solid ${colors.glow.critical}`,
          }}
          animate={phase !== 'running' ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <span className="text-xs font-mono font-bold" style={{ color: colors.glow.critical }}>
            ALTER
          </span>
        </motion.div>
      </motion.div>

      {/* The table - locked */}
      <motion.div
        className="w-20 h-16 rounded-lg flex flex-col items-center justify-center"
        style={{
          background: phase === 'queue' ? colors.glow.critical + '20' : colors.oceanLight,
          border: `2px solid ${phase === 'queue' ? colors.glow.critical : colors.text.muted}`,
        }}
      >
        <span className="font-mono text-sm" style={{ color: colors.text.primary }}>users</span>
        {phase === 'queue' && (
          <motion.span
            className="text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: colors.glow.critical }}
          >
            🔒 LOCKED
          </motion.span>
        )}
      </motion.div>

      {/* Blocked queries */}
      <AnimatePresence>
        {phase === 'queue' && (
          <motion.div
            className="absolute right-4 flex flex-col gap-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
          >
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-8 h-6 rounded flex items-center justify-center text-xs"
                style={{
                  background: colors.glow.warning + '30',
                  border: `1px solid ${colors.glow.warning}`,
                }}
                animate={{ x: [0, 2, 0] }}
                transition={{ delay: i * 0.1, duration: 0.3, repeat: Infinity }}
              >
                ⏳
              </motion.div>
            ))}
            <span className="text-xs" style={{ color: colors.glow.warning }}>waiting...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IndexAnimation({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative h-32 flex items-center justify-center gap-6">
      {/* Index being built */}
      <motion.div
        className="flex flex-col items-center gap-2"
      >
        <motion.div
          className="w-16 h-12 rounded flex items-center justify-center"
          style={{
            background: '#a78bfa30',
            border: `2px solid #a78bfa`,
          }}
          animate={isActive ? {
            boxShadow: ['0 0 0px #a78bfa00', '0 0 15px #a78bfa40', '0 0 0px #a78bfa00'],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs font-mono" style={{ color: '#a78bfa' }}>INDEX</span>
        </motion.div>
        <span className="text-xs" style={{ color: colors.text.muted }}>Building...</span>
      </motion.div>

      {/* Table still accessible */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-16 h-12 rounded flex items-center justify-center"
          style={{
            background: colors.oceanLight,
            border: `2px solid ${colors.glow.healthy}`,
          }}
        >
          <span className="text-xs font-mono" style={{ color: colors.text.primary }}>users</span>
        </div>
        <span className="text-xs" style={{ color: colors.glow.healthy }}>✓ Accessible</span>
      </div>

      {/* Concurrent operations */}
      <motion.div
        className="flex flex-col gap-1"
        animate={isActive ? { opacity: [0.7, 1, 0.7] } : { opacity: 0.5 }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {['SELECT', 'INSERT', 'UPDATE'].map((op) => (
          <div
            key={op}
            className="px-2 py-0.5 rounded text-xs font-mono"
            style={{
              background: colors.glow.healthy + '20',
              color: colors.glow.healthy,
            }}
          >
            {op} ✓
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function ScenarioCard({ scenario, isExpanded, onToggle }: {
  scenario: Scenario;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const AnimationComponent = {
    dashboard: DashboardAnimation,
    booking: BookingAnimation,
    checkout: CheckoutAnimation,
    migration: MigrationAnimation,
    index: IndexAnimation,
  }[scenario.animation];

  return (
    <motion.div
      className="rounded-xl overflow-hidden cursor-pointer"
      style={{
        background: colors.oceanDark,
        border: `1px solid ${isExpanded ? scenario.lockColor : colors.text.muted}30`,
      }}
      onClick={onToggle}
      layout
    >
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between"
        style={{ borderBottom: isExpanded ? `1px solid ${colors.text.muted}20` : 'none' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: scenario.lockColor }}
          />
          <h3 className="font-medium" style={{ color: colors.text.primary }}>
            {scenario.title}
          </h3>
        </div>
        <motion.span
          className="text-sm"
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
            {/* Story */}
            <div className="px-4 py-3" style={{ background: colors.oceanLight }}>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {scenario.story}
              </p>
            </div>

            {/* Animation */}
            <div className="p-4">
              <AnimationComponent isActive={isExpanded} />
            </div>

            {/* Lock info */}
            <div className="px-4 pb-4 space-y-3">
              {/* Lock type */}
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: colors.text.muted }}>
                  Lock Acquired
                </span>
                <p
                  className="font-mono text-sm font-bold mt-1"
                  style={{ color: scenario.lockColor }}
                >
                  {scenario.lockType}
                </p>
              </div>

              {/* Real world SQL */}
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: colors.text.muted }}>
                  The Query
                </span>
                <code
                  className="block mt-1 p-2 rounded text-xs font-mono"
                  style={{ background: colors.ocean, color: scenario.lockColor }}
                >
                  {scenario.realWorld}
                </code>
              </div>

              {/* What it blocks */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider" style={{ color: colors.glow.critical }}>
                    Blocks
                  </span>
                  <ul className="mt-1 space-y-0.5">
                    {scenario.blocks.map((item, i) => (
                      <li key={i} className="text-xs" style={{ color: colors.text.muted }}>
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider" style={{ color: colors.glow.healthy }}>
                    Allows
                  </span>
                  <ul className="mt-1 space-y-0.5">
                    {scenario.allowsConcurrent.map((item, i) => (
                      <li key={i} className="text-xs" style={{ color: colors.text.muted }}>
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function LockScenarios() {
  const [expandedId, setExpandedId] = useState<string | null>('dashboard');

  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <p className="text-sm" style={{ color: colors.text.muted }}>
          Click each scenario to see the lock in action
        </p>
      </div>

      {SCENARIOS.map((scenario) => (
        <ScenarioCard
          key={scenario.id}
          scenario={scenario}
          isExpanded={expandedId === scenario.id}
          onToggle={() => setExpandedId(expandedId === scenario.id ? null : scenario.id)}
        />
      ))}
    </div>
  );
}
