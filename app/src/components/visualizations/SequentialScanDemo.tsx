import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface Page {
  id: number;
  rows: { id: number; email: string }[];
  isTarget: boolean;
  scanned: boolean;
}

const TOTAL_PAGES = 48;
const ROWS_PER_PAGE = 4;
const TARGET_PAGE = 38;
const TARGET_ROW_ID = TARGET_PAGE * ROWS_PER_PAGE + 2;

function generatePages(): Page[] {
  const pages: Page[] = [];
  const emails = [
    'bob@example.com',
    'carol@example.com',
    'dave@example.com',
    'eve@example.com',
    'frank@example.com',
    'grace@example.com',
    'henry@example.com',
    'alice@example.com', // Our target
  ];

  for (let i = 0; i < TOTAL_PAGES; i++) {
    const rows = [];
    for (let j = 0; j < ROWS_PER_PAGE; j++) {
      const rowId = i * ROWS_PER_PAGE + j;
      const isTarget = i === TARGET_PAGE && j === 2;
      rows.push({
        id: rowId,
        email: isTarget ? 'alice@example.com' : emails[Math.floor(Math.random() * 7)],
      });
    }
    pages.push({
      id: i,
      rows,
      isTarget: i === TARGET_PAGE,
      scanned: false,
    });
  }
  return pages;
}

