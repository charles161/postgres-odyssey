import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface BloatAccumulationOpeningProps {
  onComplete: () => void;
}

type Phase =
  | 'idle'
  | 'first-ghost'
  | 'acceleration'
  | 'suffocation'
  | 'text-reveal'
  | 'first-sweep'
  | 'title'
  | 'done';

interface GhostTuple {
  id: number;
  x: number;
  y: number;
  delay: number;
}

export function BloatAccumulationOpening({ onComplete }: BloatAccumulationOpeningProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [ghosts, setGhosts] = useState<GhostTuple[]>([]);
  const [tableWidth, setTableWidth] = useState(200);
  const [showSkip, setShowSkip] = useState(false);

  // Generate ghost tuples
  const addGhost = () => {
    const newGhost: GhostTuple = {
      id: Date.now() + Math.random(),
      x: Math.random() * 160 - 80,
      y: Math.random() * 80 - 40,
      delay: Math.random() * 0.2,
    };
    setGhosts((prev) => [...prev, newGhost]);
  };

  // Timeline
  useEffect(() => {
    const timeline = [
      { delay: 500, action: () => setShowSkip(true) },
      { delay: 1000, action: () => setPhase('first-ghost') },
      { delay: 1500, action: () => { addGhost(); setTableWidth(210); } },
      { delay: 2000, action: () => setPhase('acceleration') },
      // Rapid ghost accumulation
      { delay: 2200, action: () => { addGhost(); setTableWidth(220); } },
      { delay: 2400, action: () => { addGhost(); addGhost(); setTableWidth(235); } },
      { delay: 2600, action: () => { addGhost(); addGhost(); setTableWidth(250); } },
      { delay: 2800, action: () => { addGhost(); addGhost(); addGhost(); setTableWidth(270); } },
      { delay: 3000, action: () => { addGhost(); addGhost(); addGhost(); setTableWidth(295); } },
      { delay: 3200, action: () => { addGhost(); addGhost(); addGhost(); addGhost(); setTableWidth(320); } },
      { delay: 3400, action: () => setPhase('suffocation') },
      { delay: 3600, action: () => { addGhost(); addGhost(); addGhost(); addGhost(); addGhost(); setTableWidth(360); } },
      { delay: 4000, action: () => setPhase('text-reveal') },
      { delay: 7000, action: () => setPhase('first-sweep') },
      { delay: 8500, action: () => setPhase('title') },
      { delay: 11000, action: () => { setPhase('done'); onComplete(); } },
    ];

    const timers = timeline.map(({ delay, action }) => setTimeout(action, delay));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const handleSkip = () => {
    setPhase('done');
    onComplete();
  };

  if (phase === 'done') return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: colors.ocean }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Skip button */}
      <AnimatePresence>
        {showSkip && phase !== 'title' && (
          <motion.button
            className="absolute top-8 right-8 px-4 py-2 text-sm rounded-lg z-50"
            style={{
              background: colors.oceanLight,
              color: colors.text.muted,
              border: `1px solid ${colors.text.muted}30`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Skip intro
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main visualization area */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* The Table - breathing rectangle */}
        <AnimatePresence>
          {phase !== 'title' && (
            <motion.div
              className="relative flex items-center justify-center"
              style={{ width: tableWidth, height: 120 }}
              animate={{
                width: tableWidth,
                scale: phase === 'suffocation' ? [1, 1.01, 0.99, 1] : [1, 1.02, 1],
              }}
              transition={{
                width: { duration: 0.3, ease: 'easeOut' },
                scale: {
                  duration: phase === 'suffocation' ? 0.8 : 2,
                  repeat: Infinity,
                  ease: phase === 'suffocation' ? 'easeInOut' : 'easeInOut',
                },
              }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              {/* Table glow/border */}
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{
                  background: phase === 'suffocation'
                    ? `linear-gradient(135deg, ${colors.glow.warning}20 0%, ${colors.oceanLight} 100%)`
                    : colors.oceanLight,
                  border: `2px solid ${
                    phase === 'suffocation'
                      ? colors.glow.warning
                      : phase === 'idle' || phase === 'first-ghost'
                      ? colors.glow.healthy
                      : colors.glow.warning
                  }`,
                  boxShadow:
                    phase === 'idle' || phase === 'first-ghost'
                      ? `0 0 30px ${colors.glow.healthy}30`
                      : phase === 'suffocation'
                      ? `0 0 40px ${colors.glow.warning}40`
                      : `0 0 20px ${colors.glow.warning}20`,
                }}
                animate={{
                  opacity: phase === 'suffocation' ? [0.6, 0.8, 0.6] : 1,
                }}
                transition={{ duration: 1, repeat: Infinity }}
              />

              {/* Table label */}
              <motion.span
                className="relative z-10 font-mono text-lg font-medium"
                style={{
                  color:
                    phase === 'idle' || phase === 'first-ghost'
                      ? colors.glow.healthy
                      : colors.text.primary,
                }}
                animate={{
                  opacity: phase === 'suffocation' ? [0.5, 0.8, 0.5] : 1,
                }}
              >
                users
              </motion.span>

              {/* Ghost tuples stacking behind */}
              <AnimatePresence>
                {ghosts.map((ghost) => (
                  <motion.div
                    key={ghost.id}
                    className="absolute w-6 h-4 rounded"
                    style={{
                      background: '#4a4a6a',
                      border: '1px solid #6b6b8a',
                      filter: 'grayscale(40%) brightness(0.7)',
                      left: `calc(50% + ${ghost.x}px)`,
                      top: `calc(50% + ${ghost.y}px)`,
                    }}
                    initial={{ opacity: 0, y: -10, scale: 0.8 }}
                    animate={{ opacity: 0.6, y: 0, scale: 1 }}
                    transition={{ delay: ghost.delay, duration: 0.3 }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* VACUUM sweep line */}
        <AnimatePresence>
          {phase === 'first-sweep' && (
            <motion.div
              className="absolute w-full h-12 pointer-events-none"
              style={{
                background: `linear-gradient(180deg, transparent, ${colors.glow.healthy}40, transparent)`,
              }}
              initial={{ top: '20%', opacity: 0 }}
              animate={{ top: '80%', opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.5, ease: 'linear' }}
            />
          )}
        </AnimatePresence>

        {/* Text reveal */}
        <AnimatePresence>
          {phase === 'text-reveal' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center max-w-2xl px-8">
                {['Every UPDATE leaves a ghost.', 'Every ghost takes up space.', 'Space that queries still scan through.'].map(
                  (line, i) => (
                    <motion.p
                      key={i}
                      className="text-2xl md:text-3xl font-light mb-4"
                      style={{ color: i === 0 ? colors.text.primary : colors.text.secondary }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.8, duration: 0.6 }}
                    >
                      {line}
                    </motion.p>
                  )
                )}

                <motion.p
                  className="text-xl md:text-2xl font-medium mt-8"
                  style={{ color: colors.glow.warning }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.4, duration: 0.6 }}
                >
                  This is table bloat.
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
              transition={{ duration: 0.8 }}
            >
              <motion.p
                className="text-sm uppercase tracking-[0.3em] mb-4"
                style={{ color: colors.text.muted }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Episode 10
              </motion.p>

              <motion.h1
                className="text-5xl md:text-7xl font-bold tracking-tight"
                style={{ color: colors.text.primary }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                THE CLEANUP
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl mt-6 font-light"
                style={{ color: colors.text.secondary }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                The organism must digest its dead.
              </motion.p>

              {/* Decorative line */}
              <motion.div
                className="h-px mt-8"
                style={{ background: colors.glow.healthy }}
                initial={{ width: 0 }}
                animate={{ width: 120 }}
                transition={{ delay: 1.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
