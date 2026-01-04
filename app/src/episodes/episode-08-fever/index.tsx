import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene } from '../../components/storytelling/Scene';
import { ChapterCardInline } from '../../components/storytelling/ChapterCard';
import { MicroDisasterOpening } from '../../components/visualizations/MicroDisasterOpening';
import { RaceConditionDemo } from '../../components/visualizations/RaceConditionDemo';
import { LockSolutionDemo } from '../../components/visualizations/LockSolutionDemo';
import { StyleTransition } from '../../components/visualizations/StyleTransition';
import { LockQueueDemo } from '../../components/visualizations/LockQueueDemo';
import { DeadlockSandbox } from '../../components/visualizations/DeadlockSandbox';
import { PreventionCards } from '../../components/visualizations/PreventionCards';
import { LockScenarios } from '../../components/visualizations/LockScenarios';
import { useLenis } from '../../hooks/useLenis';
import { colors } from '../../config/theme';

export function Episode08Fever() {
  const navigate = useNavigate();
  const [showOpening, setShowOpening] = useState(true);
  useLenis();

  return (
    <div style={{ background: colors.ocean }}>
      {/* Opening - Micro Disaster */}
      <AnimatePresence>
        {showOpening && (
          <MicroDisasterOpening onComplete={() => setShowOpening(false)} />
        )}
      </AnimatePresence>

      {/* Main content */}
      <AnimatePresence>
        {!showOpening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Scene 1: Introduction - The Problem Statement */}
            <Scene id="intro" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8">
                <div className="max-w-3xl text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  >
                    <p
                      className="text-2xl md:text-3xl leading-relaxed font-light mb-8"
                      style={{ color: colors.text.secondary }}
                    >
                      In Episode 7, you learned how{' '}
                      <span style={{ color: colors.glow.healthy }}>isolation levels</span> control
                      what you can see.
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed"
                      style={{ color: colors.text.muted }}
                    >
                      MVCC handles reads. But what happens when two transactions
                      <br />
                      want to <span style={{ color: colors.glow.critical }}>modify the same row</span>?
                      <br />
                      That's where <strong>locks</strong> come in.
                    </p>
                  </motion.div>

                  <motion.div
                    className="mt-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    <p
                      className="text-sm uppercase tracking-widest"
                      style={{ color: colors.text.muted }}
                    >
                      Scroll to understand
                    </p>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 2: The Problem - Full Race Condition Demo */}
            <Scene id="problem" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <RaceConditionDemo />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card: Transition to Solution */}
            <div className="py-8">
              <ChapterCardInline
                message="The bank lost $100. What if Alice had to wait?"
                accentColor={colors.text.secondary}
              />
            </div>

            {/* Scene 3: The Solution - Locks Demo */}
            <Scene id="solution" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <LockSolutionDemo />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card: Transition to Lock Types */}
            <div className="py-8">
              <ChapterCardInline
                message="But not all locks are created equal."
                accentColor={colors.text.secondary}
              />
            </div>

            {/* Scene 4: Lock Types Through Real Scenarios */}
            <Scene id="scenarios" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-3xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Arsenal
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    PostgreSQL has{' '}
                    <span style={{ color: colors.glow.warning }}>8 different lock types</span>.
                    Each one exists for a reason. Here are the ones you'll actually encounter.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <LockScenarios />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 5: Visual Style Transition */}
            <Scene id="transition" minHeight="80vh">
              <div className="flex flex-col items-center justify-center min-h-[80vh] px-8">
                <ChapterCardInline
                  message="Locks work. But what happens at scale?"
                  accentColor={colors.glow.warning}
                />
                <StyleTransition />
              </div>
            </Scene>

            {/* Scene 5: Lock Queue Cascade */}
            <Scene id="queue" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-6xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Cascade
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    One slow query. One database change. And suddenly,{' '}
                    <span style={{ color: colors.glow.warning }}>everyone is waiting</span>.
                    This is why 47 queries can be blocked while CPU sits idle.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <LockQueueDemo />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card: Transition to Deadlock */}
            <div className="py-8">
              <ChapterCardInline
                message="What if two transactions each hold what the other needs?"
                accentColor={colors.glow.critical}
              />
            </div>

            {/* Scene 6: Deadlock */}
            <Scene id="deadlock" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-6xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Trap
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    When two transactions each hold what the other needs, neither can proceed.
                    PostgreSQL must{' '}
                    <span style={{ color: colors.glow.critical }}>sacrifice one</span> to break
                    the cycle.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <DeadlockSandbox />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 7: Prevention - The Discipline */}
            <Scene id="prevention" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-6xl w-full">
                  <motion.div className="text-center mb-12">
                    <motion.h2
                      className="text-3xl md:text-5xl font-medium mb-4"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.8 }}
                      style={{ color: colors.text.primary }}
                    >
                      The Discipline
                    </motion.h2>

                    <motion.p
                      className="text-xl leading-relaxed max-w-2xl mx-auto"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      style={{ color: colors.text.secondary }}
                    >
                      The fever isn't the disease—it's the{' '}
                      <span style={{ color: colors.glow.warning }}>immune system working</span>.
                      But prevention is better than cure.
                    </motion.p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <PreventionCards />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 8: Conclusion */}
            <Scene id="conclusion" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8">
                <div className="max-w-3xl text-center">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Immune System
                  </motion.h2>

                  <motion.div
                    className="space-y-6 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <p
                      className="text-xl leading-relaxed"
                      style={{ color: colors.text.secondary }}
                    >
                      <span style={{ color: colors.glow.healthy }}>Locks</span> are how
                      transactions coordinate when MVCC can't help.
                    </p>
                    <p
                      className="text-xl leading-relaxed"
                      style={{ color: colors.text.secondary }}
                    >
                      <span style={{ color: colors.glow.warning }}>Lock queues</span> are the
                      fever—the system slowing down to stay consistent.
                    </p>
                    <p
                      className="text-xl leading-relaxed"
                      style={{ color: colors.text.secondary }}
                    >
                      <span style={{ color: colors.glow.critical }}>Deadlocks</span> are
                      autoimmune disease—the protection attacking itself.
                    </p>
                    <p
                      className="text-lg leading-relaxed mt-8"
                      style={{ color: colors.text.muted }}
                    >
                      Prevention is hygiene, not medicine.
                    </p>
                  </motion.div>

                  <motion.div
                    className="p-6 rounded-xl mb-12"
                    style={{
                      background: colors.oceanDark,
                      border: `1px solid ${colors.text.muted}20`,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <p className="text-lg" style={{ color: colors.text.secondary }}>
                      Remember those dead tuples from Episode 4?
                      <br />
                      They're still taking up space. Old versions accumulate. Tables bloat.
                    </p>
                    <p
                      className="text-lg mt-4"
                      style={{ color: colors.glow.healthy }}
                    >
                      That's where <strong>VACUUM</strong> comes in.
                    </p>
                  </motion.div>

                  <motion.div
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <motion.button
                      className="px-8 py-4 rounded-lg text-lg font-medium transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/episode/7')}
                      style={{
                        background: colors.oceanLight,
                        color: colors.text.secondary,
                        border: `1px solid ${colors.text.muted}40`,
                      }}
                    >
                      ← Episode 7: The Rules
                    </motion.button>

                    <motion.button
                      className="px-8 py-4 rounded-lg text-lg font-medium transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/episode/9')}
                      style={{
                        background: `${colors.glow.healthy}20`,
                        color: colors.glow.healthy,
                        border: `1px solid ${colors.glow.healthy}40`,
                      }}
                    >
                      Episode 9: The Cleanup →
                    </motion.button>
                  </motion.div>

                  <motion.p
                    className="mt-8 text-sm"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    style={{ color: colors.text.muted }}
                  >
                    Episode 10: The Scaling — Coming Soon
                  </motion.p>
                </div>
              </div>
            </Scene>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
