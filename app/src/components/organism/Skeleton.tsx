import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

interface SkeletonProps {
  isRevealed: boolean;
  isHovered: boolean;
  onClick?: () => void;
  onHover?: () => void;
  onLeave?: () => void;
}

export function Skeleton({ isRevealed, isHovered, onClick, onHover, onLeave }: SkeletonProps) {
  // Page blocks representing 8KB pages
  const pages = [
    { x: 140, y: 320, width: 40, height: 50 },
    { x: 185, y: 320, width: 40, height: 50 },
    { x: 230, y: 320, width: 40, height: 50 },
    { x: 162, y: 290, width: 40, height: 50 },
    { x: 207, y: 290, width: 40, height: 50 },
  ];

  return (
    <motion.g
      className="cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: isRevealed ? 1 : 0,
        y: isRevealed ? 0 : 20,
      }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Foundation line */}
      <motion.line
        x1="100"
        y1="380"
        x2="300"
        y2="380"
        stroke={colors.glow.healthy}
        strokeWidth="2"
        strokeDasharray="4 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isRevealed ? 1 : 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        style={{
          filter: `drop-shadow(0 0 5px ${colors.glow.healthy}40)`,
        }}
      />

      {/* 8KB Page blocks */}
      {pages.map((page, index) => (
        <motion.g
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isRevealed ? 1 : 0,
            scale: isRevealed ? 1 : 0.8,
          }}
          transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
        >
          <motion.rect
            x={page.x}
            y={page.y}
            width={page.width}
            height={page.height}
            rx="4"
            fill={isHovered ? `${colors.glow.healthy}20` : `${colors.ocean}80`}
            stroke={colors.glow.healthy}
            strokeWidth={isHovered ? 2 : 1}
            animate={{
              fill: isHovered ? `${colors.glow.healthy}30` : `${colors.oceanLight}80`,
            }}
            transition={{ duration: 0.2 }}
            style={{
              filter: isHovered
                ? `drop-shadow(0 0 8px ${colors.glow.healthy}60)`
                : 'none',
            }}
          />

          {/* Page header indicator */}
          <rect
            x={page.x}
            y={page.y}
            width={page.width}
            height={6}
            rx="2"
            fill={`${colors.glow.healthy}40`}
          />

          {/* Tuple lines */}
          {[0, 1, 2].map((line) => (
            <line
              key={line}
              x1={page.x + 5}
              y1={page.y + page.height - 8 - line * 10}
              x2={page.x + page.width - 5}
              y2={page.y + page.height - 8 - line * 10}
              stroke={`${colors.glow.healthy}30`}
              strokeWidth="2"
            />
          ))}
        </motion.g>
      ))}

      {/* 8KB label */}
      <motion.text
        x="200"
        y="350"
        textAnchor="middle"
        fill={colors.glow.healthy}
        fontSize="10"
        fontFamily="JetBrains Mono, monospace"
        animate={{ opacity: isHovered ? 1 : 0.5 }}
      >
        8KB
      </motion.text>

      {/* Label */}
      <motion.text
        x="200"
        y="405"
        textAnchor="middle"
        fill={colors.text.primary}
        fontSize="14"
        fontWeight="500"
        animate={{ opacity: isHovered ? 1 : 0.7 }}
      >
        Storage Layer
      </motion.text>
      <motion.text
        x="200"
        y="423"
        textAnchor="middle"
        fill={colors.text.secondary}
        fontSize="11"
        animate={{ opacity: isHovered ? 1 : 0 }}
      >
        Genesis - Episode 1
      </motion.text>

      {/* "Start Here" indicator for unlocked state */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: isRevealed ? 1 : 0 }}
        transition={{ delay: 1 }}
      >
        <motion.circle
          cx="270"
          cy="310"
          r="20"
          fill={`${colors.glow.healthy}20`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <text
          x="270"
          y="315"
          textAnchor="middle"
          fill={colors.glow.healthy}
          fontSize="10"
          fontWeight="bold"
        >
          START
        </text>
      </motion.g>
    </motion.g>
  );
}
