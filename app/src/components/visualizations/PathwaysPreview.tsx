import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

export function PathwaysPreview() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* B-tree representation */}
      <div className="relative">
        {/* Root node */}
        <motion.div
          className="w-16 h-6 rounded flex items-center justify-center text-xs font-mono mb-2 mx-auto"
          style={{
            background: colors.oceanLight,
            border: `1px solid ${colors.glow.healthy}60`,
            color: colors.text.secondary,
          }}
          animate={{
            borderColor: [
              `${colors.glow.healthy}60`,
              `${colors.glow.healthy}`,
              `${colors.glow.healthy}60`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 0 }}
        >
          root
        </motion.div>

        {/* Connecting lines */}
        <svg className="w-full h-4" viewBox="0 0 80 16">
          <motion.line
            x1="40"
            y1="0"
            x2="20"
            y2="16"
            stroke={colors.text.muted}
            strokeWidth="1"
            animate={{ stroke: [colors.text.muted, colors.glow.healthy, colors.text.muted] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          <line x1="40" y1="0" x2="60" y2="16" stroke={colors.text.muted} strokeWidth="1" />
        </svg>

        {/* Child nodes */}
        <div className="flex gap-2">
          <motion.div
            className="w-8 h-5 rounded flex items-center justify-center"
            style={{
              background: colors.oceanLight,
              border: `1px solid ${colors.text.muted}40`,
            }}
            animate={{
              borderColor: [
                `${colors.text.muted}40`,
                `${colors.glow.healthy}`,
                `${colors.text.muted}40`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          <div
            className="w-8 h-5 rounded flex items-center justify-center"
            style={{
              background: colors.oceanLight,
              border: `1px solid ${colors.text.muted}40`,
            }}
          />
        </div>

        {/* Leaf level - just dots */}
        <div className="flex justify-center gap-1 mt-2">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: i === 0 ? colors.glow.healthy : colors.text.muted }}
              animate={
                i === 0
                  ? {
                      scale: [1, 1.3, 1],
                      boxShadow: [
                        `0 0 0 ${colors.glow.healthy}`,
                        `0 0 8px ${colors.glow.healthy}`,
                        `0 0 0 ${colors.glow.healthy}`,
                      ],
                    }
                  : {}
              }
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          ))}
        </div>

        {/* Arrow pointing to heap */}
        <motion.div
          className="absolute -right-4 top-1/2 w-8 h-0.5"
          style={{ background: colors.glow.warning }}
          animate={{ opacity: [0, 1, 0], x: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
        />
      </div>

      {/* Heap representation - just a box */}
      <motion.div
        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-8 rounded"
        style={{
          background: colors.oceanLight,
          border: `1px solid ${colors.glow.warning}40`,
        }}
        animate={{
          borderColor: [
            `${colors.glow.warning}40`,
            `${colors.glow.warning}`,
            `${colors.glow.warning}40`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
      />
    </div>
  );
}
