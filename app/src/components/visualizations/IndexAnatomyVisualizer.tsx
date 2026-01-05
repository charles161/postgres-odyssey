import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface HeapRow {
  ctid: string;
  id: number;
  name: string;
  email: string;
}

interface IndexEntry {
  key: string;
  ctid: string;
}

// Sample data - heap is UNORDERED (rows inserted in random order)
const HEAP_DATA: HeapRow[] = [
  { ctid: '(0, 1)', id: 42, name: 'Zoe', email: 'zoe@example.com' },
  { ctid: '(0, 2)', id: 7, name: 'Bob', email: 'bob@example.com' },
  { ctid: '(0, 3)', id: 99, name: 'Carol', email: 'carol@example.com' },
  { ctid: '(1, 1)', id: 3, name: 'Eve', email: 'eve@example.com' },
  { ctid: '(1, 2)', id: 55, name: 'Alice', email: 'alice@example.com' },
  { ctid: '(1, 3)', id: 21, name: 'Dave', email: 'dave@example.com' },
];

// Index on email - SORTED alphabetically, only stores email + pointer
const EMAIL_INDEX: IndexEntry[] = [
  { key: 'alice@example.com', ctid: '(1, 2)' },
  { key: 'bob@example.com', ctid: '(0, 2)' },
  { key: 'carol@example.com', ctid: '(0, 3)' },
  { key: 'dave@example.com', ctid: '(1, 3)' },
  { key: 'eve@example.com', ctid: '(1, 1)' },
  { key: 'zoe@example.com', ctid: '(0, 1)' },
];

