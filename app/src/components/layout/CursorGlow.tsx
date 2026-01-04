import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCursorGlow, animateCursorFollow } from '../../hooks/useCursorGlow';
import { colors } from '../../config/theme';

export function CursorGlow() {
  const { position, isHovering, isVisible } = useCursorGlow();
  const glowRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  // Animate the glow to follow cursor with delay
  useEffect(() => {
    if (glowRef.current) {
      animateCursorFollow(glowRef.current, position, 0.1);
    }
    if (trailRef.current) {
      animateCursorFollow(trailRef.current, position, 0.15);
    }
  }, [position]);

  // Don't render on touch devices
  if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Main glow */}
          <motion.div
            ref={glowRef}
            className="fixed pointer-events-none z-[9999]"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: isHovering ? 0.8 : 0.4,
              scale: isHovering ? 1.5 : 1,
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              left: 0,
              top: 0,
              width: 24,
              height: 24,
              marginLeft: -12,
              marginTop: -12,
              background: `radial-gradient(circle, ${colors.glow.healthy}40 0%, transparent 70%)`,
              borderRadius: '50%',
              filter: 'blur(2px)',
            }}
          />

          {/* Trailing glow (slower follow) */}
          <motion.div
            ref={trailRef}
            className="fixed pointer-events-none z-[9998]"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{
              opacity: 0.2,
              scale: isHovering ? 2 : 1.2,
            }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              left: 0,
              top: 0,
              width: 40,
              height: 40,
              marginLeft: -20,
              marginTop: -20,
              background: `radial-gradient(circle, ${colors.glow.healthy}20 0%, transparent 60%)`,
              borderRadius: '50%',
              filter: 'blur(4px)',
            }}
          />

          {/* Outer ambient glow */}
          <motion.div
            className="fixed pointer-events-none z-[9997]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            style={{
              left: position.x - 60,
              top: position.y - 60,
              width: 120,
              height: 120,
              background: `radial-gradient(circle, ${colors.glow.healthy}10 0%, transparent 50%)`,
              borderRadius: '50%',
              filter: 'blur(8px)',
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}
