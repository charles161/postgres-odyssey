import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

export function RulesPreview() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Four isolation level chambers */}
      <div className="flex gap-1">
        {[100, 66, 33, 0].map((permeability, i) => (
          <motion.div
            key={i}
            className="w-4 h-12 rounded-sm relative overflow-hidden"
            style={{
              background: colors.oceanLight,
              border: `1px solid ${colors.text.muted}40`,
            }}
          >
            {/* Fill representing isolation */}
            <motion.div
              className="absolute bottom-0 left-0 right-0"
              style={{
                background:
                  permeability === 0
                    ? colors.glow.healthy
                    : permeability < 50
                    ? colors.glow.warning
                    : colors.glow.critical,
              }}
              animate={{
                height: [`${100 - permeability}%`, `${100 - permeability + 10}%`, `${100 - permeability}%`],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            />
          </motion.div>
        ))}
      </div>

      {/* Floating events */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: colors.glow.warning,
            left: '10%',
          }}
          animate={{
            x: [0, 60, 0],
            y: [-5 + i * 10, -5 + i * 10],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}
    </div>
  );
}