export function IndexAnatomyVisualizer() {
  const [highlightedCtid, setHighlightedCtid] = useState<string | null>(null);
  const [showConnection, setShowConnection] = useState(false);

  const handleIndexHover = (ctid: string) => {
    setHighlightedCtid(ctid);
    setShowConnection(true);
  };

  const handleIndexLeave = () => {
    setHighlightedCtid(null);
    setShowConnection(false);
  };

  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: colors.oceanDark,
        border: `1px solid ${colors.text.muted}20`,
      }}
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2" style={{ color: colors.text.primary }}>
          Two Separate Files on Disk
        </h3>
        <p className="text-sm" style={{ color: colors.text.muted }}>
          Hover over an index entry to see where it points in the heap
        </p>
      </div>

      {/* File paths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div
          className="p-3 rounded-lg font-mono text-xs"
          style={{ background: colors.ocean, color: colors.text.muted }}
        >
          <span style={{ color: colors.glow.warning }}>Heap file:</span>
          <br />
          $PGDATA/base/16384/<span style={{ color: colors.text.secondary }}>18204</span>
          <span className="text-xs ml-2" style={{ color: colors.text.muted }}>(table oid)</span>
        </div>
        <div
          className="p-3 rounded-lg font-mono text-xs"
          style={{ background: colors.ocean, color: colors.text.muted }}
        >
          <span style={{ color: colors.glow.healthy }}>Index file:</span>
          <br />
          $PGDATA/base/16384/<span style={{ color: colors.text.secondary }}>18210</span>
          <span className="text-xs ml-2" style={{ color: colors.text.muted }}>(index oid)</span>
        </div>
      </div>

      {/* Main comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* HEAP - Left side */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: colors.glow.warning }}
            />
            <span className="text-sm font-medium" style={{ color: colors.glow.warning }}>
              HEAP (users table)
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{ background: `${colors.glow.critical}20`, color: colors.glow.critical }}
            >
              UNORDERED
            </span>
          </div>

          <div
            className="rounded-lg overflow-hidden"
            style={{ border: `1px solid ${colors.glow.warning}40` }}
          >
            {/* Column headers */}
            <div
              className="grid grid-cols-4 gap-px text-xs font-mono p-2"
              style={{ background: `${colors.glow.warning}20`, color: colors.glow.warning }}
            >
              <span>ctid</span>
              <span>id</span>
              <span>name</span>
              <span>email</span>
            </div>

            {/* Page 0 */}
            <div className="p-2" style={{ background: colors.ocean }}>
              <div className="text-xs mb-1" style={{ color: colors.text.muted }}>
                Page 0
              </div>
              {HEAP_DATA.slice(0, 3).map((row) => (
                <motion.div
                  key={row.ctid}
                  className="grid grid-cols-4 gap-px text-xs font-mono py-1 px-1 rounded"
                  style={{
                    background:
                      highlightedCtid === row.ctid
                        ? `${colors.glow.healthy}30`
                        : 'transparent',
                    color:
                      highlightedCtid === row.ctid
                        ? colors.text.primary
                        : colors.text.secondary,
                  }}
                  animate={{
                    scale: highlightedCtid === row.ctid ? 1.02 : 1,
                  }}
                >
                  <span style={{ color: colors.text.muted }}>{row.ctid}</span>
                  <span>{row.id}</span>
                  <span>{row.name}</span>
                  <span className="truncate">{row.email.split('@')[0]}@</span>
                </motion.div>
              ))}
            </div>

            {/* Page 1 */}
            <div
              className="p-2"
              style={{ background: colors.oceanLight, borderTop: `1px solid ${colors.text.muted}20` }}
            >
              <div className="text-xs mb-1" style={{ color: colors.text.muted }}>
                Page 1
              </div>
              {HEAP_DATA.slice(3, 6).map((row) => (
                <motion.div
                  key={row.ctid}
                  className="grid grid-cols-4 gap-px text-xs font-mono py-1 px-1 rounded"
                  style={{
                    background:
                      highlightedCtid === row.ctid
                        ? `${colors.glow.healthy}30`
                        : 'transparent',
                    color:
                      highlightedCtid === row.ctid
                        ? colors.text.primary
                        : colors.text.secondary,
                  }}
                  animate={{
                    scale: highlightedCtid === row.ctid ? 1.02 : 1,
                  }}
                >
                  <span style={{ color: colors.text.muted }}>{row.ctid}</span>
                  <span>{row.id}</span>
                  <span>{row.name}</span>
                  <span className="truncate">{row.email.split('@')[0]}@</span>
                </motion.div>
              ))}
            </div>

            {/* Note */}
            <div
              className="p-2 text-xs"
              style={{ background: colors.oceanDark, color: colors.text.muted }}
            >
              Contains <strong>all columns</strong>. Notice: IDs are random order (42, 7, 99...)
            </div>
          </div>
        </div>

        {/* INDEX - Right side */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: colors.glow.healthy }}
            />
            <span className="text-sm font-medium" style={{ color: colors.glow.healthy }}>
              INDEX on email
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{ background: `${colors.glow.healthy}20`, color: colors.glow.healthy }}
            >
              SORTED
            </span>
          </div>

          <div
            className="rounded-lg overflow-hidden"
            style={{ border: `1px solid ${colors.glow.healthy}40` }}
          >
            {/* Column headers */}
            <div
              className="grid grid-cols-2 gap-px text-xs font-mono p-2"
              style={{ background: `${colors.glow.healthy}20`, color: colors.glow.healthy }}
            >
              <span>key (email)</span>
              <span>→ ctid</span>
            </div>

            {/* Index entries - SORTED */}
            <div className="p-2" style={{ background: colors.ocean }}>
              {EMAIL_INDEX.map((entry) => (
                <motion.div
                  key={entry.key}
                  className="grid grid-cols-2 gap-px text-xs font-mono py-1.5 px-2 rounded cursor-pointer focus-ring"
                  tabIndex={0}
                  role="button"
                  aria-label={`Index entry: ${entry.key}, pointer: ${entry.ctid}`}
                  style={{
                    background:
                      highlightedCtid === entry.ctid
                        ? `${colors.glow.healthy}30`
                        : 'transparent',
                    color: colors.text.secondary,
                  }}
                  onMouseEnter={() => handleIndexHover(entry.ctid)}
                  onMouseLeave={handleIndexLeave}
                  onFocus={() => handleIndexHover(entry.ctid)}
                  onBlur={handleIndexLeave}
                  whileHover={{ x: 4 }}
                >
                  <span
                    style={{
                      color:
                        highlightedCtid === entry.ctid
                          ? colors.text.primary
                          : colors.text.secondary,
                    }}
                  >
                    {entry.key.split('@')[0]}@...
                  </span>
                  <span
                    style={{
                      color:
                        highlightedCtid === entry.ctid
                          ? colors.glow.healthy
                          : colors.text.muted,
                    }}
                  >
                    → {entry.ctid}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Note */}
            <div
              className="p-2 text-xs"
              style={{ background: colors.oceanDark, color: colors.text.muted }}
            >
              Only stores <strong>indexed column + pointer</strong>. Alphabetically sorted!
            </div>
          </div>
        </div>

        {/* Connection arrow overlay */}
        <AnimatePresence>
          {showConnection && highlightedCtid && (
            <motion.div
              className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div
                className="px-3 py-1.5 rounded-full text-xs font-mono"
                style={{
                  background: colors.glow.healthy,
                  color: colors.ocean,
                }}
              >
                lookup via {highlightedCtid}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Key insight */}
      <div
        className="mt-6 p-4 rounded-lg"
        style={{
          background: colors.ocean,
          border: `1px solid ${colors.text.muted}20`,
        }}
      >
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          <strong style={{ color: colors.text.primary }}>The key insight:</strong> The index doesn't
          contain your data—it contains a <em>sorted shortcut</em> to find data in the heap. Like a
          book's index that says "PostgreSQL... page 247" without containing the actual content.
        </p>
      </div>

      {/* Storage comparison */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div
          className="p-3 rounded-lg"
          style={{ background: `${colors.glow.warning}10`, border: `1px solid ${colors.glow.warning}20` }}
        >
          <div className="text-lg font-bold" style={{ color: colors.glow.warning }}>
            ~200 bytes/row
          </div>
          <div className="text-xs" style={{ color: colors.text.muted }}>
            Heap (all columns)
          </div>
        </div>
        <div
          className="p-3 rounded-lg"
          style={{ background: `${colors.glow.healthy}10`, border: `1px solid ${colors.glow.healthy}20` }}
        >
          <div className="text-lg font-bold" style={{ color: colors.glow.healthy }}>
            ~30 bytes/entry
          </div>
          <div className="text-xs" style={{ color: colors.text.muted }}>
            Index (key + ctid only)
          </div>
        </div>
      </div>
    </div>
  );
}
