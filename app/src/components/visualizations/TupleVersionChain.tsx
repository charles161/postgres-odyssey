import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface TupleVersion {
  id: number;
  xmin: number;
  xmax: number | null; // null = infinity (still alive)
  data: {
    name: string;
    balance: number;
  };
  status: 'dead' | 'alive' | 'in-flight';
  createdBy: string;
}

const VERSIONS: TupleVersion[] = [
  {
    id: 1,
    xmin: 100,
    xmax: 150,
    data: { name: 'Alice', balance: 1000 },
    status: 'dead',
    createdBy: 'INSERT',
  },
  {
    id: 2,
    xmin: 150,
    xmax: 200,
    data: { name: 'Alice', balance: 1500 },
    status: 'dead',
    createdBy: 'UPDATE (added $500)',
  },
  {
    id: 3,
    xmin: 200,
    xmax: 275,
    data: { name: 'Alice', balance: 2000 },
    status: 'dead',
    createdBy: 'UPDATE (added $500)',
  },
  {
    id: 4,
    xmin: 275,
    xmax: null,
    data: { name: 'Alice', balance: 2500 },
    status: 'alive',
    createdBy: 'UPDATE (added $500)',
  },
];

const getStatusColor = (status: TupleVersion['status']) => {
  switch (status) {
    case 'alive':
      return colors.glow.healthy;
    case 'dead':
      return '#4a4a6a';
    case 'in-flight':
      return colors.glow.warning;
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export function TupleVersionChain() {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [hoveredVersion, setHoveredVersion] = useState<number | null>(null);

  const selectedData = selectedVersion !== null ? VERSIONS.find((v) => v.id === selectedVersion) : null;

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      style={{ minHeight: 400 }}
    >
      {/* Left: Version chain */}
      <div
        className="rounded-xl p-6"
        style={{
          background: colors.oceanDark,
          border: `1px solid ${colors.glow.healthy}20`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className="font-mono text-sm uppercase tracking-wider"
            style={{ color: colors.text.muted }}
          >
            Row: accounts WHERE id = 1
          </h3>
          <span className="text-xs" style={{ color: colors.text.muted }}>
            4 versions exist
          </span>
        </div>

        {/* Version stack */}
        <div className="space-y-3">
          {VERSIONS.map((version, index) => {
            const isSelected = selectedVersion === version.id;
            const isHovered = hoveredVersion === version.id;
            const statusColor = getStatusColor(version.status);

            return (
              <motion.div
                key={version.id}
                custom={index}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative cursor-pointer focus-ring"
                tabIndex={0}
                role="button"
                aria-label={`Tuple version ${version.id}: ${version.status}`}
                aria-pressed={isSelected}
                onClick={() => setSelectedVersion(isSelected ? null : version.id)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedVersion(isSelected ? null : version.id)}
                onMouseEnter={() => setHoveredVersion(version.id)}
                onMouseLeave={() => setHoveredVersion(null)}
                onFocus={() => setHoveredVersion(version.id)}
                onBlur={() => setHoveredVersion(null)}
              >
                <motion.div
                  className="p-4 rounded-lg relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${colors.oceanLight} 0%, ${statusColor}08 100%)`,
                    border: `2px solid ${isSelected || isHovered ? statusColor : statusColor + '40'}`,
                    boxShadow: isSelected
                      ? `0 0 20px ${statusColor}30`
                      : isHovered
                      ? `0 0 10px ${statusColor}20`
                      : 'none',
                  }}
                  animate={{
                    scale: isHovered ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Status indicator */}
                  <div
                    className="absolute top-0 left-0 w-1 h-full"
                    style={{ background: statusColor }}
                  />

                  {/* Content */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Version number */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm"
                        style={{
                          background: statusColor + '20',
                          color: statusColor,
                        }}
                      >
                        {version.id}
                      </div>

                      {/* Data preview */}
                      <div>
                        <div
                          className="font-mono text-sm"
                          style={{ color: colors.text.primary }}
                        >
                          balance = ${version.data.balance.toLocaleString()}
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: colors.text.muted }}
                        >
                          {version.createdBy}
                        </div>
                      </div>
                    </div>

                    {/* xmin/xmax badges */}
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <div
                        className="px-2 py-1 rounded"
                        style={{
                          background: colors.glow.healthy + '20',
                          color: colors.glow.healthy,
                        }}
                      >
                        xmin={version.xmin}
                      </div>
                      <div
                        className="px-2 py-1 rounded"
                        style={{
                          background:
                            version.xmax === null
                              ? colors.text.muted + '20'
                              : colors.glow.critical + '20',
                          color:
                            version.xmax === null
                              ? colors.text.muted
                              : colors.glow.critical,
                        }}
                      >
                        xmax={version.xmax ?? '∞'}
                      </div>
                    </div>
                  </div>

                  {/* Status label */}
                  <div
                    className="absolute top-2 right-2 text-xs uppercase tracking-wider"
                    style={{ color: statusColor }}
                  >
                    {version.status}
                  </div>
                </motion.div>

                {/* Arrow connecting versions */}
                {index < VERSIONS.length - 1 && (
                  <div
                    className="absolute left-6 -bottom-3 w-0.5 h-3"
                    style={{ background: colors.text.muted + '40' }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Right: Detail panel */}
      <div className="lg:sticky lg:top-8">
        <AnimatePresence mode="wait">
          {selectedData ? (
            <motion.div
              key={selectedData.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${colors.oceanLight} 0%, ${getStatusColor(selectedData.status)}08 100%)`,
                border: `2px solid ${getStatusColor(selectedData.status)}40`,
              }}
            >
              {/* Header */}
              <div
                className="p-4 border-b"
                style={{ borderColor: getStatusColor(selectedData.status) + '20' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-mono text-xl"
                    style={{
                      background: getStatusColor(selectedData.status) + '20',
                      color: getStatusColor(selectedData.status),
                    }}
                  >
                    v{selectedData.id}
                  </div>
                  <div>
                    <h4
                      className="font-medium text-lg"
                      style={{ color: getStatusColor(selectedData.status) }}
                    >
                      Version {selectedData.id}
                    </h4>
                    <p className="text-xs" style={{ color: colors.text.muted }}>
                      {selectedData.status === 'alive'
                        ? 'Currently visible to new transactions'
                        : selectedData.status === 'dead'
                        ? 'Only visible to older transactions'
                        : 'Transaction still in progress'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 space-y-4">
                {/* Visibility range */}
                <div>
                  <p
                    className="text-xs font-mono uppercase tracking-wider mb-2"
                    style={{ color: colors.text.muted }}
                  >
                    Visible To
                  </p>
                  <p className="text-sm" style={{ color: colors.text.secondary }}>
                    Transactions {selectedData.xmin} through{' '}
                    {selectedData.xmax ? selectedData.xmax - 1 : '∞'}
                  </p>
                </div>

                {/* Tuple data */}
                <div>
                  <p
                    className="text-xs font-mono uppercase tracking-wider mb-2"
                    style={{ color: colors.text.muted }}
                  >
                    Tuple Data
                  </p>
                  <div
                    className="p-3 rounded-lg font-mono text-sm space-y-1"
                    style={{ background: colors.oceanDark }}
                  >
                    <div style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.healthy }}>name:</span>{' '}
                      '{selectedData.data.name}'
                    </div>
                    <div style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.healthy }}>balance:</span>{' '}
                      {selectedData.data.balance}
                    </div>
                  </div>
                </div>

                {/* Transaction info */}
                <div>
                  <p
                    className="text-xs font-mono uppercase tracking-wider mb-2"
                    style={{ color: colors.text.muted }}
                  >
                    System Columns
                  </p>
                  <div
                    className="p-3 rounded-lg font-mono text-sm space-y-1"
                    style={{ background: colors.oceanDark }}
                  >
                    <div style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.healthy }}>xmin:</span>{' '}
                      {selectedData.xmin}{' '}
                      <span style={{ color: colors.text.muted }}>
                        (created by TXN {selectedData.xmin})
                      </span>
                    </div>
                    <div style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.critical }}>xmax:</span>{' '}
                      {selectedData.xmax ?? '0'}{' '}
                      <span style={{ color: colors.text.muted }}>
                        ({selectedData.xmax ? `deleted by TXN ${selectedData.xmax}` : 'still alive'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{
                    background: getStatusColor(selectedData.status) + '10',
                    color: colors.text.secondary,
                  }}
                >
                  {selectedData.status === 'alive' ? (
                    <>
                      This is the <strong>current live version</strong>. Any new
                      transaction will see this data.
                    </>
                  ) : (
                    <>
                      This version is <strong>dead</strong> — it was superseded by
                      version {selectedData.id + 1}. Only transactions that started
                      between {selectedData.xmin} and {selectedData.xmax! - 1} would
                      see this value.
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl p-8 text-center"
              style={{
                background: colors.oceanLight,
                border: `1px dashed ${colors.text.muted}40`,
              }}
            >
              <p style={{ color: colors.text.muted }}>
                Click a version to see its details
              </p>
              <p className="text-sm mt-2" style={{ color: colors.text.muted }}>
                Each version has different xmin/xmax values that determine which
                transactions can see it.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
