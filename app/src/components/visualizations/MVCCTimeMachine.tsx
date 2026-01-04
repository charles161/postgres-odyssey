import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface TupleVersion {
  id: number;
  xmin: number;
  xmax: number | null;
  data: {
    name: string;
    balance: number;
  };
  operation: string;
}

// Timeline of operations that created these versions
const TIMELINE_EVENTS = [
  { txn: 100, label: 'INSERT Alice', type: 'insert' },
  { txn: 150, label: 'UPDATE +500', type: 'update' },
  { txn: 200, label: 'UPDATE +500', type: 'update' },
  { txn: 275, label: 'UPDATE +500', type: 'update' },
];

const VERSIONS: TupleVersion[] = [
  {
    id: 1,
    xmin: 100,
    xmax: 150,
    data: { name: 'Alice', balance: 1000 },
    operation: 'Original INSERT',
  },
  {
    id: 2,
    xmin: 150,
    xmax: 200,
    data: { name: 'Alice', balance: 1500 },
    operation: 'First UPDATE',
  },
  {
    id: 3,
    xmin: 200,
    xmax: 275,
    data: { name: 'Alice', balance: 2000 },
    operation: 'Second UPDATE',
  },
  {
    id: 4,
    xmin: 275,
    xmax: null,
    data: { name: 'Alice', balance: 2500 },
    operation: 'Third UPDATE',
  },
];

const MIN_TXN = 90;
const MAX_TXN = 300;

function isVisible(version: TupleVersion, currentTxn: number): boolean {
  // xmin must be <= current transaction
  if (version.xmin > currentTxn) return false;
  // If xmax is null (alive), it's visible
  if (version.xmax === null) return true;
  // If xmax > current transaction, it was deleted after we started
  return version.xmax > currentTxn;
}

function getVisibilityReason(
  version: TupleVersion,
  currentTxn: number
): { visible: boolean; reason: string } {
  if (version.xmin > currentTxn) {
    return {
      visible: false,
      reason: `Not yet created (xmin ${version.xmin} > TXN ${currentTxn})`,
    };
  }
  if (version.xmax === null) {
    return {
      visible: true,
      reason: 'Currently alive (xmax = ∞)',
    };
  }
  if (version.xmax > currentTxn) {
    return {
      visible: true,
      reason: `Deleted after you started (xmax ${version.xmax} > TXN ${currentTxn})`,
    };
  }
  return {
    visible: false,
    reason: `Already deleted (xmax ${version.xmax} ≤ TXN ${currentTxn})`,
  };
}

