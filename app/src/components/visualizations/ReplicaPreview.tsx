import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

export function ReplicaPreview() {
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Primary */}
      <motion.div
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-lg flex items-center justify-center"
        style={{
          background: colors.glow.healthy + '20',
          border: `2px solid ${colors.glow.healthy}`,
        }}
        animate={{
          boxShadow: [`0 0 10px ${colors.glow.healthy}20`, `0 0 20px ${colors.glow.healthy}40`, `0 0 10px ${colors.glow.healthy}20`],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <span className="text-lg">🐘</span>
      </motion.div>

      {/* WAL flowing */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{ background: colors.glow.healthy }}
          initial={{ left: 60, top: `${35 + i * 15}%`, opacity: 0 }}
          animate={{
            left: [60, 90, 120],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'linear',
          }}
        />
      ))}

      {/* Replicas */}
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute right-4 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            top: `${30 + i * 25}%`,
            background: colors.oceanDark,
            border: `1px solid ${colors.glow.warning}40`,
          }}
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        >
          <span className="text-sm">🐘</span>
        </motion.div>
      ))}

      {/* Label */}
      <motion.div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono px-1.5 py-0.5 rounded"
        style={{
          background: colors.glow.healthy + '20',
          color: colors.glow.healthy,
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        WAL streaming
      </motion.div>
    </div>
  );
}
