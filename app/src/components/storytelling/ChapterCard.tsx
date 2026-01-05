import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

interface ChapterCardProps {
  message: string;
  subtext?: string;
  accentColor?: string;
  onComplete?: () => void;
  holdDuration?: number;
  autoStart?: boolean;
}

export function ChapterCard({
  message,
  subtext,
  accentColor = colors.text.primary,
  onComplete,
  holdDuration = 2000,
  autoStart = true,
}: ChapterCardProps) {
  const [phase, setPhase] = useState<'entering' | 'holding' | 'exiting' | 'done'>(
    autoStart ? 'entering' : 'done'
  );
  const words = message.split(' ');

  useEffect(() => {
    if (!autoStart) return;

    // Calculate total animation time for words
    const wordAnimationTime = words.length * 120 + 500; // stagger + duration

    // After words animate in, hold
    const holdTimer = setTimeout(() => {
      setPhase('holding');
    }, wordAnimationTime);

    // After hold, exit
    const exitTimer = setTimeout(() => {
      setPhase('exiting');
    }, wordAnimationTime + holdDuration);

    // After exit animation, done
    const doneTimer = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, wordAnimationTime + holdDuration + 800);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [autoStart, words.length, holdDuration, onComplete]);

  if (phase === 'done') return null;

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center px-8"
      style={{ background: colors.ocean }}
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === 'exiting' ? 0 : 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-4xl text-center">
        {/* Main message - word by word */}
        <p className="text-3xl md:text-5xl lg:text-6xl font-light leading-tight">
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.3em]"
              style={{ color: accentColor }}
              initial={{ opacity: 0, y: 30, rotateX: -40 }}
              animate={{
                opacity: phase !== 'exiting' ? 1 : 0,
                y: phase !== 'exiting' ? 0 : -20,
                rotateX: 0,
              }}
              transition={{
                delay: i * 0.12,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {word}
            </motion.span>
          ))}
        </p>

        {/* Subtext */}
        {subtext && (
          <motion.p
            className="mt-8 text-lg md:text-xl"
            style={{ color: colors.text.muted }}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: phase === 'holding' ? 1 : 0,
              y: phase === 'holding' ? 0 : 20,
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {subtext}
          </motion.p>
        )}

        {/* Decorative line */}
        <motion.div
          className="mx-auto mt-8 h-px"
          style={{ background: `${accentColor}40` }}
          initial={{ width: 0 }}
          animate={{ width: phase === 'holding' ? 120 : 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </motion.div>
  );
}

// Inline version for use within scenes (not full-screen overlay)
export function ChapterCardInline({
  message,
  accentColor = colors.text.primary,
}: {
  message: string;
  accentColor?: string;
}) {
  const words = message.split(' ');

  return (
    <motion.div
      className="py-24 text-center"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
    >
      <p className="text-2xl md:text-4xl font-light leading-tight max-w-3xl mx-auto px-8">
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="inline-block mr-[0.3em]"
            style={{ color: accentColor }}
            initial={{ opacity: 0, y: 30, rotateX: -20 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: i * 0.08,
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        ))}
      </p>

      {/* Decorative line */}
      <motion.div
        className="mx-auto mt-8 h-px"
        style={{ background: `${accentColor}40` }}
        initial={{ width: 0 }}
        whileInView={{ width: 120 }}
        viewport={{ once: true }}
        transition={{ delay: words.length * 0.08 + 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.div>
  );
}
