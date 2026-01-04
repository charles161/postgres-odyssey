import { useState } from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

export function ManyLivesPreview() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative w-full h-48 flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background glow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, ${colors.glow.healthy}10 0%, transparent 70%)`,
        }}
        animate={{ opacity: isHovered ? 0.8 : 0.3 }}
        transition={{ duration: 0.4 }}
      />

      {/* Transaction labels */}
      <motion.div
        className="absolute left-4 top-4 flex flex-col gap-2 text-xs font-mono"
        animate={{ opacity: isHovered ? 1 : 0.5 }}
      >
        <div
          className="px-2 py-1 rounded"
          style={{ background: colors.glow.healthy + '20', color: colors.glow.healthy }}
        >
          TXN 100
        </div>
        <div
          className="px-2 py-1 rounded"
          style={{ background: colors.glow.warning + '20', color: colors.glow.warning }}
        >
          TXN 105
        </div>
      </motion.div>

      {/* Center tuple that splits */}
      <div className="relative">
        {/* Original single tuple (fades out on hover) */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-lg font-mono text-lg"
          style={{
            background: colors.oceanLight,
            border: `2px solid ${colors.glow.healthy}40`,
            color: colors.text.primary,
          }}
          animate={{
            opacity: isHovered ? 0 : 1,
            scale: isHovered ? 0.8 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          balance = ?
        </motion.div>

        {/* Left split - TXN 100 sees $1,000 */}
        <motion.div
          className="absolute px-5 py-3 rounded-lg font-mono"
          style={{
            background: colors.oceanLight,
            border: `2px solid ${colors.glow.healthy}`,
            color: colors.glow.healthy,
            boxShadow: `0 0 20px ${colors.glow.healthy}30`,
          }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            x: isHovered ? -60 : 0,
            y: isHovered ? -10 : 0,
            rotate: isHovered ? -5 : 0,
          }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-sm" style={{ color: colors.text.muted }}>
            balance =
          </span>{' '}
          $1,000
        </motion.div>

        {/* Right split - TXN 105 sees $1,500 */}
        <motion.div
          className="absolute px-5 py-3 rounded-lg font-mono"
          style={{
            background: colors.oceanLight,
            border: `2px solid ${colors.glow.warning}`,
            color: colors.glow.warning,
            boxShadow: `0 0 20px ${colors.glow.warning}30`,
          }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            x: isHovered ? 50 : 0,
            y: isHovered ? 15 : 0,
            rotate: isHovered ? 5 : 0,
          }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        >
          <span className="text-sm" style={{ color: colors.text.muted }}>
            balance =
          </span>{' '}
          $1,500
        </motion.div>

        {/* Connection lines (visible on hover) */}
        <svg
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          width="200"
          height="100"
          style={{ overflow: 'visible' }}
        >
          <motion.path
            d="M -40 -20 L -80 -30"
            stroke={colors.glow.healthy}
            strokeWidth="2"
            fill="none"
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: isHovered ? 1 : 0,
              opacity: isHovered ? 0.6 : 0,
            }}
            transition={{ duration: 0.3 }}
          />
          <motion.path
            d="M 40 10 L 70 25"
            stroke={colors.glow.warning}
            strokeWidth="2"
            fill="none"
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: isHovered ? 1 : 0,
              opacity: isHovered ? 0.6 : 0,
            }}
            transition={{ duration: 0.3, delay: 0.1 }}
          />
        </svg>
      </div>

      {/* Bottom label */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-mono uppercase tracking-wider"
        style={{ color: colors.text.muted }}
        animate={{ opacity: isHovered ? 1 : 0.6 }}
      >
        xmin / xmax visibility
      </motion.div>

      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(105deg, transparent 40%, ${colors.glow.healthy}10 50%, transparent 60%)`,
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: isHovered ? ['200% 0', '-200% 0'] : '200% 0',
        }}
        transition={{
          duration: 1.5,
          ease: 'linear',
          repeat: isHovered ? Infinity : 0,
        }}
      />
    </div>
  );
}
