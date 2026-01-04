import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface Step {
  id: string;
  title: string;
  description: string;
  detail: string;
}

const STEPS: Step[] = [
  {
    id: 'scan',
    title: '1. Scan',
    description: 'VACUUM reads each page, identifying dead tuples',
    detail: 'Checks xmax against all active transactions. If no transaction can see a tuple, it\'s dead.',
  },
  {
    id: 'mark',
    title: '2. Mark',
    description: 'Dead tuple space is marked as reusable',
    detail: 'Space isn\'t returned to OS—it\'s just available for new tuples. Table size doesn\'t shrink.',
  },
  {
    id: 'freeze',
    title: '3. Freeze',
    description: 'Old tuples get a special "frozen" transaction ID',
    detail: 'FrozenXID (value: 2) means "visible to everyone, forever." Prevents transaction ID wraparound.',
  },
  {
    id: 'fsm',
    title: '4. Update FSM',
    description: 'Free Space Map updated with available space',
    detail: 'FSM tells PostgreSQL where to put new tuples. Without this, INSERTs would scan entire table.',
  },
  {
    id: 'vm',
    title: '5. Update VM',
    description: 'Visibility Map marks all-visible pages',
    detail: 'Pages with no dead tuples are "all-visible." Enables index-only scans—a huge performance win.',
  },
];

interface TupleVisualization {
  id: number;
  x: number;
  y: number;
  isDead: boolean;
  isFrozen: boolean;
  isHighlighted: boolean;
}

