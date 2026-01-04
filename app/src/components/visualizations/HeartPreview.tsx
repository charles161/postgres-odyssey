import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

interface HeartPreviewProps {
  isHovered?: boolean;
}

export function HeartPreview({ isHovered = false }: HeartPreviewProps) {
  return (
    <div className="relative w-48 h-56 flex items-center justify-center">
      {/* Radiating pulse rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute rounded-full"
          style={{
            width: 100 + i * 40,
            height: 100 + i * 40,
            border: `1px solid ${colors.glow.critical}`,
          }}
          animate={{
            scale: [1, 1.3, 1.3],
            opacity: [0.4, 0, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Ambient glow */}
      <motion.div
        className="absolute w-32 h-32 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.glow.critical}30 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          times: [0, 0.15, 1],
        }}
      />

      {/* The heart SVG */}
      <motion.svg
        viewBox="0 0 100 100"
        className="w-28 h-28 relative z-10"
        animate={{
          scale: [1, 1.15, 1, 1.08, 1],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          times: [0, 0.1, 0.2, 0.3, 1],
          ease: 'easeInOut',
        }}
      >
        <defs>
          <linearGradient id="heartGradientPreview" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.glow.critical} />
            <stop offset="100%" stopColor="#ff1a4d" />
          </linearGradient>
          <filter id="heartGlowPreview" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Heart shape - more anatomical */}
        <motion.path
          d="M50 88
             C50 88 15 60 15 38
             C15 20 28 12 50 30
             C72 12 85 20 85 38
             C85 60 50 88 50 88Z"
          fill="url(#heartGradientPreview)"
          filter="url(#heartGlowPreview)"
          animate={{
            fill: isHovered ? 'url(#heartGradientPreview)' : `${colors.glow.critical}`,
          }}
        />

        {/* Internal structure lines - ventricles */}
        <motion.path
          d="M50 30 L50 70 M35 50 Q50 60 65 50"
          fill="none"
          stroke={`${colors.glow.critical}60`}
          strokeWidth="1.5"
          animate={{
            opacity: isHovered ? 0.8 : 0.4,
          }}
        />

        {/* Aorta hint */}
        <motion.path
          d="M50 30 Q55 20 60 25 Q65 30 60 35"
          fill="none"
          stroke={`${colors.glow.critical}80`}
          strokeWidth="2"
          strokeLinecap="round"
          animate={{
            opacity: isHovered ? 1 : 0.6,
          }}
        />

        {/* Left artery */}
        <motion.path
          d="M40 28 Q30 20 25 25"
          fill="none"
          stroke={`${colors.glow.critical}80`}
          strokeWidth="2"
          strokeLinecap="round"
          animate={{
            opacity: isHovered ? 1 : 0.6,
          }}
        />
      </motion.svg>

      {/* EKG line */}
      <svg
        className="absolute bottom-8 w-full h-8"
        viewBox="0 0 200 30"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="ekgGradientPreview" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="20%" stopColor={colors.glow.critical} />
            <stop offset="80%" stopColor={colors.glow.critical} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* EKG baseline */}
        <line
          x1="0"
          y1="15"
          x2="200"
          y2="15"
          stroke={`${colors.glow.critical}20`}
          strokeWidth="1"
        />

        {/* EKG trace with animation */}
        <motion.path
          d="M0,15 L30,15 L35,15 L40,5 L45,25 L50,10 L55,15 L100,15 L105,15 L110,5 L115,25 L120,10 L125,15 L170,15 L175,15 L180,5 L185,25 L190,10 L195,15 L200,15"
          fill="none"
          stroke="url(#ekgGradientPreview)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{
            pathLength: [0, 1],
            opacity: [0.8, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            filter: `drop-shadow(0 0 4px ${colors.glow.critical}80)`,
          }}
        />
      </svg>

      {/* WAL label */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-mono"
        style={{
          background: `${colors.oceanDark}90`,
          color: colors.glow.critical,
          border: `1px solid ${colors.glow.critical}30`,
        }}
        animate={{
          borderColor: isHovered ? `${colors.glow.critical}60` : `${colors.glow.critical}30`,
        }}
      >
        WAL Writer
      </motion.div>
    </div>
  );
}
