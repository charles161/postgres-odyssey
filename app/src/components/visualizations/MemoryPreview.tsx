import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

interface MemoryPreviewProps {
  isHovered?: boolean;
}

export function MemoryPreview({ isHovered = false }: MemoryPreviewProps) {
  // Generate buffer slots for preview
  const slots = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    heat: Math.random(),
    isEmpty: Math.random() > 0.8,
  }));

  return (
    <div className="relative w-48 h-56 flex items-center justify-center">
      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.glow.healthy}20 0%, transparent 70%)`,
        }}
        animate={{
          opacity: isHovered ? 0.8 : 0.4,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Brain/memory visual */}
      <div className="relative">
        {/* Orbiting memory particles */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: i % 2 === 0 ? colors.glow.healthy : colors.glow.warning,
              left: '50%',
              top: '50%',
              marginLeft: -4,
              marginTop: -4,
            }}
            animate={{
              x: [
                Math.cos((i * Math.PI * 2) / 4) * 60,
                Math.cos((i * Math.PI * 2) / 4 + Math.PI) * 60,
                Math.cos((i * Math.PI * 2) / 4) * 60,
              ],
              y: [
                Math.sin((i * Math.PI * 2) / 4) * 40,
                Math.sin((i * Math.PI * 2) / 4 + Math.PI) * 40,
                Math.sin((i * Math.PI * 2) / 4) * 40,
              ],
              opacity: [0.6, 0.2, 0.6],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Buffer grid */}
        <motion.div
          className="grid grid-cols-4 gap-1.5 p-3 rounded-xl"
          style={{ background: `${colors.oceanDark}90` }}
          animate={{
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          {slots.map((slot, i) => (
            <motion.div
              key={slot.id}
              className="w-6 h-6 rounded"
              style={{
                background: slot.isEmpty
                  ? colors.oceanDark
                  : slot.heat > 0.7
                  ? colors.glow.healthy
                  : slot.heat > 0.4
                  ? colors.glow.warning
                  : colors.glow.critical,
                opacity: slot.isEmpty ? 0.3 : 0.3 + slot.heat * 0.7,
              }}
              animate={{
                opacity: slot.isEmpty
                  ? 0.3
                  : isHovered
                  ? 0.5 + slot.heat * 0.5
                  : 0.3 + slot.heat * 0.5,
                scale: isHovered && slot.heat > 0.7 ? [1, 1.1, 1] : 1,
              }}
              transition={{
                opacity: { duration: 0.3 },
                scale: {
                  duration: 1,
                  repeat: isHovered && slot.heat > 0.7 ? Infinity : 0,
                  delay: i * 0.05,
                },
              }}
            />
          ))}
        </motion.div>

        {/* Central brain icon overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          animate={{
            opacity: isHovered ? 0.3 : 0.15,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-16 h-16"
            fill="none"
            stroke={colors.glow.healthy}
            strokeWidth="0.5"
          >
            <path d="M12 2C9.5 2 7 3.5 7 6c0 1.5.5 2.5 1.5 3.5C7 10.5 6 12 6 14c0 2.5 1.5 4 3 5 0 1 .5 3 3 3s3-2 3-3c1.5-1 3-2.5 3-5 0-2-1-3.5-2.5-4.5C16.5 8.5 17 7.5 17 6c0-2.5-2.5-4-5-4z" />
          </svg>
        </motion.div>
      </div>

      {/* Breathing pulse effect */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{ border: `1px solid ${colors.glow.healthy}` }}
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Label */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-mono"
        style={{
          background: `${colors.oceanDark}90`,
          color: colors.glow.healthy,
          border: `1px solid ${colors.glow.healthy}30`,
        }}
        animate={{
          borderColor: isHovered ? `${colors.glow.healthy}60` : `${colors.glow.healthy}30`,
        }}
      >
        shared_buffers
      </motion.div>
    </div>
  );
}