export function SequentialScanDemo() {
  const [pages, setPages] = useState<Page[]>(generatePages);
  const [scanning, setScanning] = useState(false);
  const [currentPage, setCurrentPage] = useState(-1);
  const [found, setFound] = useState(false);
  const [pagesScanned, setPagesScanned] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const reset = useCallback(() => {
    setPages(generatePages());
    setScanning(false);
    setCurrentPage(-1);
    setFound(false);
    setPagesScanned(0);
    setElapsed(0);
  }, []);

  const startScan = useCallback(() => {
    reset();
    setScanning(true);
    setCurrentPage(0);
  }, [reset]);

  // Scanning logic
  // Slowed down to 175ms for better visual comprehension
  useEffect(() => {
    if (!scanning || found) return;

    const timer = setTimeout(() => {
      if (currentPage >= TOTAL_PAGES - 1) {
        setScanning(false);
        return;
      }

      setPages((prev) =>
        prev.map((p, i) => (i === currentPage ? { ...p, scanned: true } : p))
      );

      if (currentPage === TARGET_PAGE) {
        setFound(true);
        setScanning(false);
        setPagesScanned(currentPage + 1);
      } else {
        setCurrentPage((prev) => prev + 1);
        setPagesScanned(currentPage + 1);
      }
    }, 175);

    return () => clearTimeout(timer);
  }, [scanning, currentPage, found]);

  // Elapsed time
  useEffect(() => {
    if (!scanning) return;

    const timer = setInterval(() => {
      setElapsed((prev) => prev + 100);
    }, 100);

    return () => clearInterval(timer);
  }, [scanning]);

  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: colors.oceanDark,
        border: `1px solid ${colors.text.muted}20`,
      }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-medium" style={{ color: colors.text.primary }}>
            Sequential Scan: The Brute Force
          </h3>
          <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
            Finding alice@example.com in a table with no index
          </p>
        </div>

        <motion.button
          className="px-4 py-2 rounded-lg text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startScan}
          disabled={scanning}
          style={{
            background: scanning ? colors.oceanLight : `${colors.glow.warning}20`,
            color: scanning ? colors.text.muted : colors.glow.warning,
            border: `1px solid ${scanning ? colors.text.muted : colors.glow.warning}40`,
            cursor: scanning ? 'not-allowed' : 'pointer',
          }}
        >
          {scanning ? 'Scanning...' : found ? 'Scan Again' : 'Start Scan'}
        </motion.button>
      </div>

      {/* Query */}
      <div
        className="p-3 rounded-lg mb-6 font-mono text-sm"
        style={{
          background: colors.ocean,
          border: `1px solid ${colors.text.muted}20`,
        }}
      >
        <span style={{ color: colors.glow.healthy }}>SELECT</span>
        <span style={{ color: colors.text.secondary }}> * </span>
        <span style={{ color: colors.glow.healthy }}>FROM</span>
        <span style={{ color: colors.text.secondary }}> users </span>
        <span style={{ color: colors.glow.healthy }}>WHERE</span>
        <span style={{ color: colors.text.secondary }}> email = </span>
        <span style={{ color: colors.glow.warning }}>'alice@example.com'</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div
          className="p-3 rounded-lg text-center"
          style={{ background: colors.ocean }}
        >
          <div
            className="text-2xl font-bold font-mono"
            style={{ color: colors.text.primary }}
          >
            {pagesScanned}
          </div>
          <div className="text-xs" style={{ color: colors.text.muted }}>
            Pages Scanned
          </div>
        </div>

        <div
          className="p-3 rounded-lg text-center"
          style={{ background: colors.ocean }}
        >
          <div
            className="text-2xl font-bold font-mono"
            style={{ color: colors.text.primary }}
          >
            {pagesScanned * ROWS_PER_PAGE}
          </div>
          <div className="text-xs" style={{ color: colors.text.muted }}>
            Rows Checked
          </div>
        </div>

        <div
          className="p-3 rounded-lg text-center"
          style={{ background: colors.ocean }}
        >
          <div
            className="text-2xl font-bold font-mono"
            style={{
              color: found ? colors.glow.healthy : colors.text.primary,
            }}
          >
            {(elapsed / 1000).toFixed(1)}s
          </div>
          <div className="text-xs" style={{ color: colors.text.muted }}>
            Elapsed
          </div>
        </div>
      </div>

      {/* Page Grid - The Heap */}
      <div className="mb-4">
        <p className="text-xs uppercase tracking-wider mb-2" style={{ color: colors.text.muted }}>
          The Heap (48 pages, 192 rows)
        </p>
        <div className="grid grid-cols-8 md:grid-cols-12 gap-1">
          {pages.map((page, i) => (
            <motion.div
              key={page.id}
              className="aspect-square rounded flex items-center justify-center text-xs font-mono relative"
              style={{
                background:
                  i === currentPage
                    ? colors.glow.warning
                    : page.scanned && page.isTarget
                    ? colors.glow.healthy
                    : page.scanned
                    ? colors.oceanLight
                    : colors.ocean,
                border: `1px solid ${
                  i === currentPage
                    ? colors.glow.warning
                    : page.isTarget && found
                    ? colors.glow.healthy
                    : colors.text.muted
                }40`,
                color:
                  i === currentPage
                    ? colors.ocean
                    : page.isTarget && found
                    ? colors.glow.healthy
                    : colors.text.muted,
              }}
              animate={
                i === currentPage
                  ? {
                      scale: [1, 1.1, 1],
                    }
                  : {}
              }
              transition={{ duration: 0.1 }}
            >
              {page.id}
              {page.isTarget && found && (
                <motion.div
                  className="absolute inset-0 rounded"
                  style={{
                    background: `${colors.glow.healthy}30`,
                    boxShadow: `0 0 20px ${colors.glow.healthy}60`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.5, 1] }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Found result */}
      <AnimatePresence>
        {found && (
          <motion.div
            className="p-4 rounded-lg mt-4"
            style={{
              background: `${colors.glow.healthy}10`,
              border: `1px solid ${colors.glow.healthy}40`,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: `${colors.glow.healthy}20` }}
              >
                <span style={{ color: colors.glow.healthy }}>✓</span>
              </div>
              <div>
                <p className="font-medium" style={{ color: colors.glow.healthy }}>
                  Found: alice@example.com
                </p>
                <p className="text-sm" style={{ color: colors.text.muted }}>
                  Row {TARGET_ROW_ID} on Page {TARGET_PAGE} — after scanning{' '}
                  <span style={{ color: colors.glow.warning }}>{pagesScanned} pages</span>
                </p>
              </div>
            </div>

            <div
              className="mt-4 p-3 rounded text-sm"
              style={{ background: colors.oceanDark }}
            >
              <p style={{ color: colors.text.secondary }}>
                <span style={{ color: colors.glow.critical }}>Problem:</span> We had to read{' '}
                <strong>{pagesScanned} pages</strong> and check{' '}
                <strong>{pagesScanned * ROWS_PER_PAGE} rows</strong> just to find one email.
              </p>
              <p className="mt-2" style={{ color: colors.text.muted }}>
                In production, this table might have 1,000,000 pages. That's hours of scanning.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ background: colors.ocean, border: `1px solid ${colors.text.muted}40` }}
          />
          <span style={{ color: colors.text.muted }}>Not scanned</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ background: colors.glow.warning }}
          />
          <span style={{ color: colors.text.muted }}>Currently scanning</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ background: colors.oceanLight, border: `1px solid ${colors.text.muted}40` }}
          />
          <span style={{ color: colors.text.muted }}>Scanned (not found)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ background: colors.glow.healthy }}
          />
          <span style={{ color: colors.text.muted }}>Target found</span>
        </div>
      </div>
    </div>
  );
}
