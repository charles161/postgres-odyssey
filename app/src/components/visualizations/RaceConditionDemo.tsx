import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

type Phase =
  | 'idle'
  | 'both-read'
  | 'alice-withdraw'
  | 'bob-withdraw'
  | 'disaster'
  | 'explanation';

export function RaceConditionDemo() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [aliceReads, setAliceReads] = useState<number | null>(null);
  const [bobReads, setBobReads] = useState<number | null>(null);
  const [balance, setBalance] = useState(100);
  const [showDisaster, setShowDisaster] = useState(false);

  // Auto-play the scenario
  const playScenario = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setPhase('idle');
    setAliceReads(null);
    setBobReads(null);
    setBalance(100);
    setShowDisaster(false);

    // Timeline
    const timeline = [
      { delay: 500, action: () => setPhase('both-read') },
      { delay: 1500, action: () => { setAliceReads(100); setBobReads(100); } },
      { delay: 2500, action: () => setPhase('alice-withdraw') },
      { delay: 3000, action: () => setBalance(0) },
      { delay: 3800, action: () => setPhase('bob-withdraw') },
      { delay: 4300, action: () => setBalance(-100) },
      { delay: 5000, action: () => setPhase('disaster') },
      { delay: 5500, action: () => setShowDisaster(true) },
      { delay: 7500, action: () => setPhase('explanation') },
      { delay: 9000, action: () => setIsPlaying(false) },
    ];

    timeline.forEach(({ delay, action }) => {
      setTimeout(action, delay);
    });
  };

  const reset = () => {
    setIsPlaying(false);
    setPhase('idle');
    setAliceReads(null);
    setBobReads(null);
    setBalance(100);
    setShowDisaster(false);
  };

  const getBalanceColor = () => {
    if (balance < 0) return colors.glow.critical;
    if (balance === 0) return colors.glow.warning;
    return colors.glow.healthy;
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
          The Problem Locks Solve
        </motion.h3>
        <motion.p
          className="text-lg"
          style={{ color: colors.text.muted }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          What happens when two people access the same data at once?
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
          <div
            className="w-48 h-32 rounded-xl flex flex-col items-center justify-center relative"
            style={{
              background: `linear-gradient(135deg, ${colors.oceanLight} 0%, ${getBalanceColor()}10 100%)`,
              border: `2px solid ${getBalanceColor()}`,
              boxShadow: showDisaster ? `0 0 40px ${colors.glow.critical}50` : 'none',
            }}
          >
            <p className="text-xs font-mono uppercase tracking-wider mb-1" style={{ color: colors.text.muted }}>
              Shared Account
            </p>
            <motion.p
              className="text-4xl font-bold font-mono"
              style={{ color: getBalanceColor() }}
              animate={showDisaster ? {
                scale: [1, 1.1, 1],
                x: [0, -5, 5, -5, 0],
              } : {}}
              transition={{ duration: 0.5 }}
            >
              ${balance}
            </motion.p>

            {/* Disaster overlay */}
            <AnimatePresence>
              {showDisaster && (
                <motion.div
                  className="absolute inset-0 rounded-xl flex items-center justify-center"
                  style={{ background: `${colors.glow.critical}20` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.p
                    className="text-lg font-bold px-3 py-1 rounded"
                    style={{
                      background: colors.glow.critical,
                      color: colors.oceanDark,
                    }}
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 10 }}
                  >
                    IMPOSSIBLE!
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
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
            {/* Avatar */}
            <motion.div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2"
              style={{
                background: `linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)`,
                border: '3px solid #a78bfa',
              }}
              animate={phase === 'alice-withdraw' ? { scale: [1, 1.1, 1] } : {}}
            >
              👩
            </motion.div>
            <p className="font-medium" style={{ color: '#a78bfa' }}>Alice</p>

            {/* What Alice sees */}
            <AnimatePresence>
              {aliceReads !== null && (
                <motion.div
                  className="mt-3 px-3 py-2 rounded-lg text-center"
                  style={{ background: colors.oceanLight }}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <p className="text-xs" style={{ color: colors.text.muted }}>Reads:</p>
                  <p className="font-mono font-bold" style={{ color: colors.glow.healthy }}>
                    ${aliceReads}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action indicator */}
            <AnimatePresence>
              {phase === 'alice-withdraw' && (
                <motion.div
                  className="mt-2 px-3 py-1 rounded text-xs font-mono"
                  style={{
                    background: colors.glow.warning + '30',
                    color: colors.glow.warning,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Withdraws $100
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Connection line to account */}
          <AnimatePresence>
            {(phase === 'both-read' || phase === 'alice-withdraw') && (
              <motion.svg
                className="absolute top-8 left-16 pointer-events-none"
                width="80"
                height="2"
                style={{ overflow: 'visible' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.line
                  x1="0"
                  y1="0"
                  x2="80"
                  y2="0"
                  stroke={phase === 'alice-withdraw' ? colors.glow.warning : colors.glow.healthy}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5 }}
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bob (right) */}
        <motion.div
          className="absolute right-8 top-1/2 -translate-y-1/2"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', damping: 20 }}
        >
          <div className="flex flex-col items-center">
            {/* Avatar */}
            <motion.div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2"
              style={{
                background: `linear-gradient(135deg, #34d399 0%, #059669 100%)`,
                border: '3px solid #34d399',
              }}
              animate={phase === 'bob-withdraw' ? { scale: [1, 1.1, 1] } : {}}
            >
              👨
            </motion.div>
            <p className="font-medium" style={{ color: '#34d399' }}>Bob</p>

            {/* What Bob sees */}
            <AnimatePresence>
              {bobReads !== null && (
                <motion.div
                  className="mt-3 px-3 py-2 rounded-lg text-center"
                  style={{ background: colors.oceanLight }}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <p className="text-xs" style={{ color: colors.text.muted }}>Reads:</p>
                  <p className="font-mono font-bold" style={{ color: colors.glow.healthy }}>
                    ${bobReads}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action indicator */}
            <AnimatePresence>
              {phase === 'bob-withdraw' && (
                <motion.div
                  className="mt-2 px-3 py-1 rounded text-xs font-mono"
                  style={{
                    background: colors.glow.warning + '30',
                    color: colors.glow.warning,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Withdraws $100
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Connection line to account */}
          <AnimatePresence>
            {(phase === 'both-read' || phase === 'bob-withdraw') && (
              <motion.svg
                className="absolute top-8 right-16 pointer-events-none"
                width="80"
                height="2"
                style={{ overflow: 'visible' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.line
                  x1="80"
                  y1="0"
                  x2="0"
                  y2="0"
                  stroke={phase === 'bob-withdraw' ? colors.glow.warning : colors.glow.healthy}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5 }}
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Timeline narration */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              className="text-sm px-4 py-2 rounded-lg"
              style={{
                background: colors.oceanLight,
                color: phase === 'disaster' || phase === 'explanation'
                  ? colors.glow.critical
                  : colors.text.secondary,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {phase === 'idle' && 'Click "Play" to see what happens...'}
              {phase === 'both-read' && 'Both check the balance at the same time...'}
              {phase === 'alice-withdraw' && 'Alice withdraws $100 (saw $100, takes $100)'}
              {phase === 'bob-withdraw' && 'Bob withdraws $100 (also saw $100!)'}
              {phase === 'disaster' && 'Wait... $200 withdrawn from $100?!'}
              {phase === 'explanation' && 'The bank just lost $100. This is a race condition.'}
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
            ▶ Watch What Happens
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
        {phase === 'explanation' && (
          <motion.div
            className="mt-8 p-6 rounded-xl text-center"
            style={{
              background: `linear-gradient(135deg, ${colors.glow.critical}10 0%, ${colors.glow.critical}05 100%)`,
              border: `2px solid ${colors.glow.critical}40`,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xl font-medium mb-2" style={{ color: colors.glow.critical }}>
              Both saw $100. Both took $100.
            </p>
            <p className="text-lg" style={{ color: colors.text.secondary }}>
              Without coordination, <strong>reality breaks</strong>.
            </p>
            <p className="text-sm mt-4" style={{ color: colors.text.muted }}>
              This is why databases need locks — to ensure only one transaction
              can modify shared data at a time.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
