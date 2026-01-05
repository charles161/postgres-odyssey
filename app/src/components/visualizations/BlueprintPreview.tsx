import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

export function BlueprintPreview() {
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* DNA helix visualization */}
      <div className="relative w-24 h-32">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: i % 2 === 0 ? colors.glow.healthy : colors.glow.warning,
              left: '50%',
              top: `${8 + i * 15}%`,
              boxShadow: `0 0 10px ${i % 2 === 0 ? colors.glow.healthy : colors.glow.warning}60`,
            }}
            animate={{
              x: [
                Math.sin((i * Math.PI) / 3) * 20 - 6,
                Math.sin((i * Math.PI) / 3 + Math.PI) * 20 - 6,
                Math.sin((i * Math.PI) / 3) * 20 - 6,
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Connecting lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={`line-${i}`}
            className="absolute h-px"
            style={{
              background: `linear-gradient(90deg, ${colors.glow.healthy}40, ${colors.glow.warning}40)`,
              width: '40px',
              left: '50%',
              top: `${15 + i * 15}%`,
              transformOrigin: 'center',
            }}
            animate={{
              x: [-20, -20],
              rotate: [i * 30, i * 30 + 180, i * 30 + 360],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Floating type labels */}
      <motion.div
        className="absolute top-2 left-0 text-[10px] font-mono px-1.5 py-0.5 rounded"
        style={{
          background: colors.glow.healthy + '20',
          color: colors.glow.healthy,
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        UUID
      </motion.div>

      <motion.div
        className="absolute bottom-4 right-0 text-[10px] font-mono px-1.5 py-0.5 rounded"
        style={{
          background: colors.glow.warning + '20',
          color: colors.glow.warning,
        }}
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        TEXT
      </motion.div>

      <motion.div
        className="absolute top-1/2 right-0 text-[10px] font-mono px-1.5 py-0.5 rounded"
        style={{
          background: colors.glow.critical + '20',
          color: colors.glow.critical,
        }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        NOT NULL
      </motion.div>
    </div>
  );
}
