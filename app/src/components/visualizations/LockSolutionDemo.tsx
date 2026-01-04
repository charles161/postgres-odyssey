import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

type Phase =
  | 'idle'
  | 'alice-locks'
  | 'bob-waits'
  | 'alice-withdraws'
  | 'alice-releases'
  | 'bob-locks'
  | 'bob-rejected'
  | 'success';

export function LockSolutionDemo() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [balance, setBalance] = useState(100);
  const [lockHolder, setLockHolder] = useState<'alice' | 'bob' | null>(null);
  const [bobMessage, setBobMessage] = useState<string | null>(null);

  const playScenario = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setPhase('idle');
    setBalance(100);
    setLockHolder(null);
    setBobMessage(null);

    const timeline = [
      { delay: 500, action: () => { setPhase('alice-locks'); setLockHolder('alice'); } },
      { delay: 1500, action: () => setPhase('bob-waits') },
      { delay: 2500, action: () => { setPhase('alice-withdraws'); setBalance(0); } },
      { delay: 3500, action: () => { setPhase('alice-releases'); setLockHolder(null); } },
      { delay: 4500, action: () => { setPhase('bob-locks'); setLockHolder('bob'); } },
      { delay: 5500, action: () => { setPhase('bob-rejected'); setBobMessage('Balance: $0'); } },
      { delay: 7000, action: () => setPhase('success') },
      { delay: 9000, action: () => setIsPlaying(false) },
    ];

    timeline.forEach(({ delay, action }) => {
      setTimeout(action, delay);
    });
  };

  const reset = () => {
    setIsPlaying(false);
    setPhase('idle');
    setBalance(100);
    setLockHolder(null);
    setBobMessage(null);
  };

  const getLockColor = () => {
    if (lockHolder === 'alice') return '#a78bfa';
    if (lockHolder === 'bob') return '#34d399';
    return 'transparent';
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h3
          className="text-2xl md:text-3xl font-medium mb-2"
          style={{ color: colors.text.primary }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          The Solution: Take Turns
        </motion.h3>
        <motion.p
          className="text-lg"
          style={{ color: colors.text.muted }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Same scenario, but with a simple rule: one at a time.
        </motion.p>
      </div>

      {/* Main visualization */}
      <div
        className="relative rounded-2xl p-8 overflow-hidden"
        style={{
          background: colors.oceanDark,
          border: `1px solid ${colors.text.muted}20`,
          minHeight: 400,
        }}
      >
        {/* The Bank Account (center) */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <div className="relative">
            {/* Lock ring animation */}
            <AnimatePresence>
              {lockHolder && (
                <motion.div
                  className="absolute -inset-4 rounded-2xl"
                  style={{
                    border: `3px solid ${getLockColor()}`,
                    boxShadow: `0 0 30px ${getLockColor()}50, inset 0 0 20px ${getLockColor()}20`,
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    rotate: [0, 2, -2, 0],
                  }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  transition={{
                    duration: 0.4,
                    rotate: { duration: 0.5, repeat: Infinity, repeatType: 'reverse' }
                  }}
                >
                  {/* Lock icon */}
                  <motion.div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-mono font-bold"
                    style={{
                      background: getLockColor(),
                      color: colors.oceanDark,
                    }}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                  >
                    🔒 LOCKED
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className="w-48 h-32 rounded-xl flex flex-col items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${colors.oceanLight} 0%, ${colors.glow.healthy}10 100%)`,
                border: `2px solid ${colors.glow.healthy}`,
              }}
            >
              <p className="text-xs font-mono uppercase tracking-wider mb-1" style={{ color: colors.text.muted }}>
                Shared Account
              </p>
              <motion.p
                className="text-4xl font-bold font-mono"
                style={{ color: colors.glow.healthy }}
                key={balance}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                ${balance}
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Alice (left) */}
        <motion.div
          className="absolute left-8 top-1/2 -translate-y-1/2"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', damping: 20 }}
        >
          <div className="flex flex-col items-center">
            <motion.div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2"
              style={{
                background: `linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)`,
                border: lockHolder === 'alice' ? '3px solid #fff' : '3px solid #a78bfa',
                boxShadow: lockHolder === 'alice' ? '0 0 20px #a78bfa80' : 'none',
              }}
              animate={phase === 'alice-withdraws' ? { scale: [1, 1.1, 1] } : {}}
            >
              👩
            </motion.div>
            <p className="font-medium" style={{ color: '#a78bfa' }}>Alice</p>

            {/* Alice's actions */}
            <AnimatePresence mode="wait">
              {phase === 'alice-locks' && (
                <motion.div
                  className="mt-3 px-3 py-2 rounded-lg text-center"
                  style={{ background: '#a78bfa20', border: '1px solid #a78bfa' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-xs font-mono" style={{ color: '#a78bfa' }}>Gets the lock</p>
                </motion.div>
              )}
              {phase === 'alice-withdraws' && (
                <motion.div
                  className="mt-3 px-3 py-2 rounded-lg text-center"
                  style={{ background: colors.glow.warning + '20', border: `1px solid ${colors.glow.warning}` }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-xs font-mono" style={{ color: colors.glow.warning }}>Withdraws $100</p>
                </motion.div>
              )}
              {phase === 'alice-releases' && (
                <motion.div
                  className="mt-3 px-3 py-2 rounded-lg text-center"
                  style={{ background: colors.glow.healthy + '20', border: `1px solid ${colors.glow.healthy}` }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-xs font-mono" style={{ color: colors.glow.healthy }}>✓ Done, releases lock</p>
                </motion.div>
              )}
              {(phase === 'bob-locks' || phase === 'bob-rejected' || phase === 'success') && (
                <motion.div
                  className="mt-3 px-3 py-2 rounded-lg text-center"
                  style={{ background: colors.glow.healthy + '20', border: `1px solid ${colors.glow.healthy}` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-xs font-mono" style={{ color: colors.glow.healthy }}>✓ Got $100</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Bob (right) */}
        <motion.div
          className="absolute right-8 top-1/2 -translate-y-1/2"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', damping: 20 }}
        >
          <div className="flex flex-col items-center">
            <motion.div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2"
              style={{
                background: `linear-gradient(135deg, #34d399 0%, #059669 100%)`,
                border: lockHolder === 'bob' ? '3px solid #fff' : '3px solid #34d399',
                boxShadow: lockHolder === 'bob' ? '0 0 20px #34d39980' : 'none',
              }}
              animate={
                phase === 'bob-waits' || phase === 'alice-withdraws' || phase === 'alice-releases'
                  ? { x: [0, 3, 0], transition: { repeat: Infinity, duration: 0.5 } }
                  : {}
              }
            >
              👨
            </motion.div>
            <p className="font-medium" style={{ color: '#34d399' }}>Bob</p>

            {/* Bob's actions */}
            <AnimatePresence mode="wait">
              {(phase === 'bob-waits' || phase === 'alice-withdraws' || phase === 'alice-releases') && (
                <motion.div
                  className="mt-3 px-3 py-2 rounded-lg text-center"
                  style={{ background: colors.glow.warning + '20', border: `1px solid ${colors.glow.warning}` }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-xs font-mono" style={{ color: colors.glow.warning }}>
                    ⏳ Waiting for lock...
                  </p>
                </motion.div>
              )}
              {phase === 'bob-locks' && (
                <motion.div
                  className="mt-3 px-3 py-2 rounded-lg text-center"
                  style={{ background: '#34d39920', border: '1px solid #34d399' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-xs font-mono" style={{ color: '#34d399' }}>Gets the lock!</p>
                </motion.div>
              )}
              {phase === 'bob-rejected' && bobMessage && (
                <motion.div
                  className="mt-3 px-3 py-2 rounded-lg text-center"
                  style={{ background: colors.glow.critical + '20', border: `1px solid ${colors.glow.critical}` }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-xs font-mono" style={{ color: colors.glow.critical }}>
                    Sees: {bobMessage}
                  </p>
                  <p className="text-xs font-mono mt-1" style={{ color: colors.glow.critical }}>
                    ✗ Can't withdraw!
                  </p>
                </motion.div>
              )}
              {phase === 'success' && (
                <motion.div
                  className="mt-3 px-3 py-2 rounded-lg text-center"
                  style={{ background: colors.glow.healthy + '20', border: `1px solid ${colors.glow.healthy}` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-xs font-mono" style={{ color: colors.glow.healthy }}>✓ Correctly rejected</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Timeline narration */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              className="text-sm px-4 py-2 rounded-lg"
              style={{
                background: colors.oceanLight,
                color: phase === 'success' ? colors.glow.healthy : colors.text.secondary,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {phase === 'idle' && 'Click "Play" to see how locks prevent chaos...'}
              {phase === 'alice-locks' && 'Alice requests the lock — and gets it first.'}
              {phase === 'bob-waits' && 'Bob tries to access, but must wait...'}
              {phase === 'alice-withdraws' && 'Alice safely withdraws $100.'}
              {phase === 'alice-releases' && 'Alice releases the lock.'}
              {phase === 'bob-locks' && 'Now Bob gets the lock and checks the balance.'}
              {phase === 'bob-rejected' && 'Bob sees $0. His withdrawal is rejected.'}
              {phase === 'success' && '✓ The bank is safe. No money was lost.'}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Play button overlay */}
        {phase === 'idle' && !isPlaying && (
          <motion.button
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-8 py-4 rounded-xl font-medium text-lg"
            style={{
              background: `linear-gradient(135deg, ${colors.glow.healthy} 0%, ${colors.glow.healthy}cc 100%)`,
              color: colors.oceanDark,
              boxShadow: `0 0 30px ${colors.glow.healthy}40`,
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 40px ${colors.glow.healthy}60` }}
            whileTap={{ scale: 0.98 }}
            onClick={playScenario}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            ▶ Watch With Locks
          </motion.button>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mt-6">
        <motion.button
          className="px-6 py-2 rounded-lg font-medium text-sm"
          style={{
            background: isPlaying ? colors.oceanLight : colors.glow.healthy + '20',
            color: isPlaying ? colors.text.muted : colors.glow.healthy,
            border: `1px solid ${isPlaying ? colors.text.muted : colors.glow.healthy}40`,
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={playScenario}
          disabled={isPlaying}
        >
          {isPlaying ? 'Playing...' : 'Replay'}
        </motion.button>

        <motion.button
          className="px-6 py-2 rounded-lg font-medium text-sm"
          style={{
            background: colors.oceanLight,
            color: colors.text.secondary,
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={reset}
        >
          Reset
        </motion.button>
      </div>

      {/* The punchline */}
      <AnimatePresence>
        {phase === 'success' && (
          <motion.div
            className="mt-8 p-6 rounded-xl text-center"
            style={{
              background: `linear-gradient(135deg, ${colors.glow.healthy}10 0%, ${colors.glow.healthy}05 100%)`,
              border: `2px solid ${colors.glow.healthy}40`,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xl font-medium mb-2" style={{ color: colors.glow.healthy }}>
              One simple rule: acquire a lock before modifying.
            </p>
            <p className="text-lg" style={{ color: colors.text.secondary }}>
              Bob had to wait, but <strong>reality stayed intact</strong>.
            </p>
            <p className="text-sm mt-4" style={{ color: colors.text.muted }}>
              This is the core idea behind database locks — ensuring transactions
              don't step on each other's toes.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
