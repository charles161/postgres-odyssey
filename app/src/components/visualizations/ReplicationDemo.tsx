import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface WALRecord {
  id: number;
  lsn: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
}

interface ReplicaState {
  name: string;
  currentLsn: string;
  lag: number;
  status: 'streaming' | 'catching_up' | 'disconnected';
}

export function ReplicationDemo() {
  const [isRunning, setIsRunning] = useState(false);
  const [walRecords, setWalRecords] = useState<WALRecord[]>([]);
  const [primaryLsn, setPrimaryLsn] = useState(0);
  const [replicas, setReplicas] = useState<ReplicaState[]>([
    { name: 'replica-1', currentLsn: '0/0', lag: 0, status: 'streaming' },
    { name: 'replica-2', currentLsn: '0/0', lag: 0, status: 'streaming' },
  ]);
  const [replicationLag, setReplicationLag] = useState(1);
  const [showReads, setShowReads] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lsnRef = useRef(0);

  const tables = ['users', 'orders', 'products', 'payments'];
  const operations: ('INSERT' | 'UPDATE' | 'DELETE')[] = ['INSERT', 'UPDATE', 'DELETE'];

  const formatLsn = (lsn: number) => `0/${lsn.toString(16).toUpperCase().padStart(8, '0')}`;

  const startSimulation = () => {
    setIsRunning(true);
    setWalRecords([]);
    lsnRef.current = 0;
    setPrimaryLsn(0);
    setReplicas(prev => prev.map(r => ({ ...r, currentLsn: '0/0', lag: 0 })));

    intervalRef.current = setInterval(() => {
      // Generate new WAL record
      const newLsn = lsnRef.current + Math.floor(Math.random() * 1000) + 100;
      lsnRef.current = newLsn;

      const newRecord: WALRecord = {
        id: Date.now(),
        lsn: formatLsn(newLsn),
        operation: operations[Math.floor(Math.random() * operations.length)],
        table: tables[Math.floor(Math.random() * tables.length)],
      };

      setWalRecords(prev => [...prev.slice(-10), newRecord]);
      setPrimaryLsn(newLsn);

      // Update replica positions with lag
      setReplicas(prev => prev.map((replica, idx) => {
        const lagFactor = (idx + 1) * replicationLag;
        const replicaLsn = Math.max(0, newLsn - (lagFactor * 500));
        const lag = newLsn - replicaLsn;

        return {
          ...replica,
          currentLsn: formatLsn(replicaLsn),
          lag: lag,
          status: lag > 2000 ? 'catching_up' : 'streaming',
        };
      }));
    }, 800);
  };

  const stopSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex flex-wrap gap-6 mb-8">
        <div>
          <label className="text-xs font-mono block mb-2" style={{ color: colors.text.muted }}>
            Replication Lag Factor: {replicationLag}x
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={replicationLag}
            onChange={(e) => setReplicationLag(parseInt(e.target.value))}
            className="w-32"
          />
        </div>

        <div className="flex items-end gap-4">
          <button
            onClick={isRunning ? stopSimulation : startSimulation}
            className="px-4 py-2 rounded text-sm font-mono cursor-pointer"
            style={{
              background: isRunning ? colors.glow.critical + '30' : colors.glow.healthy + '30',
              color: isRunning ? colors.glow.critical : colors.glow.healthy,
              border: `1px solid ${isRunning ? colors.glow.critical : colors.glow.healthy}`,
            }}
          >
            {isRunning ? 'Stop' : 'Start Writes'}
          </button>

          <button
            onClick={() => setShowReads(!showReads)}
            className="px-4 py-2 rounded text-sm font-mono cursor-pointer"
            style={{
              background: showReads ? colors.glow.warning + '30' : colors.oceanLight,
              color: showReads ? colors.glow.warning : colors.text.secondary,
              border: `1px solid ${showReads ? colors.glow.warning : colors.text.muted}40`,
            }}
          >
            {showReads ? 'Hide Reads' : 'Show Read Routing'}
          </button>
        </div>
      </div>

      {/* Visualization */}
      <div
        className="p-6 rounded-xl mb-6"
        style={{
          background: colors.oceanLight,
          border: `1px solid ${colors.text.muted}30`,
        }}
      >
        <div className="flex items-start justify-between gap-8">
          {/* Primary */}
          <div className="flex-1">
            <div className="text-sm font-mono mb-4" style={{ color: colors.glow.healthy }}>
              Primary (Writes)
            </div>
            <motion.div
              className="p-4 rounded-lg relative"
              style={{
                background: colors.oceanDark,
                border: `2px solid ${colors.glow.healthy}`,
              }}
              animate={{
                boxShadow: isRunning
                  ? [`0 0 20px ${colors.glow.healthy}20`, `0 0 40px ${colors.glow.healthy}40`, `0 0 20px ${colors.glow.healthy}20`]
                  : 'none',
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className="text-center mb-4">
                <span className="text-3xl">🐘</span>
              </div>
              <div className="text-xs font-mono text-center" style={{ color: colors.text.muted }}>
                LSN: {formatLsn(primaryLsn)}
              </div>
            </motion.div>

            {/* WAL Stream */}
            <div className="mt-4">
              <div className="text-xs font-mono mb-2" style={{ color: colors.text.muted }}>
                WAL Stream
              </div>
              <div className="h-24 overflow-hidden">
                <AnimatePresence>
                  {walRecords.slice(-5).map((record) => (
                    <motion.div
                      key={record.id}
                      className="text-xs font-mono py-1 px-2 mb-1 rounded"
                      style={{
                        background: record.operation === 'INSERT'
                          ? colors.glow.healthy + '20'
                          : record.operation === 'UPDATE'
                          ? colors.glow.warning + '20'
                          : colors.glow.critical + '20',
                        color: record.operation === 'INSERT'
                          ? colors.glow.healthy
                          : record.operation === 'UPDATE'
                          ? colors.glow.warning
                          : colors.glow.critical,
                      }}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                    >
                      {record.operation} {record.table}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Replication arrows */}
          <div className="flex flex-col justify-center gap-4 pt-8">
            {replicas.map((_, idx) => (
              <motion.div
                key={idx}
                className="flex items-center gap-2"
                animate={{ x: isRunning ? [0, 10, 0] : 0 }}
                transition={{ duration: 0.5, repeat: Infinity, delay: idx * 0.2 }}
              >
                <span className="text-2xl" style={{ color: colors.glow.healthy }}>→</span>
                <span className="text-xs font-mono" style={{ color: colors.text.muted }}>WAL</span>
              </motion.div>
            ))}
          </div>

          {/* Replicas */}
          <div className="flex-1">
            <div className="text-sm font-mono mb-4" style={{ color: colors.glow.warning }}>
              Replicas (Reads)
            </div>
            <div className="space-y-4">
              {replicas.map((replica, idx) => (
                <motion.div
                  key={replica.name}
                  className="p-4 rounded-lg"
                  style={{
                    background: colors.oceanDark,
                    border: `1px solid ${
                      replica.status === 'streaming' ? colors.glow.healthy : colors.glow.warning
                    }40`,
                  }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono" style={{ color: colors.text.secondary }}>
                      {replica.name}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: replica.status === 'streaming'
                          ? colors.glow.healthy + '20'
                          : colors.glow.warning + '20',
                        color: replica.status === 'streaming'
                          ? colors.glow.healthy
                          : colors.glow.warning,
                      }}
                    >
                      {replica.status}
                    </span>
                  </div>
                  <div className="text-xs font-mono" style={{ color: colors.text.muted }}>
                    LSN: {replica.currentLsn}
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: colors.text.muted }}>Lag</span>
                      <span style={{ color: replica.lag > 1000 ? colors.glow.warning : colors.text.muted }}>
                        {replica.lag} bytes
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: colors.text.muted + '30' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: replica.lag > 1500
                            ? colors.glow.critical
                            : replica.lag > 500
                            ? colors.glow.warning
                            : colors.glow.healthy,
                        }}
                        animate={{ width: `${Math.min(100, (replica.lag / 2000) * 100)}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Read routing visualization */}
        <AnimatePresence>
          {showReads && (
            <motion.div
              className="mt-6 p-4 rounded-lg"
              style={{ background: colors.oceanDark }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="text-sm font-mono mb-4" style={{ color: colors.glow.warning }}>
                Read/Write Routing
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs mb-2" style={{ color: colors.text.muted }}>
                    Writes → Primary only
                  </div>
                  <code className="text-xs block p-2 rounded" style={{ background: colors.oceanLight, color: colors.glow.healthy }}>
                    INSERT INTO orders ... → primary:5432
                  </code>
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: colors.text.muted }}>
                    Reads → Load balanced to replicas
                  </div>
                  <code className="text-xs block p-2 rounded" style={{ background: colors.oceanLight, color: colors.glow.warning }}>
                    SELECT * FROM orders → replica-1:5432
                  </code>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Explanation */}
      <div className="grid md:grid-cols-2 gap-4">
        <div
          className="p-4 rounded-lg"
          style={{
            background: colors.glow.healthy + '10',
            border: `1px solid ${colors.glow.healthy}30`,
          }}
        >
          <div className="text-sm font-mono mb-2" style={{ color: colors.glow.healthy }}>
            How It Works
          </div>
          <ul className="text-xs space-y-1" style={{ color: colors.text.secondary }}>
            <li>• Primary writes to WAL (same WAL from Episode 3!)</li>
            <li>• WAL records stream to replicas</li>
            <li>• Replicas replay WAL to stay in sync</li>
            <li>• Replicas are read-only (SELECT only)</li>
          </ul>
        </div>

        <div
          className="p-4 rounded-lg"
          style={{
            background: colors.glow.warning + '10',
            border: `1px solid ${colors.glow.warning}30`,
          }}
        >
          <div className="text-sm font-mono mb-2" style={{ color: colors.glow.warning }}>
            Replication Lag Consequences
          </div>
          <ul className="text-xs space-y-1" style={{ color: colors.text.secondary }}>
            <li>• User writes, then reads from replica = stale data</li>
            <li>• "I just updated my profile but don't see changes"</li>
            <li>• Solution: read-your-writes consistency routing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
