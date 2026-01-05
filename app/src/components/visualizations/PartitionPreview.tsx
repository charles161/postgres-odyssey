import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

export function PartitionPreview() {
  const partitions = [
    { active: false },
    { active: true },
    { active: false },
    { active: false },
  ];

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Table divided into partitions */}
      <div className="flex gap-1">
        {partitions.map((partition, i) => (
          <motion.div
            key={i}
            className="w-8 h-24 rounded flex flex-col justify-end overflow-hidden"
            style={{
              background: partition.active
                ? colors.glow.healthy + '30'
                : colors.text.muted + '20',
              border: `1px solid ${partition.active ? colors.glow.healthy : colors.text.muted}40`,
            }}
            animate={partition.active ? {
              boxShadow: [`0 0 10px ${colors.glow.healthy}20`, `0 0 20px ${colors.glow.healthy}40`, `0 0 10px ${colors.glow.healthy}20`],
            } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {/* Rows inside partition */}
            {[0, 1, 2, 3].map((row) => (
              <motion.div
                key={row}
                className="h-4 mx-0.5 mb-0.5 rounded-sm"
                style={{
                  background: partition.active
                    ? colors.glow.healthy + '60'
                    : colors.text.muted + '30',
                }}
                animate={partition.active ? {
                  opacity: [0.5, 1, 0.5],
                } : {}}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: row * 0.1,
                }}
              />
            ))}
          </motion.div>
        ))}
      </div>

      {/* Labels */}
      <motion.div
        className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono px-1.5 py-0.5 rounded"
        style={{
          background: colors.glow.healthy + '20',
          color: colors.glow.healthy,
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        pruning
      </motion.div>

      <motion.div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-mono"
        style={{ color: colors.text.muted }}
      >
        {partitions.filter(p => !p.active).length} skipped
      </motion.div>
    </div>
  );
}
