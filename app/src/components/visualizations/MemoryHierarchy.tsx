import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

interface MemoryLevel {
  id: string;
  name: string;
  latency: string;
  latencyNs: number;
  size: string;
  color: string;
  brightness: number;
  title: string;
  description: string;
  analogy: string;
  isPostgres?: boolean;
}

const memoryLevels: MemoryLevel[] = [
  {
    id: 'l1',
    name: 'L1 Cache',
    latency: '~1ns',
    latencyNs: 1,
    size: '64KB',
    color: colors.glow.healthy,
    brightness: 1,
    title: 'Lightning Fast',
    description: 'The CPU\'s fastest memory, built right into the processor core.',
    analogy: 'Like having a note on your hand—instant recall, but tiny capacity.',
  },
  {
    id: 'l2',
    name: 'L2 Cache',
    latency: '~4ns',
    latencyNs: 4,
    size: '256KB',
    color: colors.glow.healthy,
    brightness: 0.85,
    title: 'Very Fast',
    description: 'Slightly larger cache, still on the CPU die.',
    analogy: 'Like your wallet—quick to access, holds more than your hand.',
  },
  {
    id: 'l3',
    name: 'L3 Cache',
    latency: '~12ns',
    latencyNs: 12,
    size: '8-32MB',
    color: colors.glow.healthy,
    brightness: 0.7,
    title: 'Fast',
    description: 'Shared cache across CPU cores. Last level before RAM.',
    analogy: 'Like your desk drawer—takes a second to open, but organized.',
  },
  {
    id: 'ram',
    name: 'RAM (shared_buffers)',
    latency: '~100ns',
    latencyNs: 100,
    size: '1-128GB',
    color: colors.glow.healthy,
    brightness: 0.55,
    title: 'PostgreSQL\'s Memory',
    description: 'This is where shared_buffers lives! PostgreSQL caches pages here.',
    analogy: 'Like a filing cabinet in your office—quick walk, lots of space.',
    isPostgres: true,
  },
  {
    id: 'ssd',
    name: 'SSD',
    latency: '~100μs',
    latencyNs: 100000,
    size: '256GB-4TB',
    color: colors.glow.warning,
    brightness: 0.35,
    title: '1000x Slower',
    description: 'Fast storage, but crossing the RAM-to-disk boundary is expensive.',
    analogy: 'Like walking to a warehouse across town—doable, but noticeable.',
  },
  {
    id: 'hdd',
    name: 'HDD',
    latency: '~10ms',
    latencyNs: 10000000,
    size: '1-20TB',
    color: colors.glow.critical,
    brightness: 0.2,
    title: '10,000,000x Slower',
    description: 'Spinning disks with mechanical seek times. Avoid at all costs for hot data.',
    analogy: 'Like driving to another city to retrieve a file—painful wait.',
  },
];

const panelVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    filter: 'blur(4px)',
    transition: { duration: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function MemoryHierarchy() {
  const [activeLevel, setActiveLevel] = useState<string>('ram');
  const isMobile = useIsMobile();

  const activeInfo = memoryLevels.find((l) => l.id === activeLevel);

  // Calculate bar width based on latency (log scale)
  const getBarWidth = (latencyNs: number) => {
    const minLog = Math.log10(1);
    const maxLog = Math.log10(10000000);
    const currentLog = Math.log10(latencyNs);
    const percent = ((currentLog - minLog) / (maxLog - minLog)) * 100;
    return Math.max(5, Math.min(100, percent));
  };

  return (
    <div
      className="relative gap-6 items-start"
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 360px',
      }}
    >
      {/* Left: Memory levels visualization */}
      <div
        className="rounded-xl overflow-hidden border-2 transition-all duration-300"
        style={{
          borderColor: activeInfo ? activeInfo.color + '40' : colors.glow.healthy + '30',
          background: colors.oceanDark,
        }}
      >
        {/* Header */}
        <div
          className="p-4 border-b"
          style={{
            background: `linear-gradient(135deg, ${colors.oceanDark} 0%, ${colors.glow.healthy}08 100%)`,
            borderColor: colors.glow.healthy + '20',
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-xs font-mono uppercase tracking-wider"
              style={{ color: colors.glow.healthy }}
            >
              Memory Hierarchy
            </span>
            <span className="text-xs" style={{ color: colors.text.muted }}>
              Click any level to explore
            </span>
          </div>
          <p className="text-sm" style={{ color: colors.text.muted }}>
            Latency increases as you move away from the CPU
          </p>
        </div>

        {/* Memory levels */}
        <div className="p-4 space-y-3">
          {memoryLevels.map((level, index) => (
            <motion.button
              key={level.id}
              className="w-full text-left relative overflow-hidden rounded-lg p-4"
              style={{
                background:
                  activeLevel === level.id ? level.color + '15' : colors.ocean,
                border: `2px solid ${activeLevel === level.id ? level.color + '60' : 'transparent'}`,
                boxShadow:
                  activeLevel === level.id
                    ? `0 0 24px ${level.color}25, inset 0 1px 0 rgba(255,255,255,0.05)`
                    : 'none',
              }}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1] as const,
              }}
              onClick={() => setActiveLevel(level.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* PostgreSQL indicator */}
              {level.isPostgres && (
                <div
                  className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-mono"
                  style={{
                    background: colors.glow.healthy + '20',
                    color: colors.glow.healthy,
                  }}
                >
                  PostgreSQL
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <span
                  className="font-mono text-sm font-medium"
                  style={{ color: level.color }}
                >
                  {level.name}
                </span>
                <span
                  className="text-xs font-mono"
                  style={{ color: colors.text.muted }}
                >
                  {level.latency}
                </span>
              </div>

              {/* Latency bar */}
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: colors.oceanDark }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${level.color}, ${level.color}80)`,
                    opacity: level.brightness,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${getBarWidth(level.latencyNs)}%` }}
                  transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
                />
              </div>

              <div className="flex justify-between mt-2">
                <span className="text-xs" style={{ color: colors.text.muted }}>
                  Size: {level.size}
                </span>
              </div>

              {/* Active indicator */}
              {activeLevel === level.id && (
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 right-4 w-2.5 h-2.5 rounded-full"
                  style={{ background: level.color }}
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [1, 0.6, 1],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Scale indicator */}
        <div
          className="p-3 border-t text-center"
          style={{ borderColor: colors.glow.healthy + '20' }}
        >
          <span className="text-xs font-mono" style={{ color: colors.text.muted }}>
            1ns → 10ms (logarithmic scale)
          </span>
        </div>
      </div>

      {/* Right: Info panel */}
      <div style={isMobile ? {} : { position: 'sticky', top: '2rem' }}>
        <AnimatePresence mode="wait">
          {activeInfo && (
            <motion.div
              key={activeInfo.id}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="rounded-xl border-l-[3px] overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${colors.oceanLight} 0%, ${activeInfo.color}05 100%)`,
                borderColor: activeInfo.color,
                boxShadow: `
                  inset 4px 0 20px -10px ${activeInfo.color}40,
                  0 0 40px -15px ${activeInfo.color}30
                `,
              }}
            >
              {/* Breathing glow */}
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-xl"
                animate={{
                  boxShadow: [
                    `inset 0 0 30px -15px ${activeInfo.color}20`,
                    `inset 0 0 50px -15px ${activeInfo.color}35`,
                    `inset 0 0 30px -15px ${activeInfo.color}20`,
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="relative p-5">
                {/* Header */}
                <motion.div variants={itemVariants} className="flex items-center gap-3 mb-4">
                  <motion.div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: activeInfo.color + '20' }}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                      delay: 0.15,
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{
                        background: activeInfo.color,
                        opacity: activeInfo.brightness,
                        boxShadow: `0 0 20px ${activeInfo.color}`,
                      }}
                    />
                  </motion.div>
                  <div>
                    <h4 className="font-semibold text-lg" style={{ color: activeInfo.color }}>
                      {activeInfo.title}
                    </h4>
                    <p className="text-xs font-mono" style={{ color: colors.text.muted }}>
                      {activeInfo.name} — {activeInfo.latency}
                    </p>
                  </div>
                </motion.div>

                {/* Description */}
                <motion.p
                  variants={itemVariants}
                  className="text-sm leading-relaxed mb-4"
                  style={{ color: colors.text.secondary }}
                >
                  {activeInfo.description}
                </motion.p>

                {/* Analogy callout */}
                <motion.div
                  variants={itemVariants}
                  className="p-3 rounded-lg mb-4 border-l-2"
                  style={{
                    background: colors.oceanDark,
                    borderColor: activeInfo.color + '80',
                  }}
                >
                  <p className="text-sm" style={{ color: colors.text.secondary }}>
                    <span style={{ color: activeInfo.color }}>💡</span>{' '}
                    <span className="italic">{activeInfo.analogy}</span>
                  </p>
                </motion.div>

                {/* Stats */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{ background: colors.oceanDark }}
                  >
                    <p className="text-xs font-mono mb-1" style={{ color: colors.text.muted }}>
                      Latency
                    </p>
                    <p className="font-mono text-lg" style={{ color: activeInfo.color }}>
                      {activeInfo.latency}
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{ background: colors.oceanDark }}
                  >
                    <p className="text-xs font-mono mb-1" style={{ color: colors.text.muted }}>
                      Typical Size
                    </p>
                    <p className="font-mono text-lg" style={{ color: colors.text.primary }}>
                      {activeInfo.size}
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
