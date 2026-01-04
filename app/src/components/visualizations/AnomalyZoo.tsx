import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface Anomaly {
  id: string;
  name: string;
  description: string;
  scenario: string[];
  problem: string;
  preventedBy: string[];
}

const anomalies: Anomaly[] = [
  {
    id: 'dirty-read',
    name: 'Dirty Read',
    description: 'Reading uncommitted changes from another transaction',
    scenario: [
      'T1: UPDATE accounts SET balance = 0 WHERE id = 1',
      'T2: SELECT balance FROM accounts WHERE id = 1  → 0',
      'T1: ROLLBACK',
      'T2 saw data that never existed!',
    ],
    problem: "T2 made a decision based on T1's changes, but T1 rolled back.",
    preventedBy: ['READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'],
  },
  {
    id: 'non-repeatable-read',
    name: 'Non-Repeatable Read',
    description: 'Same query returns different results within one transaction',
    scenario: [
      'T1: SELECT balance FROM accounts WHERE id = 1  → $1000',
      'T2: UPDATE accounts SET balance = 500 WHERE id = 1; COMMIT',
      'T1: SELECT balance FROM accounts WHERE id = 1  → $500',
      'T1 got different answers for the same query!',
    ],
    problem: 'T1 cannot trust that data stays consistent during its execution.',
    preventedBy: ['REPEATABLE READ', 'SERIALIZABLE'],
  },
  {
    id: 'phantom-read',
    name: 'Phantom Read',
    description: 'New rows appear in repeated queries',
    scenario: [
      'T1: SELECT COUNT(*) FROM orders WHERE status = "pending"  → 10',
      'T2: INSERT INTO orders (status) VALUES ("pending"); COMMIT',
      'T1: SELECT COUNT(*) FROM orders WHERE status = "pending"  → 11',
      'A phantom row appeared!',
    ],
    problem: 'T1 cannot trust that the SET of matching rows stays the same.',
    preventedBy: ['SERIALIZABLE'],
  },
];

