import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface Stage {
  id: string;
  name: string;
  description: string;
  color: string;
  details: string[];
}

const stages: Stage[] = [
  {
    id: 'parse',
    name: 'Parser',
    description: 'SQL → Parse Tree',
    color: colors.glow.healthy,
    details: [
      'Tokenizes the SQL string',
      'Validates syntax',
      'Builds abstract syntax tree',
    ],
  },
  {
    id: 'analyze',
    name: 'Analyzer',
    description: 'Names → OIDs',
    color: colors.glow.warning,
    details: [
      'Resolves table/column names',
      'Checks permissions',
      'Looks up system catalogs',
    ],
  },
  {
    id: 'rewrite',
    name: 'Rewriter',
    description: 'Apply Rules',
    color: colors.text.secondary,
    details: [
      'Applies view definitions',
      'Transforms rules',
      'Expands * to columns',
    ],
  },
  {
    id: 'plan',
    name: 'Planner',
    description: 'Generate Plans',
    color: colors.glow.critical,
    details: [
      'Generates possible paths',
      'Estimates costs using statistics',
      'Picks cheapest plan',
    ],
  },
  {
    id: 'execute',
    name: 'Executor',
    description: 'Run the Plan',
    color: colors.glow.healthy,
    details: [
      'Fetches pages from disk/buffer',
      'Applies filters',
      'Returns result rows',
    ],
  },
];

export function QueryLifecycle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStage, setActiveStage] = useState(-1);

  const runDemo = useCallback(() => {
    setIsPlaying(true);
    setActiveStage(0);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setActiveStage(-1);
  }, []);

  // Auto-advance stages
  useEffect(() => {
    if (!isPlaying || activeStage < 0) return;

    if (activeStage >= stages.length) {
      // Done
      return;
    }

    const timer = setTimeout(() => {
      setActiveStage((prev) => prev + 1);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isPlaying, activeStage]);

  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: colors.oceanDark,
        border: `1px solid ${colors.text.muted}20`,
      }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-medium" style={{ color: colors.text.primary }}>
            Query Lifecycle
          </h3>
          <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
            From SQL string to result rows
          </p>
        </div>

        <motion.button
          className="px-4 py-2 rounded-lg text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isPlaying ? reset : runDemo}
          style={{
            background: `${colors.glow.healthy}20`,
            color: colors.glow.healthy,
            border: `1px solid ${colors.glow.healthy}40`,
          }}
        >
          {isPlaying ? 'Reset' : 'Run Query'}
        </motion.button>
      </div>

      {/* Query Input */}
      <div
        className="p-3 rounded-lg mb-6 font-mono text-sm overflow-x-auto"
        style={{
          background: colors.ocean,
          border: `1px solid ${colors.text.muted}20`,
        }}
      >
        <motion.span
          animate={
            isPlaying && activeStage === 0
              ? { opacity: [1, 0.5, 1] }
              : {}
          }
          transition={{ duration: 0.3, repeat: activeStage === 0 ? Infinity : 0 }}
        >
          <span style={{ color: colors.glow.healthy }}>SELECT</span>
          <span style={{ color: colors.text.secondary }}> * </span>
          <span style={{ color: colors.glow.healthy }}>FROM</span>
          <span style={{ color: colors.text.secondary }}> users </span>
          <span style={{ color: colors.glow.healthy }}>WHERE</span>
          <span style={{ color: colors.text.secondary }}> email = </span>
          <span style={{ color: colors.glow.warning }}>'alice@example.com'</span>
        </motion.span>
      </div>

      {/* Pipeline Visualization */}
      <div className="relative">
        {/* Stages */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-2 justify-between">
          {stages.map((stage, i) => {
            const isActive = activeStage === i;
            const isPast = activeStage > i;
            const isFuture = activeStage < i;

            return (
              <motion.div
                key={stage.id}
                className="flex-1 relative"
                initial={{ opacity: 0.5 }}
                animate={{
                  opacity: isFuture && isPlaying ? 0.3 : 1,
                }}
              >
                {/* Arrow connecting to next (desktop) */}
                {i < stages.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                    <motion.div
                      className="w-4 h-4"
                      style={{
                        borderTop: `2px solid ${isPast ? colors.glow.healthy : colors.text.muted}40`,
                        borderRight: `2px solid ${isPast ? colors.glow.healthy : colors.text.muted}40`,
                        transform: 'rotate(45deg)',
                      }}
                      animate={
                        isActive
                          ? {
                              borderColor: [
                                `${colors.text.muted}40`,
                                stage.color,
                                `${colors.text.muted}40`,
                              ],
                            }
                          : {}
                      }
                      transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
                    />
                  </div>
                )}

                <motion.div
                  className="p-4 rounded-lg text-center h-full"
                  style={{
                    background: isActive
                      ? `${stage.color}20`
                      : isPast
                      ? colors.oceanLight
                      : colors.ocean,
                    border: `2px solid ${
                      isActive ? stage.color : isPast ? colors.glow.healthy : colors.text.muted
                    }40`,
                  }}
                  animate={isActive ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
                >
                  <div
                    className="text-xs uppercase tracking-wider mb-1"
                    style={{ color: colors.text.muted }}
                  >
                    Stage {i + 1}
                  </div>
                  <div
                    className="font-medium mb-1"
                    style={{ color: isActive ? stage.color : colors.text.primary }}
                  >
                    {stage.name}
                  </div>
                  <div className="text-xs" style={{ color: colors.text.muted }}>
                    {stage.description}
                  </div>

                  {/* Checkmark for completed */}
                  {isPast && (
                    <motion.div
                      className="absolute top-2 right-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <span style={{ color: colors.glow.healthy }}>✓</span>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Active stage details */}
        <AnimatePresence mode="wait">
          {isPlaying && activeStage >= 0 && activeStage < stages.length && (
            <motion.div
              key={activeStage}
              className="mt-6 p-4 rounded-lg"
              style={{
                background: colors.ocean,
                border: `1px solid ${stages[activeStage].color}40`,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: `${stages[activeStage].color}20` }}
                >
                  <motion.div
                    className="w-3 h-3 rounded-full"
                    style={{ background: stages[activeStage].color }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                </div>
                <div>
                  <div className="font-medium" style={{ color: stages[activeStage].color }}>
                    {stages[activeStage].name}
                  </div>
                  <div className="text-sm" style={{ color: colors.text.muted }}>
                    {stages[activeStage].description}
                  </div>
                </div>
              </div>

              <ul className="space-y-1 text-sm">
                {stages[activeStage].details.map((detail, i) => (
                  <motion.li
                    key={i}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <span style={{ color: stages[activeStage].color }}>•</span>
                    <span style={{ color: colors.text.secondary }}>{detail}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion message */}
        <AnimatePresence>
          {activeStage >= stages.length && (
            <motion.div
              className="mt-6 p-4 rounded-lg text-center"
              style={{
                background: `${colors.glow.healthy}10`,
                border: `1px solid ${colors.glow.healthy}40`,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="font-medium" style={{ color: colors.glow.healthy }}>
                Query Complete
              </p>
              <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
                Result: 1 row returned
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Key insight */}
      <div
        className="mt-6 p-4 rounded-lg text-sm"
        style={{ background: colors.ocean }}
      >
        <p style={{ color: colors.text.secondary }}>
          <span style={{ color: colors.glow.critical }}>The Planner</span> is where strategy
          decisions happen. It estimates costs and picks the cheapest path.
        </p>
        <p className="mt-2" style={{ color: colors.text.muted }}>
          Bad statistics = bad cost estimates = wrong plan choice.
        </p>
      </div>
    </div>
  );
}
