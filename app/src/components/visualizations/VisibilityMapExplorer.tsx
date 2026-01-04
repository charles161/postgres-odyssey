import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface Page {
  id: number;
  isAllVisible: boolean;
  deadTupleCount: number;
  isScanning: boolean;
  isSkipped: boolean;
}

export function VisibilityMapExplorer() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isRunningQuery, setIsRunningQuery] = useState(false);
  const [queryType, setQueryType] = useState<'sequential' | 'index-only'>('sequential');
  const [pagesScanned, setPagesScanned] = useState(0);
  const [pagesSkipped, setPagesSkipped] = useState(0);
  const [hasVacuumed, setHasVacuumed] = useState(false);

  // Initialize pages
  useEffect(() => {
    const initialPages: Page[] = [];
    for (let i = 0; i < 24; i++) {
      initialPages.push({
        id: i,
        isAllVisible: Math.random() > 0.6, // ~40% have dead tuples initially
        deadTupleCount: Math.random() > 0.6 ? 0 : Math.floor(Math.random() * 5) + 1,
        isScanning: false,
        isSkipped: false,
      });
    }
    setPages(initialPages);
  }, []);

  const runVacuum = () => {
    // VACUUM makes all pages all-visible
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        isAllVisible: true,
        deadTupleCount: 0,
      }))
    );
    setHasVacuumed(true);
  };

  const runQuery = async () => {
    if (isRunningQuery) return;

    setIsRunningQuery(true);
    setPagesScanned(0);
    setPagesSkipped(0);

    // Reset page states
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        isScanning: false,
        isSkipped: false,
      }))
    );

    let scanned = 0;
    let skipped = 0;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      // Update scanning state
      setPages((prev) =>
        prev.map((p, idx) =>
          idx === i ? { ...p, isScanning: true } : { ...p, isScanning: false }
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Index-only scan can skip all-visible pages
      if (queryType === 'index-only' && page.isAllVisible) {
        skipped++;
        setPagesSkipped(skipped);
        setPages((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, isScanning: false, isSkipped: true } : p
          )
        );
      } else {
        scanned++;
        setPagesScanned(scanned);
        setPages((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, isScanning: false } : p
          )
        );
      }
    }

    setIsRunningQuery(false);
  };

  const reset = () => {
    setHasVacuumed(false);
    const resetPages: Page[] = [];
    for (let i = 0; i < 24; i++) {
      resetPages.push({
        id: i,
        isAllVisible: Math.random() > 0.6,
        deadTupleCount: Math.random() > 0.6 ? 0 : Math.floor(Math.random() * 5) + 1,
        isScanning: false,
        isSkipped: false,
      });
    }
    setPages(resetPages);
    setPagesScanned(0);
    setPagesSkipped(0);
  };

  const allVisibleCount = pages.filter((p) => p.isAllVisible).length;
  const notVisibleCount = pages.length - allVisibleCount;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex flex-wrap gap-4 justify-center">
        <div
          className="px-4 py-2 rounded-lg"
          style={{ background: colors.oceanDark, border: `1px solid ${colors.glow.healthy}40` }}
        >
          <span className="text-sm" style={{ color: colors.text.muted }}>
            All-visible pages:{' '}
          </span>
          <span className="font-mono font-bold" style={{ color: colors.glow.healthy }}>
            {allVisibleCount}
          </span>
        </div>

        <div
          className="px-4 py-2 rounded-lg"
          style={{ background: colors.oceanDark, border: `1px solid ${colors.glow.warning}40` }}
        >
          <span className="text-sm" style={{ color: colors.text.muted }}>
            Needs heap access:{' '}
          </span>
          <span className="font-mono font-bold" style={{ color: colors.glow.warning }}>
            {notVisibleCount}
          </span>
        </div>

        {pagesScanned > 0 || pagesSkipped > 0 ? (
          <>
            <div
              className="px-4 py-2 rounded-lg"
              style={{ background: colors.oceanDark, border: `1px solid ${colors.text.muted}40` }}
            >
              <span className="text-sm" style={{ color: colors.text.muted }}>
                Pages scanned:{' '}
              </span>
              <span className="font-mono font-bold" style={{ color: colors.text.secondary }}>
                {pagesScanned}
              </span>
            </div>

            <div
              className="px-4 py-2 rounded-lg"
              style={{ background: colors.oceanDark, border: `1px solid ${colors.glow.healthy}40` }}
            >
              <span className="text-sm" style={{ color: colors.text.muted }}>
                Pages skipped:{' '}
              </span>
              <span className="font-mono font-bold" style={{ color: colors.glow.healthy }}>
                {pagesSkipped}
              </span>
            </div>
          </>
        ) : null}
      </div>

      {/* Page grid */}
      <div
        className="p-6 rounded-xl"
        style={{ background: colors.oceanDark, border: `1px solid ${colors.text.muted}30` }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-mono" style={{ color: colors.text.muted }}>
            Visibility Map: users table
          </span>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{ background: colors.glow.healthy, boxShadow: `0 0 6px ${colors.glow.healthy}` }}
              />
              <span style={{ color: colors.text.muted }}>All-visible</span>
            </div>
            <div className="flex items-center gap-1">
              <motion.div
                className="w-3 h-3 rounded"
                style={{ background: colors.glow.warning }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span style={{ color: colors.text.muted }}>Has dead tuples</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-6 md:grid-cols-8 gap-2">
          {pages.map((page) => (
            <motion.div
              key={page.id}
              className="aspect-square rounded-lg flex items-center justify-center text-xs font-mono relative"
              style={{
                background: page.isSkipped
                  ? `${colors.glow.healthy}10`
                  : page.isAllVisible
                  ? colors.oceanLight
                  : colors.oceanDark,
                border: `2px solid ${
                  page.isScanning
                    ? colors.glow.healthy
                    : page.isSkipped
                    ? colors.glow.healthy
                    : page.isAllVisible
                    ? colors.glow.healthy
                    : colors.glow.warning
                }`,
                boxShadow: page.isScanning
                  ? `0 0 15px ${colors.glow.healthy}`
                  : page.isAllVisible
                  ? `0 0 6px ${colors.glow.healthy}40`
                  : 'none',
              }}
              animate={{
                opacity: page.isAllVisible ? 1 : [0.7, 1, 0.7],
                scale: page.isScanning ? 1.1 : 1,
              }}
              transition={{
                opacity: { duration: 1.5, repeat: page.isAllVisible ? 0 : Infinity },
                scale: { duration: 0.2 },
              }}
            >
              <span style={{ color: page.isAllVisible ? colors.glow.healthy : colors.glow.warning }}>
                {page.id}
              </span>

              {/* Dead tuple indicator */}
              {page.deadTupleCount > 0 && !page.isAllVisible && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                  style={{ background: colors.glow.warning, color: colors.oceanDark }}
                >
                  {page.deadTupleCount}
                </div>
              )}

              {/* Skip indicator */}
              <AnimatePresence>
                {page.isSkipped && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center rounded-lg"
                    style={{ background: `${colors.glow.healthy}20` }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <span style={{ color: colors.glow.healthy }}>✓</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 justify-center items-center">
        {/* Query type toggle */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${colors.text.muted}40` }}>
          <button
            className="px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: queryType === 'sequential' ? colors.glow.warning : colors.oceanDark,
              color: queryType === 'sequential' ? colors.oceanDark : colors.text.muted,
            }}
            onClick={() => setQueryType('sequential')}
          >
            Sequential Scan
          </button>
          <button
            className="px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: queryType === 'index-only' ? colors.glow.healthy : colors.oceanDark,
              color: queryType === 'index-only' ? colors.oceanDark : colors.text.muted,
            }}
            onClick={() => setQueryType('index-only')}
          >
            Index-Only Scan
          </button>
        </div>

        <motion.button
          className="px-6 py-2 rounded-lg font-medium"
          style={{
            background: isRunningQuery ? colors.oceanDark : colors.glow.healthy,
            color: isRunningQuery ? colors.text.muted : colors.oceanDark,
            cursor: isRunningQuery ? 'not-allowed' : 'pointer',
          }}
          whileHover={!isRunningQuery ? { scale: 1.05 } : {}}
          whileTap={!isRunningQuery ? { scale: 0.95 } : {}}
          onClick={runQuery}
          disabled={isRunningQuery}
        >
          {isRunningQuery ? 'Running...' : 'Run Query'}
        </motion.button>

        <motion.button
          className="px-6 py-2 rounded-lg font-medium"
          style={{
            background: hasVacuumed ? colors.oceanDark : `${colors.glow.healthy}20`,
            color: hasVacuumed ? colors.text.muted : colors.glow.healthy,
            border: `1px solid ${colors.glow.healthy}40`,
            cursor: hasVacuumed ? 'not-allowed' : 'pointer',
          }}
          whileHover={!hasVacuumed ? { scale: 1.05 } : {}}
          whileTap={!hasVacuumed ? { scale: 0.95 } : {}}
          onClick={runVacuum}
          disabled={hasVacuumed}
        >
          {hasVacuumed ? 'Already Vacuumed' : 'Run VACUUM'}
        </motion.button>

        <motion.button
          className="px-4 py-2 rounded-lg text-sm"
          style={{
            background: colors.oceanDark,
            color: colors.text.muted,
            border: `1px solid ${colors.text.muted}40`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={reset}
        >
          Reset
        </motion.button>
      </div>

      {/* Insight */}
      <div
        className="p-4 rounded-lg text-center max-w-xl mx-auto"
        style={{ background: colors.oceanDark, border: `1px solid ${colors.text.muted}20` }}
      >
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          {queryType === 'index-only' ? (
            hasVacuumed ? (
              <>
                <span style={{ color: colors.glow.healthy }}>All pages are all-visible!</span>{' '}
                Index-only scans can skip every page—no heap access needed.
              </>
            ) : (
              <>
                Index-only scans can only skip <span style={{ color: colors.glow.healthy }}>all-visible</span> pages.
                Pages with dead tuples still require heap access. Run VACUUM to see the difference.
              </>
            )
          ) : (
            <>
              Sequential scans must read every page regardless of visibility.
              Try <span style={{ color: colors.glow.healthy }}>Index-Only Scan</span> to see how VACUUM enables skipping.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
