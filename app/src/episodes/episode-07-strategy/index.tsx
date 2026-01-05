import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene } from '../../components/storytelling/Scene';
import { ScrollIndicator } from '../../components/storytelling/ScrollIndicator';
import { ChapterCardInline } from '../../components/storytelling/ChapterCard';
import { StrategyOpening } from '../../components/visualizations/StrategyOpening';
import { QueryLifecycle } from '../../components/visualizations/QueryLifecycle';
import { CostArena } from '../../components/visualizations/CostArena';
import { StatisticsDecay } from '../../components/visualizations/StatisticsDecay';
import { JoinAlgorithmDemo } from '../../components/visualizations/JoinAlgorithmDemo';
import { ExplainAnalyzeViewer } from '../../components/visualizations/ExplainAnalyzeViewer';
import { EpisodeNavigation } from '../../components/EpisodeNavigation';
import { useLenis } from '../../hooks/useLenis';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { colors } from '../../config/theme';

export function Episode07Strategy() {
  const [showOpening, setShowOpening] = useState(true);
  useLenis();
  useDocumentMeta({
    title: 'Episode 7: The Strategy',
    description: 'How the query planner picks the cheapest execution path.',
  });

  return (
    <div style={{ background: colors.ocean }}>
      {/* Opening - Bad Decision */}
      <AnimatePresence>
        {showOpening && (
          <StrategyOpening onComplete={() => setShowOpening(false)} />
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
            {/* Scene 1: Introduction */}
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
                      You just saw the planner choose{' '}
                      <span style={{ color: colors.glow.critical }}>the wrong path</span>.
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed"
                      style={{ color: colors.text.muted }}
                    >
                      It wasn't malicious. It wasn't random.
                      <br />
                      It made the <span style={{ color: colors.glow.warning }}>
                        best decision it could
                      </span>{' '}
                      with outdated information.
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed mt-8"
                      style={{ color: colors.glow.healthy }}
                    >
                      Let's see how decisions are made.
                    </p>
                  </motion.div>

                  <ScrollIndicator delay={1.5} />
                </div>
              </div>
            </Scene>

            {/* Scene 2: Query Lifecycle */}
            <Scene id="lifecycle" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Pipeline
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Every query passes through 5 stages. The{' '}
                    <span style={{ color: colors.glow.critical }}>Planner</span> is where strategy
                    decisions happen.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <QueryLifecycle />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="The planner picks the cheapest path. But how?"
                accentColor={colors.text.secondary}
              />
            </div>

            {/* Scene 3: Cost Model */}
            <Scene id="cost" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Cost Model
                  </motion.h2>

                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      The planner assigns a{' '}
                      <span style={{ color: colors.glow.warning }}>cost</span> to each possible
                      strategy. Lower is better.
                    </p>

                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.oceanDark,
                        border: `1px solid ${colors.text.muted}20`,
                      }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4
                            className="font-medium mb-2"
                            style={{ color: colors.glow.healthy }}
                          >
                            Sequential I/O
                          </h4>
                          <p className="text-sm" style={{ color: colors.text.muted }}>
                            Cost: <code className="font-mono">1.0</code> per page
                          </p>
                          <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                            Reading pages in order is fast (prefetch works)
                          </p>
                        </div>
                        <div>
                          <h4
                            className="font-medium mb-2"
                            style={{ color: colors.glow.critical }}
                          >
                            Random I/O
                          </h4>
                          <p className="text-sm" style={{ color: colors.text.muted }}>
                            Cost: <code className="font-mono">4.0</code> per page
                          </p>
                          <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                            Jumping around is expensive (seek time)
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-lg" style={{ color: colors.text.muted }}>
                      The planner estimates{' '}
                      <span style={{ color: colors.glow.warning }}>how many rows</span> each
                      strategy will process, then calculates total cost.
                    </p>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 4: Cost Arena */}
            <Scene id="arena" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-6xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Arena
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Watch strategies compete. Toggle between stale and fresh statistics to see
                    how the winner changes.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <CostArena />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="The planner is only as good as its information."
                accentColor={colors.glow.warning}
              />
            </div>

            {/* Scene 5: Statistics Decay */}
            <Scene id="statistics" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Decay
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Statistics freeze at the last{' '}
                    <span style={{ color: colors.glow.healthy }}>ANALYZE</span>. As data changes,
                    the gap between estimate and reality grows.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <StatisticsDecay />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="How does the planner combine tables?"
                accentColor={colors.glow.critical}
              />
            </div>

            {/* Scene 6: Join Algorithms */}
            <Scene id="joins" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-6xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Join Algorithms
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    When you write a{' '}
                    <span className="font-mono" style={{ color: colors.glow.healthy }}>
                      JOIN
                    </span>
                    , the planner picks one of three algorithms. Each has different performance
                    characteristics.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <JoinAlgorithmDemo />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="How do you see what the planner chose?"
                accentColor={colors.glow.healthy}
              />
            </div>

            {/* Scene 7: EXPLAIN ANALYZE */}
            <Scene id="explain" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-6xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    EXPLAIN ANALYZE
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    The{' '}
                    <span className="font-mono" style={{ color: colors.glow.critical }}>
                      EXPLAIN ANALYZE
                    </span>{' '}
                    command shows you exactly what the planner decided—and whether it was right.
                    Compare estimated vs actual rows to spot problems.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <ExplainAnalyzeViewer />
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
                    The Prefrontal Cortex
                  </motion.h2>

                  <motion.div
                    className="space-y-6 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.healthy }}>The Planner</span> evaluates
                      options and picks the cheapest path—like your brain planning a movement.
                    </p>
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.warning }}>Statistics</span> are its memory.
                      Stale memory means wrong decisions. Use{' '}
                      <span className="font-mono" style={{ color: colors.glow.critical }}>
                        EXPLAIN ANALYZE
                      </span>{' '}
                      to spot the mismatch.
                    </p>
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.critical }}>Join algorithms</span> matter.
                      Nested Loop for small, Hash for large, Merge when pre-sorted.
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
                      You now understand how PostgreSQL plans and executes queries.
                      <br />
                      But what happens when two transactions try to modify the same row?
                    </p>
                    <p className="text-lg mt-4" style={{ color: colors.glow.healthy }}>
                      That's <strong>The Rules</strong>—locks and isolation levels.
                    </p>
                  </motion.div>

                  <EpisodeNavigation currentEpisode={7} />
                </div>
              </div>
            </Scene>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
