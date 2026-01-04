import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

interface FieldInfo {
  id: string;
  label: string;
  value: string;
  color: string;
  title: string;
  description: string;
  analogy: string;
  detail: string;
}

const tupleFields: FieldInfo[] = [
  {
    id: 't_xmin',
    label: 't_xmin',
    value: '1847293',
    color: colors.glow.healthy,
    title: 'Birth Certificate',
    description: 'The transaction ID that created this row.',
    analogy: 'Like a birth certificate number—proves when and by whom this data came into existence.',
    detail: 'Every transaction in Postgres gets a unique, ever-increasing ID. When you INSERT a row, that transaction\'s ID is stamped here forever.',
  },
  {
    id: 't_xmax',
    label: 't_xmax',
    value: '0',
    color: colors.glow.warning,
    title: 'Death Certificate',
    description: 'The transaction ID that deleted or updated this row. 0 = still alive.',
    analogy: 'When someone DELETEs or UPDATEs this row, their transaction ID gets stamped here—marking the moment this version "died."',
    detail: 'If t_xmax ≠ 0, check t_ctid: if it points elsewhere, that\'s where the new version lives (UPDATE). If it points to itself, the row was DELETEd with no successor.',
  },
  {
    id: 't_ctid',
    label: 't_ctid',
    value: '(42, 7)',
    color: colors.glow.healthy,
    title: 'Home Address',
    description: 'Physical location on disk: page 42, slot 7. Also serves as a "forwarding address."',
    analogy: '"Building 42, Apartment 7" — the page is an 8KB block, the slot is which row within that block.',
    detail: 'Points to itself when current. But after an UPDATE, the old tuple\'s t_ctid points to the NEW version\'s location. So: t_xmax ≠ 0 + t_ctid points elsewhere = "follow this address to find the updated row."',
  },
];

const userData = [
  { key: 'id', value: '42', type: 'number' },
  { key: 'name', value: "'Alice'", type: 'string' },
  { key: 'email', value: "'alice@example.com'", type: 'string' },
  { key: 'created_at', value: '2024-01-15', type: 'date' },
];

const panelVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    filter: 'blur(4px)',
    transition: { duration: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function InteractiveTuple() {
  // Default to t_xmin selected
  const [activeField, setActiveField] = useState<string>('t_xmin');
  const [showUserData, setShowUserData] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isMobile = useIsMobile();

  const activeInfo = tupleFields.find((f) => f.id === activeField);

  return (
    <div
      ref={containerRef}
      className="relative gap-6 items-start"
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 360px',
      }}
    >
      {/* Left: Tuple card */}
      <div
        className="rounded-xl overflow-hidden border-2 transition-all duration-300"
        style={{
          borderColor: activeInfo ? activeInfo.color + '40' : colors.glow.healthy + '30',
          background: colors.oceanDark,
        }}
      >
        {/* Header fields */}
        <div
          className="p-4 border-b transition-all duration-300"
          style={{
            background: activeInfo
              ? `linear-gradient(135deg, ${colors.oceanDark} 0%, ${activeInfo.color}08 100%)`
              : colors.oceanDark,
            borderColor: colors.glow.healthy + '20',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs font-mono uppercase tracking-wider"
              style={{ color: colors.glow.healthy }}
            >
              Tuple Header
            </span>
            <span className="text-xs" style={{ color: colors.text.muted }}>
              23 bytes · invisible to queries
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {tupleFields.map((field) => (
              <motion.button
                key={field.id}
                ref={(el) => {
                  fieldRefs.current[field.id] = el;
                }}
                className="relative px-4 py-3 rounded-lg font-mono text-sm text-left transition-all"
                style={{
                  background:
                    activeField === field.id ? field.color + '15' : colors.ocean,
                  border: `2px solid ${activeField === field.id ? field.color + '60' : 'transparent'}`,
                  boxShadow:
                    activeField === field.id
                      ? `0 0 24px ${field.color}25, inset 0 1px 0 rgba(255,255,255,0.05)`
                      : 'none',
                }}
                onClick={() => setActiveField(field.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <span style={{ color: field.color }}>{field.label}</span>
                <span style={{ color: colors.text.muted }}>=</span>
                <span style={{ color: colors.text.primary }}>{field.value}</span>

                {/* Pulse indicator when active */}
                {activeField === field.id && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                    style={{ background: field.color }}
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [1, 0.6, 1],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* User data section */}
        <div
          className="p-4 cursor-pointer transition-all duration-200"
          onClick={() => setShowUserData(!showUserData)}
          style={{
            background: showUserData
              ? `linear-gradient(135deg, ${colors.oceanDark} 0%, ${colors.glow.healthy}05 100%)`
              : 'transparent',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-mono uppercase tracking-wider"
              style={{ color: colors.text.primary }}
            >
              Your Data
            </span>
            <motion.span
              className="text-xs"
              style={{ color: colors.text.muted }}
              animate={{ opacity: showUserData ? 1 : 0.6 }}
            >
              {showUserData ? 'Click to collapse' : 'Click to explore →'}
            </motion.span>
          </div>

          <AnimatePresence mode="wait">
            {showUserData ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5"
              >
                {userData.map((item, index) => (
                  <motion.div
                    key={item.key}
                    className="flex items-center gap-3 p-2 rounded"
                    style={{ background: colors.ocean }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <span
                      className="text-xs font-mono w-24"
                      style={{ color: colors.text.muted }}
                    >
                      {item.key}
                    </span>
                    <span
                      className="font-mono text-sm"
                      style={{
                        color:
                          item.type === 'string'
                            ? colors.glow.healthy
                            : item.type === 'number'
                            ? colors.text.primary
                            : colors.text.secondary,
                      }}
                    >
                      {item.value}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-sm truncate"
                style={{ color: colors.text.secondary }}
              >
                {`{ id: 42, name: 'Alice', email: '...', ... }`}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Floating explanation panel */}
      <div style={isMobile ? {} : { position: 'sticky', top: '2rem' }}>
        <AnimatePresence mode="wait">
          {activeInfo && (
            <motion.div
              key={activeInfo.id}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="rounded-xl border-l-[3px] overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${colors.oceanLight} 0%, ${activeInfo.color}05 100%)`,
                borderColor: activeInfo.color,
                boxShadow: `
                  inset 4px 0 20px -10px ${activeInfo.color}40,
                  0 0 40px -15px ${activeInfo.color}30
                `,
              }}
            >
            {/* Breathing glow animation */}
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-xl"
              animate={{
                boxShadow: [
                  `inset 0 0 30px -15px ${activeInfo.color}20`,
                  `inset 0 0 50px -15px ${activeInfo.color}35`,
                  `inset 0 0 30px -15px ${activeInfo.color}20`,
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative p-5">
              {/* Icon and title */}
              <motion.div variants={itemVariants} className="flex items-center gap-3 mb-4">
                <motion.div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: activeInfo.color + '20' }}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.15,
                  }}
                >
                  {activeInfo.id === 't_xmin' && '🎂'}
                  {activeInfo.id === 't_xmax' && '💀'}
                  {activeInfo.id === 't_ctid' && '📍'}
                </motion.div>
                <div>
                  <h4 className="font-semibold text-lg" style={{ color: activeInfo.color }}>
                    {activeInfo.title}
                  </h4>
                  <p className="text-xs font-mono" style={{ color: colors.text.muted }}>
                    {activeInfo.label} = {activeInfo.value}
                  </p>
                </div>
              </motion.div>

              {/* Description */}
              <motion.p
                variants={itemVariants}
                className="text-sm leading-relaxed mb-4"
                style={{ color: colors.text.secondary }}
              >
                {activeInfo.description}
              </motion.p>

              {/* Analogy callout */}
              <motion.div
                variants={itemVariants}
                className="p-3 rounded-lg mb-4 border-l-2"
                style={{
                  background: colors.oceanDark,
                  borderColor: activeInfo.color + '80',
                }}
              >
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  <span style={{ color: activeInfo.color }}>💡</span>{' '}
                  <span className="italic">{activeInfo.analogy}</span>
                </p>
              </motion.div>

              {/* Technical detail */}
              <motion.p
                variants={itemVariants}
                className="text-xs leading-relaxed"
                style={{ color: colors.text.muted }}
              >
                {activeInfo.detail}
              </motion.p>
            </div>
          </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