export function VacuumProcess() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Generate sample tuples for visualization
  const generateTuples = (): TupleVisualization[] => {
    const tuples: TupleVisualization[] = [];
    for (let i = 0; i < 20; i++) {
      tuples.push({
        id: i,
        x: (i % 5) * 50 + 25,
        y: Math.floor(i / 5) * 35 + 20,
        isDead: i % 3 === 0, // Every 3rd tuple is dead
        isFrozen: false,
        isHighlighted: false,
      });
    }
    return tuples;
  };

  const [tuples, setTuples] = useState<TupleVisualization[]>(generateTuples());

  const step = STEPS[currentStep];

  const nextStep = () => {
    if (isAnimating) return;

    if (currentStep < STEPS.length - 1) {
      setIsAnimating(true);

      // Apply visual changes based on step
      if (currentStep === 0) {
        // Scan - highlight dead tuples
        setTuples((prev) =>
          prev.map((t) => ({
            ...t,
            isHighlighted: t.isDead,
          }))
        );
      } else if (currentStep === 1) {
        // Mark - dead tuples start fading
        setTuples((prev) =>
          prev.map((t) => ({
            ...t,
            isHighlighted: false,
          }))
        );
      } else if (currentStep === 2) {
        // Freeze - old live tuples get frozen indicator
        setTuples((prev) =>
          prev.map((t, i) => ({
            ...t,
            isFrozen: !t.isDead && i < 8, // First 8 live tuples get frozen
          }))
        );
      }

      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsAnimating(false);
      }, 500);
    }
  };

  const prevStep = () => {
    if (isAnimating || currentStep === 0) return;

    setIsAnimating(true);
    setCurrentStep((prev) => prev - 1);

    // Reset visual state
    if (currentStep === 1) {
      setTuples((prev) =>
        prev.map((t) => ({
          ...t,
          isHighlighted: false,
        }))
      );
    } else if (currentStep === 3) {
      setTuples((prev) =>
        prev.map((t) => ({
          ...t,
          isFrozen: false,
        }))
      );
    }

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const reset = () => {
    setCurrentStep(0);
    setTuples(generateTuples());
    setIsAnimating(false);
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex justify-center gap-2">
        {STEPS.map((s, i) => (
          <motion.button
            key={s.id}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono"
            style={{
              background: i === currentStep ? colors.glow.healthy : colors.oceanDark,
              color: i === currentStep ? colors.oceanDark : colors.text.muted,
              border: `2px solid ${
                i < currentStep ? colors.glow.healthy : i === currentStep ? colors.glow.healthy : colors.text.muted
              }40`,
            }}
            whileHover={{ scale: 1.1 }}
            onClick={() => {
              if (!isAnimating && i <= currentStep) {
                setCurrentStep(i);
              }
            }}
          >
            {i + 1}
          </motion.button>
        ))}
      </div>

      {/* Visualization area */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Page visualization */}
        <div
          className="relative rounded-xl p-4 flex-1"
          style={{ background: colors.oceanDark, border: `1px solid ${colors.text.muted}30`, minHeight: 200 }}
        >
          <div className="absolute top-2 left-2 text-xs font-mono" style={{ color: colors.text.muted }}>
            Page 0
          </div>

          {/* Tuples */}
          <div className="relative mt-6">
            {tuples.map((tuple) => (
              <motion.div
                key={tuple.id}
                className="absolute w-10 h-6 rounded flex items-center justify-center text-xs font-mono"
                style={{
                  left: tuple.x,
                  top: tuple.y,
                  background: tuple.isDead
                    ? currentStep >= 1
                      ? 'transparent'
                      : '#4a4a6a'
                    : tuple.isFrozen
                    ? colors.glow.healthy
                    : colors.oceanLight,
                  border: `2px solid ${
                    tuple.isHighlighted
                      ? colors.glow.critical
                      : tuple.isDead
                      ? currentStep >= 1
                        ? 'transparent'
                        : '#6b6b8a'
                      : tuple.isFrozen
                      ? colors.glow.healthy
                      : colors.text.muted
                  }`,
                  opacity: tuple.isDead && currentStep >= 1 ? 0.2 : 1,
                  color: tuple.isDead ? '#6b6b8a' : tuple.isFrozen ? colors.oceanDark : colors.text.muted,
                }}
                animate={{
                  scale: tuple.isHighlighted ? [1, 1.1, 1] : 1,
                  boxShadow: tuple.isHighlighted
                    ? [`0 0 0px ${colors.glow.critical}`, `0 0 10px ${colors.glow.critical}`, `0 0 0px ${colors.glow.critical}`]
                    : 'none',
                }}
                transition={{ duration: 0.5, repeat: tuple.isHighlighted ? Infinity : 0 }}
              >
                {tuple.isDead ? (currentStep >= 1 ? '∅' : '✗') : tuple.isFrozen ? '❄' : '○'}
              </motion.div>
            ))}
          </div>

          {/* Scan line indicator */}
          <AnimatePresence>
            {currentStep === 0 && (
              <motion.div
                className="absolute left-0 right-0 h-1 rounded"
                style={{ background: colors.glow.healthy, top: 40 }}
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </AnimatePresence>

          {/* Legend */}
          <div className="absolute bottom-2 right-2 flex gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: colors.oceanLight, border: `1px solid ${colors.text.muted}` }} />
              <span style={{ color: colors.text.muted }}>Live</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: '#4a4a6a', border: `1px solid #6b6b8a` }} />
              <span style={{ color: colors.text.muted }}>Dead</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: colors.glow.healthy }} />
              <span style={{ color: colors.text.muted }}>Frozen</span>
            </div>
          </div>
        </div>

        {/* Step info */}
        <div
          className="flex-1 p-6 rounded-xl"
          style={{ background: colors.oceanDark, border: `1px solid ${colors.glow.healthy}30` }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h3
                className="text-xl font-mono font-bold mb-2"
                style={{ color: colors.glow.healthy }}
              >
                {step.title}
              </h3>
              <p className="text-lg mb-4" style={{ color: colors.text.primary }}>
                {step.description}
              </p>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {step.detail}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center gap-4">
        <motion.button
          className="px-6 py-2 rounded-lg font-medium"
          style={{
            background: currentStep === 0 ? colors.oceanDark : colors.oceanLight,
            color: currentStep === 0 ? colors.text.muted : colors.text.secondary,
            border: `1px solid ${colors.text.muted}40`,
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
          }}
          whileHover={currentStep > 0 ? { scale: 1.05 } : {}}
          whileTap={currentStep > 0 ? { scale: 0.95 } : {}}
          onClick={prevStep}
          disabled={currentStep === 0 || isAnimating}
        >
          ← Previous
        </motion.button>

        <motion.button
          className="px-6 py-2 rounded-lg font-medium"
          style={{
            background: currentStep === STEPS.length - 1 ? colors.oceanDark : colors.glow.healthy,
            color: currentStep === STEPS.length - 1 ? colors.text.muted : colors.oceanDark,
            cursor: currentStep === STEPS.length - 1 ? 'not-allowed' : 'pointer',
          }}
          whileHover={currentStep < STEPS.length - 1 ? { scale: 1.05 } : {}}
          whileTap={currentStep < STEPS.length - 1 ? { scale: 0.95 } : {}}
          onClick={nextStep}
          disabled={currentStep === STEPS.length - 1 || isAnimating}
        >
          Next →
        </motion.button>

        <motion.button
          className="px-4 py-2 rounded-lg text-sm"
          style={{
            background: colors.oceanDark,
            color: colors.text.muted,
            border: `1px solid ${colors.text.muted}40`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={reset}
        >
          Reset
        </motion.button>
      </div>
    </div>
  );
}
