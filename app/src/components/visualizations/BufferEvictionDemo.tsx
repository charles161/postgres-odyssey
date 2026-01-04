import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface BufferSlot {
  id: number;
  tableName: string | null;
  pageNumber: number | null;
  usageCount: number;
  isDirty: boolean;
  isBeingEvicted: boolean;
  isWritingToDisk: boolean;
  isNewlyLoaded: boolean;
  isJustAccessed: boolean;
}

// Deterministic initial state so first queries can hit
const INITIAL_PAGES = [
  { table: 'users', page: 1 },
  { table: 'users', page: 2 },
  { table: 'orders', page: 1 },
  { table: 'orders', page: 5 },
  { table: 'products', page: 1 },
  { table: 'sessions', page: 1 },
  { table: 'analytics', page: 1 },
  { table: 'users', page: 3 },
  { table: 'orders', page: 2 },
  { table: 'products', page: 2 },
  { table: 'logs', page: 1 },
  { table: 'users', page: 4 },
];

const TABLES = ['users', 'orders', 'products', 'sessions', 'analytics', 'logs'];
const SLOT_COUNT = 20;

// Create buffer with known pages for guaranteed early hits
const createInitialBuffers = (): BufferSlot[] => {
  return Array.from({ length: SLOT_COUNT }, (_, i) => {
    const preset = INITIAL_PAGES[i];
    const isEmpty = !preset;
    return {
      id: i,
      tableName: preset?.table || null,
      pageNumber: preset?.page || null,
      usageCount: isEmpty ? 0 : Math.floor(Math.random() * 3) + 2,
      isDirty: !isEmpty && Math.random() > 0.6,
      isBeingEvicted: false,
      isWritingToDisk: false,
      isNewlyLoaded: false,
      isJustAccessed: false,
    };
  });
};

