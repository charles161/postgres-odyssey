import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

export function ConnectionPreview() {
  const clients = [0, 1, 2, 3, 4, 5];
  const poolConnections = [0, 1, 2];

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Clients on the left */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
        {clients.map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ background: colors.glow.warning }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Pool in the middle */}
      <motion.div
        className="relative w-16 h-20 rounded-lg flex flex-col items-center justify-center gap-1"
        style={{
          background: colors.glow.healthy + '15',
          border: `1px solid ${colors.glow.healthy}40`,
        }}
      >
        <div className="text-[8px] font-mono" style={{ color: colors.glow.healthy }}>
          POOL
        </div>
        <div className="flex gap-1">
          {poolConnections.map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded"
              style={{ background: colors.glow.healthy + '60' }}
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Database on the right */}
      <motion.div
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-10 rounded flex items-center justify-center"
        style={{
          background: colors.oceanDark,
          border: `1px solid ${colors.text.muted}40`,
        }}
      >
        <motion.div
          className="text-[10px] font-mono"
          style={{ color: colors.text.muted }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          PG
        </motion.div>
      </motion.div>

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Clients to pool */}
        {clients.map((i) => (
          <motion.line
            key={`client-${i}`}
            x1="20"
            y1={45 + i * 10}
            x2="55"
            y2="80"
            stroke={colors.glow.warning}
            strokeWidth="0.5"
            strokeDasharray="2,2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}

        {/* Pool to database */}
        {poolConnections.map((i) => (
          <motion.line
            key={`pool-${i}`}
            x1="105"
            y1={70 + i * 10}
            x2="125"
            y2="80"
            stroke={colors.glow.healthy}
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
