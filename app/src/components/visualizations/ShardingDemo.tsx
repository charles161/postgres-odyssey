import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface Shard {
  id: number;
  name: string;
  tenantRange: string;
  rowCount: number;
  color: string;
}

export function ShardingDemo() {
  const [queryTenant, setQueryTenant] = useState('tenant_042');
  const [isQuerying, setIsQuerying] = useState(false);
  const [targetShard, setTargetShard] = useState<number | null>(null);

  const shards: Shard[] = [
    { id: 0, name: 'shard_0', tenantRange: 'tenant_000 - tenant_024', rowCount: 12500000, color: colors.glow.healthy },
    { id: 1, name: 'shard_1', tenantRange: 'tenant_025 - tenant_049', rowCount: 13200000, color: colors.glow.warning },
    { id: 2, name: 'shard_2', tenantRange: 'tenant_050 - tenant_074', rowCount: 11800000, color: colors.glow.critical },
    { id: 3, name: 'shard_3', tenantRange: 'tenant_075 - tenant_099', rowCount: 12100000, color: '#9333ea' },
  ];

  const runQuery = () => {
    setIsQuerying(true);
    setTargetShard(null);

    // Determine which shard based on tenant ID
    const tenantNum = parseInt(queryTenant.split('_')[1]);
    const shardId = Math.floor(tenantNum / 25);

    setTimeout(() => {
      setTargetShard(shardId);
      setTimeout(() => {
        setIsQuerying(false);
      }, 1000);
    }, 500);
  };

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex flex-wrap gap-6 mb-8">
        <div>
          <label className="text-xs font-mono block mb-2" style={{ color: colors.text.muted }}>
            Query Tenant
          </label>
          <select
            value={queryTenant}
            onChange={(e) => setQueryTenant(e.target.value)}
            className="px-3 py-2 rounded text-sm font-mono"
            style={{
              background: colors.oceanLight,
              color: colors.text.secondary,
              border: `1px solid ${colors.text.muted}40`,
            }}
          >
            <option value="tenant_012">tenant_012 (Shard 0)</option>
            <option value="tenant_042">tenant_042 (Shard 1)</option>
            <option value="tenant_067">tenant_067 (Shard 2)</option>
            <option value="tenant_089">tenant_089 (Shard 3)</option>
          </select>
        </div>

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
            {isQuerying ? 'Routing...' : 'Run Query'}
          </button>
        </div>
      </div>

      {/* Query display */}
      <div
        className="p-4 rounded-lg mb-6 font-mono text-sm"
        style={{ background: colors.oceanDark }}
      >
        <span style={{ color: colors.text.muted }}>-- Sharded query routing</span>
        <br />
        <span style={{ color: colors.glow.healthy }}>SELECT</span>
        <span style={{ color: colors.text.secondary }}> * </span>
        <span style={{ color: colors.glow.healthy }}>FROM</span>
        <span style={{ color: colors.text.primary }}> orders</span>
        <br />
        <span style={{ color: colors.glow.healthy }}>WHERE</span>
        <span style={{ color: colors.text.secondary }}> tenant_id = '</span>
        <span style={{ color: colors.glow.warning }}>{queryTenant}</span>
        <span style={{ color: colors.text.secondary }}>';</span>
      </div>

      {/* Visualization */}
      <div
        className="p-6 rounded-xl mb-6"
        style={{
          background: colors.oceanLight,
          border: `1px solid ${colors.text.muted}30`,
        }}
      >
        {/* Router */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            className="px-6 py-3 rounded-lg text-center"
            style={{
              background: colors.oceanDark,
              border: `2px solid ${isQuerying ? colors.glow.warning : colors.text.muted}40`,
            }}
            animate={isQuerying ? {
              borderColor: [colors.glow.warning, colors.glow.healthy, colors.glow.warning],
            } : {}}
            transition={{ duration: 0.5, repeat: isQuerying ? Infinity : 0 }}
          >
            <div className="text-sm font-mono" style={{ color: colors.glow.warning }}>
              Shard Router
            </div>
            <div className="text-xs mt-1" style={{ color: colors.text.muted }}>
              hash(tenant_id) % 4 → shard
            </div>
          </motion.div>

          {/* Routing arrows */}
          <div className="flex justify-center gap-8 mt-4">
            {shards.map((shard) => (
              <motion.div
                key={shard.id}
                className="text-lg"
                style={{
                  color: targetShard === shard.id ? shard.color : colors.text.muted,
                }}
                animate={targetShard === shard.id ? {
                  y: [0, 10, 0],
                  opacity: [0.5, 1, 0.5],
                } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                ↓
              </motion.div>
            ))}
          </div>
        </div>

        {/* Shards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatePresence>
            {shards.map((shard) => {
              const isTarget = targetShard === shard.id;
              const isOther = targetShard !== null && !isTarget;

              return (
                <motion.div
                  key={shard.id}
                  className="p-4 rounded-lg relative overflow-hidden"
                  style={{
                    background: isTarget
                      ? shard.color + '20'
                      : colors.oceanDark,
                    border: `2px solid ${isTarget ? shard.color : colors.text.muted}40`,
                    opacity: isOther ? 0.4 : 1,
                  }}
                  animate={isTarget && isQuerying ? {
                    boxShadow: [`0 0 20px ${shard.color}20`, `0 0 40px ${shard.color}40`, `0 0 20px ${shard.color}20`],
                  } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  {/* Scan animation */}
                  {isTarget && isQuerying && (
                    <motion.div
                      className="absolute inset-0"
                      style={{ background: shard.color }}
                      initial={{ scaleY: 0, originY: 0 }}
                      animate={{ scaleY: [0, 1, 0], originY: [0, 0, 1] }}
                      transition={{ duration: 0.8 }}
                    />
                  )}

                  <div className="relative z-10">
                    <div className="text-sm font-mono mb-2" style={{ color: isTarget ? shard.color : colors.text.secondary }}>
                      {shard.name}
                    </div>
                    <div className="text-xs mb-2" style={{ color: colors.text.muted }}>
                      {shard.tenantRange}
                    </div>
                    <div className="text-xs" style={{ color: colors.text.muted }}>
                      {(shard.rowCount / 1000000).toFixed(1)}M rows
                    </div>

                    {isTarget && !isQuerying && (
                      <motion.div
                        className="absolute top-2 right-2 text-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        ✓
                      </motion.div>
                    )}

                    {isOther && (
                      <div className="absolute top-2 right-2 text-xs" style={{ color: colors.text.muted }}>
                        SKIPPED
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
      {targetShard !== null && !isQuerying && (
        <motion.div
          className="grid md:grid-cols-2 gap-4"
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
              Query Routed To
            </div>
            <div className="text-xl font-mono" style={{ color: shards[targetShard].color }}>
              {shards[targetShard].name}
            </div>
            <div className="text-xs mt-1" style={{ color: colors.text.muted }}>
              Only 1 of 4 shards queried
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
              Data Isolation
            </div>
            <div className="text-xl font-mono" style={{ color: colors.glow.warning }}>
              {queryTenant}
            </div>
            <div className="text-xs mt-1" style={{ color: colors.text.muted }}>
              Data stays on its designated shard
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
