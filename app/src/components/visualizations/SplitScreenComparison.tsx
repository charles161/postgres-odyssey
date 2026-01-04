import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';
import { pathwayMotion } from '../../config/animation';

export function SplitScreenComparison() {
  const [isRunning, setIsRunning] = useState(false);
  const [seqScanCount, setSeqScanCount] = useState(0);
  const [indexCount, setIndexCount] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'running' | 'complete'>('idle');

  const targetSeqScan = 847293;
  const targetIndex = 3;

  const runComparison = useCallback(async () => {
    setIsRunning(true);
    setPhase('running');
    setSeqScanCount(0);
    setIndexCount(0);

    // Animate index count quickly (3 pages)
    const indexDuration = 600;
    const indexStart = Date.now();
    const animateIndex = () => {
      const elapsed = Date.now() - indexStart;
      const progress = Math.min(elapsed / indexDuration, 1);
      setIndexCount(Math.floor(progress * targetIndex));
      if (progress < 1) {
        requestAnimationFrame(animateIndex);
      }
    };
    requestAnimationFrame(animateIndex);

    // Animate seq scan count (fast counter roll effect)
    const seqDuration = pathwayMotion.counterRoll.duration * 1000;
    const seqStart = Date.now();
    const animateSeq = () => {
      const elapsed = Date.now() - seqStart;
      const progress = Math.min(elapsed / seqDuration, 1);
      // Use easeOut for dramatic effect
      const eased = 1 - Math.pow(1 - progress, 3);
      setSeqScanCount(Math.floor(eased * targetSeqScan));
      if (progress < 1) {
        requestAnimationFrame(animateSeq);
      }
    };
    requestAnimationFrame(animateSeq);

    await delay(seqDuration + 500);
    setPhase('complete');
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setSeqScanCount(0);
    setIndexCount(0);
    setIsRunning(false);
  }, []);

  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: colors.oceanDark,
        border: `1px solid ${colors.text.muted}20`,
      }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-medium" style={{ color: colors.text.primary }}>
            The Difference
          </h3>
          <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
            Sequential scan vs. B-tree index lookup
          </p>
        </div>

        <motion.button
          className="px-4 py-2 rounded-lg text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={phase === 'idle' || phase === 'complete' ? runComparison : reset}
          disabled={isRunning}
          style={{
            background: `${colors.glow.healthy}20`,
            color: colors.glow.healthy,
            border: `1px solid ${colors.glow.healthy}40`,
            cursor: isRunning ? 'wait' : 'pointer',
          }}
        >
          {phase === 'idle' ? 'Compare' : phase === 'complete' ? 'Run Again' : 'Running...'}
        </motion.button>
      </div>

      {/* Split Screen Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Sequential Scan - VISUAL CHAOS */}
        <motion.div
          className="p-6 rounded-xl relative overflow-hidden"
          style={{
            background: colors.ocean,
            border: `2px solid ${colors.glow.critical}40`,
          }}
          animate={
            phase === 'running'
              ? {
                  borderColor: [colors.glow.critical + '40', colors.glow.critical, colors.glow.critical + '40'],
                  x: [0, -2, 2, -1, 0],
                }
              : {}
          }
          transition={{
            duration: 0.3,
            repeat: phase === 'running' ? Infinity : 0,
            x: { duration: 0.15, repeat: Infinity },
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <motion.div
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ background: `${colors.glow.critical}20`, color: colors.glow.critical }}
              animate={phase === 'running' ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 0.2, repeat: Infinity }}
            >
              SEQUENTIAL SCAN
            </motion.div>
            {phase === 'running' && (
              <motion.span
                className="text-xs"
                style={{ color: colors.glow.critical }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                ⚠ SLOW
              </motion.span>
            )}
          </div>

          {/* Counter with shake */}
          <motion.div
            className="text-5xl md:text-6xl font-bold font-mono text-center mb-4 relative z-10"
            style={{ color: colors.glow.critical }}
            animate={
              phase === 'running'
                ? {
                    opacity: [1, 0.7, 1],
                    scale: [1, 0.98, 1],
                  }
                : {}
            }
            transition={{ duration: 0.2, repeat: phase === 'running' ? Infinity : 0 }}
          >
            {seqScanCount.toLocaleString()}
          </motion.div>

          <p className="text-center text-sm mb-4 relative z-10" style={{ color: colors.text.muted }}>
            pages scanned
          </p>

          {/* Time estimate with growing urgency */}
          <motion.div
            className="p-3 rounded-lg text-center relative z-10"
            style={{ background: colors.oceanDark }}
            animate={phase === 'running' ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <motion.div
              className="text-xl font-bold"
              style={{ color: colors.glow.critical }}
              animate={phase === 'running' ? { opacity: [1, 0.6, 1] } : {}}
              transition={{ duration: 0.4, repeat: Infinity }}
            >
              3h 47m
            </motion.div>
            <div className="text-xs" style={{ color: colors.text.muted }}>
              estimated time
            </div>
          </motion.div>

          {/* CHAOS LAYER 1: Fast scrolling page bars */}
          <AnimatePresence>
            {phase === 'running' && (
              <motion.div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="flex flex-col gap-1"
                  animate={{ y: [0, -800] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                  {[...Array(50)].map((_, i) => (
                    <div
                      key={i}
                      className="h-3 mx-4 rounded"
                      style={{
                        background: colors.glow.critical,
                        opacity: Math.random() * 0.5 + 0.5,
                        width: `${Math.random() * 30 + 60}%`,
                      }}
                    />
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CHAOS LAYER 2: Random page numbers flying by */}
          <AnimatePresence>
            {phase === 'running' && (
              <motion.div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                exit={{ opacity: 0 }}
              >
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-xs font-mono"
                    style={{
                      color: colors.glow.critical,
                      left: `${10 + Math.random() * 80}%`,
                    }}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{
                      y: ['-20px', '120%'],
                      opacity: [0, 0.8, 0.8, 0],
                    }}
                    transition={{
                      duration: 1.2 + Math.random() * 0.5,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: 'linear',
                    }}
                  >
                    pg_{Math.floor(Math.random() * 800000)}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* CHAOS LAYER 3: Scan beam moving across */}
          <AnimatePresence>
            {phase === 'running' && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute left-0 right-0 h-8"
                  style={{
                    background: `linear-gradient(180deg, transparent, ${colors.glow.critical}30, transparent)`,
                  }}
                  animate={{ top: ['0%', '100%'] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right: B-tree Index */}
        <motion.div
          className="p-6 rounded-xl relative"
          style={{
            background: colors.ocean,
            border: `2px solid ${colors.glow.healthy}40`,
          }}
          animate={
            phase === 'complete'
              ? { borderColor: colors.glow.healthy, boxShadow: `0 0 30px ${colors.glow.healthy}30` }
              : {}
          }
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ background: `${colors.glow.healthy}20`, color: colors.glow.healthy }}
            >
              B-TREE INDEX
            </div>
          </div>

          {/* Counter */}
          <motion.div
            className="text-5xl md:text-6xl font-bold font-mono text-center mb-4"
            style={{ color: colors.glow.healthy }}
            animate={phase === 'complete' ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            {indexCount}
          </motion.div>

          <p className="text-center text-sm mb-4" style={{ color: colors.text.muted }}>
            pages read
          </p>

          {/* Time estimate */}
          <div
            className="p-3 rounded-lg text-center"
            style={{ background: colors.oceanDark }}
          >
            <div className="text-xl font-bold" style={{ color: colors.glow.healthy }}>
              0.003ms
            </div>
            <div className="text-xs" style={{ color: colors.text.muted }}>
              actual time
            </div>
          </div>

          {/* Mini tree visualization */}
          <div className="mt-4 flex justify-center">
            <svg width="120" height="80" viewBox="0 0 120 80">
              {/* Root */}
              <motion.circle
                cx="60"
                cy="15"
                r="10"
                fill={phase !== 'idle' ? colors.glow.healthy : colors.text.muted + '40'}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: phase !== 'idle' ? 1 : 0.3 }}
              />
              {/* Internal nodes */}
              <motion.circle
                cx="30"
                cy="45"
                r="8"
                fill={indexCount >= 2 ? colors.glow.healthy : colors.text.muted + '40'}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: indexCount >= 2 ? 1 : 0.3 }}
                transition={{ delay: 0.2 }}
              />
              <motion.circle
                cx="90"
                cy="45"
                r="8"
                fill={colors.text.muted + '20'}
              />
              {/* Leaf nodes */}
              <motion.circle
                cx="15"
                cy="70"
                r="6"
                fill={indexCount >= 3 ? colors.glow.healthy : colors.text.muted + '40'}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: indexCount >= 3 ? 1 : 0.3 }}
                transition={{ delay: 0.4 }}
              />
              <motion.circle
                cx="45"
                cy="70"
                r="6"
                fill={colors.text.muted + '20'}
              />
              {/* Connecting lines */}
              <line x1="60" y1="25" x2="30" y2="37" stroke={colors.text.muted + '40'} />
              <line x1="60" y1="25" x2="90" y2="37" stroke={colors.text.muted + '40'} />
              <line x1="30" y1="53" x2="15" y2="64" stroke={colors.text.muted + '40'} />
              <line x1="30" y1="53" x2="45" y2="64" stroke={colors.text.muted + '40'} />
            </svg>
          </div>
        </motion.div>
      </div>

      {/* Result Summary with Haptic Snap-back */}
      <AnimatePresence>
        {phase === 'complete' && (
          <motion.div
            className="mt-6 p-4 rounded-lg text-center"
            style={{
              background: `${colors.glow.healthy}10`,
              border: `1px solid ${colors.glow.healthy}40`,
            }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: [0.9, 1.08, 0.98, 1], // Haptic snap-back
            }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.5,
              scale: { duration: 0.4, times: [0, 0.5, 0.8, 1], ease: 'easeOut' },
            }}
          >
            <motion.p
              className="text-xl font-medium"
              style={{ color: colors.text.primary }}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.15, 1] }} // Extra punch on the number
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <span style={{ color: colors.glow.healthy }}>
                {Math.round(targetSeqScan / targetIndex).toLocaleString()}×
              </span>{' '}
              fewer pages read
            </motion.p>
            <p className="text-sm mt-2" style={{ color: colors.text.muted }}>
              Same data. Same query. Different strategy.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explanation */}
      <div
        className="mt-6 p-4 rounded-lg text-sm"
        style={{ background: colors.ocean }}
      >
        <p style={{ color: colors.text.secondary }}>
          <span style={{ color: colors.glow.critical }}>Sequential scan</span>: Read every page,
          check every row.
        </p>
        <p className="mt-1" style={{ color: colors.text.secondary }}>
          <span style={{ color: colors.glow.healthy }}>Index lookup</span>: Tree navigation (3
          levels) straight to the data.
        </p>
        <p className="mt-2" style={{ color: colors.text.muted }}>
          As your table grows from 1M to 100M rows, the index still needs just 3-4 page reads.
          O(log n) vs O(n).
        </p>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
