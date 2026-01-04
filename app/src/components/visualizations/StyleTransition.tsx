import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface StyleTransitionProps {
  onComplete?: () => void;
  autoStart?: boolean;
}

export function StyleTransition({ onComplete, autoStart = true }: StyleTransitionProps) {
  const [phase, setPhase] = useState<'characters' | 'morphing' | 'nodes' | 'text' | 'done'>(
    autoStart ? 'characters' : 'done'
  );

  useEffect(() => {
    if (!autoStart) return;

    const timeline = [
      { delay: 1500, action: () => setPhase('morphing') },
      { delay: 3000, action: () => setPhase('nodes') },
      { delay: 4500, action: () => setPhase('text') },
      { delay: 7500, action: () => { setPhase('done'); onComplete?.(); } },
    ];

    const timers = timeline.map(({ delay, action }) => setTimeout(action, delay));
    return () => timers.forEach(clearTimeout);
  }, [autoStart, onComplete]);

  if (phase === 'done') return null;

  return (
    <div className="py-16">
      <div className="relative h-80 flex items-center justify-center overflow-hidden">
        {/* Characters phase */}
        <AnimatePresence>
          {(phase === 'characters' || phase === 'morphing') && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center gap-32"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'morphing' ? 0.3 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Alice */}
              <motion.div
                className="flex flex-col items-center"
                animate={phase === 'morphing' ? { scale: 0.5, y: -20 } : {}}
                transition={{ duration: 0.8 }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                  style={{
                    background: `linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)`,
                    border: '3px solid #a78bfa',
                  }}
                >
                  👩
                </div>
                <p className="mt-2 font-medium" style={{ color: '#a78bfa' }}>Alice</p>
              </motion.div>

              {/* Center indicator */}
              <motion.div
                className="w-20 h-20 rounded-xl flex items-center justify-center"
                style={{
                  background: colors.oceanLight,
                  border: `2px solid ${colors.glow.healthy}`,
                }}
                animate={phase === 'morphing' ? { scale: 0.6 } : {}}
              >
                <span className="font-mono text-sm" style={{ color: colors.glow.healthy }}>
                  $100
                </span>
              </motion.div>

              {/* Bob */}
              <motion.div
                className="flex flex-col items-center"
                animate={phase === 'morphing' ? { scale: 0.5, y: -20 } : {}}
                transition={{ duration: 0.8 }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                  style={{
                    background: `linear-gradient(135deg, #34d399 0%, #059669 100%)`,
                    border: '3px solid #34d399',
                  }}
                >
                  👨
                </div>
                <p className="mt-2 font-medium" style={{ color: '#34d399' }}>Bob</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nodes phase - abstract representation */}
        <AnimatePresence>
          {(phase === 'nodes' || phase === 'text') && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Central resource */}
              <motion.div
                className="relative"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
              >
                <div
                  className="w-24 h-24 rounded-xl flex flex-col items-center justify-center"
                  style={{
                    background: colors.oceanLight,
                    border: `2px solid ${colors.glow.healthy}`,
                    boxShadow: `0 0 30px ${colors.glow.healthy}20`,
                  }}
                >
                  <span className="font-mono text-xs uppercase" style={{ color: colors.text.muted }}>
                    Resource
                  </span>
                  <span className="font-mono text-lg mt-1" style={{ color: colors.glow.healthy }}>
                    TABLE
                  </span>
                </div>

                {/* Orbiting transaction nodes */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i * 45 * Math.PI) / 180;
                  const radius = 100;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  const delay = i * 0.1;

                  return (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: i % 3 === 0
                          ? colors.glow.critical + '30'
                          : i % 2 === 0
                          ? colors.glow.warning + '30'
                          : colors.glow.healthy + '30',
                        border: `2px solid ${
                          i % 3 === 0
                            ? colors.glow.critical
                            : i % 2 === 0
                            ? colors.glow.warning
                            : colors.glow.healthy
                        }`,
                      }}
                      initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                      animate={{
                        x: x - 16,
                        y: y - 16,
                        opacity: 0.8,
                        scale: 1,
                      }}
                      transition={{ delay, duration: 0.5, type: 'spring' }}
                    >
                      <span className="font-mono text-xs" style={{ color: colors.text.muted }}>
                        T{i + 1}
                      </span>
                    </motion.div>
                  );
                })}

                {/* Connection lines */}
                <svg
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  width="240"
                  height="240"
                  style={{ overflow: 'visible' }}
                >
                  {Array.from({ length: 8 }).map((_, i) => {
                    const angle = (i * 45 * Math.PI) / 180;
                    const x = Math.cos(angle) * 100;
                    const y = Math.sin(angle) * 100;

                    return (
                      <motion.line
                        key={i}
                        x1={0}
                        y1={0}
                        x2={x}
                        y2={y}
                        stroke={colors.text.muted}
                        strokeWidth={1}
                        strokeOpacity={0.3}
                        strokeDasharray="4 4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
                      />
                    );
                  })}
                </svg>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transition text */}
        <AnimatePresence>
          {phase === 'text' && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 text-center pb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p
                className="text-lg md:text-xl font-light"
                style={{ color: colors.text.secondary }}
              >
                In production, these aren't just{' '}
                <span style={{ color: '#a78bfa' }}>Alice</span> and{' '}
                <span style={{ color: '#34d399' }}>Bob</span>.
              </p>
              <p
                className="text-lg md:text-xl font-light mt-2"
                style={{ color: colors.text.muted }}
              >
                They're{' '}
                <span style={{ color: colors.glow.warning }}>hundreds of connections</span>,
                each waiting in line.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