export function BufferEvictionDemo() {
  const [buffers, setBuffers] = useState<BufferSlot[]>(createInitialBuffers);
  const [clockPosition, setClockPosition] = useState(0);
  const [evictionLog, setEvictionLog] = useState<string[]>([]);
  const [queryCount, setQueryCount] = useState(0);
  const [cacheHits, setCacheHits] = useState(0);
  const [cacheMisses, setCacheMisses] = useState(0);
  const [isAutoQuerying, setIsAutoQuerying] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');
  const clockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryHistoryRef = useRef<number>(0);

  // Get slot position on circle
  const getSlotPosition = (index: number) => {
    const angle = (index / SLOT_COUNT) * Math.PI * 2 - Math.PI / 2;
    const radius = 120;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  // Clock sweep - always running, slower pace
  const clockSweepStep = useCallback(() => {
    setClockPosition((prev) => {
      const next = (prev + 1) % SLOT_COUNT;

      setBuffers((currentBuffers) => {
        const newBuffers = [...currentBuffers];
        const slot = newBuffers[next];

        // If slot has data and usage > 0, decrement
        if (slot.tableName && slot.usageCount > 0) {
          newBuffers[next] = { ...slot, usageCount: slot.usageCount - 1 };
        }

        return newBuffers;
      });

      return next;
    });
  }, []);

  // Auto-start clock sweep on mount
  useEffect(() => {
    clockIntervalRef.current = setInterval(clockSweepStep, 800);
    return () => {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
    };
  }, [clockSweepStep]);

  // Auto-query mode
  useEffect(() => {
    if (isAutoQuerying) {
      queryIntervalRef.current = setInterval(() => {
        simulateQuery();
      }, 1500);
    } else if (queryIntervalRef.current) {
      clearInterval(queryIntervalRef.current);
    }
    return () => {
      if (queryIntervalRef.current) clearInterval(queryIntervalRef.current);
    };
  }, [isAutoQuerying]);

  // Simulate a query - biased toward hits early on
  const simulateQuery = useCallback(() => {
    queryHistoryRef.current += 1;
    const queryNum = queryHistoryRef.current;

    // First 3 queries guaranteed to hit known pages
    let tableName: string;
    let pageNumber: number;

    if (queryNum <= 3) {
      const preset = INITIAL_PAGES[queryNum - 1];
      tableName = preset.table;
      pageNumber = preset.page;
    } else if (Math.random() < 0.4) {
      // 40% chance to query something in buffer
      const occupiedSlots = buffers.filter((b) => b.tableName);
      if (occupiedSlots.length > 0) {
        const slot = occupiedSlots[Math.floor(Math.random() * occupiedSlots.length)];
        tableName = slot.tableName!;
        pageNumber = slot.pageNumber!;
      } else {
        tableName = TABLES[Math.floor(Math.random() * TABLES.length)];
        pageNumber = Math.floor(Math.random() * 20) + 1;
      }
    } else {
      // Query random page (likely miss)
      tableName = TABLES[Math.floor(Math.random() * TABLES.length)];
      pageNumber = Math.floor(Math.random() * 50) + 1;
    }

    setQueryCount((q) => q + 1);
    setLastAction(`SELECT * FROM ${tableName} WHERE page=${pageNumber}`);

    // Check for cache hit
    const hitIndex = buffers.findIndex(
      (b) => b.tableName === tableName && b.pageNumber === pageNumber
    );

    if (hitIndex >= 0) {
      // Cache hit!
      setCacheHits((h) => h + 1);
      setBuffers((prev) => {
        const newBuffers = [...prev];
        newBuffers[hitIndex] = {
          ...newBuffers[hitIndex],
          usageCount: Math.min(5, newBuffers[hitIndex].usageCount + 1),
          isJustAccessed: true,
        };
        return newBuffers;
      });

      // Clear access highlight
      setTimeout(() => {
        setBuffers((prev) => {
          const newBuffers = [...prev];
          if (newBuffers[hitIndex]) {
            newBuffers[hitIndex] = { ...newBuffers[hitIndex], isJustAccessed: false };
          }
          return newBuffers;
        });
      }, 400);

      setEvictionLog((log) => [
        `✓ HIT: ${tableName}:${pageNumber} → slot #${hitIndex} (from memory!)`,
        ...log.slice(0, 4),
      ]);
    } else {
      // Cache miss - find a victim
      setCacheMisses((m) => m + 1);

      let victimIndex = buffers.findIndex((b) => !b.tableName);
      if (victimIndex === -1) {
        victimIndex = buffers.findIndex((b) => b.usageCount === 0);
      }
      if (victimIndex === -1) {
        victimIndex = buffers.reduce(
          (minIdx, b, idx) =>
            b.usageCount < buffers[minIdx].usageCount ? idx : minIdx,
          0
        );
      }

      const victim = buffers[victimIndex];
      const wasEmpty = !victim.tableName;
      const wasDirty = victim.isDirty;

      if (wasEmpty) {
        // Empty slot - just load
        setBuffers((prev) => {
          const newBuffers = [...prev];
          newBuffers[victimIndex] = {
            id: victimIndex,
            tableName,
            pageNumber,
            usageCount: 1,
            isDirty: false,
            isBeingEvicted: false,
            isWritingToDisk: false,
            isNewlyLoaded: true,
            isJustAccessed: false,
          };
          return newBuffers;
        });

        setTimeout(() => {
          setBuffers((prev) => {
            const newBuffers = [...prev];
            newBuffers[victimIndex] = { ...newBuffers[victimIndex], isNewlyLoaded: false };
            return newBuffers;
          });
        }, 500);

        setEvictionLog((log) => [
          `+ LOAD: ${tableName}:${pageNumber} → empty slot #${victimIndex}`,
          ...log.slice(0, 4),
        ]);
      } else {
        // Need to evict
        const evictedName = `${victim.tableName}:${victim.pageNumber}`;

        // If dirty, show write-to-disk first
        if (wasDirty) {
          setBuffers((prev) => {
            const newBuffers = [...prev];
            newBuffers[victimIndex] = { ...newBuffers[victimIndex], isWritingToDisk: true };
            return newBuffers;
          });

          setEvictionLog((log) => [
            `⟳ WRITING: ${evictedName} to disk (was dirty)...`,
            ...log.slice(0, 4),
          ]);

          // After write delay, then evict
          setTimeout(() => {
            setBuffers((prev) => {
              const newBuffers = [...prev];
              newBuffers[victimIndex] = {
                ...newBuffers[victimIndex],
                isWritingToDisk: false,
                isBeingEvicted: true,
              };
              return newBuffers;
            });

            setTimeout(() => {
              setBuffers((prev) => {
                const newBuffers = [...prev];
                newBuffers[victimIndex] = {
                  id: victimIndex,
                  tableName,
                  pageNumber,
                  usageCount: 1,
                  isDirty: false,
                  isBeingEvicted: false,
                  isWritingToDisk: false,
                  isNewlyLoaded: true,
                  isJustAccessed: false,
                };
                return newBuffers;
              });

              setEvictionLog((log) => [
                `✗ EVICT: ${evictedName} → loaded ${tableName}:${pageNumber}`,
                ...log.slice(0, 4),
              ]);

              setTimeout(() => {
                setBuffers((prev) => {
                  const newBuffers = [...prev];
                  newBuffers[victimIndex] = { ...newBuffers[victimIndex], isNewlyLoaded: false };
                  return newBuffers;
                });
              }, 500);
            }, 300);
          }, 600);
        } else {
          // Clean page - evict immediately
          setBuffers((prev) => {
            const newBuffers = [...prev];
            newBuffers[victimIndex] = { ...newBuffers[victimIndex], isBeingEvicted: true };
            return newBuffers;
          });

          setTimeout(() => {
            setBuffers((prev) => {
              const newBuffers = [...prev];
              newBuffers[victimIndex] = {
                id: victimIndex,
                tableName,
                pageNumber,
                usageCount: 1,
                isDirty: false,
                isBeingEvicted: false,
                isWritingToDisk: false,
                isNewlyLoaded: true,
                isJustAccessed: false,
              };
              return newBuffers;
            });

            setEvictionLog((log) => [
              `✗ EVICT: ${evictedName} → loaded ${tableName}:${pageNumber}`,
              ...log.slice(0, 4),
            ]);

            setTimeout(() => {
              setBuffers((prev) => {
                const newBuffers = [...prev];
                newBuffers[victimIndex] = { ...newBuffers[victimIndex], isNewlyLoaded: false };
                return newBuffers;
              });
            }, 500);
          }, 300);
        }
      }
    }
  }, [buffers]);

  const getSlotColor = (slot: BufferSlot) => {
    if (slot.isWritingToDisk) return colors.glow.warning;
    if (slot.isBeingEvicted) return colors.glow.critical;
    if (slot.isNewlyLoaded || slot.isJustAccessed) return colors.glow.healthy;
    if (!slot.tableName) return colors.oceanDark;
    if (slot.usageCount >= 4) return colors.glow.healthy;
    if (slot.usageCount >= 2) return colors.glow.warning;
    if (slot.usageCount >= 1) return '#ff9d00';
    return colors.glow.critical;
  };

  const hitRatio = queryCount > 0 ? ((cacheHits / queryCount) * 100).toFixed(0) : '—';

  return (
    <div className="relative">
      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Circular buffer */}
        <div
          className="relative rounded-2xl p-6 flex flex-col items-center"
          style={{
            background: `linear-gradient(135deg, ${colors.oceanDark} 0%, ${colors.ocean} 100%)`,
            border: `1px solid ${colors.glow.healthy}20`,
          }}
        >
          {/* Explanation header */}
          <div className="text-center mb-4">
            <p className="text-sm" style={{ color: colors.text.muted }}>
              The <span style={{ color: colors.glow.critical }}>clock hand</span> sweeps continuously,
              decrementing usage counts. Low counts get evicted first.
            </p>
          </div>

          {/* The circular buffer */}
          <div className="relative" style={{ width: 280, height: 280 }}>
            {/* Center stats */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-3xl font-bold"
                style={{ color: hitRatio === '—' ? colors.text.muted : colors.glow.healthy }}
              >
                {hitRatio}%
              </span>
              <span className="text-xs" style={{ color: colors.text.muted }}>
                cache hit ratio
              </span>
            </div>

            {/* Clock hand */}
            <motion.div
              className="absolute top-1/2 left-1/2 origin-bottom"
              style={{
                width: 3,
                height: 85,
                marginLeft: -1.5,
                marginTop: -85,
                background: `linear-gradient(to top, ${colors.glow.critical}, ${colors.glow.critical}40)`,
                borderRadius: 2,
                boxShadow: `0 0 15px ${colors.glow.critical}60`,
              }}
              animate={{
                rotate: (clockPosition / SLOT_COUNT) * 360,
              }}
              transition={{ type: 'spring', stiffness: 80, damping: 12 }}
            />

            {/* Clock center dot */}
            <div
              className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{
                background: colors.glow.critical,
                boxShadow: `0 0 10px ${colors.glow.critical}`,
              }}
            />

            {/* Buffer slots */}
            {buffers.map((slot, index) => {
              const pos = getSlotPosition(index);
              const isUnderHand = index === clockPosition;

              return (
                <motion.div
                  key={slot.id}
                  className="absolute flex items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    left: '50%',
                    top: '50%',
                    marginLeft: -16,
                    marginTop: -16,
                    x: pos.x,
                    y: pos.y,
                  }}
                >
                  <motion.div
                    className="w-full h-full rounded-lg flex items-center justify-center font-mono text-xs relative"
                    style={{
                      background: getSlotColor(slot),
                      opacity: slot.tableName ? 0.4 + (slot.usageCount / 5) * 0.6 : 0.15,
                      boxShadow: isUnderHand
                        ? `0 0 15px ${colors.glow.critical}50, inset 0 0 10px ${colors.glow.critical}30`
                        : slot.isJustAccessed
                        ? `0 0 20px ${colors.glow.healthy}70`
                        : slot.isNewlyLoaded
                        ? `0 0 15px ${colors.glow.healthy}50`
                        : 'none',
                      border: isUnderHand
                        ? `2px solid ${colors.glow.critical}`
                        : slot.isJustAccessed
                        ? `2px solid ${colors.glow.healthy}`
                        : `1px solid transparent`,
                    }}
                    animate={{
                      scale: slot.isBeingEvicted
                        ? [1, 1.2, 0]
                        : slot.isNewlyLoaded
                        ? [0, 1.15, 1]
                        : slot.isJustAccessed
                        ? [1, 1.2, 1]
                        : isUnderHand
                        ? 1.1
                        : 1,
                    }}
                    transition={{
                      duration: slot.isBeingEvicted ? 0.3 : slot.isNewlyLoaded ? 0.4 : 0.15,
                      ease: 'easeOut',
                    }}
                  >
                    {/* Usage count */}
                    {slot.tableName && !slot.isWritingToDisk && (
                      <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                        {slot.usageCount}
                      </span>
                    )}

                    {/* Writing indicator */}
                    {slot.isWritingToDisk && (
                      <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.4, repeat: Infinity }}
                        style={{ color: 'white', fontSize: 10 }}
                      >
                        ⟳
                      </motion.span>
                    )}

                    {/* Dirty indicator */}
                    {slot.isDirty && !slot.isWritingToDisk && (
                      <div
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                        style={{ background: colors.glow.warning }}
                      />
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center mt-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: colors.glow.healthy, opacity: 0.9 }} />
              <span style={{ color: colors.text.muted }}>Hot (4-5)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: colors.glow.warning, opacity: 0.7 }} />
              <span style={{ color: colors.text.muted }}>Warm (2-3)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: colors.glow.critical, opacity: 0.5 }} />
              <span style={{ color: colors.text.muted }}>Cold (0-1)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded relative" style={{ background: colors.glow.warning }}>
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: colors.glow.warning }} />
              </div>
              <span style={{ color: colors.text.muted }}>Dirty</span>
            </div>
          </div>
        </div>

        {/* Right: Controls & Log */}
        <div className="space-y-4">
          {/* Query simulator */}
          <div
            className="rounded-xl p-5"
            style={{
              background: `linear-gradient(135deg, ${colors.oceanLight} 0%, ${colors.glow.healthy}08 100%)`,
              border: `1px solid ${colors.glow.healthy}30`,
            }}
          >
            <h4
              className="text-sm font-semibold mb-3"
              style={{ color: colors.text.primary }}
            >
              Simulate Database Queries
            </h4>
            <p className="text-sm mb-4" style={{ color: colors.text.muted }}>
              Each query checks if the page is cached. Hits are instant; misses require loading from disk.
            </p>

            <div className="flex gap-3 mb-4">
              <motion.button
                onClick={() => simulateQuery()}
                className="flex-1 px-4 py-3 rounded-lg font-medium text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: colors.glow.healthy,
                  color: colors.ocean,
                }}
              >
                Run Query
              </motion.button>

              <motion.button
                onClick={() => setIsAutoQuerying(!isAutoQuerying)}
                className="px-4 py-3 rounded-lg font-medium text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: isAutoQuerying ? colors.glow.warning + '20' : colors.oceanDark,
                  color: isAutoQuerying ? colors.glow.warning : colors.text.secondary,
                  border: `1px solid ${isAutoQuerying ? colors.glow.warning : colors.text.muted}40`,
                }}
              >
                {isAutoQuerying ? 'Stop Auto' : 'Auto-Query'}
              </motion.button>
            </div>

            {/* Last query */}
            {lastAction && (
              <div
                className="p-2 rounded font-mono text-xs"
                style={{ background: colors.oceanDark, color: colors.glow.healthy }}
              >
                {lastAction}
              </div>
            )}
          </div>

          {/* Stats */}
          <div
            className="rounded-xl p-4"
            style={{ background: colors.oceanDark, border: `1px solid ${colors.glow.healthy}20` }}
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold" style={{ color: colors.text.primary }}>
                  {queryCount}
                </div>
                <div className="text-xs" style={{ color: colors.text.muted }}>Queries</div>
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: colors.glow.healthy }}>
                  {cacheHits}
                </div>
                <div className="text-xs" style={{ color: colors.text.muted }}>Hits</div>
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: colors.glow.critical }}>
                  {cacheMisses}
                </div>
                <div className="text-xs" style={{ color: colors.text.muted }}>Misses</div>
              </div>
            </div>
          </div>

          {/* Activity log */}
          <div
            className="rounded-xl p-4"
            style={{ background: colors.oceanDark, border: `1px solid ${colors.glow.healthy}20` }}
          >
            <h4
              className="text-xs font-mono uppercase tracking-wider mb-3"
              style={{ color: colors.text.muted }}
            >
              What's Happening
            </h4>
            <div className="space-y-2 min-h-[100px]">
              <AnimatePresence mode="popLayout">
                {evictionLog.length === 0 ? (
                  <p className="text-sm" style={{ color: colors.text.muted }}>
                    Click <strong>Run Query</strong> to simulate a database read.
                    Watch the buffer pool respond!
                  </p>
                ) : (
                  evictionLog.map((log, i) => (
                    <motion.div
                      key={`${log}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1 - i * 0.15, x: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="font-mono text-xs leading-relaxed"
                      style={{
                        color: log.startsWith('✓')
                          ? colors.glow.healthy
                          : log.startsWith('✗')
                          ? colors.glow.critical
                          : log.startsWith('⟳')
                          ? colors.glow.warning
                          : colors.text.secondary,
                      }}
                    >
                      {log}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* How it works - compact */}
          <div
            className="rounded-xl p-4 text-sm"
            style={{ background: colors.oceanLight, color: colors.text.secondary }}
          >
            <p>
              <span style={{ color: colors.glow.critical }}>●</span> The clock hand sweeps
              through slots, decrementing counts.{' '}
              <span style={{ color: colors.glow.healthy }}>●</span> Frequently accessed pages
              maintain high counts and survive.{' '}
              <span style={{ color: colors.glow.warning }}>●</span> Cold pages (count=0) are
              evicted when new data arrives.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
