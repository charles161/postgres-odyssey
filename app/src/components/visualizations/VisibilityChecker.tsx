import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface DecisionNode {
  id: string;
  question: string;
  yesNext: string | 'VISIBLE' | 'NOT_VISIBLE';
  noNext: string | 'VISIBLE' | 'NOT_VISIBLE';
  evaluate: (myTxn: number, xmin: number, xmax: number | null) => boolean;
}

const DECISION_TREE: DecisionNode[] = [
  {
    id: 'check_xmin',
    question: 'Is xmin ≤ my TXN ID?',
    yesNext: 'check_xmax_null',
    noNext: 'NOT_VISIBLE',
    evaluate: (myTxn, xmin) => xmin <= myTxn,
  },
  {
    id: 'check_xmax_null',
    question: 'Is xmax = ∞ (still alive)?',
    yesNext: 'VISIBLE',
    noNext: 'check_xmax_greater',
    evaluate: (_, __, xmax) => xmax === null,
  },
  {
    id: 'check_xmax_greater',
    question: 'Is xmax > my TXN ID?',
    yesNext: 'VISIBLE',
    noNext: 'NOT_VISIBLE',
    evaluate: (myTxn, _, xmax) => xmax !== null && xmax > myTxn,
  },
];

const getExplanation = (result: 'VISIBLE' | 'NOT_VISIBLE', path: string[]): string => {
  if (result === 'VISIBLE') {
    if (path.includes('check_xmax_null') && path.length === 2) {
      return 'This tuple is still alive (xmax = ∞), so you can see it!';
    }
    if (path.includes('check_xmax_greater')) {
      return 'This tuple was deleted after your transaction started, so you still see it!';
    }
    return 'This tuple is visible to your transaction.';
  } else {
    if (path.length === 1) {
      return "This tuple didn't exist when your transaction started (xmin > your TXN ID).";
    }
    return 'This tuple was already deleted before your transaction started.';
  }
};

