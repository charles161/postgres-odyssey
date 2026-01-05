import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene } from '../../components/storytelling/Scene';
import { ScrollIndicator } from '../../components/storytelling/ScrollIndicator';
import { ChapterCardInline } from '../../components/storytelling/ChapterCard';
import { StatisticsExplorer } from '../../components/visualizations/StatisticsExplorer';
import { HistogramDemo } from '../../components/visualizations/HistogramDemo';
import { EpisodeNavigation } from '../../components/EpisodeNavigation';
import { useLenis } from '../../hooks/useLenis';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { colors } from '../../config/theme';

export function Episode11Statistics() {
  const [showOpening, setShowOpening] = useState(true);
  useLenis();
  useDocumentMeta({
    title: 'Episode 11: The Statistics',
    description: 'How PostgreSQL uses statistics to plan queries.',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOpening(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ background: colors.ocean }}>
      {/* Opening */}
      <AnimatePresence>
        {showOpening && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: colors.ocean }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8 relative"
              >
                {/* Histogram bars animation */}
                <div className="relative w-32 h-32 mx-auto flex items-end justify-center gap-1">
                  {[0.3, 0.5, 0.8, 1, 0.7, 0.4, 0.2].map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-3 rounded-t"
                      style={{ background: colors.glow.healthy }}
                      initial={{ height: 0 }}
                      animate={{ height: `${h * 100}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                    />
                  ))}
                </div>
              </motion.div>

              <motion.p
                className="text-sm uppercase tracking-[0.3em] mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ color: colors.glow.healthy }}
              >
                Episode 11
              </motion.p>

              <motion.h1
                className="text-5xl md:text-7xl font-light tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                style={{ color: colors.text.primary }}
              >
                The Memory
              </motion.h1>

              <motion.p
                className="text-lg mt-4 max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{ color: colors.text.secondary }}
              >
                How PostgreSQL remembers your data's shape
              </motion.p>
            </div>
          </motion.div>
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
                      The query planner doesn't read your data to make decisions.
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed"
                      style={{ color: colors.text.muted }}
                    >
                      It reads{' '}
                      <span style={{ color: colors.glow.healthy }}>statistics about your data</span>.
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed mt-8"
                      style={{ color: colors.glow.warning }}
                    >
                      If the statistics are wrong, the plan will be wrong.
                    </p>
                  </motion.div>

                  <ScrollIndicator delay={1.5} />
                </div>
              </div>
            </Scene>

            {/* Scene 2: Statistics Overview */}
            <Scene id="overview" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    What PostgreSQL Tracks
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    PostgreSQL maintains statistics in system catalogs. The planner queries these to
                    estimate costs without touching actual data.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <StatisticsExplorer />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="Statistics are summaries. But how does PostgreSQL summarize distributions?"
                accentColor={colors.text.secondary}
              />
            </div>

            {/* Scene 3: Histograms */}
            <Scene id="histograms" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Histograms
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    For columns with many distinct values, PostgreSQL builds a histogram.
                    This lets it estimate how many rows fall in any range.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <HistogramDemo />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="Statistics get stale. ANALYZE refreshes them."
                accentColor={colors.glow.warning}
              />
            </div>

            {/* Scene 4: ANALYZE */}
            <Scene id="analyze" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Keeping Statistics Fresh
                  </motion.h2>

                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      Data changes. Statistics must follow. PostgreSQL provides two mechanisms:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div
                        className="p-6 rounded-xl"
                        style={{
                          background: colors.oceanLight,
                          border: `1px solid ${colors.glow.healthy}30`,
                        }}
                      >
                        <h4 className="font-semibold mb-2" style={{ color: colors.glow.healthy }}>
                          ANALYZE (Manual)
                        </h4>
                        <pre
                          className="text-sm font-mono p-3 rounded mb-3 overflow-x-auto"
                          style={{ background: colors.oceanDark, color: colors.text.secondary }}
                        >
                          ANALYZE orders;
                        </pre>
                        <p className="text-sm" style={{ color: colors.text.muted }}>
                          Run after bulk imports, schema changes, or when you notice bad query plans.
                        </p>
                      </div>

                      <div
                        className="p-6 rounded-xl"
                        style={{
                          background: colors.oceanLight,
                          border: `1px solid ${colors.glow.warning}30`,
                        }}
                      >
                        <h4 className="font-semibold mb-2" style={{ color: colors.glow.warning }}>
                          Autovacuum (Automatic)
                        </h4>
                        <p className="text-sm mb-3" style={{ color: colors.text.secondary }}>
                          Runs ANALYZE automatically when:
                        </p>
                        <pre
                          className="text-xs font-mono p-3 rounded overflow-x-auto"
                          style={{ background: colors.oceanDark, color: colors.text.muted }}
                        >
{`changed_tuples >
  autovacuum_analyze_threshold +
  autovacuum_analyze_scale_factor * reltuples`}
                        </pre>
                        <p className="text-xs mt-2" style={{ color: colors.text.muted }}>
                          Default: 50 + 10% of table size
                        </p>
                      </div>
                    </div>

                    <div
                      className="p-4 rounded-lg"
                      style={{
                        background: colors.glow.critical + '10',
                        border: `1px solid ${colors.glow.critical}30`,
                      }}
                    >
                      <p className="font-medium mb-2" style={{ color: colors.glow.critical }}>
                        When to manually ANALYZE:
                      </p>
                      <ul className="text-sm space-y-1" style={{ color: colors.text.secondary }}>
                        <li>• After loading a large batch of data</li>
                        <li>• After adding a new index</li>
                        <li>• When EXPLAIN shows estimates far from actual</li>
                        <li>• On columns with special distributions (e.g., mostly NULL, then filled)</li>
                      </ul>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 5: Extended Statistics */}
            <Scene id="extended" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Extended Statistics
                  </motion.h2>

                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      Standard statistics treat columns independently. But columns are often{' '}
                      <span style={{ color: colors.glow.warning }}>correlated</span>.
                    </p>

                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.oceanLight,
                        border: `1px solid ${colors.text.muted}30`,
                      }}
                    >
                      <p className="text-sm mb-4" style={{ color: colors.text.muted }}>
                        Example: city and zip_code are highly correlated.
                      </p>

                      <pre
                        className="text-sm font-mono p-4 rounded mb-4 overflow-x-auto"
                        style={{ background: colors.oceanDark, color: colors.text.secondary }}
                      >
{`-- Without extended stats, planner multiplies selectivities:
-- city = 'San Francisco' → 1%
-- zip_code = '94102' → 0.01%
-- Combined estimate: 0.0001% (WAY too low!)

-- Create extended statistics for correlation:
CREATE STATISTICS city_zip_stats (dependencies)
ON city, zip_code FROM addresses;

ANALYZE addresses;

-- Now planner knows: if city = 'San Francisco',
-- zip_code is likely a SF zip code`}
                      </pre>

                      <p className="text-sm" style={{ color: colors.glow.healthy }}>
                        Extended statistics help when queries filter on multiple correlated columns.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 6: Conclusion */}
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
                    The Database's Memory
                  </motion.h2>

                  <motion.div
                    className="space-y-6 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.healthy }}>Statistics</span> are how
                      PostgreSQL remembers your data's shape without reading it.
                    </p>
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.warning }}>Histograms</span> capture
                      distributions. Common values are tracked separately.
                    </p>
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.critical }}>ANALYZE</span> refreshes the
                      memory. Autovacuum does it automatically, but sometimes you need to help.
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
                      You've completed Part 1: The Machine.
                      <br />
                      One PostgreSQL instance, mastered.
                    </p>
                    <p className="text-lg mt-4" style={{ color: colors.glow.healthy }}>
                      Next: <strong>The Circulation</strong>—how connections flow through
                      the system.
                    </p>
                  </motion.div>

                  <EpisodeNavigation currentEpisode={11} />
                </div>
              </div>
            </Scene>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