export function MVCCTimeMachine() {
  const [currentTxn, setCurrentTxn] = useState(175);
  const [showAllVersions, setShowAllVersions] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [glitchTrigger, setGlitchTrigger] = useState(0);
  const prevVisibleVersionRef = useRef<number | null>(null);

  // Find which version is currently visible
  const visibleVersion = useMemo(() => {
    for (let i = VERSIONS.length - 1; i >= 0; i--) {
      if (isVisible(VERSIONS[i], currentTxn)) {
        return VERSIONS[i];
      }
    }
    return null;
  }, [currentTxn]);

  // Trigger glitch effect when visible version changes
  useEffect(() => {
    if (visibleVersion?.id !== prevVisibleVersionRef.current) {
      setGlitchTrigger((t) => t + 1);
      prevVisibleVersionRef.current = visibleVersion?.id ?? null;
    }
  }, [visibleVersion?.id]);

  // Handle timeline drag
  const handleTimelineDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const percentage = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / rect.width)
    );
    const txn = Math.round(MIN_TXN + percentage * (MAX_TXN - MIN_TXN));
    setCurrentTxn(txn);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleTimelineDrag(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleTimelineDrag(e);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleTimelineDrag(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) handleTimelineDrag(e);
  };

  const txnPercentage = ((currentTxn - MIN_TXN) / (MAX_TXN - MIN_TXN)) * 100;

  return (
    <div className="space-y-8">
      {/* Header with transaction display */}
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-xs font-mono uppercase tracking-wider mb-1"
            style={{ color: colors.text.muted }}
          >
            Time Traveling As
          </p>
          <motion.div
            key={glitchTrigger}
            className="text-4xl font-bold font-mono"
            style={{ color: colors.glow.healthy }}
            initial={{ opacity: 0.5, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
          >
            TXN {currentTxn}
          </motion.div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showAllVersions}
            onChange={(e) => setShowAllVersions(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm" style={{ color: colors.text.muted }}>
            Show all versions
          </span>
        </label>
      </div>

      {/* Timeline scrubber */}
      <div
        className="rounded-xl p-6"
        style={{
          background: colors.oceanDark,
          border: `1px solid ${colors.glow.healthy}20`,
        }}
      >
        <p
          className="text-xs font-mono uppercase tracking-wider mb-4"
          style={{ color: colors.text.muted }}
        >
          Drag to travel through time
        </p>

        {/* Timeline events markers */}
        <div className="relative h-8 mb-2">
          {TIMELINE_EVENTS.map((event) => {
            const percentage =
              ((event.txn - MIN_TXN) / (MAX_TXN - MIN_TXN)) * 100;
            const isPast = event.txn <= currentTxn;
            return (
              <motion.div
                key={event.txn}
                className="absolute -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${percentage}%` }}
                animate={{ opacity: isPast ? 1 : 0.4 }}
              >
                <div
                  className="text-xs font-mono whitespace-nowrap"
                  style={{
                    color: isPast ? colors.text.secondary : colors.text.muted,
                  }}
                >
                  {event.label}
                </div>
                <div
                  className="w-0.5 h-3 mt-1"
                  style={{
                    background: isPast
                      ? event.type === 'insert'
                        ? colors.glow.healthy
                        : colors.glow.warning
                      : colors.text.muted + '40',
                  }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* The draggable timeline */}
        <div
          ref={timelineRef}
          className="relative h-12 rounded-lg cursor-grab active:cursor-grabbing select-none"
          style={{ background: colors.oceanLight }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {/* Progress fill */}
          <motion.div
            className="absolute top-0 left-0 h-full rounded-l-lg"
            style={{
              background: `linear-gradient(90deg, ${colors.glow.healthy}30 0%, ${colors.glow.healthy}10 100%)`,
              width: `${txnPercentage}%`,
            }}
            layout
          />

          {/* Version markers on timeline */}
          {VERSIONS.map((version) => {
            const startPercent =
              ((version.xmin - MIN_TXN) / (MAX_TXN - MIN_TXN)) * 100;
            const endPercent = version.xmax
              ? ((version.xmax - MIN_TXN) / (MAX_TXN - MIN_TXN)) * 100
              : 100;
            const isCurrentlyVisible = visibleVersion?.id === version.id;

            return (
              <motion.div
                key={version.id}
                className="absolute h-2 rounded-full"
                style={{
                  left: `${startPercent}%`,
                  width: `${endPercent - startPercent}%`,
                  top: 8 + version.id * 8,
                  background: isCurrentlyVisible
                    ? colors.glow.healthy
                    : colors.text.muted + '40',
                }}
                animate={{
                  opacity: isCurrentlyVisible ? 1 : 0.5,
                  boxShadow: isCurrentlyVisible
                    ? `0 0 10px ${colors.glow.healthy}`
                    : 'none',
                }}
              />
            );
          })}

          {/* Scrubber handle */}
          <motion.div
            className="absolute top-0 h-full w-1 -translate-x-1/2"
            style={{
              left: `${txnPercentage}%`,
              background: colors.glow.healthy,
              boxShadow: `0 0 20px ${colors.glow.healthy}`,
            }}
            whileHover={{ scale: 1.5 }}
          >
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full"
              style={{
                background: colors.glow.healthy,
                boxShadow: `0 0 10px ${colors.glow.healthy}`,
              }}
            />
          </motion.div>

          {/* Scale */}
          <div
            className="absolute bottom-1 left-0 right-0 flex justify-between px-2 text-xs font-mono"
            style={{ color: colors.text.muted }}
          >
            <span>{MIN_TXN}</span>
            <span>{MAX_TXN}</span>
          </div>
        </div>
      </div>

      {/* Visible result card */}
      <AnimatePresence mode="wait">
        {visibleVersion ? (
          <motion.div
            key={visibleVersion.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl p-6"
            style={{
              background: `linear-gradient(135deg, ${colors.oceanLight} 0%, ${colors.glow.healthy}08 100%)`,
              border: `2px solid ${colors.glow.healthy}`,
              boxShadow: `0 0 40px ${colors.glow.healthy}20`,
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p
                  className="text-xs font-mono uppercase tracking-wider mb-1"
                  style={{ color: colors.text.muted }}
                >
                  What You See
                </p>
                <motion.div
                  key={`balance-${visibleVersion.data.balance}-${glitchTrigger}`}
                  className="text-3xl font-bold font-mono"
                  style={{ color: colors.glow.healthy }}
                  initial={{ opacity: 0.5, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 0.2 }}
                >
                  ${visibleVersion.data.balance.toLocaleString()}
                </motion.div>
                <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                  {visibleVersion.data.name}'s account balance
                </p>
              </div>
              <div
                className="px-3 py-1 rounded-full text-xs font-mono"
                style={{
                  background: colors.glow.healthy + '20',
                  color: colors.glow.healthy,
                }}
              >
                Version {visibleVersion.id}
              </div>
            </div>

            <div
              className="p-3 rounded-lg font-mono text-sm"
              style={{ background: colors.oceanDark }}
            >
              <div className="flex justify-between">
                <span style={{ color: colors.text.muted }}>xmin:</span>
                <span style={{ color: colors.glow.healthy }}>
                  {visibleVersion.xmin}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span style={{ color: colors.text.muted }}>xmax:</span>
                <span
                  style={{
                    color: visibleVersion.xmax
                      ? colors.glow.critical
                      : colors.text.muted,
                  }}
                >
                  {visibleVersion.xmax ?? '∞'}
                </span>
              </div>
              <div
                className="text-xs mt-2 pt-2 border-t"
                style={{
                  color: colors.text.secondary,
                  borderColor: colors.text.muted + '30',
                }}
              >
                {getVisibilityReason(visibleVersion, currentTxn).reason}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl p-6 text-center"
            style={{
              background: colors.oceanLight,
              border: `2px dashed ${colors.text.muted}40`,
            }}
          >
            <p
              className="text-lg font-medium"
              style={{ color: colors.text.muted }}
            >
              No visible version
            </p>
            <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
              This row doesn't exist yet at TXN {currentTxn}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All versions grid (when showing all) */}
      {showAllVersions && (
        <div
          className="rounded-xl p-6"
          style={{
            background: colors.oceanDark,
            border: `1px solid ${colors.text.muted}20`,
          }}
        >
          <p
            className="text-xs font-mono uppercase tracking-wider mb-4"
            style={{ color: colors.text.muted }}
          >
            All Versions in Storage
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {VERSIONS.map((version) => {
              const visibility = getVisibilityReason(version, currentTxn);
              const isCurrent = visibleVersion?.id === version.id;

              return (
                <motion.div
                  key={version.id}
                  className="p-4 rounded-lg relative"
                  style={{
                    background: visibility.visible
                      ? colors.oceanLight
                      : colors.oceanLight + '60',
                    border: `2px solid ${
                      isCurrent
                        ? colors.glow.healthy
                        : visibility.visible
                        ? colors.glow.healthy + '40'
                        : 'transparent'
                    }`,
                    opacity: visibility.visible ? 1 : 0.5,
                  }}
                  animate={{
                    scale: isCurrent ? 1.02 : 1,
                    boxShadow: isCurrent
                      ? `0 0 20px ${colors.glow.healthy}30`
                      : 'none',
                  }}
                >
                  {/* Version badge */}
                  <div
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono"
                    style={{
                      background: isCurrent
                        ? colors.glow.healthy
                        : visibility.visible
                        ? colors.glow.healthy + '60'
                        : colors.text.muted + '60',
                      color: isCurrent ? colors.oceanDark : colors.text.primary,
                    }}
                  >
                    {version.id}
                  </div>

                  <div
                    className="font-mono text-lg mb-2"
                    style={{
                      color: visibility.visible
                        ? colors.text.primary
                        : colors.text.muted,
                    }}
                  >
                    ${version.data.balance.toLocaleString()}
                  </div>

                  <div className="flex gap-2 text-xs font-mono">
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={{
                        background: colors.glow.healthy + '20',
                        color: visibility.visible
                          ? colors.glow.healthy
                          : colors.text.muted,
                      }}
                    >
                      {version.xmin}
                    </span>
                    <span style={{ color: colors.text.muted }}>→</span>
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={{
                        background:
                          version.xmax === null
                            ? colors.text.muted + '20'
                            : colors.glow.critical + '20',
                        color: visibility.visible
                          ? version.xmax === null
                            ? colors.text.muted
                            : colors.glow.critical
                          : colors.text.muted,
                      }}
                    >
                      {version.xmax ?? '∞'}
                    </span>
                  </div>

                  {/* Status */}
                  <div
                    className="text-xs mt-2 pt-2 border-t"
                    style={{
                      color: colors.text.muted,
                      borderColor: colors.text.muted + '20',
                    }}
                  >
                    {visibility.visible ? (
                      isCurrent ? (
                        <span style={{ color: colors.glow.healthy }}>
                          ✓ You see this
                        </span>
                      ) : (
                        <span>Visible (older)</span>
                      )
                    ) : version.xmin > currentTxn ? (
                      <span>Not created yet</span>
                    ) : (
                      <span>Already gone</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insight */}
      <div
        className="p-4 rounded-lg text-sm"
        style={{
          background: colors.glow.healthy + '10',
          border: `1px solid ${colors.glow.healthy}30`,
          color: colors.text.secondary,
        }}
      >
        <strong style={{ color: colors.glow.healthy }}>Insight:</strong> As you
        scrub through time, notice how different transactions see different
        "truths." Transaction 120 sees $1,000. Transaction 180 sees $1,500. Both
        are correct—for their point in time. This is how PostgreSQL achieves{' '}
        <strong>readers never block writers</strong>.
      </div>
    </div>
  );
}
