import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from '../../lib/gsap';
import { colors } from '../../config/theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface TextRevealProps {
  children: string;
  isActive?: boolean;
  variant?: 'words' | 'chars' | 'lines';
  stagger?: number;
  className?: string;
  highlightWord?: string;
  onComplete?: () => void;
}

export function TextReveal({
  children,
  isActive = true,
  variant: _variant = 'words',
  stagger = 0.12,
  className = '',
  highlightWord,
  onComplete,
}: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Split text into words
  const words = children.split(' ');

  useEffect(() => {
    if (!isActive || !containerRef.current || isRevealed) return;

    // Skip animation for reduced motion preference
    if (prefersReducedMotion) {
      setIsRevealed(true);
      onComplete?.();
      return;
    }

    const elements = containerRef.current.querySelectorAll('.reveal-word');

    const tl = gsap.timeline({
      onComplete: () => {
        setIsRevealed(true);
        onComplete?.();
      },
    });

    tl.from(elements, {
      y: 50,
      opacity: 0,
      duration: 0.6,
      stagger,
      ease: 'power3.out',
    });

    return () => {
      tl.kill();
    };
  }, [isActive, isRevealed, stagger, onComplete, prefersReducedMotion]);

  return (
    <div ref={containerRef} className={className}>
      <AnimatePresence>
        {words.map((word, index) => {
          const isHighlight = highlightWord && word.toLowerCase().includes(highlightWord.toLowerCase());

          return (
            <span
              key={index}
              className="reveal-word inline-block mr-[0.25em]"
              style={{
                color: isHighlight ? colors.glow.healthy : colors.text.primary,
                textShadow: isHighlight
                  ? `0 0 20px ${colors.glow.healthy}60, 0 0 40px ${colors.glow.healthy}30`
                  : 'none',
              }}
            >
              {word}
            </span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Special opening text reveal - single shot cinematic reveal
interface OpeningRevealProps {
  onComplete?: () => void;
}

export function OpeningReveal({ onComplete }: OpeningRevealProps) {
  const [phase, setPhase] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // If user prefers reduced motion, skip the intro entirely
  useEffect(() => {
    if (prefersReducedMotion) {
      onComplete?.();
    }
  }, [prefersReducedMotion, onComplete]);

  useEffect(() => {
    // Skip timeline if reduced motion is preferred
    if (prefersReducedMotion) return;

    // Simplified timeline:
    // Phase 0: Black screen (1.5s)
    // Phase 1: "Before there was a query..." fades in as ONE line
    // Phase 2: Hold, let it breathe
    // Phase 3: First line dims, "there was a page" rises with glow
    // Phase 4: Complete

    const timeline = [
      { delay: 1500, nextPhase: 1 },  // Initial black
      { delay: 800, nextPhase: 2 },   // Line 1 fade in complete
      { delay: 2000, nextPhase: 3 },  // Hold for reading
      { delay: 1200, nextPhase: 4 },  // Transition to page reveal
    ];

    let timeoutId: ReturnType<typeof setTimeout>;

    if (phase < timeline.length) {
      const current = timeline[phase];
      timeoutId = setTimeout(() => {
        setPhase(current.nextPhase);
      }, current.delay);
    } else if (phase === 4) {
      onComplete?.();
    }

    return () => clearTimeout(timeoutId);
  }, [phase, onComplete, prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: colors.ocean }}
    >
      <div className="text-center max-w-4xl px-8">
        {/* "Before there was a query..." - single line reveal */}
        <motion.p
          className="text-4xl md:text-6xl font-light leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: phase >= 1 ? (phase >= 3 ? 0.25 : 1) : 0,
            y: phase >= 1 ? 0 : 20,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ color: colors.text.primary }}
        >
          Before there was a query...
        </motion.p>

        {/* "there was a page" - rises after the first line dims */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{
            opacity: phase >= 3 ? 1 : 0,
            y: phase >= 3 ? 0 : 40,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <span
            className="text-3xl md:text-5xl font-light"
            style={{ color: colors.text.secondary }}
          >
            there was a{' '}
          </span>
          <span
            className="text-4xl md:text-6xl font-medium"
            style={{
              color: colors.glow.healthy,
              textShadow: `0 0 30px ${colors.glow.healthy}80, 0 0 60px ${colors.glow.healthy}40`,
            }}
          >
            page
          </span>
        </motion.div>

        {/* 8,192 bytes */}
        <motion.p
          className="mt-16 text-lg tracking-[0.2em] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 3 ? 0.5 : 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          style={{ color: colors.text.muted }}
        >
          8,192 bytes of possibility
        </motion.p>
      </div>
    </div>
  );
}
