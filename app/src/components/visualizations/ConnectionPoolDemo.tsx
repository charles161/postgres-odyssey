import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface Connection {
  id: number;
  state: 'idle' | 'active' | 'waiting';
  clientId: number | null;
  queryTime: number;
}

interface Client {
  id: number;
  state: 'waiting' | 'connected' | 'completed';
  assignedConnection: number | null;
}

type PoolMode = 'none' | 'session' | 'transaction';

export function ConnectionPoolDemo() {
  const [poolMode, setPoolMode] = useState<PoolMode>('none');
  const [poolSize, setPoolSize] = useState(5);
  const [clientCount, setClientCount] = useState(20);
  const [isRunning, setIsRunning] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [metrics, setMetrics] = useState({ completed: 0, avgWait: 0, totalTime: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const waitTimesRef = useRef<number[]>([]);

  // Initialize connections based on mode
  useEffect(() => {
    if (poolMode === 'none') {
      // No pool: one connection per client (capped at 50 to show problem)
      setConnections(Array.from({ length: Math.min(clientCount, 50) }, (_, i) => ({
        id: i,
        state: 'idle' as const,
        clientId: null,
        queryTime: 0,
      })));
    } else {
      // Pool mode: fixed number of connections
      setConnections(Array.from({ length: poolSize }, (_, i) => ({
        id: i,
        state: 'idle' as const,
        clientId: null,
        queryTime: 0,
      })));
    }
  }, [poolMode, poolSize, clientCount]);

  const startSimulation = () => {
    setIsRunning(true);
    startTimeRef.current = Date.now();
    waitTimesRef.current = [];

    // Create clients
    const newClients: Client[] = Array.from({ length: clientCount }, (_, i) => ({
      id: i,
      state: 'waiting' as const,
      assignedConnection: null,
    }));
    setClients(newClients);
    setMetrics({ completed: 0, avgWait: 0, totalTime: 0 });

    // Start simulation loop
    intervalRef.current = setInterval(() => {
      setConnections(prevConns => {
        const updatedConns = [...prevConns];

        // Process active connections (decrement query time)
        updatedConns.forEach(conn => {
          if (conn.state === 'active' && conn.queryTime > 0) {
            conn.queryTime -= 1;
            if (conn.queryTime <= 0) {
              // Query complete
              conn.state = 'idle';

              setClients(prevClients => {
                const updated = [...prevClients];
                const clientIdx = updated.findIndex(c => c.id === conn.clientId);
                if (clientIdx >= 0) {
                  updated[clientIdx].state = 'completed';
                  waitTimesRef.current.push(Date.now() - startTimeRef.current);

                  const completedCount = updated.filter(c => c.state === 'completed').length;
                  setMetrics({
                    completed: completedCount,
                    avgWait: waitTimesRef.current.length > 0
                      ? Math.round(waitTimesRef.current.reduce((a, b) => a + b, 0) / waitTimesRef.current.length)
                      : 0,
                    totalTime: Date.now() - startTimeRef.current,
                  });
                }
                return updated;
              });

              conn.clientId = null;
            }
          }
        });

        return updatedConns;
      });

      // Assign waiting clients to idle connections
      setClients(prevClients => {
        const updated = [...prevClients];

        setConnections(prevConns => {
          const updatedConns = [...prevConns];

          updated.forEach(client => {
            if (client.state === 'waiting') {
              const idleConn = updatedConns.find(c => c.state === 'idle');
              if (idleConn) {
                idleConn.state = 'active';
                idleConn.clientId = client.id;
                idleConn.queryTime = 3 + Math.floor(Math.random() * 5); // 3-7 ticks
                client.state = 'connected';
                client.assignedConnection = idleConn.id;
              }
            }
          });

          return updatedConns;
        });

        return updated;
      });

      // Check if simulation complete
      setClients(prevClients => {
        if (prevClients.every(c => c.state === 'completed')) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsRunning(false);
        }
        return prevClients;
      });
    }, 200);
  };

  const stopSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setClients([]);
    setMetrics({ completed: 0, avgWait: 0, totalTime: 0 });
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const waitingCount = clients.filter(c => c.state === 'waiting').length;
  const connectedCount = clients.filter(c => c.state === 'connected').length;
  const completedCount = clients.filter(c => c.state === 'completed').length;

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex flex-wrap gap-6 mb-8">
        {/* Pool Mode */}
        <div>
          <label className="text-xs font-mono block mb-2" style={{ color: colors.text.muted }}>
            Connection Strategy
          </label>
          <div className="flex gap-2">
            {(['none', 'session', 'transaction'] as PoolMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => { stopSimulation(); setPoolMode(mode); }}
                disabled={isRunning}
                className="px-3 py-1.5 rounded text-xs font-mono transition-all"
                style={{
                  background: poolMode === mode ? colors.glow.healthy + '30' : colors.oceanLight,
                  color: poolMode === mode ? colors.glow.healthy : colors.text.secondary,
                  border: `1px solid ${poolMode === mode ? colors.glow.healthy : colors.text.muted}40`,
                  opacity: isRunning ? 0.5 : 1,
                }}
              >
                {mode === 'none' ? 'No Pool' : mode === 'session' ? 'Session Pool' : 'Transaction Pool'}
              </button>
            ))}
          </div>
        </div>

        {/* Pool Size */}
        {poolMode !== 'none' && (
          <div>
            <label className="text-xs font-mono block mb-2" style={{ color: colors.text.muted }}>
              Pool Size: {poolSize}
            </label>
            <input
              type="range"
              min="2"
              max="20"
              value={poolSize}
              onChange={(e) => setPoolSize(parseInt(e.target.value))}
              disabled={isRunning}
              className="w-32"
            />
          </div>
        )}

        {/* Client Count */}
        <div>
          <label className="text-xs font-mono block mb-2" style={{ color: colors.text.muted }}>
            Clients: {clientCount}
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={clientCount}
            onChange={(e) => setClientCount(parseInt(e.target.value))}
            disabled={isRunning}
            className="w-32"
          />
        </div>

        {/* Run Button */}
        <div className="flex items-end">
          <button
            onClick={isRunning ? stopSimulation : startSimulation}
            className="px-4 py-2 rounded text-sm font-mono"
            style={{
              background: isRunning ? colors.glow.critical + '30' : colors.glow.healthy + '30',
              color: isRunning ? colors.glow.critical : colors.glow.healthy,
              border: `1px solid ${isRunning ? colors.glow.critical : colors.glow.healthy}`,
            }}
          >
            {isRunning ? 'Stop' : 'Run Simulation'}
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
        <div className="flex gap-8">
          {/* Clients */}
          <div className="flex-1">
            <div className="text-xs font-mono mb-3" style={{ color: colors.text.muted }}>
              Clients ({clientCount})
            </div>
            <div className="flex flex-wrap gap-1">
              {clients.length > 0 ? (
                clients.slice(0, 50).map(client => (
                  <motion.div
                    key={client.id}
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: client.state === 'waiting'
                        ? colors.glow.critical
                        : client.state === 'connected'
                        ? colors.glow.warning
                        : colors.glow.healthy,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: client.id * 0.01 }}
                  />
                ))
              ) : (
                <div className="text-xs" style={{ color: colors.text.muted }}>
                  Click "Run Simulation" to start
                </div>
              )}
              {clients.length > 50 && (
                <span className="text-xs ml-2" style={{ color: colors.text.muted }}>
                  +{clients.length - 50} more
                </span>
              )}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: colors.glow.critical }} />
                <span style={{ color: colors.text.muted }}>Waiting ({waitingCount})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: colors.glow.warning }} />
                <span style={{ color: colors.text.muted }}>Connected ({connectedCount})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: colors.glow.healthy }} />
                <span style={{ color: colors.text.muted }}>Done ({completedCount})</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center">
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ color: colors.text.muted }}
            >
              →
            </motion.div>
          </div>

          {/* Connection Pool / Postgres */}
          <div className="flex-1">
            <div className="text-xs font-mono mb-3" style={{ color: colors.text.muted }}>
              {poolMode === 'none' ? 'PostgreSQL Connections' : 'PgBouncer Pool'} ({connections.length})
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {connections.slice(0, 20).map(conn => (
                  <motion.div
                    key={conn.id}
                    className="w-8 h-8 rounded flex items-center justify-center text-xs font-mono"
                    style={{
                      background: conn.state === 'idle'
                        ? colors.text.muted + '30'
                        : colors.glow.warning + '40',
                      border: `1px solid ${conn.state === 'active' ? colors.glow.warning : colors.text.muted}40`,
                      color: conn.state === 'active' ? colors.glow.warning : colors.text.muted,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    {conn.state === 'active' ? conn.queryTime : '•'}
                  </motion.div>
                ))}
              </AnimatePresence>
              {connections.length > 20 && (
                <span className="text-xs" style={{ color: colors.text.muted }}>
                  +{connections.length - 20} more
                </span>
              )}
            </div>

            {poolMode !== 'none' && (
              <div className="mt-4 text-xs" style={{ color: colors.text.muted }}>
                Mode: {poolMode === 'session' ? 'Session (1 client = 1 conn for session)' : 'Transaction (conn returned after each tx)'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <div
          className="p-4 rounded-lg"
          style={{
            background: colors.glow.healthy + '10',
            border: `1px solid ${colors.glow.healthy}30`,
          }}
        >
          <div className="text-xs font-mono mb-1" style={{ color: colors.text.muted }}>
            Completed
          </div>
          <div className="text-2xl font-mono" style={{ color: colors.glow.healthy }}>
            {metrics.completed} / {clientCount}
          </div>
        </div>

        <div
          className="p-4 rounded-lg"
          style={{
            background: colors.glow.warning + '10',
            border: `1px solid ${colors.glow.warning}30`,
          }}
        >
          <div className="text-xs font-mono mb-1" style={{ color: colors.text.muted }}>
            Avg Wait Time
          </div>
          <div className="text-2xl font-mono" style={{ color: colors.glow.warning }}>
            {metrics.avgWait}ms
          </div>
        </div>

        <div
          className="p-4 rounded-lg"
          style={{
            background: poolMode === 'none' && metrics.totalTime > 5000
              ? colors.glow.critical + '10'
              : colors.text.muted + '10',
            border: `1px solid ${poolMode === 'none' && metrics.totalTime > 5000
              ? colors.glow.critical
              : colors.text.muted}30`,
          }}
        >
          <div className="text-xs font-mono mb-1" style={{ color: colors.text.muted }}>
            Total Time
          </div>
          <div
            className="text-2xl font-mono"
            style={{
              color: poolMode === 'none' && metrics.totalTime > 5000
                ? colors.glow.critical
                : colors.text.secondary
            }}
          >
            {metrics.totalTime}ms
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div
        className="mt-6 p-4 rounded-lg"
        style={{ background: colors.oceanDark }}
      >
        {poolMode === 'none' ? (
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            <strong style={{ color: colors.glow.critical }}>No Pool:</strong> Each client creates a new
            PostgreSQL connection. With {clientCount} clients, you need {Math.min(clientCount, 50)} connections.
            Each connection is ~10MB memory and requires a fork. This doesn't scale.
          </p>
        ) : poolMode === 'session' ? (
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            <strong style={{ color: colors.glow.warning }}>Session Pool:</strong> PgBouncer maintains
            {poolSize} connections. Clients wait in queue when all connections are busy. Connection is held
            for entire session. Better than no pool, but connections sit idle between queries.
          </p>
        ) : (
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            <strong style={{ color: colors.glow.healthy }}>Transaction Pool:</strong> Connections are
            returned to pool after each transaction. Maximum efficiency—{poolSize} connections can serve
            {clientCount} clients. Trade-off: prepared statements don't work across transactions.
          </p>
        )}
      </div>
    </div>
  );
}
