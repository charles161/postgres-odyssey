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

interface BufferSlot {
  id: number;
  isEmpty: boolean;
  tableName: string;
  pageNumber: number;
  usageCount: number;
  isDirty: boolean;
  lastAccessed: string;
}

// Generate mock buffer slots
const generateBufferSlots = (): BufferSlot[] => {
  const tables = ['users', 'orders', 'products', 'sessions', 'analytics', 'logs'];
  const slots: BufferSlot[] = [];

  for (let i = 0; i < 32; i++) {
    const isEmpty = Math.random() > 0.85;
    slots.push({
      id: i,
      isEmpty,
      tableName: tables[Math.floor(Math.random() * tables.length)],
      pageNumber: Math.floor(Math.random() * 1000),
      usageCount: isEmpty ? 0 : Math.floor(Math.random() * 5) + 1,
      isDirty: !isEmpty && Math.random() > 0.7,
      lastAccessed: isEmpty ? '' : `${Math.floor(Math.random() * 60)}s ago`,
    });
  }

  return slots;
};

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

export function InteractiveBufferCache() {
  const [bufferSlots] = useState<BufferSlot[]>(generateBufferSlots);
  const [activeSlot, setActiveSlot] = useState<number | null>(0);
  const isMobile = useIsMobile();

  const activeBuffer = activeSlot !== null ? bufferSlots[activeSlot] : null;

  // Get color based on usage count
  const getSlotColor = (slot: BufferSlot) => {
    if (slot.isEmpty) return colors.oceanDark;
    if (slot.usageCount >= 4) return colors.glow.healthy;
    if (slot.usageCount >= 2) return colors.glow.warning;
    return colors.glow.critical;
  };

  // Get opacity based on usage count (hot data is brighter)
  const getSlotOpacity = (slot: BufferSlot) => {
    if (slot.isEmpty) return 0.2;
    return 0.3 + (slot.usageCount / 5) * 0.7;
  };

  return (
    <div
      className="relative gap-6 items-start"
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 340px',
      }}
    >
      {/* Left: Buffer grid */}
      <div
        className="rounded-xl overflow-hidden border-2 transition-all duration-300"
        style={{
          borderColor: activeBuffer
            ? getSlotColor(activeBuffer) + '40'
            : colors.glow.healthy + '30',
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
              Buffer Pool
            </span>
            <span className="text-xs" style={{ color: colors.text.muted }}>
              32 slots × 8KB = 256KB
            </span>
          </div>
          <p className="text-sm" style={{ color: colors.text.muted }}>
            Click any slot to see what's cached
          </p>
        </div>

        {/* Buffer grid */}
        <div className="p-4">
          <div className="grid grid-cols-8 gap-2">
            {bufferSlots.map((slot, index) => (
              <motion.button
                key={slot.id}
                className="aspect-square rounded-lg relative overflow-hidden"
                style={{
                  background: getSlotColor(slot),
                  opacity: getSlotOpacity(slot),
                  border:
                    activeSlot === slot.id
                      ? `2px solid ${getSlotColor(slot)}`
                      : '2px solid transparent',
                  boxShadow:
                    activeSlot === slot.id
                      ? `0 0 20px ${getSlotColor(slot)}40`
                      : slot.usageCount >= 4
                      ? `0 0 10px ${getSlotColor(slot)}30`
                      : 'none',
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: getSlotOpacity(slot),
                  scale: 1,
                }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.02,
                  ease: [0.22, 1, 0.36, 1] as const,
                }}
                onClick={() => setActiveSlot(slot.id)}
                whileHover={{ scale: 1.1, opacity: 1 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Dirty indicator */}
                {slot.isDirty && (
                  <div
                    className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full"
                    style={{ background: colors.glow.warning }}
                  />
                )}

                {/* Usage count dots */}
                {!slot.isEmpty && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {Array.from({ length: Math.min(slot.usageCount, 5) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.6)' }}
                      />
                    ))}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div
          className="p-4 border-t flex flex-wrap gap-4 justify-center"
          style={{ borderColor: colors.glow.healthy + '20' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ background: colors.glow.healthy, opacity: 0.8 }}
            />
            <span className="text-xs" style={{ color: colors.text.muted }}>
              Hot (high usage)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ background: colors.glow.warning, opacity: 0.6 }}
            />
            <span className="text-xs" style={{ color: colors.text.muted }}>
              Warm
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ background: colors.glow.critical, opacity: 0.4 }}
            />
            <span className="text-xs" style={{ color: colors.text.muted }}>
              Cold
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ background: colors.oceanDark, border: `1px solid ${colors.text.muted}40` }}
            />
            <span className="text-xs" style={{ color: colors.text.muted }}>
              Empty
            </span>
          </div>
        </div>
      </div>

      {/* Right: Info panel */}
      <div style={isMobile ? {} : { position: 'sticky', top: '2rem' }}>
        <AnimatePresence mode="wait">
          {activeBuffer && (
            <motion.div
              key={activeBuffer.id}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="rounded-xl border-l-[3px] overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${colors.oceanLight} 0%, ${getSlotColor(activeBuffer)}05 100%)`,
                borderColor: getSlotColor(activeBuffer),
                boxShadow: `
                  inset 4px 0 20px -10px ${getSlotColor(activeBuffer)}40,
                  0 0 40px -15px ${getSlotColor(activeBuffer)}30
                `,
              }}
            >
              {/* Breathing glow */}
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-xl"
                animate={{
                  boxShadow: [
                    `inset 0 0 30px -15px ${getSlotColor(activeBuffer)}20`,
                    `inset 0 0 50px -15px ${getSlotColor(activeBuffer)}35`,
                    `inset 0 0 30px -15px ${getSlotColor(activeBuffer)}20`,
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="relative p-5">
                {/* Header */}
                <motion.div variants={itemVariants} className="flex items-center gap-3 mb-4">
                  <motion.div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-mono text-lg"
                    style={{
                      background: getSlotColor(activeBuffer) + '20',
                      color: getSlotColor(activeBuffer),
                    }}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                      delay: 0.15,
                    }}
                  >
                    #{activeBuffer.id}
                  </motion.div>
                  <div>
                    <h4
                      className="font-semibold text-lg"
                      style={{ color: getSlotColor(activeBuffer) }}
                    >
                      {activeBuffer.isEmpty ? 'Empty Slot' : `Buffer #${activeBuffer.id}`}
                    </h4>
                    <p className="text-xs font-mono" style={{ color: colors.text.muted }}>
                      {activeBuffer.isEmpty
                        ? 'Available for caching'
                        : `${activeBuffer.tableName} / page ${activeBuffer.pageNumber}`}
                    </p>
                  </div>
                </motion.div>

                {activeBuffer.isEmpty ? (
                  <motion.p
                    variants={itemVariants}
                    className="text-sm leading-relaxed"
                    style={{ color: colors.text.secondary }}
                  >
                    This buffer slot is empty and ready to cache a new page from disk.
                    When a query needs data not in memory, PostgreSQL will load it here.
                  </motion.p>
                ) : (
                  <>
                    {/* Buffer details */}
                    <motion.div variants={itemVariants} className="mb-4">
                      <p
                        className="text-xs font-mono uppercase tracking-wider mb-2"
                        style={{ color: colors.text.muted }}
                      >
                        Buffer Tag
                      </p>
                      <div
                        className="p-3 rounded-lg font-mono text-xs space-y-1"
                        style={{ background: colors.oceanDark }}
                      >
                        <div style={{ color: colors.text.secondary }}>
                          <span style={{ color: colors.glow.healthy }}>table:</span>{' '}
                          {activeBuffer.tableName}
                        </div>
                        <div style={{ color: colors.text.secondary }}>
                          <span style={{ color: colors.glow.healthy }}>page:</span>{' '}
                          {activeBuffer.pageNumber}
                        </div>
                        <div style={{ color: colors.text.secondary }}>
                          <span style={{ color: colors.glow.healthy }}>usage_count:</span>{' '}
                          {activeBuffer.usageCount}
                        </div>
                        {activeBuffer.isDirty && (
                          <div style={{ color: colors.glow.warning }}>
                            <span>dirty:</span> true (needs write to disk)
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Usage indicator */}
                    <motion.div variants={itemVariants} className="mb-4">
                      <p
                        className="text-xs font-mono uppercase tracking-wider mb-2"
                        style={{ color: colors.text.muted }}
                      >
                        Heat Level
                      </p>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 h-2 rounded"
                            style={{
                              background:
                                i < activeBuffer.usageCount
                                  ? getSlotColor(activeBuffer)
                                  : colors.oceanDark,
                              opacity: i < activeBuffer.usageCount ? 1 : 0.3,
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                        {activeBuffer.usageCount >= 4
                          ? 'Frequently accessed - will survive many clock sweeps'
                          : activeBuffer.usageCount >= 2
                          ? 'Moderately accessed - may be evicted eventually'
                          : 'Rarely accessed - likely to be evicted soon'}
                      </p>
                    </motion.div>

                    {/* Last accessed */}
                    <motion.p
                      variants={itemVariants}
                      className="text-xs"
                      style={{ color: colors.text.muted }}
                    >
                      Last accessed: {activeBuffer.lastAccessed}
                    </motion.p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
