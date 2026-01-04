import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

interface PagePreviewProps {
  isHovered?: boolean;
}

export function PagePreview({ isHovered = false }: PagePreviewProps) {
  // Generate tuple rows
  const tuples = [
    { width: 85, delay: 0 },
    { width: 70, delay: 0.1 },
    { width: 90, delay: 0.2 },
    { width: 65, delay: 0.3 },
    { width: 80, delay: 0.4 },
  ];

  return (
    <div className="relative w-48 h-56">
      {/* Ambient glow behind page */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.glow.healthy}20 0%, transparent 70%)`,
        }}
        animate={{
          opacity: isHovered ? 0.8 : 0.4,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* The page structure */}
      <svg viewBox="0 0 120 160" className="w-full h-full">
        {/* Page outline with gradient */}
        <defs>
          <linearGradient id="pageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.oceanLight} />
            <stop offset="100%" stopColor={colors.oceanDark} />
          </linearGradient>
          <linearGradient id="headerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={`${colors.glow.healthy}40`} />
            <stop offset="100%" stopColor={`${colors.glow.healthy}10`} />
          </linearGradient>
        </defs>

        {/* Page background */}
        <motion.rect
          x="10"
          y="10"
          width="100"
          height="140"
          rx="4"
          fill="url(#pageGradient)"
          stroke={colors.glow.healthy}
          strokeWidth="1.5"
          animate={{
            strokeWidth: isHovered ? 2 : 1.5,
            filter: isHovered
              ? `drop-shadow(0 0 8px ${colors.glow.healthy}60)`
              : `drop-shadow(0 0 4px ${colors.glow.healthy}30)`,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Page header (pd_lsn, etc.) */}
        <motion.rect
          x="10"
          y="10"
          width="100"
          height="20"
          rx="4"
          fill="url(#headerGradient)"
          animate={{
            opacity: isHovered ? 1 : 0.7,
          }}
        />

        {/* Header label */}
        <text
          x="60"
          y="24"
          textAnchor="middle"
          fill={colors.glow.healthy}
          fontSize="8"
          fontFamily="JetBrains Mono, monospace"
        >
          pd_lsn
        </text>

        {/* Line pointers section */}
        <motion.g
          animate={{
            opacity: isHovered ? 1 : 0.6,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.line
              key={`pointer-${i}`}
              x1={20 + i * 18}
              y1="35"
              x2={20 + i * 18}
              y2="45"
              stroke={colors.glow.healthy}
              strokeWidth="1"
              strokeDasharray="2 2"
              initial={{ pathLength: 0 }}
              animate={{
                pathLength: 1,
                opacity: isHovered ? 1 : 0.5,
              }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            />
          ))}
        </motion.g>

        {/* Free space indicator */}
        <rect
          x="15"
          y="50"
          width="90"
          height="40"
          fill={`${colors.ocean}80`}
          rx="2"
        />
        <text
          x="60"
          y="73"
          textAnchor="middle"
          fill={colors.text.muted}
          fontSize="7"
          fontFamily="JetBrains Mono, monospace"
        >
          free space
        </text>

        {/* Tuples - fill from bottom up */}
        {tuples.map((tuple, i) => (
          <motion.g key={`tuple-${i}`}>
            {/* Tuple background */}
            <motion.rect
              x={15 + (90 - tuple.width) / 2}
              y={145 - (i + 1) * 18}
              width={tuple.width}
              height="14"
              rx="2"
              fill={`${colors.glow.healthy}15`}
              stroke={`${colors.glow.healthy}40`}
              strokeWidth="1"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{
                scaleX: 1,
                opacity: isHovered ? 1 : 0.7,
              }}
              transition={{
                delay: tuple.delay,
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1] as const,
              }}
            />

            {/* Tuple data lines */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 0.8 : 0.4 }}
              transition={{ delay: tuple.delay + 0.2 }}
            >
              <rect
                x={20 + (90 - tuple.width) / 2}
                y={148 - (i + 1) * 18}
                width={tuple.width * 0.3}
                height="3"
                rx="1"
                fill={colors.glow.healthy}
                opacity="0.6"
              />
              <rect
                x={25 + tuple.width * 0.3 + (90 - tuple.width) / 2}
                y={148 - (i + 1) * 18}
                width={tuple.width * 0.5}
                height="3"
                rx="1"
                fill={colors.text.muted}
                opacity="0.4"
              />
            </motion.g>
          </motion.g>
        ))}

        {/* Breathing pulse effect */}
        <motion.rect
          x="10"
          y="10"
          width="100"
          height="140"
          rx="4"
          fill="transparent"
          stroke={colors.glow.healthy}
          strokeWidth="1"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            filter: `blur(4px)`,
          }}
        />
      </svg>

      {/* 8KB label */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-mono"
        style={{
          background: `${colors.oceanDark}90`,
          color: colors.glow.healthy,
          border: `1px solid ${colors.glow.healthy}30`,
        }}
        animate={{
          borderColor: isHovered ? `${colors.glow.healthy}60` : `${colors.glow.healthy}30`,
        }}
      >
        8KB Page
      </motion.div>
    </div>
  );
}
