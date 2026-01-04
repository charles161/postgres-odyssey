import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface StrategyOpeningProps {
  onComplete: () => void;
}

export function StrategyOpening({ onComplete }: StrategyOpeningProps) {
  const [phase, setPhase] = useState<
    'paths' | 'choice' | 'scanning' | 'reveal' | 'question' | 'title' | 'fade'
  >('paths');

  // Phase timing
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase('choice'), 2500));
    timers.push(setTimeout(() => setPhase('scanning'), 4500));
    timers.push(setTimeout(() => setPhase('reveal'), 8000));
    timers.push(setTimeout(() => setPhase('question'), 11000));
    timers.push(setTimeout(() => setPhase('title'), 14000));
    timers.push(setTimeout(() => setPhase('fade'), 17000));
    timers.push(setTimeout(() => onComplete(), 18000));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'fade' && (
        <motion.div
          className="fixed inset-0 flex flex-col items-center justify-center z-50"
          style={{ background: colors.ocean }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <AnimatePresence mode="wait">
            {/* Two paths shown */}
            {phase === 'paths' && (
              <motion.div
                key="paths"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-lg mb-8" style={{ color: colors.text.muted }}>
                  PostgreSQL evaluates multiple strategies...
                </p>

                <div className="flex gap-16">
                  {/* Path A - Index */}
                  <motion.div
                    className="p-6 rounded-xl text-center min-w-[200px]"
                    style={{
                      background: colors.oceanDark,
                      border: `2px solid ${colors.glow.healthy}`,
                    }}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div
                      className="text-sm uppercase tracking-wider mb-2"
                      style={{ color: colors.glow.healthy }}
                    >
                      Path A
                    </div>
                    <div className="text-xl font-medium mb-2" style={{ color: colors.text.primary }}>
                      Index Scan
                    </div>
                    <div
                      className="text-4xl font-bold font-mono"
                      style={{ color: colors.glow.healthy }}
                    >
                      84
                    </div>
                    <div className="text-sm" style={{ color: colors.text.muted }}>
                      estimated cost
                    </div>
                  </motion.div>

                  {/* Path B - Sequential */}
                  <motion.div
                    className="p-6 rounded-xl text-center min-w-[200px]"
                    style={{
                      background: colors.oceanDark,
                      border: `2px solid ${colors.glow.warning}`,
                    }}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div
                      className="text-sm uppercase tracking-wider mb-2"
                      style={{ color: colors.glow.warning }}
                    >
                      Path B
                    </div>
                    <div className="text-xl font-medium mb-2" style={{ color: colors.text.primary }}>
                      Seq Scan
                    </div>
                    <div
                      className="text-4xl font-bold font-mono"
                      style={{ color: colors.glow.warning }}
                    >
                      847,293
                    </div>
                    <div className="text-sm" style={{ color: colors.text.muted }}>
                      estimated cost
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* The planner chooses... wrong */}
            {phase === 'choice' && (
              <motion.div
                key="choice"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-2xl mb-8" style={{ color: colors.text.secondary }}>
                  The planner chooses...
                </p>

                <motion.div
                  className="p-8 rounded-xl"
                  style={{
                    background: `${colors.glow.critical}20`,
                    border: `3px solid ${colors.glow.critical}`,
                  }}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  <div
                    className="text-3xl font-bold mb-2"
                    style={{ color: colors.glow.critical }}
                  >
                    Sequential Scan
                  </div>
                  <div className="text-lg" style={{ color: colors.text.muted }}>
                    Wait, what?
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Scanning animation */}
            {phase === 'scanning' && (
              <motion.div
                key="scanning"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-6xl md:text-8xl font-bold font-mono mb-4"
                  style={{ color: colors.glow.warning }}
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  847,293
                </motion.div>
                <p className="text-xl" style={{ color: colors.text.secondary }}>
                  pages being scanned...
                </p>

                {/* Progress bar */}
                <div
                  className="w-64 h-2 rounded-full mt-8 mx-auto overflow-hidden"
                  style={{ background: colors.oceanDark }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: colors.glow.warning }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3.5 }}
                  />
                </div>
              </motion.div>
            )}

            {/* Reveal why */}
            {phase === 'reveal' && (
              <motion.div
                key="reveal"
                className="text-center max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="p-6 rounded-xl mb-6"
                  style={{
                    background: colors.oceanDark,
                    border: `1px solid ${colors.glow.critical}40`,
                  }}
                >
                  <div className="space-y-3 text-left font-mono text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: colors.text.muted }}>Statistics last updated:</span>
                      <span style={{ color: colors.glow.critical }}>847 days ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: colors.text.muted }}>Estimated rows:</span>
                      <span style={{ color: colors.glow.critical }}>12</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: colors.text.muted }}>Actual rows:</span>
                      <span style={{ color: colors.glow.healthy }}>8,493,284</span>
                    </div>
                  </div>
                </motion.div>

                <motion.p
                  className="text-xl"
                  style={{ color: colors.text.secondary }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  The planner made a decision with{' '}
                  <span style={{ color: colors.glow.critical }}>old information</span>.
                </motion.p>
              </motion.div>
            )}

            {/* Question */}
            {phase === 'question' && (
              <motion.div
                key="question"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p
                  className="text-2xl md:text-4xl font-light leading-relaxed"
                  style={{ color: colors.text.primary }}
                >
                  How does PostgreSQL
                  <br />
                  <motion.span
                    style={{ color: colors.glow.healthy }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    choose its strategy?
                  </motion.span>
                </p>
              </motion.div>
            )}

            {/* Title */}
            {phase === 'title' && (
              <motion.div
                key="title"
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.p
                  className="text-sm uppercase tracking-[0.3em] mb-4"
                  style={{ color: colors.text.muted }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Episode 6
                </motion.p>

                <motion.h1
                  className="text-5xl md:text-7xl font-bold tracking-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span style={{ color: colors.text.primary }}>THE </span>
                  <span
                    style={{
                      background: `linear-gradient(135deg, ${colors.glow.healthy} 0%, ${colors.glow.warning} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    STRATEGY ROOM
                  </span>
                </motion.h1>

                <motion.p
                  className="text-lg mt-4"
                  style={{ color: colors.text.secondary }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Inside the Query Planner
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
