import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';
import { pathwayMotion } from '../../config/animation';

interface BeamCoords {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface HeapRow {
  id: number;
  email: string;
  name: string;
  created_at: string;
  xmin: number;
  xmax: number | null;
}

interface IndexEntry {
  key: string;
  ctid: string;
  pageNum: number;
  rowNum: number;
}

// Simulated heap pages
const heapPages: { pageNum: number; rows: HeapRow[] }[] = [
  {
    pageNum: 5,
    rows: [
      { id: 1, email: 'bob@example.com', name: 'Bob', created_at: '2024-01-15', xmin: 100, xmax: null },
      { id: 2, email: 'carol@example.com', name: 'Carol', created_at: '2024-01-16', xmin: 101, xmax: null },
      { id: 3, email: 'dave@example.com', name: 'Dave', created_at: '2024-01-17', xmin: 102, xmax: null },
    ],
  },
  {
    pageNum: 38,
    rows: [
      { id: 12, email: 'xavier@example.com', name: 'Xavier', created_at: '2024-02-01', xmin: 200, xmax: null },
      { id: 13, email: 'yvonne@example.com', name: 'Yvonne', created_at: '2024-02-02', xmin: 201, xmax: null },
      { id: 14, email: 'alice@example.com', name: 'Alice', created_at: '2024-02-03', xmin: 202, xmax: null },
      { id: 15, email: 'zach@example.com', name: 'Zach', created_at: '2024-02-04', xmin: 203, xmax: null },
    ],
  },
];

// Index entries (sorted by email)
// Note: ctid uses 1-indexed slot numbers (PostgreSQL convention)
// rowNum is 0-indexed for array access in the code
const indexEntries: IndexEntry[] = [
  { key: 'alice@example.com', ctid: '(38, 3)', pageNum: 38, rowNum: 2 },
  { key: 'bob@example.com', ctid: '(5, 1)', pageNum: 5, rowNum: 0 },
  { key: 'carol@example.com', ctid: '(5, 2)', pageNum: 5, rowNum: 1 },
  { key: 'dave@example.com', ctid: '(5, 3)', pageNum: 5, rowNum: 2 },
  { key: 'xavier@example.com', ctid: '(38, 1)', pageNum: 38, rowNum: 0 },
  { key: 'yvonne@example.com', ctid: '(38, 2)', pageNum: 38, rowNum: 1 },
  { key: 'zach@example.com', ctid: '(38, 4)', pageNum: 38, rowNum: 3 },
];

type Phase = 'idle' | 'index-lookup' | 'ctid-found' | 'heap-hop' | 'row-fetched' | 'visibility-check' | 'complete';

export function HeapHopVisualizer() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [targetEmail] = useState('alice@example.com');
  const [highlightedEntry, setHighlightedEntry] = useState<IndexEntry | null>(null);
  const [highlightedRow, setHighlightedRow] = useState<HeapRow | null>(null);
  const [showBeam, setShowBeam] = useState(false);
  const [beamProgress, setBeamProgress] = useState(0);
  const [beamCoords, setBeamCoords] = useState<BeamCoords | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const indexPanelRef = useRef<HTMLDivElement>(null);
  const heapPanelRef = useRef<HTMLDivElement>(null);
  const highlightedEntryRef = useRef<HTMLDivElement>(null);
  const targetRowRef = useRef<HTMLDivElement>(null);

  // Calculate beam coordinates when showing beam
  useEffect(() => {
    if (showBeam && highlightedEntryRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const entryRect = highlightedEntryRef.current.getBoundingClientRect();

      // Start from the right side of the highlighted index entry
      const startX = entryRect.right - containerRect.left;
      const startY = entryRect.top + entryRect.height / 2 - containerRect.top;

      // End at the left side of the target row (we'll find it by the page/row)
      // For now, use the heap panel's left edge at the same vertical level
      const heapPanelRect = heapPanelRef.current?.getBoundingClientRect();
      const endX = heapPanelRect ? heapPanelRect.left - containerRect.left + 20 : startX + 200;

      // Find the target row element
      const targetRowEl = targetRowRef.current;
      const endY = targetRowEl
        ? targetRowEl.getBoundingClientRect().top + targetRowEl.getBoundingClientRect().height / 2 - containerRect.top
        : startY;

      setBeamCoords({ startX, startY, endX, endY });
    }
  }, [showBeam, highlightedEntry]);

