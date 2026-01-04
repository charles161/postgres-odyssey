import { useRef } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { colors } from '../../config/theme';

interface SceneProps {
  id: string;
  children: ReactNode;
  className?: string;
  minHeight?: string;
  pinned?: boolean;
  scrub?: boolean | number;
  onEnter?: () => void;
  onLeave?: () => void;
}

export function Scene({
  id,
  children,
  className = '',
  minHeight = '100vh',
  pinned = false,
  scrub = true,
  onEnter,
  onLeave,
}: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { progress, isInView } = useScrollProgress(containerRef, {
    start: 'top center',
    end: 'bottom center',
    scrub,
    pin: pinned,
    onEnter,
    onLeave,
  });

  return (
    <section
      ref={containerRef}
      id={id}
      className={`relative ${className}`}
      style={{
        minHeight,
        background: colors.ocean,
      }}
    >
      {/* Progress-aware children wrapper */}
      <SceneContext.Provider value={{ progress, isInView }}>
        {typeof children === 'function'
          ? (children as (props: { progress: number; isInView: boolean }) => ReactNode)({ progress, isInView })
          : children}
      </SceneContext.Provider>
    </section>
  );
}

// Context for sharing progress with children
import { createContext, useContext } from 'react';

interface SceneContextValue {
  progress: number;
  isInView: boolean;
}

const SceneContext = createContext<SceneContextValue>({ progress: 0, isInView: false });

export function useSceneProgress() {
  return useContext(SceneContext);
}

// Helper component for progress-based opacity
interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className = '' }: FadeInProps) {
  const { progress } = useSceneProgress();
  const opacity = Math.max(0, Math.min(1, (progress - delay) * 2));

  return (
    <motion.div
      className={className}
      style={{ opacity }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity, y: opacity > 0.5 ? 0 : 20 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
