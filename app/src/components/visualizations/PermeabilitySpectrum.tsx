import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface IsolationLevel {
  id: string;
  name: string;
  description: string;
  permeability: number; // 0-100, how much leaks through
  blocks: string[];
  allows: string[];
  postgresDefault: boolean;
}

const levels: IsolationLevel[] = [
  {
    id: 'read-uncommitted',
    name: 'READ UNCOMMITTED',
    description: 'See everything, even uncommitted changes',
    permeability: 100,
    blocks: [],
    allows: ['Dirty reads', 'Non-repeatable reads', 'Phantoms'],
    postgresDefault: false,
  },
  {
    id: 'read-committed',
    name: 'READ COMMITTED',
    description: 'Only see committed data (PostgreSQL default)',
    permeability: 66,
    blocks: ['Dirty reads'],
    allows: ['Non-repeatable reads', 'Phantoms'],
    postgresDefault: true,
  },
  {
    id: 'repeatable-read',
    name: 'REPEATABLE READ',
    description: 'Snapshot frozen at transaction start',
    permeability: 33,
    blocks: ['Dirty reads', 'Non-repeatable reads'],
    allows: ['Phantoms (in SQL standard, not Postgres)'],
    postgresDefault: false,
  },
  {
    id: 'serializable',
    name: 'SERIALIZABLE',
    description: 'As if transactions ran one at a time',
    permeability: 0,
    blocks: ['Dirty reads', 'Non-repeatable reads', 'Phantoms'],
    allows: [],
    postgresDefault: false,
  },
];

interface Event {
  id: number;
  type: 'insert' | 'update' | 'delete' | 'uncommitted';
  label: string;
}

