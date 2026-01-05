import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../config/theme';

interface RulesOpeningProps {
  onComplete: () => void;
}

export function RulesOpening({ onComplete }: RulesOpeningProps) {
  const [phase, setPhase] = useState<
    'balance' | 'deposit' | 'read1' | 'read2' | 'confusion' | 'question' | 'title' | 'fade'
  >('balance');

  const [balance, setBalance] = useState(1000);
  const [_showDeposit, setShowDeposit] = useState(false);

  // Phase timing
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase('deposit'), 2000));
    timers.push(
      setTimeout(() => {
        setShowDeposit(true);
        setBalance(1500);
      }, 3500)
    );
    timers.push(setTimeout(() => setPhase('read1'), 4500));
    timers.push(setTimeout(() => setPhase('read2'), 7000));
    timers.push(setTimeout(() => setPhase('confusion'), 10000));
    timers.push(setTimeout(() => setPhase('question'), 13000));
    timers.push(setTimeout(() => setPhase('title'), 16000));
    timers.push(setTimeout(() => setPhase('fade'), 19000));
    timers.push(setTimeout(() => onComplete(), 20000));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'fade' && (
        <motion.div
          className="fixed inset-0 flex flex-col items-center justify-center z-50"
          style={{ background: colors.ocean }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <AnimatePresence mode="wait">
            {/* Initial balance */}
            {phase === 'balance' && (
              <motion.div
                key="balance"
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-lg mb-4" style={{ color: colors.text.muted }}>
                  Your transaction reads the account balance:
                </p>

                <motion.div
                  className="p-8 rounded-xl inline-block"
                  style={{
                    background: colors.oceanDark,
                    border: `2px solid ${colors.glow.healthy}`,
                  }}
                >
                  <div className="text-sm mb-2" style={{ color: colors.text.muted }}>
                    Balance
                  </div>
                  <div
                    className="text-5xl md:text-7xl font-bold font-mono"
                    style={{ color: colors.glow.healthy }}
                  >
                    ${balance}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Meanwhile, another transaction... */}
            {phase === 'deposit' && (
              <motion.div
                key="deposit"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-xl mb-6" style={{ color: colors.text.secondary }}>
                  Meanwhile, another transaction...
                </p>

                <motion.div
                  className="p-6 rounded-xl inline-block"
                  style={{
                    background: `${colors.glow.warning}20`,
                    border: `2px solid ${colors.glow.warning}`,
                  }}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <div className="font-mono text-lg" style={{ color: colors.glow.warning }}>
                    INSERT INTO transactions (amount)
                    <br />
                    VALUES (+$500);
                  </div>
                  <motion.p
                    className="mt-4 text-sm"
                    style={{ color: colors.glow.healthy }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    COMMIT
                  </motion.p>
                </motion.div>
              </motion.div>
            )}

            {/* Your transaction reads again - READ COMMITTED */}
            {phase === 'read1' && (
              <motion.div
                key="read1"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-lg mb-4" style={{ color: colors.text.muted }}>
                  Your transaction reads again (READ COMMITTED):
                </p>

                <motion.div
                  className="p-8 rounded-xl inline-block"
                  style={{
                    background: colors.oceanDark,
                    border: `2px solid ${colors.glow.warning}`,
                  }}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-sm mb-2" style={{ color: colors.text.muted }}>
                    Balance
                  </div>
                  <div
                    className="text-5xl md:text-7xl font-bold font-mono"
                    style={{ color: colors.glow.warning }}
                  >
                    $1,500
                  </div>
                </motion.div>

                <motion.p
                  className="mt-4 text-lg"
                  style={{ color: colors.glow.warning }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  It changed!
                </motion.p>
              </motion.div>
            )}

            {/* Same moment, REPEATABLE READ */}
            {phase === 'read2' && (
              <motion.div
                key="read2"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-lg mb-4" style={{ color: colors.text.muted }}>
                  Same transaction, but with REPEATABLE READ:
                </p>

                <motion.div
                  className="p-8 rounded-xl inline-block"
                  style={{
                    background: colors.oceanDark,
                    border: `2px solid ${colors.glow.healthy}`,
                  }}
                >
                  <div className="text-sm mb-2" style={{ color: colors.text.muted }}>
                    Balance
                  </div>
                  <div
                    className="text-5xl md:text-7xl font-bold font-mono"
                    style={{ color: colors.glow.healthy }}
                  >
                    $1,000
                  </div>
                </motion.div>

                <motion.p
                  className="mt-4 text-lg"
                  style={{ color: colors.glow.healthy }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Still $1,000 (frozen at transaction start)
                </motion.p>
              </motion.div>
            )}

            {/* Confusion */}
            {phase === 'confusion' && (
              <motion.div
                key="confusion"
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex gap-8 mb-8">
                  <div
                    className="p-6 rounded-xl"
                    style={{
                      background: colors.oceanDark,
                      border: `2px solid ${colors.glow.warning}`,
                    }}
                  >
                    <div className="text-xs mb-2" style={{ color: colors.text.muted }}>
                      READ COMMITTED
                    </div>
                    <div
                      className="text-4xl font-bold font-mono"
                      style={{ color: colors.glow.warning }}
                    >
                      $1,500
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="text-2xl" style={{ color: colors.text.muted }}>
                      vs
                    </span>
                  </div>

                  <div
                    className="p-6 rounded-xl"
                    style={{
                      background: colors.oceanDark,
                      border: `2px solid ${colors.glow.healthy}`,
                    }}
                  >
                    <div className="text-xs mb-2" style={{ color: colors.text.muted }}>
                      REPEATABLE READ
                    </div>
                    <div
                      className="text-4xl font-bold font-mono"
                      style={{ color: colors.glow.healthy }}
                    >
                      $1,000
                    </div>
                  </div>
                </div>

                <motion.p
                  className="text-2xl"
                  style={{ color: colors.text.primary }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Same database. Same moment.{' '}
                  <span style={{ color: colors.glow.critical }}>Different answers.</span>
                </motion.p>
              </motion.div>
            )}

            {/* Question */}
            {phase === 'question' && (
              <motion.div
                key="question"
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.p
                  className="text-2xl md:text-4xl font-light leading-relaxed"
                  style={{ color: colors.text.primary }}
                >
                  Which truth is true?
                  <br />
                  <motion.span
                    style={{ color: colors.glow.healthy }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    That depends on your isolation level.
                  </motion.span>
                </motion.p>
              </motion.div>
            )}

            {/* Title */}
            {phase === 'title' && (
              <motion.div
                key="title"
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.p
                  className="text-sm uppercase tracking-[0.3em] mb-4"
                  style={{ color: colors.text.muted }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Episode 8
                </motion.p>

                <motion.h1
                  className="text-5xl md:text-7xl font-bold tracking-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span style={{ color: colors.text.primary }}>THE </span>
                  <span
                    style={{
                      background: `linear-gradient(135deg, ${colors.glow.healthy} 0%, ${colors.glow.critical} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    RULES
                  </span>
                </motion.h1>

                <motion.p
                  className="text-lg mt-4"
                  style={{ color: colors.text.secondary }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Isolation Levels and Transaction Boundaries
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