  const runDemo = useCallback(async () => {
    // Reset
    setPhase('idle');
    setHighlightedEntry(null);
    setHighlightedRow(null);
    setShowBeam(false);
    setBeamProgress(0);

    await delay(300);

    // Phase 1: Index lookup
    setPhase('index-lookup');
    await delay(1500);

    // Phase 2: Found ctid
    const entry = indexEntries.find((e) => e.key === targetEmail)!;
    setHighlightedEntry(entry);
    setPhase('ctid-found');
    await delay(2000); // Longer pause to appreciate ctid reveal

    // Phase 3: Heap hop with beam animation
    setPhase('heap-hop');
    setShowBeam(true);

    // Animate beam progress
    const beamDuration = pathwayMotion.heapHop.duration * 1000;
    const startTime = Date.now();
    const animateBeam = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / beamDuration, 1);
      setBeamProgress(progress);
      if (progress < 1) {
        requestAnimationFrame(animateBeam);
      }
    };
    requestAnimationFrame(animateBeam);

    await delay(beamDuration + 200);
    setShowBeam(false);

    // Phase 4: Row fetched
    const page = heapPages.find((p) => p.pageNum === entry.pageNum)!;
    const row = page.rows[entry.rowNum];
    setHighlightedRow(row);
    setPhase('row-fetched');
    await delay(1500);

    // Phase 5: Visibility check
    setPhase('visibility-check');
    await delay(1500);

