import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

// Generate sample data with skewed distribution
function generateData(count: number): number[] {
  const data: number[] = [];
  for (let i = 0; i < count; i++) {
    // Skewed distribution: many small values, fewer large values
    const r = Math.random();
    if (r < 0.6) {
      data.push(Math.floor(Math.random() * 100)); // 60% between 0-100
    } else if (r < 0.85) {
      data.push(Math.floor(100 + Math.random() * 400)); // 25% between 100-500
    } else if (r < 0.95) {
      data.push(Math.floor(500 + Math.random() * 500)); // 10% between 500-1000
    } else {
      data.push(Math.floor(1000 + Math.random() * 9000)); // 5% between 1000-10000
    }
  }
  return data.sort((a, b) => a - b);
}

function calculateHistogramBounds(data: number[], numBuckets: number): number[] {
  const bounds: number[] = [];
  const step = Math.floor(data.length / numBuckets);

  for (let i = 0; i <= numBuckets; i++) {
    const idx = Math.min(i * step, data.length - 1);
    bounds.push(data[idx]);
  }

  return bounds;
}

export function HistogramDemo() {
  const [numBuckets, setNumBuckets] = useState(10);
  const [queryValue, setQueryValue] = useState(250);

  const data = useMemo(() => generateData(1000), []);
  const histogramBounds = useMemo(() => calculateHistogramBounds(data, numBuckets), [data, numBuckets]);

  // Calculate bucket heights for visualization
  const bucketCounts = useMemo(() => {
    const counts: number[] = new Array(numBuckets).fill(0);
    const step = Math.floor(data.length / numBuckets);
    for (let i = 0; i < numBuckets; i++) {
      counts[i] = step;
    }
    return counts;
  }, [data, numBuckets]);

  // Estimate selectivity for query value
  const estimatedSelectivity = useMemo(() => {
    // Find which bucket the query value falls into
    let bucketIdx = 0;
    for (let i = 0; i < histogramBounds.length - 1; i++) {
      if (queryValue >= histogramBounds[i] && queryValue < histogramBounds[i + 1]) {
        bucketIdx = i;
        break;
      }
      if (queryValue >= histogramBounds[histogramBounds.length - 1]) {
        bucketIdx = histogramBounds.length - 2;
      }
    }

    // Each bucket represents 1/numBuckets of the data
    // For values <= queryValue, count full buckets + partial
    const fullBuckets = bucketIdx;
    const bucketWidth = histogramBounds[bucketIdx + 1] - histogramBounds[bucketIdx];
    const positionInBucket = bucketWidth > 0
      ? (queryValue - histogramBounds[bucketIdx]) / bucketWidth
      : 0;

    const selectivity = (fullBuckets + positionInBucket) / numBuckets;
    return Math.min(1, Math.max(0, selectivity));
  }, [queryValue, histogramBounds, numBuckets]);

  // Actual count for comparison
  const actualCount = useMemo(() => {
    return data.filter(v => v <= queryValue).length;
  }, [data, queryValue]);

  const estimatedCount = Math.round(estimatedSelectivity * data.length);
  const error = Math.abs(estimatedCount - actualCount);
  const errorPercent = ((error / actualCount) * 100).toFixed(1);

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex flex-wrap gap-6 mb-6">
        <div>
          <label className="text-xs font-mono block mb-2" style={{ color: colors.text.muted }}>
            Histogram buckets: {numBuckets}
          </label>
          <input
            type="range"
            min="5"
            max="20"
            value={numBuckets}
            onChange={(e) => setNumBuckets(parseInt(e.target.value))}
            className="w-32"
          />
        </div>

        <div>
          <label className="text-xs font-mono block mb-2" style={{ color: colors.text.muted }}>
            Query: WHERE amount {'<='} {queryValue}
          </label>
          <input
            type="range"
            min="0"
            max="2000"
            value={queryValue}
            onChange={(e) => setQueryValue(parseInt(e.target.value))}
            className="w-48"
          />
        </div>
      </div>

      {/* Histogram visualization */}
      <div
        className="p-4 rounded-xl mb-4"
        style={{
          background: colors.oceanLight,
          border: `1px solid ${colors.text.muted}30`,
        }}
      >
        <div className="text-xs font-mono mb-4" style={{ color: colors.text.muted }}>
          histogram_bounds (equal-depth histogram)
        </div>

        <div className="relative h-40 flex items-end gap-1">
          {bucketCounts.map((_, i) => {
            const isBeforeQuery = histogramBounds[i + 1] <= queryValue;
            const isQueryBucket = histogramBounds[i] <= queryValue && histogramBounds[i + 1] > queryValue;

            return (
              <motion.div
                key={i}
                className="flex-1 rounded-t relative group"
                style={{
                  height: '100%',
                  background: isBeforeQuery
                    ? colors.glow.healthy + '60'
                    : isQueryBucket
                    ? colors.glow.warning + '60'
                    : colors.text.muted + '30',
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                {/* Bucket label */}
                <div
                  className="absolute -bottom-6 left-0 right-0 text-center text-[10px] font-mono truncate"
                  style={{ color: colors.text.muted }}
                >
                  {histogramBounds[i]}
                </div>

                {/* Tooltip on hover */}
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
                  style={{ background: colors.oceanDark, color: colors.text.primary }}
                >
                  {histogramBounds[i]} - {histogramBounds[i + 1]}
                  <br />
                  ~{(100 / numBuckets).toFixed(1)}% of rows
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Last bound label */}
        <div className="flex justify-end mt-6 pr-1">
          <span className="text-[10px] font-mono" style={{ color: colors.text.muted }}>
            {histogramBounds[histogramBounds.length - 1]}
          </span>
        </div>
      </div>

      {/* Estimation results */}
      <div className="grid md:grid-cols-3 gap-4">
        <div
          className="p-4 rounded-lg"
          style={{
            background: colors.glow.healthy + '10',
            border: `1px solid ${colors.glow.healthy}30`,
          }}
        >
          <div className="text-xs font-mono mb-1" style={{ color: colors.text.muted }}>
            Estimated rows
          </div>
          <div className="text-2xl font-mono" style={{ color: colors.glow.healthy }}>
            {estimatedCount.toLocaleString()}
          </div>
          <div className="text-xs mt-1" style={{ color: colors.text.muted }}>
            {(estimatedSelectivity * 100).toFixed(1)}% selectivity
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
            Actual rows
          </div>
          <div className="text-2xl font-mono" style={{ color: colors.glow.warning }}>
            {actualCount.toLocaleString()}
          </div>
          <div className="text-xs mt-1" style={{ color: colors.text.muted }}>
            {((actualCount / data.length) * 100).toFixed(1)}% of total
          </div>
        </div>

        <div
          className="p-4 rounded-lg"
          style={{
            background: error > 50 ? colors.glow.critical + '10' : colors.text.muted + '10',
            border: `1px solid ${error > 50 ? colors.glow.critical : colors.text.muted}30`,
          }}
        >
          <div className="text-xs font-mono mb-1" style={{ color: colors.text.muted }}>
            Estimation error
          </div>
          <div
            className="text-2xl font-mono"
            style={{ color: error > 50 ? colors.glow.critical : colors.text.secondary }}
          >
            {error.toLocaleString()}
          </div>
          <div className="text-xs mt-1" style={{ color: colors.text.muted }}>
            {errorPercent}% off
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div
        className="mt-4 p-4 rounded-lg"
        style={{ background: colors.oceanDark }}
      >
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          <strong style={{ color: colors.glow.healthy }}>Equal-depth histogram:</strong> Each bucket
          contains ~{(100 / numBuckets).toFixed(0)}% of rows. The bounds show where each bucket starts.
          PostgreSQL uses this to estimate how many rows match a range condition.
        </p>
        <p className="text-sm mt-2" style={{ color: colors.text.muted }}>
          Try adjusting the query value and bucket count to see how estimation accuracy changes.
          More buckets = better estimates, but more storage overhead.
        </p>
      </div>
    </div>
  );
}
