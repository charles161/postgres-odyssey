import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

type Phase =
  | 'start'
  | 'both-reach'
  | 'both-take'
  | 'disaster'
  | 'freeze'
  | 'question'
  | 'title'
  | 'done';

interface MicroDisasterOpeningProps {
  onComplete: () => void;
}

export function MicroDisasterOpening({ onComplete }: MicroDisasterOpeningProps) {
  const [phase, setPhase] = useState<Phase>('start');
  const [balance, setBalance] = useState(100);

  useEffect(() => {
    const timeline = [
      { delay: 800, action: () => setPhase('both-reach') },
      { delay: 2000, action: () => setPhase('both-take') },
      { delay: 2500, action: () => setBalance(0) },
      { delay: 3000, action: () => setBalance(-100) },
      { delay: 3500, action: () => setPhase('disaster') },
      { delay: 5000, action: () => setPhase('freeze') },
      { delay: 6500, action: () => setPhase('question') },
      { delay: 9000, action: () => setPhase('title') },
      { delay: 12000, action: () => { setPhase('done'); onComplete(); } },
    ];

    const timers = timeline.map(({ delay, action }) => setTimeout(action, delay));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const getBalanceColor = () => {
    if (balance < 0) return colors.glow.critical;
    if (balance === 0) return colors.glow.warning;
    return colors.glow.healthy;
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: colors.ocean }}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'done' ? 0 : 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Skip button */}
      <motion.button
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm z-50"
        style={{ color: colors.text.muted }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        whileHover={{ opacity: 1 }}
        onClick={onComplete}
      >
        Skip intro
      </motion.button>

      {/* Scene container */}
      <div className="relative w-full max-w-lg h-64">
        {/* Central account */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: phase === 'disaster' ? [1, 1.1, 1] : 1,
            opacity: phase !== 'question' && phase !== 'title' ? 1 : 0,
            x: phase === 'disaster' ? [0, -5, 5, -5, 0] : 0,
          }}
          transition={{
            scale: { duration: 0.3 },
            x: { duration: 0.4 },
            opacity: { duration: 0.5 }
          }}
        >
          <div
            className="w-40 h-24 rounded-xl flex flex-col items-center justify-center relative"
            style={{
              background: `linear-gradient(135deg, ${colors.oceanLight} 0%, ${getBalanceColor()}10 100%)`,
              border: `2px solid ${getBalanceColor()}`,
              boxShadow: phase === 'disaster' ? `0 0 40px ${colors.glow.critical}50` : 'none',
            }}
          >
            <p className="text-xs font-mono uppercase tracking-wider mb-1" style={{ color: colors.text.muted }}>
              Account
            </p>
            <motion.p
              className="text-3xl font-bold font-mono"
              style={{ color: getBalanceColor() }}
              key={balance}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
            >
              ${balance}
            </motion.p>

            {/* Disaster overlay */}
            <AnimatePresence>
              {phase === 'disaster' && (
                <motion.div
                  className="absolute inset-0 rounded-xl flex items-center justify-center"
                  style={{ background: `${colors.glow.critical}30` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.p
                    className="text-sm font-bold px-2 py-1 rounded"
                    style={{ background: colors.glow.critical, color: colors.oceanDark }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    -$100!
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Alice (left) */}
        <motion.div
          className="absolute left-8 top-1/2 -translate-y-1/2"
          initial={{ x: -50, opacity: 0 }}
          animate={{
            x: phase === 'both-reach' || phase === 'both-take' ? 30 : 0,
            opacity: phase !== 'question' && phase !== 'title' ? 1 : 0,
          }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <div className="flex flex-col items-center">
            <motion.div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
              style={{
                background: `linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)`,
                border: '2px solid #a78bfa',
              }}
              animate={phase === 'both-take' ? { scale: [1, 1.2, 1] } : {}}
            >
              👩
            </motion.div>
            <p className="text-xs mt-1 font-medium" style={{ color: '#a78bfa' }}>Alice</p>
            {phase === 'both-take' && (
              <motion.p
                className="text-xs mt-1 px-2 py-0.5 rounded"
                style={{ background: colors.glow.warning + '30', color: colors.glow.warning }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Takes $100
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* Bob (right) */}
        <motion.div
          className="absolute right-8 top-1/2 -translate-y-1/2"
          initial={{ x: 50, opacity: 0 }}
          animate={{
            x: phase === 'both-reach' || phase === 'both-take' ? -30 : 0,
            opacity: phase !== 'question' && phase !== 'title' ? 1 : 0,
          }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <div className="flex flex-col items-center">
            <motion.div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
              style={{
                background: `linear-gradient(135deg, #34d399 0%, #059669 100%)`,
                border: '2px solid #34d399',
              }}
              animate={phase === 'both-take' ? { scale: [1, 1.2, 1] } : {}}
            >
              👨
            </motion.div>
            <p className="text-xs mt-1 font-medium" style={{ color: '#34d399' }}>Bob</p>
            {phase === 'both-take' && (
              <motion.p
                className="text-xs mt-1 px-2 py-0.5 rounded"
                style={{ background: colors.glow.warning + '30', color: colors.glow.warning }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Takes $100
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* Freeze frame text */}
        <AnimatePresence>
          {phase === 'freeze' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="px-6 py-3 rounded-lg text-center"
                style={{ background: colors.oceanDark }}
              >
                <p className="text-xl font-medium" style={{ color: colors.glow.critical }}>
                  The bank just lost $100.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question */}
        <AnimatePresence>
          {phase === 'question' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <motion.p
                  className="text-2xl md:text-3xl font-light"
                  style={{ color: colors.text.secondary }}
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                >
                  What if they could{' '}
                  <span style={{ color: colors.glow.healthy }}>coordinate</span>?
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title reveal */}
        <AnimatePresence>
          {phase === 'title' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.p
                className="text-sm font-mono uppercase tracking-widest mb-4"
                style={{ color: colors.glow.critical }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Episode 5
              </motion.p>
              <motion.h1
                className="text-5xl md:text-7xl font-medium"
                style={{
                  color: colors.text.primary,
                  textShadow: `0 0 60px ${colors.glow.critical}40`,
                }}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                The Fever
              </motion.h1>
              <motion.div
                className="mt-6 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${colors.glow.critical}60, transparent)` }}
                initial={{ width: 0 }}
                animate={{ width: 200 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
