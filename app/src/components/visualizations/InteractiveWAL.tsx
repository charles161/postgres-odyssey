import { useState, useEffect } from 'react';
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

interface WALRecordInfo {
  id: string;
  type: string;
  lsn: string;
  color: string;
  icon: string;
  title: string;
  description: string;
  analogy: string;
  detail: string;
  contents: string[];
}

const walRecords: WALRecordInfo[] = [
  {
    id: 'insert',
    type: 'INSERT',
    lsn: '0/1A3B4C0',
    color: colors.glow.healthy,
    icon: '📝',
    title: 'Birth Record',
    description: 'Logs the creation of a new row with all its data.',
    analogy: 'Like a hospital recording a birth—the exact moment, location, and all vital details are captured.',
    detail: 'Contains: transaction ID, table identifier, tuple data (the actual row contents), and the target location (page, slot).',
    contents: ['xid: 1847293', 'rel: users', 'data: (42, Alice, ...)', 'target: (42, 7)'],
  },
  {
    id: 'update',
    type: 'UPDATE',
    lsn: '0/1A3B5D8',
    color: colors.glow.warning,
    icon: '✏️',
    title: 'Amendment Record',
    description: 'Logs both the old and new version of the modified row.',
    analogy: 'Like a legal amendment—we keep the original text AND the revision, so we can reconstruct either.',
    detail: 'Contains: transaction ID, old tuple location, new tuple location, and the changed data. This is why UPDATEs create new tuple versions!',
    contents: ['xid: 1847295', 'old: (42, 7)', 'new: (42, 9)', 'data: email changed'],
  },
  {
    id: 'commit',
    type: 'COMMIT',
    lsn: '0/1A3B6F0',
    color: colors.glow.critical,
    icon: '✅',
    title: 'The Promise Kept',
    description: 'Marks that a transaction successfully completed.',
    analogy: 'Like a notary stamp—once this record hits disk, the transaction is officially permanent. No take-backs.',
    detail: 'This is the "D" in ACID (Durability). After COMMIT is written to WAL and fsynced, even a crash won\'t lose your data.',
    contents: ['xid: 1847295', 'timestamp: 2024-01-15 14:32:01', 'status: committed'],
  },
  {
    id: 'checkpoint',
    type: 'CHECKPOINT',
    lsn: '0/1A40000',
    color: '#8b5cf6',
    icon: '💾',
    title: 'Save Point',
    description: 'Marks a moment when all dirty data was flushed to disk.',
    analogy: 'Like saving your game—everything before this point is safely stored. Recovery only needs to replay from here.',
    detail: 'Records: the redo point (where recovery should start), and confirms all buffers have been written to data files.',
    contents: ['redo: 0/1A3F000', 'time: 2024-01-15 14:35:00', 'buffers flushed: 1,247'],
  },
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

export function InteractiveWAL() {
  const [activeRecord, setActiveRecord] = useState<string>('insert');
  const isMobile = useIsMobile();

  const activeInfo = walRecords.find((r) => r.id === activeRecord);

  return (
    <div
      className="relative gap-6 items-start"
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 380px',
      }}
    >
      {/* Left: WAL stream visualization */}
      <div
        className="rounded-xl overflow-hidden border-2 transition-all duration-300"
        style={{
          borderColor: activeInfo ? activeInfo.color + '40' : colors.glow.critical + '30',
          background: colors.oceanDark,
        }}
      >
        {/* Header */}
        <div
          className="p-4 border-b"
          style={{
            background: `linear-gradient(135deg, ${colors.oceanDark} 0%, ${colors.glow.critical}08 100%)`,
            borderColor: colors.glow.critical + '20',
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-xs font-mono uppercase tracking-wider"
              style={{ color: colors.glow.critical }}
            >
              WAL Stream
            </span>
            <span className="text-xs" style={{ color: colors.text.muted }}>
              pg_wal/000000010000000000000001
            </span>
          </div>
          <p className="text-sm" style={{ color: colors.text.muted }}>
            Sequential log of all changes — click any record to explore
          </p>
        </div>

        {/* WAL Records */}
        <div className="p-4 space-y-2">
          {walRecords.map((record, index) => (
            <motion.button
              key={record.id}
              className="w-full p-4 rounded-lg text-left transition-all relative overflow-hidden"
              style={{
                background:
                  activeRecord === record.id ? record.color + '15' : colors.ocean,
                border: `2px solid ${activeRecord === record.id ? record.color + '60' : 'transparent'}`,
                boxShadow:
                  activeRecord === record.id
                    ? `0 0 24px ${record.color}25, inset 0 1px 0 rgba(255,255,255,0.05)`
                    : 'none',
              }}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.15,
                ease: [0.22, 1, 0.36, 1] as const,
              }}
              onClick={() => setActiveRecord(record.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Connection line to next record with pulse */}
              {index < walRecords.length - 1 && (
                <motion.div
                  className="absolute left-7 bottom-0 w-0.5 h-4 translate-y-full overflow-hidden"
                  style={{ background: colors.glow.critical + '20' }}
                >
                  <motion.div
                    className="w-full h-full"
                    style={{ background: colors.glow.critical }}
                    animate={{
                      y: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: index * 0.3,
                      ease: 'linear',
                    }}
                  />
                </motion.div>
              )}

              <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: record.color + '20' }}
                >
                  {record.icon}
                </div>

                {/* Record info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-mono text-sm font-medium"
                      style={{ color: record.color }}
                    >
                      {record.type}
                    </span>
                    <span
                      className="text-xs font-mono"
                      style={{ color: colors.text.muted }}
                    >
                      LSN: {record.lsn}
                    </span>
                  </div>
                  <p
                    className="text-sm truncate"
                    style={{ color: colors.text.secondary }}
                  >
                    {record.contents[0]}
                  </p>
                </div>

                {/* Active indicator */}
                {activeRecord === record.id && (
                  <motion.div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: record.color }}
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [1, 0.6, 1],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Footer */}
        <div
          className="p-3 border-t text-center"
          style={{ borderColor: colors.glow.critical + '20' }}
        >
          <span className="text-xs font-mono" style={{ color: colors.text.muted }}>
            → more records follow...
          </span>
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
              {/* Breathing glow */}
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
                    {activeInfo.icon}
                  </motion.div>
                  <div>
                    <h4 className="font-semibold text-lg" style={{ color: activeInfo.color }}>
                      {activeInfo.title}
                    </h4>
                    <p className="text-xs font-mono" style={{ color: colors.text.muted }}>
                      {activeInfo.type} @ {activeInfo.lsn}
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

                {/* Record contents */}
                <motion.div variants={itemVariants} className="mb-4">
                  <p
                    className="text-xs font-mono uppercase tracking-wider mb-2"
                    style={{ color: colors.text.muted }}
                  >
                    Record Contents
                  </p>
                  <div
                    className="p-3 rounded-lg font-mono text-xs space-y-1"
                    style={{ background: colors.oceanDark }}
                  >
                    {activeInfo.contents.map((line, i) => (
                      <div key={i} style={{ color: colors.text.secondary }}>
                        {line}
                      </div>
                    ))}
                  </div>
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
