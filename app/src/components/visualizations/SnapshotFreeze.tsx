import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface Row {
  id: number;
  name: string;
  balance: number;
  xmin: number;
}

export function SnapshotFreeze() {
  const [worldTime, setWorldTime] = useState(0);
  const [snapshotTime, setSnapshotTime] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [worldRows, setWorldRows] = useState<Row[]>([
    { id: 1, name: 'Alice', balance: 1000, xmin: 100 },
    { id: 2, name: 'Bob', balance: 500, xmin: 100 },
    { id: 3, name: 'Carol', balance: 750, xmin: 100 },
  ]);

  // Events that will happen over time
  const events = [
    { time: 2, action: 'update', id: 1, newBalance: 1500, description: 'Alice deposits $500' },
    { time: 4, action: 'insert', name: 'Dave', balance: 200, description: 'Dave opens account' },
    { time: 6, action: 'update', id: 2, newBalance: 0, description: 'Bob withdraws all' },
    { time: 8, action: 'delete', id: 3, description: 'Carol closes account' },
  ];

  const startDemo = useCallback(() => {
    setWorldTime(0);
    setSnapshotTime(null);
    setWorldRows([
      { id: 1, name: 'Alice', balance: 1000, xmin: 100 },
      { id: 2, name: 'Bob', balance: 500, xmin: 100 },
      { id: 3, name: 'Carol', balance: 750, xmin: 100 },
    ]);
    setIsRunning(true);
  }, []);

  const takeSnapshot = useCallback(() => {
    setSnapshotTime(worldTime);
  }, [worldTime]);

  // Progress time and apply events
  useEffect(() => {
    if (!isRunning) return;

    if (worldTime >= 10) {
      setIsRunning(false);
      return;
    }

    const timer = setTimeout(() => {
      setWorldTime((t) => t + 1);

      // Check for events at this time
      events.forEach((event) => {
        if (event.time === worldTime + 1) {
          setWorldRows((rows) => {
            if (event.action === 'update') {
              return rows.map((r) =>
                r.id === event.id
                  ? { ...r, balance: event.newBalance!, xmin: 100 + worldTime + 1 }
                  : r
              );
            }
            if (event.action === 'insert') {
              return [
                ...rows,
                {
                  id: rows.length + 1,
                  name: event.name!,
                  balance: event.balance!,
                  xmin: 100 + worldTime + 1,
                },
              ];
            }
            if (event.action === 'delete') {
              return rows.filter((r) => r.id !== event.id);
            }
            return rows;
          });
        }
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [isRunning, worldTime, events]);

  // Get rows visible at snapshot time
  const getSnapshotRows = () => {
    if (snapshotTime === null) return [];

    // Build initial state
    let rows: Row[] = [
      { id: 1, name: 'Alice', balance: 1000, xmin: 100 },
      { id: 2, name: 'Bob', balance: 500, xmin: 100 },
      { id: 3, name: 'Carol', balance: 750, xmin: 100 },
    ];

    // Apply events up to snapshot time
    events.forEach((event) => {
      if (event.time <= snapshotTime) {
        if (event.action === 'update') {
          rows = rows.map((r) =>
            r.id === event.id
              ? { ...r, balance: event.newBalance!, xmin: 100 + event.time }
              : r
          );
        }
        if (event.action === 'insert') {
          rows = [
            ...rows,
            {
              id: rows.length + 1,
              name: event.name!,
              balance: event.balance!,
              xmin: 100 + event.time,
            },
          ];
        }
        if (event.action === 'delete') {
          rows = rows.filter((r) => r.id !== event.id);
        }
      }
    });

    return rows;
  };

  const snapshotRows = getSnapshotRows();

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
            The Snapshot Freeze
          </h3>
          <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
            Your transaction sees a photograph of the database at BEGIN
          </p>
        </div>

        <div className="flex gap-2">
          <motion.button
            className="px-4 py-2 rounded-lg text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startDemo}
            disabled={isRunning}
            style={{
              background: `${colors.glow.warning}20`,
              color: colors.glow.warning,
              border: `1px solid ${colors.glow.warning}40`,
            }}
          >
            {isRunning ? 'Running...' : 'Start Time'}
          </motion.button>
          <motion.button
            className="px-4 py-2 rounded-lg text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={takeSnapshot}
            disabled={snapshotTime !== null}
            style={{
              background:
                snapshotTime !== null ? colors.oceanLight : `${colors.glow.healthy}20`,
              color: snapshotTime !== null ? colors.text.muted : colors.glow.healthy,
              border: `1px solid ${
                snapshotTime !== null ? colors.text.muted : colors.glow.healthy
              }40`,
            }}
          >
            {snapshotTime !== null ? `Snapshot @ t=${snapshotTime}` : 'BEGIN (Take Snapshot)'}
          </motion.button>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-6">
        <div className="flex justify-between text-xs mb-2" style={{ color: colors.text.muted }}>
          <span>t=0</span>
          <span>t={worldTime}</span>
          <span>t=10</span>
        </div>
        <div
          className="h-4 rounded-full relative overflow-hidden"
          style={{ background: colors.ocean }}
        >
          {/* Progress */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: colors.glow.warning }}
            animate={{ width: `${(worldTime / 10) * 100}%` }}
          />

          {/* Snapshot marker */}
          {snapshotTime !== null && (
            <motion.div
              className="absolute top-0 bottom-0 w-1"
              style={{
                left: `${(snapshotTime / 10) * 100}%`,
                background: colors.glow.healthy,
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
            />
          )}

          {/* Event markers */}
          {events.map((event) => (
            <div
              key={event.time}
              className="absolute top-0 bottom-0 w-0.5"
              style={{
                left: `${(event.time / 10) * 100}%`,
                background:
                  worldTime >= event.time ? colors.text.secondary : colors.text.muted,
                opacity: 0.5,
              }}
            />
          ))}
        </div>

        {/* Event log */}
        <div className="mt-2 flex flex-wrap gap-2">
          {events.map((event) => (
            <span
              key={event.time}
              className="text-xs px-2 py-1 rounded"
              style={{
                background:
                  worldTime >= event.time
                    ? snapshotTime !== null && event.time > snapshotTime
                      ? `${colors.glow.critical}20`
                      : colors.oceanLight
                    : colors.ocean,
                color:
                  worldTime >= event.time
                    ? snapshotTime !== null && event.time > snapshotTime
                      ? colors.glow.critical
                      : colors.text.secondary
                    : colors.text.muted,
                border: `1px solid ${colors.text.muted}20`,
              }}
            >
              t={event.time}: {event.description}
            </span>
          ))}
        </div>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* World State */}
        <div
          className="p-4 rounded-lg"
          style={{
            background: colors.ocean,
            border: `1px solid ${colors.glow.warning}40`,
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ background: colors.glow.warning }}
            />
            <span className="font-medium" style={{ color: colors.glow.warning }}>
              Current World State (t={worldTime})
            </span>
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {worldRows.map((row) => (
                <motion.div
                  key={row.id}
                  className="flex justify-between items-center p-2 rounded"
                  style={{ background: colors.oceanDark }}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                >
                  <span style={{ color: colors.text.secondary }}>{row.name}</span>
                  <span className="font-mono" style={{ color: colors.text.primary }}>
                    ${row.balance}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {worldRows.length === 0 && (
              <div className="text-center py-4 text-sm" style={{ color: colors.text.muted }}>
                All accounts closed
              </div>
            )}
          </div>

          <div className="mt-4 text-xs" style={{ color: colors.text.muted }}>
            This changes as time progresses
          </div>
        </div>

        {/* Snapshot State */}
        <div
          className="p-4 rounded-lg"
          style={{
            background: colors.ocean,
            border: `1px solid ${
              snapshotTime !== null ? colors.glow.healthy : colors.text.muted
            }40`,
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background:
                  snapshotTime !== null ? colors.glow.healthy : colors.text.muted,
              }}
            />
            <span
              className="font-medium"
              style={{
                color: snapshotTime !== null ? colors.glow.healthy : colors.text.muted,
              }}
            >
              Your Transaction's View
              {snapshotTime !== null && ` (frozen @ t=${snapshotTime})`}
            </span>
          </div>

          {snapshotTime !== null ? (
            <div className="space-y-2">
              {snapshotRows.map((row) => (
                <motion.div
                  key={row.id}
                  className="flex justify-between items-center p-2 rounded"
                  style={{ background: colors.oceanDark }}
                >
                  <span style={{ color: colors.text.secondary }}>{row.name}</span>
                  <span className="font-mono" style={{ color: colors.glow.healthy }}>
                    ${row.balance}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: colors.text.muted }}>
                Click "BEGIN" to take a snapshot
              </p>
              <p className="text-xs mt-2" style={{ color: colors.text.muted }}>
                (REPEATABLE READ freezes the world at transaction start)
              </p>
            </div>
          )}

          {snapshotTime !== null && (
            <div className="mt-4 text-xs" style={{ color: colors.glow.healthy }}>
              This never changes during your transaction
            </div>
          )}
        </div>
      </div>

      {/* Difference highlight */}
      <AnimatePresence>
        {snapshotTime !== null && worldTime > snapshotTime && (
          <motion.div
            className="mt-6 p-4 rounded-lg"
            style={{
              background: `${colors.glow.warning}10`,
              border: `1px solid ${colors.glow.warning}40`,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="font-medium" style={{ color: colors.glow.warning }}>
              The world moved on, but your view is frozen
            </p>
            <p className="text-sm mt-2" style={{ color: colors.text.secondary }}>
              {worldTime - snapshotTime} time units have passed since your BEGIN.{' '}
              {events.filter((e) => e.time > snapshotTime && e.time <= worldTime).length}{' '}
              changes happened that you cannot see.
            </p>
            <p className="text-sm mt-2" style={{ color: colors.text.muted }}>
              This is <strong>REPEATABLE READ</strong>: your transaction sees a consistent
              snapshot from the moment it started.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SQL */}
      <div
        className="mt-6 p-4 rounded-lg font-mono text-sm"
        style={{
          background: colors.ocean,
          border: `1px solid ${colors.text.muted}20`,
        }}
      >
        <div style={{ color: colors.text.muted }}>-- Set isolation level for next transaction</div>
        <div>
          <span style={{ color: colors.glow.healthy }}>SET TRANSACTION ISOLATION LEVEL</span>
          <span style={{ color: colors.glow.warning }}> REPEATABLE READ</span>
          <span style={{ color: colors.text.secondary }}>;</span>
        </div>
        <div>
          <span style={{ color: colors.glow.healthy }}>BEGIN</span>
          <span style={{ color: colors.text.secondary }}>;</span>
          <span style={{ color: colors.text.muted }}> -- Snapshot taken here</span>
        </div>
      </div>
    </div>
  );
}