export function AnomalyZoo() {
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [step, setStep] = useState(0);
  const [_isPlaying, setIsPlaying] = useState(false);

  const playScenario = useCallback((anomaly: Anomaly) => {
    setSelectedAnomaly(anomaly);
    setStep(0);
    setIsPlaying(true);
  }, []);

  const nextStep = useCallback(() => {
    if (!selectedAnomaly) return;
    if (step < selectedAnomaly.scenario.length - 1) {
      setStep((s) => s + 1);
    } else {
      setIsPlaying(false);
    }
  }, [selectedAnomaly, step]);

  const reset = useCallback(() => {
    setSelectedAnomaly(null);
    setStep(0);
    setIsPlaying(false);
  }, []);

  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: colors.oceanDark,
        border: `1px solid ${colors.text.muted}20`,
      }}
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-medium" style={{ color: colors.text.primary }}>
          The Anomaly Zoo
        </h3>
        <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
          What can go wrong when transactions don't isolate properly
        </p>
      </div>

      {/* Anomaly Cards */}
      {!selectedAnomaly && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {anomalies.map((anomaly) => (
            <motion.button
              key={anomaly.id}
              className="p-4 rounded-lg text-left"
              style={{
                background: colors.ocean,
                border: `1px solid ${colors.text.muted}40`,
              }}
              whileHover={{
                scale: 1.02,
                borderColor: colors.glow.warning,
              }}
              onClick={() => playScenario(anomaly)}
            >
              <h4 className="font-medium mb-2" style={{ color: colors.glow.warning }}>
                {anomaly.name}
              </h4>
              <p className="text-sm" style={{ color: colors.text.muted }}>
                {anomaly.description}
              </p>
              <div className="mt-3 flex gap-1 flex-wrap">
                {anomaly.preventedBy.map((level) => (
                  <span
                    key={level}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: `${colors.glow.healthy}20`,
                      color: colors.glow.healthy,
                    }}
                  >
                    {level}
                  </span>
                ))}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Scenario Player */}
      <AnimatePresence>
        {selectedAnomaly && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="font-medium" style={{ color: colors.glow.warning }}>
                  {selectedAnomaly.name}
                </h4>
                <p className="text-sm" style={{ color: colors.text.muted }}>
                  {selectedAnomaly.description}
                </p>
              </div>
              <motion.button
                className="px-3 py-1 rounded text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={reset}
                style={{
                  background: colors.ocean,
                  color: colors.text.secondary,
                  border: `1px solid ${colors.text.muted}40`,
                }}
              >
                Back
              </motion.button>
            </div>

            {/* Timeline */}
            <div className="space-y-3 mb-6">
              {selectedAnomaly.scenario.map((line, i) => {
                const isT1 = line.startsWith('T1:');
                const isT2 = line.startsWith('T2:');
                const isVisible = i <= step;
                const isCurrent = i === step;
                const isComment = !isT1 && !isT2;

                return (
                  <motion.div
                    key={i}
                    className="flex gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{
                      opacity: isVisible ? 1 : 0.2,
                      x: 0,
                    }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {/* Transaction indicator */}
                    {!isComment && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isT1
                            ? `${colors.glow.healthy}20`
                            : `${colors.glow.warning}20`,
                          border: `2px solid ${isT1 ? colors.glow.healthy : colors.glow.warning}${
                            isCurrent ? '' : '40'
                          }`,
                        }}
                      >
                        <span
                          className="text-xs font-bold"
                          style={{
                            color: isT1 ? colors.glow.healthy : colors.glow.warning,
                          }}
                        >
                          {isT1 ? 'T1' : 'T2'}
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <motion.div
                      className={`flex-1 p-3 rounded-lg font-mono text-sm ${
                        isComment ? 'text-center' : ''
                      }`}
                      style={{
                        background: isCurrent
                          ? isComment
                            ? `${colors.glow.critical}20`
                            : colors.oceanLight
                          : colors.ocean,
                        border: isCurrent
                          ? `2px solid ${isComment ? colors.glow.critical : colors.text.muted}`
                          : '2px solid transparent',
                        color: isComment ? colors.glow.critical : colors.text.secondary,
                        marginLeft: isComment ? 44 : 0,
                      }}
                      animate={
                        isCurrent
                          ? {
                              boxShadow: [
                                '0 0 0 rgba(255,255,255,0)',
                                '0 0 20px rgba(255,255,255,0.1)',
                                '0 0 0 rgba(255,255,255,0)',
                              ],
                            }
                          : {}
                      }
                      transition={{ duration: 1, repeat: isCurrent ? Infinity : 0 }}
                    >
                      {isComment ? line : line.substring(4)}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 mb-6">
              <motion.button
                className="px-6 py-2 rounded-lg text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextStep}
                disabled={step >= selectedAnomaly.scenario.length - 1}
                style={{
                  background:
                    step >= selectedAnomaly.scenario.length - 1
                      ? colors.oceanLight
                      : `${colors.glow.healthy}20`,
                  color:
                    step >= selectedAnomaly.scenario.length - 1
                      ? colors.text.muted
                      : colors.glow.healthy,
                  border: `1px solid ${
                    step >= selectedAnomaly.scenario.length - 1
                      ? colors.text.muted
                      : colors.glow.healthy
                  }40`,
                  cursor:
                    step >= selectedAnomaly.scenario.length - 1 ? 'not-allowed' : 'pointer',
                }}
              >
                {step >= selectedAnomaly.scenario.length - 1 ? 'Complete' : 'Next Step'}
              </motion.button>
            </div>

            {/* Problem explanation */}
            <AnimatePresence>
              {step >= selectedAnomaly.scenario.length - 1 && (
                <motion.div
                  className="p-4 rounded-lg"
                  style={{
                    background: `${colors.glow.critical}10`,
                    border: `1px solid ${colors.glow.critical}40`,
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="font-medium mb-2" style={{ color: colors.glow.critical }}>
                    The Problem
                  </p>
                  <p className="text-sm" style={{ color: colors.text.secondary }}>
                    {selectedAnomaly.problem}
                  </p>

                  <div className="mt-4">
                    <p className="text-sm mb-2" style={{ color: colors.text.muted }}>
                      Prevented by:
                    </p>
                    <div className="flex gap-2">
                      {selectedAnomaly.preventedBy.map((level) => (
                        <span
                          key={level}
                          className="px-3 py-1 rounded text-sm"
                          style={{
                            background: `${colors.glow.healthy}20`,
                            color: colors.glow.healthy,
                          }}
                        >
                          {level}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
