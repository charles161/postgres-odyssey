import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

export function FeverPreview() {
  const [isHovered, setIsHovered] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);

  // Animate waiting count on hover
  useEffect(() => {
    if (!isHovered) {
      setWaitingCount(0);
      return;
    }

    const interval = setInterval(() => {
      setWaitingCount((prev) => {
        if (prev >= 47) return 47;
        return prev + Math.floor(Math.random() * 5) + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div
      className="relative w-full h-48 flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background warmth on hover */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, ${colors.glow.critical}10 0%, transparent 70%)`,
        }}
        animate={{ opacity: isHovered ? 0.6 : 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* Central blocker node */}
      <div className="relative">
        <motion.div
          className="w-16 h-16 rounded-full flex items-center justify-center relative"
          style={{
            background: colors.oceanLight,
            border: `2px solid ${isHovered ? colors.glow.critical : colors.glow.warning}`,
          }}
          animate={{
            boxShadow: isHovered
              ? [
                  `0 0 10px ${colors.glow.critical}30`,
                  `0 0 30px ${colors.glow.critical}50`,
                  `0 0 10px ${colors.glow.critical}30`,
                ]
              : `0 0 10px ${colors.glow.warning}20`,
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span
            className="font-mono text-xs font-bold"
            style={{ color: isHovered ? colors.glow.critical : colors.glow.warning }}
          >
            LOCK
          </span>
        </motion.div>

        {/* Waiting nodes */}
        {isHovered &&
          Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const x = Math.cos(angle) * 50;
            const y = Math.sin(angle) * 40;

            return (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  marginLeft: -6,
                  marginTop: -6,
                  background: colors.glow.warning,
                }}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                animate={{
                  opacity: 0.7,
                  x,
                  y,
                  scale: 1,
                }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              />
            );
          })}

        {/* Connection lines on hover */}
        {isHovered && (
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ left: -30, top: -20, width: 80, height: 60, overflow: 'visible' }}
          >
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45 * Math.PI) / 180;
              const x2 = Math.cos(angle) * 50 + 40;
              const y2 = Math.sin(angle) * 40 + 30;

              return (
                <motion.line
                  key={i}
                  x1={40}
                  y1={30}
                  x2={x2}
                  y2={y2}
                  stroke={colors.glow.warning}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.4 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                />
              );
            })}
          </svg>
        )}
      </div>

      {/* Waiting count */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center"
        animate={{ opacity: isHovered ? 1 : 0.6 }}
      >
        <motion.div
          className="font-mono text-2xl font-bold"
          style={{ color: waitingCount > 20 ? colors.glow.critical : colors.glow.warning }}
        >
          {waitingCount > 0 ? waitingCount : '—'}
        </motion.div>
        <p
          className="text-xs font-mono uppercase tracking-wider"
          style={{ color: colors.text.muted }}
        >
          waiting
        </p>
      </motion.div>

      {/* Arrhythmic pulse effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${colors.glow.warning}08 0%, transparent 50%)`,
        }}
        animate={{
          opacity: isHovered ? [0.3, 0.5, 0.2, 0.4, 0.3] : 0.2,
          scale: isHovered ? [1, 1.02, 1, 1.01, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          times: [0, 0.2, 0.4, 0.7, 1],
        }}
      />
    </div>
  );
}
