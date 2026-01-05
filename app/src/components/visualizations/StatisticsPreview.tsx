import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

export function StatisticsPreview() {
  const bars = [0.6, 0.8, 0.95, 0.7, 0.5, 0.3, 0.15, 0.1];

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Histogram bars */}
      <div className="flex items-end gap-1 h-24">
        {bars.map((height, i) => (
          <motion.div
            key={i}
            className="w-3 rounded-t"
            style={{
              background: `linear-gradient(to top, ${colors.glow.healthy}, ${colors.glow.warning})`,
              opacity: 0.8,
            }}
            animate={{
              height: [`${height * 60}%`, `${height * 80}%`, `${height * 60}%`],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Floating labels */}
      <motion.div
        className="absolute top-2 left-2 text-[10px] font-mono px-1.5 py-0.5 rounded"
        style={{
          background: colors.glow.healthy + '20',
          color: colors.glow.healthy,
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        pg_stats
      </motion.div>

      <motion.div
        className="absolute bottom-4 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded"
        style={{
          background: colors.glow.warning + '20',
          color: colors.glow.warning,
        }}
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        ANALYZE
      </motion.div>

      {/* Scan line */}
      <motion.div
        className="absolute left-4 right-4 h-px"
        style={{ background: colors.glow.critical }}
        animate={{
          top: ['30%', '70%', '30%'],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