export function PermeabilitySpectrum() {
  const [selectedLevel, setSelectedLevel] = useState<IsolationLevel>(levels[1]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventCounter, setEventCounter] = useState(0);

  // Generate random events
  useEffect(() => {
    const interval = setInterval(() => {
      setEventCounter((c) => c + 1);
      const types: Event['type'][] = ['insert', 'update', 'delete', 'uncommitted'];
      const type = types[Math.floor(Math.random() * types.length)];
      const labels = {
        insert: 'New row inserted',
        update: 'Row updated',
        delete: 'Row deleted',
        uncommitted: 'Uncommitted change',
      };

      setEvents((prev) => [
        ...prev.slice(-5), // Keep last 5
        { id: eventCounter, type, label: labels[type] },
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, [eventCounter]);

  // Determine if event passes through based on isolation level
  const eventPassesThrough = (event: Event, level: IsolationLevel): boolean => {
    if (event.type === 'uncommitted') {
      return level.permeability === 100; // Only READ UNCOMMITTED
    }
    return level.permeability > 0;
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
        <h3 className="text-xl font-medium" style={{ color: colors.text.primary }}>
          The Permeability Spectrum
        </h3>
        <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
          Higher isolation = less of the outside world leaks in
        </p>
      </div>

      {/* Level Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {levels.map((level) => (
          <motion.button
            key={level.id}
            className="p-3 rounded-lg text-left relative"
            style={{
              background:
                selectedLevel.id === level.id ? `${colors.glow.healthy}20` : colors.ocean,
              border: `2px solid ${
                selectedLevel.id === level.id ? colors.glow.healthy : colors.text.muted
              }40`,
            }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedLevel(level)}
          >
            {level.postgresDefault && (
              <span
                className="absolute top-1 right-1 text-xs px-1 rounded"
                style={{ background: colors.glow.healthy, color: colors.ocean }}
              >
                default
              </span>
            )}
            <div className="text-xs font-mono" style={{ color: colors.text.muted }}>
              {level.name}
            </div>
            <div className="mt-1 h-1 rounded-full" style={{ background: colors.ocean }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${100 - level.permeability}%`,
                  background:
                    level.permeability === 0
                      ? colors.glow.healthy
                      : level.permeability < 50
                      ? colors.glow.warning
                      : colors.glow.critical,
                }}
              />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Outside World */}
        <div
          className="p-4 rounded-lg"
          style={{
            background: colors.ocean,
            border: `1px solid ${colors.text.muted}40`,
          }}
        >
          <div className="text-center mb-4">
            <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
              Outside World
            </span>
            <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
              Other transactions' changes
            </p>
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  className="px-3 py-2 rounded text-xs"
                  style={{
                    background:
                      event.type === 'uncommitted'
                        ? `${colors.glow.critical}20`
                        : colors.oceanDark,
                    border: `1px solid ${
                      event.type === 'uncommitted' ? colors.glow.critical : colors.text.muted
                    }40`,
                    color: colors.text.secondary,
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  layout
                >
                  {event.label}
                </motion.div>
              ))}
            </AnimatePresence>
            {events.length === 0 && (
              <div className="text-center py-4 text-xs" style={{ color: colors.text.muted }}>
                Waiting for events...
              </div>
            )}
          </div>
        </div>

        {/* Membrane */}
        <div className="flex flex-col items-center justify-center relative">
          <motion.div
            className="w-4 h-full min-h-[200px] rounded-full relative overflow-hidden"
            style={{
              background: colors.oceanLight,
              border: `2px solid ${
                selectedLevel.permeability === 0
                  ? colors.glow.healthy
                  : selectedLevel.permeability < 50
                  ? colors.glow.warning
                  : colors.glow.critical
              }`,
            }}
          >
            {/* Permeability fill */}
            <motion.div
              className="absolute bottom-0 left-0 right-0"
              style={{
                background:
                  selectedLevel.permeability === 0
                    ? colors.glow.healthy
                    : selectedLevel.permeability < 50
                    ? colors.glow.warning
                    : colors.glow.critical,
              }}
              animate={{ height: `${100 - selectedLevel.permeability}%` }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>

          <div className="mt-2 text-center">
            <div className="text-sm font-medium" style={{ color: colors.text.primary }}>
              {selectedLevel.name}
            </div>
            <div className="text-xs" style={{ color: colors.text.muted }}>
              {100 - selectedLevel.permeability}% blocked
            </div>
          </div>

          {/* Events passing through */}
          <AnimatePresence>
            {events.slice(-3).map((event) => {
              const passes = eventPassesThrough(event, selectedLevel);
              if (!passes) return null;

              return (
                <motion.div
                  key={`pass-${event.id}`}
                  className="absolute w-2 h-2 rounded-full"
                  style={{ background: colors.glow.warning }}
                  initial={{ x: -50, y: 0, opacity: 1 }}
                  animate={{ x: 50, opacity: 0 }}
                  transition={{ duration: 1 }}
                />
              );
            })}
          </AnimatePresence>
        </div>

        {/* Your Transaction */}
        <div
          className="p-4 rounded-lg"
          style={{
            background: colors.ocean,
            border: `1px solid ${colors.glow.healthy}40`,
          }}
        >
          <div className="text-center mb-4">
            <span className="text-sm font-medium" style={{ color: colors.glow.healthy }}>
              Your Transaction
            </span>
            <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
              What you can see
            </p>
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {events
                .filter((e) => eventPassesThrough(e, selectedLevel))
                .map((event) => (
                  <motion.div
                    key={`seen-${event.id}`}
                    className="px-3 py-2 rounded text-xs"
                    style={{
                      background:
                        event.type === 'uncommitted'
                          ? `${colors.glow.critical}20`
                          : colors.oceanDark,
                      border: `1px solid ${colors.text.muted}40`,
                      color: colors.text.secondary,
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    layout
                  >
                    {event.label}
                  </motion.div>
                ))}
            </AnimatePresence>
            {events.filter((e) => eventPassesThrough(e, selectedLevel)).length === 0 && (
              <div
                className="text-center py-4 text-xs"
                style={{ color: colors.glow.healthy }}
              >
                {selectedLevel.permeability === 0
                  ? 'Fully isolated'
                  : 'Waiting for visible events...'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Level Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg" style={{ background: colors.ocean }}>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: colors.glow.healthy }}
            />
            <span className="font-medium" style={{ color: colors.glow.healthy }}>
              Blocks
            </span>
          </div>
          {selectedLevel.blocks.length > 0 ? (
            <ul className="space-y-1">
              {selectedLevel.blocks.map((b) => (
                <li key={b} className="text-sm" style={{ color: colors.text.secondary }}>
                  • {b}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: colors.text.muted }}>
              Nothing (all anomalies possible)
            </p>
          )}
        </div>

        <div className="p-4 rounded-lg" style={{ background: colors.ocean }}>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: colors.glow.critical }}
            />
            <span className="font-medium" style={{ color: colors.glow.critical }}>
              Allows
            </span>
          </div>
          {selectedLevel.allows.length > 0 ? (
            <ul className="space-y-1">
              {selectedLevel.allows.map((a) => (
                <li key={a} className="text-sm" style={{ color: colors.text.secondary }}>
                  • {a}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: colors.glow.healthy }}>
              Nothing (fully isolated)
            </p>
          )}
        </div>
      </div>

      {/* Note */}
      <div
        className="mt-6 p-4 rounded-lg text-sm"
        style={{ background: colors.ocean }}
      >
        <p style={{ color: colors.text.secondary }}>
          <span style={{ color: colors.glow.healthy }}>PostgreSQL note:</span> In Postgres,
          REPEATABLE READ actually prevents phantom reads too (using MVCC snapshots).
        </p>
        <p className="mt-2" style={{ color: colors.text.muted }}>
          Higher isolation = more protection, but also more potential for serialization
          failures.
        </p>
      </div>
    </div>
  );
}
