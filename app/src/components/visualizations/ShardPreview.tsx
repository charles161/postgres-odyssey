import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

export function ShardPreview() {
  const shardColors = [colors.glow.healthy, colors.glow.warning, colors.glow.critical, '#9333ea'];

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Central router */}
      <motion.div
        className="absolute w-12 h-12 rounded-full flex items-center justify-center z-10"
        style={{
          background: colors.oceanDark,
          border: `2px solid ${colors.glow.warning}`,
        }}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-xs font-mono" style={{ color: colors.glow.warning }}>
          ⚡
        </span>
      </motion.div>

      {/* Shards around the router */}
      {shardColors.map((color, i) => {
        const angle = (i * 90 - 45) * (Math.PI / 180);
        const radius = 50;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <motion.div
            key={i}
            className="absolute w-8 h-10 rounded flex items-center justify-center"
            style={{
              left: `calc(50% + ${x}px - 16px)`,
              top: `calc(50% + ${y}px - 20px)`,
              background: color + '30',
              border: `1px solid ${color}`,
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            <span className="text-[8px] font-mono" style={{ color }}>
              S{i}
            </span>
          </motion.div>
        );
      })}

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {shardColors.map((color, i) => {
          const angle = (i * 90 - 45) * (Math.PI / 180);
          const radius = 30;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.line
              key={i}
              x1="80"
              y1="80"
              x2={80 + x}
              y2={80 + y}
              stroke={color}
              strokeWidth="1"
              strokeDasharray="3,3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          );
        })}
      </svg>

      {/* Label */}
      <motion.div
        className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-mono"
        style={{ color: colors.text.muted }}
      >
        distributed
      </motion.div>
    </div>
  );
}
