import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from '../../lib/gsap';
import { colors } from '../../config/theme';

interface HeartProps {
  isRevealed: boolean;
  isHovered: boolean;
  onClick?: () => void;
  onHover?: () => void;
  onLeave?: () => void;
}

export function Heart({ isRevealed, isHovered, onClick, onHover, onLeave }: HeartProps) {
  const glowRef = useRef<SVGCircleElement>(null);

  // Subtle glow pulse - the only continuous animation
  useEffect(() => {
    if (!glowRef.current || !isRevealed) return;

    const pulse = gsap.to(glowRef.current, {
      opacity: 0.6,
      scale: 1.1,
      duration: 1.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    return () => {
      pulse.kill();
    };
  }, [isRevealed]);

  return (
    <motion.g
      className="cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: isRevealed ? 1 : 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Subtle ambient glow behind heart */}
      <circle
        ref={glowRef}
        cx="200"
        cy="175"
        r="35"
        fill={colors.glow.healthy}
        opacity="0.15"
        style={{ transformOrigin: '200px 175px' }}
      />

      {/* Heart shape - simple and clean */}
      <motion.path
        d="M200 205
           C200 205, 170 175, 170 160
           C170 145, 182 138, 200 155
           C218 138, 230 145, 230 160
           C230 175, 200 205, 200 205"
        fill="none"
        stroke={colors.glow.healthy}
        strokeWidth="1.5"
        animate={{
          fill: isHovered ? `${colors.glow.healthy}20` : 'none',
          strokeWidth: isHovered ? 2 : 1.5,
        }}
        transition={{ duration: 0.3 }}
        style={{
          filter: isHovered
            ? `drop-shadow(0 0 12px ${colors.glow.healthy}80)`
            : `drop-shadow(0 0 6px ${colors.glow.healthy}40)`,
        }}
      />

      {/* Label */}
      <motion.text
        x="200"
        y="240"
        textAnchor="middle"
        fill={colors.text.primary}
        fontSize="14"
        fontWeight="500"
        animate={{ opacity: isHovered ? 1 : 0.7 }}
      >
        WAL Writer
      </motion.text>
      <motion.text
        x="200"
        y="256"
        textAnchor="middle"
        fill={colors.text.secondary}
        fontSize="11"
        animate={{ opacity: isHovered ? 1 : 0 }}
      >
        The Heartbeat
      </motion.text>
    </motion.g>
  );
}