    // Phase 6: Complete
    setPhase('complete');
  }, [targetEmail]);

  const reset = useCallback(() => {
    setPhase('idle');
    setHighlightedEntry(null);
    setHighlightedRow(null);
    setShowBeam(false);
    setBeamProgress(0);
  }, []);

  return (
    <div
      ref={containerRef}
      className="p-6 rounded-xl relative"
      style={{
        background: colors.oceanDark,
        border: `1px solid ${colors.text.muted}20`,
      }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-medium" style={{ color: colors.text.primary }}>
            The Heap Hop
          </h3>
          <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
            Index knows WHERE, but only the heap knows IF YOU CAN SEE IT
          </p>
        </div>

        <motion.button
          className="px-4 py-2 rounded-lg text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={phase === 'idle' || phase === 'complete' ? runDemo : reset}
          style={{
            background: `${colors.glow.healthy}20`,
            color: colors.glow.healthy,
            border: `1px solid ${colors.glow.healthy}40`,
          }}
        >
          {phase === 'idle' ? 'Run Demo' : phase === 'complete' ? 'Run Again' : 'Reset'}
        </motion.button>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between mb-8 px-4">
        {[
          { id: 'index-lookup', label: '1. Index Lookup' },
          { id: 'ctid-found', label: '2. Get ctid' },
          { id: 'heap-hop', label: '3. Heap Hop' },
          { id: 'visibility-check', label: '4. Visibility' },
          { id: 'complete', label: '5. Return' },
        ].map((step, i) => {
          const stepPhases = ['index-lookup', 'ctid-found', 'heap-hop', 'row-fetched', 'visibility-check', 'complete'];
          const currentIdx = stepPhases.indexOf(phase);
          const stepIdx = stepPhases.indexOf(step.id);
          const isActive = currentIdx >= stepIdx && phase !== 'idle';

          return (
            <div key={step.id} className="flex flex-col items-center">
              <motion.div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1"
                style={{
                  background: isActive ? colors.glow.healthy : colors.ocean,
                  color: isActive ? colors.ocean : colors.text.muted,
                  border: `2px solid ${isActive ? colors.glow.healthy : colors.text.muted}40`,
                }}
                animate={phase === step.id ? { scale: [1, 1.1, 1] } : {}}
              >
                {i + 1}
              </motion.div>
              <span
                className="text-xs text-center hidden md:block"
                style={{ color: isActive ? colors.glow.healthy : colors.text.muted }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Index Side */}
        <div
          ref={indexPanelRef}
          className="p-4 rounded-lg relative"
          style={{
            background: colors.ocean,
            border: `2px solid ${
              phase === 'index-lookup' || phase === 'ctid-found'
                ? colors.glow.healthy
                : colors.text.muted
            }40`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="px-2 py-1 rounded text-xs font-mono"
              style={{ background: colors.glow.healthy + '20', color: colors.glow.healthy }}
            >
              INDEX
            </div>
            <span className="text-sm" style={{ color: colors.text.muted }}>
              idx_users_email (sorted)
            </span>
          </div>

          <div className="space-y-1">
            {indexEntries.map((entry) => {
              const isHighlighted = highlightedEntry?.key === entry.key;
              return (
                <motion.div
                  key={entry.key}
                  ref={isHighlighted ? highlightedEntryRef : undefined}
                  className="flex justify-between items-center px-3 py-2 rounded font-mono text-sm"
                  style={{
                    background: isHighlighted ? `${colors.glow.healthy}20` : colors.oceanDark,
                    border: `1px solid ${isHighlighted ? colors.glow.healthy : 'transparent'}`,
                  }}
                  animate={isHighlighted ? { scale: [1, 1.02, 1] } : {}}
                >
                  <span style={{ color: isHighlighted ? colors.glow.healthy : colors.text.secondary }}>
                    {entry.key}
                  </span>
                  <span style={{ color: colors.text.muted }}>{entry.ctid}</span>
                </motion.div>
              );
            })}
          </div>

          {/* Scanning indicator */}
          <AnimatePresence>
            {phase === 'index-lookup' && (
              <motion.div
                className="absolute left-0 right-0 h-8 rounded pointer-events-none"
                style={{
                  background: `linear-gradient(180deg, transparent, ${colors.glow.healthy}40, transparent)`,
                  top: 60,
                }}
                initial={{ top: 60 }}
                animate={{ top: [60, 200, 60] }}
                transition={{ duration: 1.5, repeat: 0 }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Heap Side */}
        <div
          ref={heapPanelRef}
          className="p-4 rounded-lg relative"
          style={{
            background: colors.ocean,
            border: `2px solid ${
              phase === 'heap-hop' || phase === 'row-fetched' || phase === 'visibility-check'
                ? colors.glow.warning
                : colors.text.muted
            }40`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="px-2 py-1 rounded text-xs font-mono"
              style={{ background: colors.glow.warning + '20', color: colors.glow.warning }}
            >
              HEAP
            </div>
            <span className="text-sm" style={{ color: colors.text.muted }}>
              users table (unordered)
            </span>
          </div>

          <div className="space-y-4">
            {heapPages.map((page) => (
              <div key={page.pageNum}>
                <div className="text-xs mb-1" style={{ color: colors.text.muted }}>
                  Page {page.pageNum}
                </div>
                <div className="space-y-1">
                  {page.rows.map((row, rowIdx) => {
                    const isHighlighted =
                      highlightedRow?.id === row.id ||
                      (highlightedEntry &&
                        highlightedEntry.pageNum === page.pageNum &&
                        highlightedEntry.rowNum === rowIdx);

                    // This is the target row for the beam
                    const isBeamTarget =
                      highlightedEntry &&
                      highlightedEntry.pageNum === page.pageNum &&
                      highlightedEntry.rowNum === rowIdx;

                    return (
                      <motion.div
                        key={row.id}
                        ref={isBeamTarget ? targetRowRef : undefined}
                        className="px-3 py-2 rounded text-xs font-mono"
                        style={{
                          background: isHighlighted
                            ? `${colors.glow.warning}20`
                            : colors.oceanDark,
                          border: `1px solid ${isHighlighted ? colors.glow.warning : 'transparent'}`,
                        }}
                        animate={isHighlighted && phase === 'row-fetched' ? { scale: [1, 1.02, 1] } : {}}
                      >
                        <div className="flex justify-between items-center">
                          <span style={{ color: colors.text.secondary }}>
                            {row.email.split('@')[0]}@ | {row.name}
                          </span>
                          <span style={{ color: colors.text.muted }}>
                            xmin:{row.xmin} xmax:{row.xmax ?? '-'}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Visibility check highlight */}
          <AnimatePresence>
            {phase === 'visibility-check' && highlightedRow && (
              <motion.div
                className="absolute inset-0 rounded-lg pointer-events-none flex items-center justify-center"
                style={{ background: `${colors.oceanDark}80` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="p-4 rounded-lg text-center"
                  style={{ background: colors.oceanDark }}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <p style={{ color: colors.glow.healthy }}>Checking visibility...</p>
                  <p className="text-sm mt-2" style={{ color: colors.text.muted }}>
                    xmin: {highlightedRow.xmin} (committed, visible)
                  </p>
                  <p className="text-sm" style={{ color: colors.text.muted }}>
                    xmax: - (not deleted)
                  </p>
                  <motion.p
                    className="mt-2 font-medium"
                    style={{ color: colors.glow.healthy }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Row is visible to this transaction
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Beam Animation Overlay */}
      <AnimatePresence>
        {showBeam && beamCoords && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <svg className="w-full h-full" style={{ overflow: 'visible' }}>
              <defs>
                <filter id="beam-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={colors.glow.healthy} />
                  <stop offset="100%" stopColor={colors.glow.warning} />
                </linearGradient>
              </defs>

              {/* Beam path - curved arc from index entry to heap row */}
              {(() => {
                const { startX, startY, endX, endY } = beamCoords;
                const midX = (startX + endX) / 2;
                const midY = Math.min(startY, endY) - pathwayMotion.heapHop.arcHeight;
                const pathD = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;

                return (
                  <>
                    <motion.path
                      d={pathD}
                      fill="none"
                      stroke="url(#beam-gradient)"
                      strokeWidth="3"
                      strokeDasharray="8 4"
                      filter="url(#beam-glow)"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: beamProgress, opacity: 1 }}
                      style={{ strokeLinecap: 'round' }}
                    />

                    {/* Glowing particle at the head of the beam */}
                    {beamProgress > 0 && beamProgress < 1 && (
                      <motion.circle
                        r="8"
                        fill={colors.glow.healthy}
                        filter="url(#beam-glow)"
                        cx={startX + (endX - startX) * beamProgress}
                        cy={startY + (endY - startY) * beamProgress - pathwayMotion.heapHop.arcHeight * Math.sin(beamProgress * Math.PI)}
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: [0.5, 1, 0.5],
                          r: [6, 10, 6],
                        }}
                        transition={{ duration: 0.3, repeat: Infinity }}
                      />
                    )}

                    {/* Trail particles */}
                    {[...Array(5)].map((_, i) => {
                      const particleProgress = Math.max(0, beamProgress - i * 0.08);
                      if (particleProgress <= 0) return null;
                      return (
                        <motion.circle
                          key={i}
                          r={4 - i * 0.5}
                          fill={colors.glow.healthy}
                          opacity={0.3 - i * 0.05}
                          cx={startX + (endX - startX) * particleProgress}
                          cy={startY + (endY - startY) * particleProgress - pathwayMotion.heapHop.arcHeight * Math.sin(particleProgress * Math.PI)}
                        />
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ctid Address Reveal with Breakdown - Haptic Snap-back */}
      <AnimatePresence>
        {(phase === 'ctid-found' || phase === 'heap-hop') && highlightedEntry && (
          <motion.div
            className="flex justify-center my-6"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: [0.9, 1.08, 0.98, 1], // Haptic snap-back
            }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{
              duration: pathwayMotion.addressReveal.duration,
              scale: { duration: 0.4, times: [0, 0.5, 0.8, 1], ease: 'easeOut' },
            }}
          >
            <div
              className="px-6 py-4 rounded-xl text-center"
              style={{
                background: `${colors.glow.healthy}10`,
                border: `2px solid ${colors.glow.healthy}40`,
                boxShadow: `0 0 30px ${colors.glow.healthy}20`,
              }}
            >
              {/* ctid value with extra punch */}
              <motion.div
                className="text-2xl font-mono font-bold mb-3"
                style={{ color: colors.glow.healthy }}
                initial={{ scale: 0.8 }}
                animate={{ scale: [0.8, 1.15, 1] }} // Snap-back on the address
                transition={{ duration: 0.4, times: [0, 0.6, 1], ease: 'easeOut' }}
              >
                ctid = {highlightedEntry.ctid}
              </motion.div>

              {/* Breakdown animation */}
              <div className="flex items-center justify-center gap-4">
                <motion.div
                  className="px-4 py-2 rounded-lg"
                  style={{
                    background: colors.ocean,
                    border: `1px solid ${colors.glow.warning}40`,
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: pathwayMotion.addressReveal.stagger }}
                >
                  <div className="text-xs mb-1" style={{ color: colors.text.muted }}>
                    Block Number
                  </div>
                  <div
                    className="text-xl font-mono font-bold"
                    style={{ color: colors.glow.warning }}
                  >
                    Page {highlightedEntry.pageNum}
                  </div>
                </motion.div>

                <motion.span
                  className="text-xl"
                  style={{ color: colors.text.muted }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: pathwayMotion.addressReveal.stagger * 1.5 }}
                >
                  +
                </motion.span>

                <motion.div
                  className="px-4 py-2 rounded-lg"
                  style={{
                    background: colors.ocean,
                    border: `1px solid ${colors.glow.warning}40`,
                  }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: pathwayMotion.addressReveal.stagger * 2 }}
                >
                  <div className="text-xs mb-1" style={{ color: colors.text.muted }}>
                    Slot Number
                  </div>
                  <div
                    className="text-xl font-mono font-bold"
                    style={{ color: colors.glow.warning }}
                  >
                    Slot {highlightedEntry.rowNum + 1}
                  </div>
                </motion.div>
              </div>

              {phase === 'heap-hop' && (
                <motion.p
                  className="mt-3 text-sm"
                  style={{ color: colors.text.muted }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Jumping to heap to fetch the row...
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result with Haptic Snap-back */}
      <AnimatePresence>
        {phase === 'complete' && highlightedRow && (
          <motion.div
            className="mt-6 p-4 rounded-lg"
            style={{
              background: `${colors.glow.healthy}10`,
              border: `1px solid ${colors.glow.healthy}40`,
            }}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: [0.95, 1.06, 0.98, 1], // Haptic snap-back
            }}
            transition={{
              scale: { duration: 0.4, times: [0, 0.5, 0.8, 1], ease: 'easeOut' },
            }}
          >
            <div className="text-center mb-4">
              <span
                className="px-3 py-1 rounded text-sm font-medium"
                style={{ background: colors.glow.healthy, color: colors.ocean }}
              >
                Row Retrieved
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-sm">
              <div className="text-center">
                <div style={{ color: colors.text.muted }}>id</div>
                <div style={{ color: colors.text.primary }}>{highlightedRow.id}</div>
              </div>
              <div className="text-center">
                <div style={{ color: colors.text.muted }}>email</div>
                <div style={{ color: colors.glow.healthy }}>{highlightedRow.email}</div>
              </div>
              <div className="text-center">
                <div style={{ color: colors.text.muted }}>name</div>
                <div style={{ color: colors.text.primary }}>{highlightedRow.name}</div>
              </div>
              <div className="text-center">
                <div style={{ color: colors.text.muted }}>created_at</div>
                <div style={{ color: colors.text.primary }}>{highlightedRow.created_at}</div>
              </div>
            </div>

            <div
              className="mt-4 p-3 rounded text-sm text-center"
              style={{ background: colors.oceanDark }}
            >
              <p style={{ color: colors.text.secondary }}>
                <strong>Total pages read:</strong> 1 (index leaf) + 1 (heap) ={' '}
                <span style={{ color: colors.glow.healthy }}>2 pages</span>
              </p>
              <p className="mt-1" style={{ color: colors.text.muted }}>
                vs. 847,293 pages for sequential scan
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explanation */}
      <div
        className="mt-6 p-4 rounded-lg text-sm"
        style={{ background: colors.ocean }}
      >
        <p style={{ color: colors.text.secondary }}>
          <span style={{ color: colors.glow.healthy }}>Index</span> = sorted, compact (just email + ctid)
        </p>
        <p className="mt-1" style={{ color: colors.text.secondary }}>
          <span style={{ color: colors.glow.warning }}>Heap</span> = unordered, complete (all columns + xmin/xmax)
        </p>
        <p className="mt-2" style={{ color: colors.text.muted }}>
          The index doesn't store visibility info. That's why we MUST hop to the heap to check
          xmin/xmax (unless the visibility map says "all-visible").
        </p>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
