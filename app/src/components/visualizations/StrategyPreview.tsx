import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

export function StrategyPreview() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Two competing paths */}
      <div className="flex gap-3">
        {/* Fast path */}
        <motion.div
          className="w-8 h-12 rounded flex flex-col items-center justify-center"
          style={{
            background: colors.oceanLight,
            border: `1px solid ${colors.glow.healthy}60`,
          }}
          animate={{
            borderColor: [
              `${colors.glow.healthy}60`,
              `${colors.glow.healthy}`,
              `${colors.glow.healthy}60`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div
            className="text-xs font-mono"
            style={{ color: colors.glow.healthy }}
          >
            84
          </div>
        </motion.div>

        {/* VS */}
        <div
          className="flex items-center text-xs"
          style={{ color: colors.text.muted }}
        >
          vs
        </div>

        {/* Slow path */}
        <motion.div
          className="w-8 h-12 rounded flex flex-col items-center justify-center"
          style={{
            background: colors.oceanLight,
            border: `1px solid ${colors.glow.critical}60`,
          }}
        >
          <div
            className="text-xs font-mono"
            style={{ color: colors.glow.critical }}
          >
            8M
          </div>
        </motion.div>
      </div>

      {/* Decision indicator */}
      <motion.div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
        style={{ background: colors.glow.warning }}
        animate={{
          x: [-15, 15, -15],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
}
