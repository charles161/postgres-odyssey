import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface PreventionCardProps {
  title: string;
  description: string;
  code: string;
  callback: {
    label: string;
    animation: 'lock-timeout' | 'consistent-order' | 'concurrent-index';
  };
}

// Mini animation for lock_timeout
function LockTimeoutMini() {
  const [phase, setPhase] = useState<'waiting' | 'timeout' | 'released'>('waiting');

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('timeout'), 1500),
      setTimeout(() => setPhase('released'), 2500),
      setTimeout(() => setPhase('waiting'), 4000),
    ];
    const interval = setInterval(() => {
      setPhase('waiting');
      setTimeout(() => setPhase('timeout'), 1500);
      setTimeout(() => setPhase('released'), 2500);
    }, 4500);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative h-16 flex items-center justify-center gap-2">
      {/* Queue of blocked transactions */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-8 h-8 rounded flex items-center justify-center text-xs font-mono"
          style={{
            background: phase === 'released' ? colors.glow.healthy + '30' : colors.glow.warning + '30',
            border: `1px solid ${phase === 'released' ? colors.glow.healthy : colors.glow.warning}`,
          }}
          animate={{
            x: phase === 'waiting' ? [0, 2, 0] : 0,
            scale: phase === 'released' ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.3, repeat: phase === 'waiting' ? Infinity : 0 }}
        >
          {phase === 'released' ? '✓' : '⏳'}
        </motion.div>
      ))}

      {/* Timeout indicator */}
      <AnimatePresence>
        {phase === 'timeout' && (
          <motion.div
            className="absolute -top-2 right-0 text-xs px-2 py-0.5 rounded"
            style={{ background: colors.glow.critical, color: colors.oceanDark }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            TIMEOUT!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mini animation for consistent lock ordering
function ConsistentOrderMini() {
  const [showDeadlock, setShowDeadlock] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setShowDeadlock(prev => !prev), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-16 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {showDeadlock ? (
          <motion.div
            key="deadlock"
            className="flex items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <div className="text-xs" style={{ color: colors.text.muted }}>A→B</div>
              <div className="text-xs font-mono" style={{ color: colors.glow.critical }}>users→accts</div>
            </div>
            <motion.div
              className="w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center"
              style={{ borderColor: colors.glow.critical }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <span className="text-xs">🔄</span>
            </motion.div>
            <div className="text-center">
              <div className="text-xs" style={{ color: colors.text.muted }}>B→A</div>
              <div className="text-xs font-mono" style={{ color: colors.glow.critical }}>accts→users</div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="safe"
            className="flex items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <div className="text-xs" style={{ color: colors.text.muted }}>A</div>
              <div className="text-xs font-mono" style={{ color: colors.glow.healthy }}>users→accts</div>
            </div>
            <motion.div
              className="text-xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
            >
              ✓
            </motion.div>
            <div className="text-center">
              <div className="text-xs" style={{ color: colors.text.muted }}>B</div>
              <div className="text-xs font-mono" style={{ color: colors.glow.healthy }}>users→accts</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mini animation for concurrent index
function ConcurrentIndexMini() {
  const [phase, setPhase] = useState<'blocking' | 'concurrent'>('blocking');

  useEffect(() => {
    const interval = setInterval(() => setPhase(prev => prev === 'blocking' ? 'concurrent' : 'blocking'), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-16 flex items-center justify-center gap-3">
      {/* Table */}
      <div
        className="w-12 h-10 rounded flex items-center justify-center text-xs font-mono"
        style={{
          background: colors.oceanLight,
          border: `1px solid ${phase === 'blocking' ? colors.glow.critical : colors.glow.healthy}`,
        }}
      >
        TBL
      </div>

      {/* Index being built */}
      <motion.div
        className="flex items-center gap-1"
        animate={{ opacity: phase === 'blocking' ? [1, 0.5, 1] : 1 }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <div
          className="w-8 h-6 rounded text-xs flex items-center justify-center"
          style={{
            background: phase === 'blocking' ? colors.glow.critical + '30' : colors.glow.healthy + '30',
            border: `1px solid ${phase === 'blocking' ? colors.glow.critical : colors.glow.healthy}`,
          }}
        >
          IDX
        </div>
      </motion.div>

      {/* Queries */}
      <div className="flex flex-col gap-1">
        {[0, 1].map(i => (
          <motion.div
            key={i}
            className="w-6 h-4 rounded text-xs flex items-center justify-center"
            style={{
              background: phase === 'blocking' ? colors.glow.warning + '30' : colors.glow.healthy + '30',
              borderColor: phase === 'blocking' ? colors.glow.warning : colors.glow.healthy,
            }}
            animate={{
              x: phase === 'blocking' ? [0, 2, 0] : 0,
            }}
            transition={{ duration: 0.3, repeat: phase === 'blocking' ? Infinity : 0 }}
          >
            {phase === 'blocking' ? '⏳' : '✓'}
          </motion.div>
        ))}
      </div>

      {/* Label */}
      <div className="absolute -bottom-1 text-xs font-mono" style={{ color: colors.text.muted }}>
        {phase === 'blocking' ? 'CREATE INDEX' : 'CONCURRENTLY'}
      </div>
    </div>
  );
}

function PreventionCard({ title, description, code, callback }: PreventionCardProps) {
  return (
    <motion.div
      className="rounded-xl overflow-hidden"
      style={{
        background: colors.oceanDark,
        border: `1px solid ${colors.glow.healthy}30`,
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Mini animation */}
      <div
        className="p-4"
        style={{ background: colors.oceanLight }}
      >
        {callback.animation === 'lock-timeout' && <LockTimeoutMini />}
        {callback.animation === 'consistent-order' && <ConsistentOrderMini />}
        {callback.animation === 'concurrent-index' && <ConcurrentIndexMini />}
        <p className="text-xs text-center mt-2" style={{ color: colors.text.muted }}>
          {callback.label}
        </p>
      </div>

      {/* Content */}
      <div className="p-4">
        <h4
          className="font-mono text-sm font-bold mb-2"
          style={{ color: colors.glow.healthy }}
        >
          {title}
        </h4>
        <p className="text-sm mb-3" style={{ color: colors.text.secondary }}>
          {description}
        </p>
        <code
          className="block p-3 rounded text-xs font-mono"
          style={{ background: colors.ocean, color: colors.glow.healthy }}
        >
          {code}
        </code>
      </div>
    </motion.div>
  );
}

export function PreventionCards() {
  const cards: PreventionCardProps[] = [
    {
      title: 'SET lock_timeout',
      description: 'Remember the ALTER TABLE that blocked everyone? With this setting, it would have given up after 3 seconds.',
      code: "SET lock_timeout = '3s';",
      callback: {
        label: 'Queue clears when ALTER times out',
        animation: 'lock-timeout',
      },
    },
    {
      title: 'Consistent Lock Ordering',
      description: 'Remember Transaction B causing the deadlock? If it acquired locks in the same order as A, no cycle could form.',
      code: '-- Always: users → accounts\n-- Never: accounts → users',
      callback: {
        label: 'Same order = no deadlock',
        animation: 'consistent-order',
      },
    },
    {
      title: 'CREATE INDEX CONCURRENTLY',
      description: 'Regular CREATE INDEX blocks all writes. CONCURRENTLY builds the index without locking the table.',
      code: 'CREATE INDEX CONCURRENTLY idx ON users(email);',
      callback: {
        label: 'Queries continue during build',
        animation: 'concurrent-index',
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, i) => (
        <PreventionCard key={i} {...card} />
      ))}
    </div>
  );
}
