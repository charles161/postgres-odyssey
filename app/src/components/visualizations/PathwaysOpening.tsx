import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface PathwaysOpeningProps {
  onComplete: () => void;
}

export function PathwaysOpening({ onComplete }: PathwaysOpeningProps) {
  const [phase, setPhase] = useState<
    'query' | 'scanning' | 'elapsed' | 'question' | 'title' | 'fade'
  >('query');
  const [currentPage, setCurrentPage] = useState(1);
  const [targetPage] = useState(847293);
  const totalPages = 1000000;

  // Phase timing
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Query appears
    timers.push(setTimeout(() => setPhase('scanning'), 2000));

    // Scanning for a few seconds
    timers.push(setTimeout(() => setPhase('elapsed'), 6000));

    // Show elapsed time
    timers.push(setTimeout(() => setPhase('question'), 9000));

    // Question appears
    timers.push(setTimeout(() => setPhase('title'), 12000));

    // Title appears
    timers.push(setTimeout(() => setPhase('fade'), 15000));

    // Complete
    timers.push(setTimeout(() => onComplete(), 16000));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Simulate page scanning during scanning phase
  useEffect(() => {
    if (phase !== 'scanning') return;

    const interval = setInterval(() => {
      setCurrentPage((prev) => {
        // Accelerate to show many pages flying by
        const increment = Math.floor(Math.random() * 50000) + 10000;
        return Math.min(prev + increment, targetPage);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [phase, targetPage]);

  return (
    <AnimatePresence>
      {phase !== 'fade' && (
        <motion.div
          className="fixed inset-0 flex flex-col items-center justify-center z-50"
          style={{ background: colors.ocean }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          {/* Query Display */}
          <AnimatePresence mode="wait">
            {phase === 'query' && (
              <motion.div
                key="query"
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <motion.code
                  className="block text-lg md:text-2xl font-mono px-6 py-4 rounded-lg mb-4"
                  style={{
                    background: colors.oceanDark,
                    color: colors.glow.healthy,
                    border: `1px solid ${colors.glow.healthy}40`,
                  }}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  SELECT * FROM users WHERE email = 'alice@example.com'
                </motion.code>
                <p className="text-sm" style={{ color: colors.text.muted }}>
                  A simple query. Just one row.
                </p>
              </motion.div>
            )}

            {phase === 'scanning' && (
              <motion.div
                key="scanning"
                className="text-center w-full max-w-2xl px-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Progress bar */}
                <div
                  className="h-2 rounded-full mb-6 overflow-hidden"
                  style={{ background: colors.oceanDark }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: colors.glow.warning }}
                    animate={{ width: `${(currentPage / totalPages) * 100}%` }}
                  />
                </div>

                {/* Page counter - flying numbers effect */}
                <div className="relative h-24 overflow-hidden mb-4">
                  <motion.div
                    className="text-5xl md:text-7xl font-mono font-bold"
                    style={{ color: colors.text.primary }}
                    animate={{ y: [-10, 0, 10, 0] }}
                    transition={{ duration: 0.2, repeat: Infinity }}
                  >
                    Page {currentPage.toLocaleString()}
                  </motion.div>
                </div>

                <p className="text-lg" style={{ color: colors.text.secondary }}>
                  of {totalPages.toLocaleString()} pages
                </p>

                {/* Flying page representations */}
                <div className="relative h-20 mt-8">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-8 h-10 rounded"
                      style={{
                        background: colors.oceanLight,
                        border: `1px solid ${colors.text.muted}40`,
                        left: `${10 + i * 12}%`,
                      }}
                      initial={{ y: 80, opacity: 0 }}
                      animate={{
                        y: [-80, 80],
                        opacity: [0, 1, 1, 0],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.08,
                        ease: 'linear',
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {phase === 'elapsed' && (
              <motion.div
                key="elapsed"
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Freeze effect */}
                <motion.div
                  className="text-7xl md:text-9xl font-bold mb-4"
                  style={{ color: colors.glow.critical }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0.8, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  3h 47m
                </motion.div>

                <p className="text-xl mb-8" style={{ color: colors.text.secondary }}>
                  Found at page {targetPage.toLocaleString()}
                </p>

                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-lg" style={{ color: colors.text.muted }}>
                    Every cell. Every page. Every row.
                  </p>
                  <p
                    className="text-lg font-medium"
                    style={{ color: colors.glow.warning }}
                  >
                    Just to find one email address.
                  </p>
                </motion.div>
              </motion.div>
            )}

            {phase === 'question' && (
              <motion.div
                key="question"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.p
                  className="text-2xl md:text-4xl font-light leading-relaxed"
                  style={{ color: colors.text.primary }}
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                >
                  What if the database
                  <br />
                  <motion.span
                    style={{ color: colors.glow.healthy }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    already knew where to look?
                  </motion.span>
                </motion.p>
              </motion.div>
            )}

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
                  Episode 5
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
                    PATHWAYS
                  </span>
                </motion.h1>

                <motion.p
                  className="text-lg mt-4"
                  style={{ color: colors.text.secondary }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  How indexes give PostgreSQL a memory
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
