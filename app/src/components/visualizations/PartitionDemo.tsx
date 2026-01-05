import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface Partition {
  name: string;
  dateRange: string;
  rowCount: number;
  isScanned: boolean;
}

type PartitionType = 'range' | 'list' | 'hash';

export function PartitionDemo() {
  const [partitionType, setPartitionType] = useState<PartitionType>('range');
  const [queryMonth, setQueryMonth] = useState('2024-03');
  const [isQuerying, setIsQuerying] = useState(false);

  const rangePartitions: Partition[] = useMemo(() => [
    { name: 'orders_2024_01', dateRange: '2024-01', rowCount: 150000, isScanned: false },
    { name: 'orders_2024_02', dateRange: '2024-02', rowCount: 145000, isScanned: false },
    { name: 'orders_2024_03', dateRange: '2024-03', rowCount: 162000, isScanned: false },
    { name: 'orders_2024_04', dateRange: '2024-04', rowCount: 158000, isScanned: false },
    { name: 'orders_2024_05', dateRange: '2024-05', rowCount: 171000, isScanned: false },
    { name: 'orders_2024_06', dateRange: '2024-06', rowCount: 168000, isScanned: false },
  ], []);

  const listPartitions: Partition[] = useMemo(() => [
    { name: 'orders_us', dateRange: 'US', rowCount: 450000, isScanned: false },
    { name: 'orders_eu', dateRange: 'EU', rowCount: 320000, isScanned: false },
    { name: 'orders_apac', dateRange: 'APAC', rowCount: 180000, isScanned: false },
  ], []);

  const hashPartitions: Partition[] = useMemo(() => [
    { name: 'orders_p0', dateRange: 'hash % 4 = 0', rowCount: 240000, isScanned: false },
    { name: 'orders_p1', dateRange: 'hash % 4 = 1', rowCount: 238000, isScanned: false },
    { name: 'orders_p2', dateRange: 'hash % 4 = 2', rowCount: 242000, isScanned: false },
    { name: 'orders_p3', dateRange: 'hash % 4 = 3', rowCount: 236000, isScanned: false },
  ], []);

  const partitions = partitionType === 'range' ? rangePartitions
    : partitionType === 'list' ? listPartitions
    : hashPartitions;

  const [scannedPartitions, setScannedPartitions] = useState<string[]>([]);

  const runQuery = () => {
    setIsQuerying(true);
    setScannedPartitions([]);

    // Determine which partition(s) to scan based on query
    let toScan: string[] = [];
    if (partitionType === 'range') {
      toScan = rangePartitions
        .filter(p => p.dateRange === queryMonth)
        .map(p => p.name);
    } else if (partitionType === 'list') {
      // For demo, scan based on queryMonth which we repurpose as region
      toScan = ['orders_us']; // Default to US for demo
    } else {
      // Hash: would need user_id, for demo scan one partition
      toScan = ['orders_p2'];
    }

    // Animate the scan
    setTimeout(() => {
      setScannedPartitions(toScan);
      setTimeout(() => {
        setIsQuerying(false);
      }, 1000);
    }, 500);
  };

  const scannedCount = scannedPartitions.length;
  const totalPartitions = partitions.length;
  const rowsScanned = partitions
    .filter(p => scannedPartitions.includes(p.name))
    .reduce((sum, p) => sum + p.rowCount, 0);
  const totalRows = partitions.reduce((sum, p) => sum + p.rowCount, 0);

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex flex-wrap gap-6 mb-8">
        {/* Partition Type */}
        <div>
          <label className="text-xs font-mono block mb-2" style={{ color: colors.text.muted }}>
            Partition Type
          </label>
          <div className="flex gap-2">
            {(['range', 'list', 'hash'] as PartitionType[]).map(type => (
              <button
                key={type}
                onClick={() => { setPartitionType(type); setScannedPartitions([]); }}
                className="px-3 py-1.5 rounded text-xs font-mono transition-all cursor-pointer"
                style={{
                  background: partitionType === type ? colors.glow.healthy + '30' : colors.oceanLight,
                  color: partitionType === type ? colors.glow.healthy : colors.text.secondary,
                  border: `1px solid ${partitionType === type ? colors.glow.healthy : colors.text.muted}40`,
                }}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Query selector */}
        {partitionType === 'range' && (
          <div>
            <label className="text-xs font-mono block mb-2" style={{ color: colors.text.muted }}>
              Query Month
            </label>
            <select
              value={queryMonth}
              onChange={(e) => setQueryMonth(e.target.value)}
              className="px-3 py-1.5 rounded text-xs font-mono"
              style={{
                background: colors.oceanLight,
                color: colors.text.secondary,
                border: `1px solid ${colors.text.muted}40`,
              }}
            >
              <option value="2024-01">January 2024</option>
              <option value="2024-02">February 2024</option>
              <option value="2024-03">March 2024</option>
              <option value="2024-04">April 2024</option>
              <option value="2024-05">May 2024</option>
              <option value="2024-06">June 2024</option>
            </select>
          </div>
        )}

        {/* Run button */}
        <div className="flex items-end">
          <button
            onClick={runQuery}
            disabled={isQuerying}
            className="px-4 py-2 rounded text-sm font-mono cursor-pointer"
            style={{
              background: colors.glow.healthy + '30',
              color: colors.glow.healthy,
              border: `1px solid ${colors.glow.healthy}`,
              opacity: isQuerying ? 0.5 : 1,
            }}
          >
            {isQuerying ? 'Scanning...' : 'Run Query'}
          </button>
        </div>
      </div>

      {/* Query display */}
      <div
        className="p-4 rounded-lg mb-6 font-mono text-sm"
        style={{ background: colors.oceanDark }}
      >
        <span style={{ color: colors.text.muted }}>-- Query with partition pruning</span>
        <br />
        <span style={{ color: colors.glow.healthy }}>SELECT</span>
        <span style={{ color: colors.text.secondary }}> * </span>
        <span style={{ color: colors.glow.healthy }}>FROM</span>
        <span style={{ color: colors.text.primary }}> orders</span>
        <br />
        <span style={{ color: colors.glow.healthy }}>WHERE</span>
        {partitionType === 'range' && (
          <span style={{ color: colors.text.secondary }}> created_at {'>'}= '{queryMonth}-01' AND created_at {'<'} '{queryMonth}-01'::date + interval '1 month'</span>
        )}
        {partitionType === 'list' && (
          <span style={{ color: colors.text.secondary }}> region = 'US'</span>
        )}
        {partitionType === 'hash' && (
          <span style={{ color: colors.text.secondary }}> user_id = 12345</span>
        )}
      </div>

      {/* Partitions visualization */}
      <div
        className="p-6 rounded-xl mb-6"
        style={{
          background: colors.oceanLight,
          border: `1px solid ${colors.text.muted}30`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-mono" style={{ color: colors.text.muted }}>
            {partitionType === 'range' ? 'Time-based partitions (monthly)' :
             partitionType === 'list' ? 'Region-based partitions' :
             'Hash partitions (by user_id)'}
          </div>
          <div className="text-xs" style={{ color: colors.text.muted }}>
            {totalRows.toLocaleString()} total rows
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <AnimatePresence>
            {partitions.map((partition, idx) => {
              const isScanned = scannedPartitions.includes(partition.name);
              const isSkipped = scannedPartitions.length > 0 && !isScanned;

              return (
                <motion.div
                  key={partition.name}
                  className="p-3 rounded-lg relative overflow-hidden"
                  style={{
                    background: isScanned
                      ? colors.glow.healthy + '20'
                      : isSkipped
                      ? colors.text.muted + '10'
                      : colors.oceanDark,
                    border: `1px solid ${isScanned ? colors.glow.healthy : isSkipped ? colors.text.muted + '30' : colors.text.muted}40`,
                    opacity: isSkipped ? 0.5 : 1,
                  }}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: isSkipped ? 0.5 : 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  {/* Scan animation */}
                  {isScanned && isQuerying && (
                    <motion.div
                      className="absolute inset-0"
                      style={{ background: colors.glow.healthy }}
                      initial={{ scaleX: 0, originX: 0 }}
                      animate={{ scaleX: [0, 1, 0], originX: [0, 0, 1] }}
                      transition={{ duration: 0.8 }}
                    />
                  )}

                  <div className="relative z-10">
                    <div className="text-xs font-mono truncate mb-1" style={{ color: isScanned ? colors.glow.healthy : colors.text.secondary }}>
                      {partition.name}
                    </div>
                    <div className="text-[10px]" style={{ color: colors.text.muted }}>
                      {partition.dateRange}
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: colors.text.muted }}>
                      {partition.rowCount.toLocaleString()} rows
                    </div>

                    {isScanned && (
                      <motion.div
                        className="absolute top-1 right-1 text-xs"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        ✓
                      </motion.div>
                    )}

                    {isSkipped && (
                      <div className="absolute top-1 right-1 text-xs" style={{ color: colors.text.muted }}>
                        PRUNED
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Results */}
      {scannedPartitions.length > 0 && (
        <motion.div
          className="grid md:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            className="p-4 rounded-lg"
            style={{
              background: colors.glow.healthy + '10',
              border: `1px solid ${colors.glow.healthy}30`,
            }}
          >
            <div className="text-xs font-mono mb-1" style={{ color: colors.text.muted }}>
              Partitions Scanned
            </div>
            <div className="text-2xl font-mono" style={{ color: colors.glow.healthy }}>
              {scannedCount} / {totalPartitions}
            </div>
            <div className="text-xs mt-1" style={{ color: colors.text.muted }}>
              {totalPartitions - scannedCount} pruned away
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
              Rows Scanned
            </div>
            <div className="text-2xl font-mono" style={{ color: colors.glow.warning }}>
              {rowsScanned.toLocaleString()}
            </div>
            <div className="text-xs mt-1" style={{ color: colors.text.muted }}>
              vs {totalRows.toLocaleString()} total
            </div>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              background: colors.glow.healthy + '10',
              border: `1px solid ${colors.glow.healthy}30`,
            }}
          >
            <div className="text-xs font-mono mb-1" style={{ color: colors.text.muted }}>
              Work Saved
            </div>
            <div className="text-2xl font-mono" style={{ color: colors.glow.healthy }}>
              {Math.round((1 - rowsScanned / totalRows) * 100)}%
            </div>
            <div className="text-xs mt-1" style={{ color: colors.text.muted }}>
              fewer rows to scan
            </div>
          </div>
        </motion.div>
      )}

      {/* Explanation */}
      <div
        className="mt-6 p-4 rounded-lg"
        style={{ background: colors.oceanDark }}
      >
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          <strong style={{ color: colors.glow.healthy }}>Partition Pruning:</strong> PostgreSQL
          examines the WHERE clause and skips partitions that can't contain matching rows.
          {partitionType === 'range' && ' For time-based queries, only the relevant month is scanned.'}
          {partitionType === 'list' && ' For region queries, only that region\'s partition is scanned.'}
          {partitionType === 'hash' && ' For user lookups, the hash determines exactly one partition.'}
        </p>
      </div>
    </div>
  );
}