export function VisibilityChecker() {
  const [myTxn, setMyTxn] = useState(175);
  const [xmin, setXmin] = useState(150);
  const [xmax, setXmax] = useState<number | null>(200);
  const [xmaxInfinity, setXmaxInfinity] = useState(false);
  const [evaluatedPath, setEvaluatedPath] = useState<string[]>([]);
  const [result, setResult] = useState<'VISIBLE' | 'NOT_VISIBLE' | null>(null);

  // Animate through the decision tree
  const evaluateVisibility = async () => {
    setEvaluatedPath([]);
    setResult(null);

    const effectiveXmax = xmaxInfinity ? null : xmax;
    const path: string[] = [];
    let currentNode: DecisionNode | undefined = DECISION_TREE[0];

    while (currentNode) {
      path.push(currentNode.id);
      setEvaluatedPath([...path]);

      // Wait for animation
      await new Promise((r) => setTimeout(r, 800));

      const answer: boolean = currentNode.evaluate(myTxn, xmin, effectiveXmax);
      const nextId: string = answer ? currentNode.yesNext : currentNode.noNext;

      if (nextId === 'VISIBLE' || nextId === 'NOT_VISIBLE') {
        setResult(nextId);
        break;
      }

      currentNode = DECISION_TREE.find((n) => n.id === nextId);
    }
  };

  // Auto-evaluate when inputs change
  useEffect(() => {
    const timeout = setTimeout(() => {
      evaluateVisibility();
    }, 300);
    return () => clearTimeout(timeout);
  }, [myTxn, xmin, xmax, xmaxInfinity]);

  const effectiveXmax = xmaxInfinity ? null : xmax;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Controls */}
      <div
        className="rounded-xl p-6"
        style={{
          background: colors.oceanDark,
          border: `1px solid ${colors.glow.healthy}20`,
        }}
      >
        <h3
          className="font-mono text-sm uppercase tracking-wider mb-6"
          style={{ color: colors.text.muted }}
        >
          Configure Scenario
        </h3>

        {/* My Transaction ID */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label
              className="text-sm font-medium"
              style={{ color: colors.text.secondary }}
            >
              Your Transaction ID
            </label>
            <span
              className="font-mono text-lg px-3 py-1 rounded"
              style={{
                background: colors.glow.healthy + '20',
                color: colors.glow.healthy,
              }}
            >
              TXN {myTxn}
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={250}
            value={myTxn}
            onChange={(e) => setMyTxn(Number(e.target.value))}
            className="w-full accent-cyan-400"
            style={{ accentColor: colors.glow.healthy }}
          />
          <div
            className="flex justify-between text-xs mt-1"
            style={{ color: colors.text.muted }}
          >
            <span>100</span>
            <span>250</span>
          </div>
        </div>

        {/* Tuple xmin */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label
              className="text-sm font-medium"
              style={{ color: colors.text.secondary }}
            >
              Tuple xmin (created by)
            </label>
            <span
              className="font-mono px-3 py-1 rounded"
              style={{
                background: colors.glow.healthy + '20',
                color: colors.glow.healthy,
              }}
            >
              {xmin}
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={250}
            value={xmin}
            onChange={(e) => setXmin(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: colors.glow.healthy }}
          />
        </div>

        {/* Tuple xmax */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label
              className="text-sm font-medium"
              style={{ color: colors.text.secondary }}
            >
              Tuple xmax (deleted by)
            </label>
            <span
              className="font-mono px-3 py-1 rounded"
              style={{
                background: xmaxInfinity
                  ? colors.text.muted + '20'
                  : colors.glow.critical + '20',
                color: xmaxInfinity ? colors.text.muted : colors.glow.critical,
              }}
            >
              {xmaxInfinity ? '∞' : xmax}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={100}
              max={250}
              value={xmax ?? 200}
              onChange={(e) => setXmax(Number(e.target.value))}
              disabled={xmaxInfinity}
              className="flex-1"
              style={{
                accentColor: colors.glow.critical,
                opacity: xmaxInfinity ? 0.3 : 1,
              }}
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={xmaxInfinity}
                onChange={(e) => setXmaxInfinity(e.target.checked)}
                className="rounded"
              />
              <span style={{ color: colors.text.muted }}>∞ (alive)</span>
            </label>
          </div>
        </div>

        {/* Visual representation of the tuple */}
        <div
          className="p-4 rounded-lg mt-6"
          style={{ background: colors.oceanLight }}
        >
          <p
            className="text-xs font-mono uppercase tracking-wider mb-3"
            style={{ color: colors.text.muted }}
          >
            The Tuple
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-12 rounded"
              style={{
                background:
                  effectiveXmax === null
                    ? colors.glow.healthy
                    : colors.text.muted,
              }}
            />
            <div className="flex-1 font-mono text-sm">
              <div style={{ color: colors.text.secondary }}>
                name = 'Alice'
              </div>
              <div style={{ color: colors.text.secondary }}>
                balance = 1500
              </div>
            </div>
            <div className="text-right text-xs font-mono">
              <div style={{ color: colors.glow.healthy }}>
                xmin={xmin}
              </div>
              <div
                style={{
                  color: effectiveXmax === null
                    ? colors.text.muted
                    : colors.glow.critical,
                }}
              >
                xmax={effectiveXmax ?? '∞'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Decision Tree */}
      <div
        className="rounded-xl p-6"
        style={{
          background: colors.oceanDark,
          border: `1px solid ${colors.glow.healthy}20`,
        }}
      >
        <h3
          className="font-mono text-sm uppercase tracking-wider mb-6"
          style={{ color: colors.text.muted }}
        >
          Visibility Check
        </h3>

        <div className="space-y-4">
          {DECISION_TREE.map((node, index) => {
            const isEvaluated = evaluatedPath.includes(node.id);
            const isCurrentStep =
              evaluatedPath[evaluatedPath.length - 1] === node.id && !result;
            const answer = isEvaluated
              ? node.evaluate(myTxn, xmin, effectiveXmax)
              : null;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0.4, scale: 0.95 }}
                animate={{
                  opacity: isEvaluated ? 1 : 0.4,
                  scale: isCurrentStep ? 1.02 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className="p-4 rounded-lg relative overflow-hidden"
                  style={{
                    background: isEvaluated
                      ? `linear-gradient(135deg, ${colors.oceanLight} 0%, ${
                          answer ? colors.glow.healthy : colors.glow.critical
                        }10 100%)`
                      : colors.oceanLight,
                    border: `2px solid ${
                      isCurrentStep
                        ? colors.glow.warning
                        : isEvaluated
                        ? answer
                          ? colors.glow.healthy + '60'
                          : colors.glow.critical + '60'
                        : 'transparent'
                    }`,
                    boxShadow: isCurrentStep
                      ? `0 0 20px ${colors.glow.warning}40`
                      : 'none',
                  }}
                >
                  {/* Step number */}
                  <div
                    className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono"
                    style={{
                      background: isEvaluated
                        ? answer
                          ? colors.glow.healthy + '20'
                          : colors.glow.critical + '20'
                        : colors.text.muted + '20',
                      color: isEvaluated
                        ? answer
                          ? colors.glow.healthy
                          : colors.glow.critical
                        : colors.text.muted,
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Question */}
                  <p
                    className="font-medium pl-8 mb-3"
                    style={{ color: colors.text.primary }}
                  >
                    {node.question}
                  </p>

                  {/* Answer badges */}
                  <div className="flex items-center gap-3 pl-8">
                    <motion.div
                      className="px-3 py-1 rounded text-xs font-mono"
                      style={{
                        background:
                          isEvaluated && answer
                            ? colors.glow.healthy + '30'
                            : colors.glow.healthy + '10',
                        color:
                          isEvaluated && answer
                            ? colors.glow.healthy
                            : colors.text.muted,
                        border: `1px solid ${
                          isEvaluated && answer
                            ? colors.glow.healthy
                            : 'transparent'
                        }`,
                      }}
                      animate={{
                        scale: isEvaluated && answer ? [1, 1.1, 1] : 1,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      YES → {node.yesNext === 'VISIBLE' ? '✓ VISIBLE' : 'continue'}
                    </motion.div>
                    <motion.div
                      className="px-3 py-1 rounded text-xs font-mono"
                      style={{
                        background:
                          isEvaluated && answer === false
                            ? colors.glow.critical + '30'
                            : colors.glow.critical + '10',
                        color:
                          isEvaluated && answer === false
                            ? colors.glow.critical
                            : colors.text.muted,
                        border: `1px solid ${
                          isEvaluated && answer === false
                            ? colors.glow.critical
                            : 'transparent'
                        }`,
                      }}
                      animate={{
                        scale: isEvaluated && answer === false ? [1, 1.1, 1] : 1,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      NO → {node.noNext === 'NOT_VISIBLE' ? '✗ NOT VISIBLE' : 'continue'}
                    </motion.div>
                  </div>
                </div>

                {/* Connector line */}
                {index < DECISION_TREE.length - 1 && (
                  <div
                    className="w-0.5 h-4 mx-auto"
                    style={{
                      background:
                        evaluatedPath.length > index + 1
                          ? colors.glow.healthy + '60'
                          : colors.text.muted + '30',
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 p-4 rounded-xl text-center"
              style={{
                background:
                  result === 'VISIBLE'
                    ? `linear-gradient(135deg, ${colors.glow.healthy}15 0%, ${colors.glow.healthy}05 100%)`
                    : `linear-gradient(135deg, ${colors.glow.critical}15 0%, ${colors.glow.critical}05 100%)`,
                border: `2px solid ${
                  result === 'VISIBLE'
                    ? colors.glow.healthy
                    : colors.glow.critical
                }`,
                boxShadow: `0 0 30px ${
                  result === 'VISIBLE'
                    ? colors.glow.healthy
                    : colors.glow.critical
                }30`,
              }}
            >
              <motion.div
                className="text-3xl font-bold mb-2"
                style={{
                  color:
                    result === 'VISIBLE'
                      ? colors.glow.healthy
                      : colors.glow.critical,
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5 }}
              >
                {result === 'VISIBLE' ? '✓ VISIBLE' : '✗ NOT VISIBLE'}
              </motion.div>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {getExplanation(result, evaluatedPath)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
