import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

export function CleanupPreview() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Table representation with dead tuples */}
      <div className="relative">
        {/* Table rectangle */}
        <motion.div
          className="w-24 h-16 rounded-lg flex flex-wrap items-center justify-center gap-1 p-2"
          style={{
            background: colors.oceanLight,
            border: `2px solid ${colors.text.muted}`,
          }}
          animate={{
            borderColor: [colors.text.muted, colors.glow.healthy, colors.text.muted],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {/* Tuples - mix of live and dead */}
          {[...Array(12)].map((_, i) => {
            const isDead = i % 3 === 0;
            return (
              <motion.div
                key={i}
                className="w-3 h-2 rounded-sm"
                style={{
                  background: isDead ? '#4a4a6a' : colors.glow.healthy,
                  opacity: isDead ? 0.5 : 1,
                }}
                animate={
                  isDead
                    ? {
                        opacity: [0.5, 0.3, 0.5],
                      }
                    : {}
                }
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              />
            );
          })}
        </motion.div>

        {/* VACUUM sweep line */}
        <motion.div
          className="absolute left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.glow.healthy}, transparent)`,
            top: 0,
          }}
          animate={{
            top: ['0%', '100%', '0%'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Ghost particles floating up */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: '#4a4a6a',
            left: `${30 + i * 15}%`,
          }}
          animate={{
            y: [-10, -40],
            opacity: [0.6, 0],
            scale: [1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}
