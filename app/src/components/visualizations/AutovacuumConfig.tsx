import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface ConfigPreset {
  id: string;
  name: string;
  threshold: number;
  scaleFactor: number;
  costDelay: number;
  costLimit: number;
  description: string;
}

const PRESETS: ConfigPreset[] = [
  {
    id: 'default',
    name: 'Default',
    threshold: 50,
    scaleFactor: 0.2,
    costDelay: 2,
    costLimit: 200,
    description: 'PostgreSQL defaults. Gentle, won\'t impact production.',
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    threshold: 50,
    scaleFactor: 0.1,
    costDelay: 0,
    costLimit: 2000,
    description: 'For high-write tables. Triggers faster, runs faster.',
  },
];

export function AutovacuumConfig() {
  const [tableRows, setTableRows] = useState(1000000); // 1M rows
  const [scaleFactor, setScaleFactor] = useState(0.2);
  const [threshold, setThreshold] = useState(50);
  const [costDelay, setCostDelay] = useState(2);
  const [costLimit, setCostLimit] = useState(200);
  const [showThrottling, setShowThrottling] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('default');

  // Calculate trigger threshold
  const triggerAt = Math.floor(threshold + scaleFactor * tableRows);

  // Calculate effective vacuum speed
  const effectiveSpeed = costDelay === 0 ? 'Maximum' : `${Math.round((costLimit / 200) * (2 / costDelay) * 100)}%`;

  const applyPreset = (preset: ConfigPreset) => {
    setSelectedPreset(preset.id);
    setThreshold(preset.threshold);
    setScaleFactor(preset.scaleFactor);
    setCostDelay(preset.costDelay);
    setCostLimit(preset.costLimit);
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };

  return (
    <div className="space-y-8">
      {/* Presets */}
      <div className="flex gap-4 justify-center">
        {PRESETS.map((preset) => (
          <motion.button
            key={preset.id}
            className="px-6 py-3 rounded-lg font-medium transition-all"
            style={{
              background: selectedPreset === preset.id ? colors.glow.healthy : colors.oceanDark,
              color: selectedPreset === preset.id ? colors.oceanDark : colors.text.secondary,
              border: `1px solid ${selectedPreset === preset.id ? colors.glow.healthy : colors.text.muted}40`,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => applyPreset(preset)}
          >
            {preset.name}
          </motion.button>
        ))}
      </div>

      {/* Main Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Sliders */}
        <div
          className="p-6 rounded-xl space-y-6"
          style={{ background: colors.oceanDark, border: `1px solid ${colors.text.muted}30` }}
        >
          <h3 className="font-mono text-lg font-bold" style={{ color: colors.text.primary }}>
            Configuration
          </h3>

          {/* Table size */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: colors.text.muted }}>Table size (n_live_tup)</span>
              <span className="font-mono" style={{ color: colors.text.secondary }}>
                {formatNumber(tableRows)} rows
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="10000000"
              step="1000"
              value={tableRows}
              onChange={(e) => setTableRows(Number(e.target.value))}
              aria-label="Table size - number of live tuples"
              className="w-full"
            />
            <div className="flex justify-between text-xs" style={{ color: colors.text.muted }}>
              <span>1K</span>
              <span>10M</span>
            </div>
          </div>

          {/* Scale factor */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: colors.text.muted }}>autovacuum_vacuum_scale_factor</span>
              <span className="font-mono" style={{ color: colors.glow.healthy }}>
                {scaleFactor.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={scaleFactor}
              onChange={(e) => {
                setScaleFactor(Number(e.target.value));
                setSelectedPreset('custom');
              }}
              aria-label="Autovacuum vacuum scale factor"
              className="w-full"
            />
            <div className="flex justify-between text-xs" style={{ color: colors.text.muted }}>
              <span>0.01 (1%)</span>
              <span>0.5 (50%)</span>
            </div>
          </div>

          {/* Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: colors.text.muted }}>autovacuum_vacuum_threshold</span>
              <span className="font-mono" style={{ color: colors.glow.healthy }}>
                {threshold}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={threshold}
              onChange={(e) => {
                setThreshold(Number(e.target.value));
                setSelectedPreset('custom');
              }}
              aria-label="Autovacuum vacuum threshold"
              className="w-full"
            />
            <div className="flex justify-between text-xs" style={{ color: colors.text.muted }}>
              <span>0</span>
              <span>1000</span>
            </div>
          </div>
        </div>

        {/* Right: Result */}
        <div
          className="p-6 rounded-xl flex flex-col justify-center"
          style={{ background: colors.oceanDark, border: `1px solid ${colors.glow.healthy}30` }}
        >
          <div className="text-center space-y-4">
            {/* Formula */}
            <div className="space-y-2">
              <p className="text-sm" style={{ color: colors.text.muted }}>
                Autovacuum triggers when:
              </p>
              <code
                className="block p-3 rounded-lg font-mono text-sm"
                style={{ background: colors.ocean, color: colors.text.secondary }}
              >
                dead_tuples {'>'} {threshold} + {scaleFactor} × {formatNumber(tableRows)}
              </code>
            </div>

            {/* Result */}
            <div className="py-6">
              <p className="text-sm mb-2" style={{ color: colors.text.muted }}>
                VACUUM triggers at:
              </p>
              <motion.div
                className="text-4xl font-mono font-bold"
                style={{ color: colors.glow.healthy }}
                key={triggerAt}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {formatNumber(triggerAt)}
              </motion.div>
              <p className="text-sm mt-2" style={{ color: colors.text.muted }}>
                dead tuples
              </p>
            </div>

            {/* Percentage insight */}
            <div
              className="p-4 rounded-lg"
              style={{
                background: triggerAt > tableRows * 0.5 ? `${colors.glow.warning}10` : `${colors.glow.healthy}10`,
                border: `1px solid ${triggerAt > tableRows * 0.5 ? colors.glow.warning : colors.glow.healthy}20`,
              }}
            >
              <p className="text-sm" style={{ color: triggerAt > tableRows * 0.5 ? colors.glow.warning : colors.text.secondary }}>
                That's <strong>{((triggerAt / tableRows) * 100).toFixed(1)}%</strong> of your table.
                {triggerAt > tableRows * 0.5 && (
                  <span style={{ color: colors.glow.warning }}>
                    {' '}Consider lowering scale_factor for this table.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Throttling Section */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: colors.oceanDark, border: `1px solid ${colors.text.muted}30` }}
      >
        <button
          className="w-full p-4 flex items-center justify-between text-left"
          onClick={() => setShowThrottling(!showThrottling)}
        >
          <div className="flex items-center gap-3">
            <motion.span
              animate={{ rotate: showThrottling ? 90 : 0 }}
              style={{ color: colors.text.muted }}
            >
              ▶
            </motion.span>
            <span className="font-medium" style={{ color: colors.text.primary }}>
              Why is autovacuum "lazy"?
            </span>
          </div>
          <span className="text-sm" style={{ color: colors.text.muted }}>
            Cost-based throttling explained
          </span>
        </button>

        <AnimatePresence>
          {showThrottling && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-6 space-y-6" style={{ borderTop: `1px solid ${colors.text.muted}20` }}>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  Autovacuum is intentionally throttled to minimize impact on production workloads.
                  After each chunk of work, it sleeps.
                </p>

                {/* Throttling sliders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cost delay */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: colors.text.muted }}>vacuum_cost_delay</span>
                      <span className="font-mono" style={{ color: colors.glow.healthy }}>
                        {costDelay}ms
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={costDelay}
                      onChange={(e) => {
                        setCostDelay(Number(e.target.value));
                        setSelectedPreset('custom');
                      }}
                      aria-label="Vacuum cost delay in milliseconds"
                      className="w-full"
                    />
                    <p className="text-xs" style={{ color: colors.text.muted }}>
                      Sleep duration between chunks. 0 = no sleeping.
                    </p>
                  </div>

                  {/* Cost limit */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: colors.text.muted }}>vacuum_cost_limit</span>
                      <span className="font-mono" style={{ color: colors.glow.healthy }}>
                        {costLimit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="10000"
                      step="100"
                      value={costLimit}
                      onChange={(e) => {
                        setCostLimit(Number(e.target.value));
                        setSelectedPreset('custom');
                      }}
                      aria-label="Vacuum cost limit"
                      className="w-full"
                    />
                    <p className="text-xs" style={{ color: colors.text.muted }}>
                      Work done before sleeping. Higher = bigger chunks.
                    </p>
                  </div>
                </div>

                {/* Speed visualization */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: colors.ocean }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: colors.glow.healthy }}
                        animate={{
                          width: costDelay === 0 ? '100%' : `${Math.min(100, (costLimit / 200) * (2 / costDelay) * 100)}%`,
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                  <span className="font-mono text-sm w-24" style={{ color: colors.text.secondary }}>
                    Speed: {effectiveSpeed}
                  </span>
                </div>

                {/* Work/sleep cycle visualization */}
                <div
                  className="p-4 rounded-lg"
                  style={{ background: colors.ocean }}
                >
                  <p className="text-xs font-mono mb-3" style={{ color: colors.text.muted }}>
                    Work/Sleep Cycle:
                  </p>
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="flex gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div
                          className="h-6 rounded"
                          style={{
                            width: Math.max(8, costLimit / 100),
                            background: colors.glow.healthy,
                          }}
                        />
                        {costDelay > 0 && (
                          <div
                            className="h-6 rounded"
                            style={{
                              width: Math.max(4, costDelay * 2),
                              background: colors.text.muted,
                              opacity: 0.3,
                            }}
                          />
                        )}
                      </motion.div>
                    ))}
                    <span className="text-xs ml-2" style={{ color: colors.text.muted }}>
                      ...
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs" style={{ color: colors.text.muted }}>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded" style={{ background: colors.glow.healthy }} />
                      <span>Work</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded" style={{ background: colors.text.muted, opacity: 0.3 }} />
                      <span>Sleep</span>
                    </div>
                  </div>
                </div>

                {/* Insight */}
                <div
                  className="p-4 rounded-lg"
                  style={{
                    background: `${colors.glow.warning}10`,
                    border: `1px solid ${colors.glow.warning}20`,
                  }}
                >
                  <p className="text-sm" style={{ color: colors.text.secondary }}>
                    <span style={{ color: colors.glow.warning }}>The problem:</span> Default settings
                    are too conservative for high-write tables. On a 10M row table with 50K writes/hour,
                    autovacuum might not keep up—leading to bloat accumulation.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Key insight */}
      <div
        className="p-4 rounded-lg text-center max-w-2xl mx-auto"
        style={{ background: colors.oceanDark, border: `1px solid ${colors.text.muted}20` }}
      >
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          For high-write tables, consider per-table settings:{' '}
          <code
            className="px-2 py-0.5 rounded font-mono text-xs"
            style={{ background: colors.ocean, color: colors.glow.healthy }}
          >
            ALTER TABLE users SET (autovacuum_vacuum_scale_factor = 0.05)
          </code>
        </p>
      </div>
    </div>
  );
}
