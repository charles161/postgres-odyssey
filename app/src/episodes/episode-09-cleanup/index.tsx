import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene } from '../../components/storytelling/Scene';
import { ChapterCardInline } from '../../components/storytelling/ChapterCard';
import { BloatAccumulationOpening } from '../../components/visualizations/BloatAccumulationOpening';
import { BloatMonitor } from '../../components/visualizations/BloatMonitor';
import { VacuumProcess } from '../../components/visualizations/VacuumProcess';
import { VisibilityMapExplorer } from '../../components/visualizations/VisibilityMapExplorer';
import { VacuumSpectrum } from '../../components/visualizations/VacuumSpectrum';
import { AutovacuumConfig } from '../../components/visualizations/AutovacuumConfig';
import { VacuumMonitor } from '../../components/visualizations/VacuumMonitor';
import { XIDTimeline } from '../../components/visualizations/XIDTimeline';
import { useLenis } from '../../hooks/useLenis';
import { colors } from '../../config/theme';

export function Episode09Cleanup() {
  const navigate = useNavigate();
  const [showOpening, setShowOpening] = useState(true);
  useLenis();

  return (
    <div style={{ background: colors.ocean }}>
      {/* Opening - Bloat Accumulation */}
      <AnimatePresence>
        {showOpening && (
          <BloatAccumulationOpening onComplete={() => setShowOpening(false)} />
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
                      In Episode 4, you learned that every{' '}
                      <span style={{ color: colors.glow.warning }}>UPDATE</span> creates a new
                      tuple version.
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed"
                      style={{ color: colors.text.muted }}
                    >
                      The old version becomes invisible—but it doesn't disappear.
                      <br />
                      Those <span style={{ color: '#4a4a6a' }}>ghosts</span> accumulate.
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed mt-8"
                      style={{ color: colors.glow.healthy }}
                    >
                      This is where <strong>VACUUM</strong> comes in.
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

            {/* Chapter Card: Dead tuples */}
            <div className="py-8">
              <ChapterCardInline
                message="Dead tuples are the leftovers of MVCC."
                accentColor={colors.text.muted}
              />
            </div>

            {/* Scene 2: Bloat Demo */}
            <Scene id="bloat" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Bloat
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Dead tuples still consume disk space. Queries still scan through them.
                    <br />
                    Your table might be{' '}
                    <span style={{ color: colors.glow.warning }}>10x larger</span> than your
                    actual data.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <BloatMonitor />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card: Without cleanup */}
            <div className="py-8">
              <ChapterCardInline
                message="Without cleanup, your database eats itself."
                accentColor={colors.glow.warning}
              />
            </div>

            {/* Scene 3: VACUUM Process */}
            <Scene id="process" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Process
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    VACUUM scans tables, marks dead space as reusable, freezes old tuples, and
                    updates the maps that make queries faster.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <VacuumProcess />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 4: Visibility Map */}
            <Scene id="maps" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Maps
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Remember the <span style={{ color: colors.glow.healthy }}>heap hop</span> from
                    Episode 5? Index scans must visit the heap to check visibility.
                    <br />
                    The Visibility Map tracks which pages are "all-visible"—letting{' '}
                    <span style={{ color: colors.glow.healthy }}>index-only scans</span> skip the
                    heap entirely. VACUUM makes pages all-visible.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <VisibilityMapExplorer />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card: VACUUM accelerates */}
            <div className="py-8">
              <ChapterCardInline
                message="VACUUM doesn't just clean. It accelerates."
                accentColor={colors.glow.healthy}
              />
            </div>

            {/* Scene 5: VACUUM Spectrum */}
            <Scene id="spectrum" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Spectrum
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    VACUUM, VACUUM FULL, VACUUM ANALYZE—each has trade-offs.
                    <br />
                    Choose your weapon carefully.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <VacuumSpectrum />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card: Choose carefully */}
            <div className="py-8">
              <ChapterCardInline
                message="Choose your weapon carefully."
                accentColor={colors.text.muted}
              />
            </div>

            {/* Scene 6: Autovacuum */}
            <Scene id="autovacuum" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Automation
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Autovacuum runs in the background, but it's{' '}
                    <span style={{ color: colors.glow.warning }}>intentionally throttled</span>.
                    <br />
                    For large tables, defaults might not keep up.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <AutovacuumConfig />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card: Automation */}
            <div className="py-8">
              <ChapterCardInline
                message="Automation that can't keep up is worse than none."
                accentColor={colors.glow.warning}
              />
            </div>

            {/* Scene 7: Monitoring */}
            <Scene id="monitoring" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Dashboard
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    How do you know if VACUUM is working? Check{' '}
                    <code
                      className="px-2 py-1 rounded text-sm"
                      style={{ background: colors.oceanDark, color: colors.glow.healthy }}
                    >
                      pg_stat_user_tables
                    </code>
                    .
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <VacuumMonitor />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card: Monitoring */}
            <div className="py-8">
              <ChapterCardInline
                message="What gets measured gets managed."
                accentColor={colors.glow.healthy}
              />
            </div>

            {/* Scene 8: Wraparound */}
            <Scene id="wraparound" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Existential Threat
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    PostgreSQL uses 32-bit transaction IDs. Without VACUUM freezing old tuples,
                    you'll hit{' '}
                    <span style={{ color: colors.glow.critical }}>2 billion transactions</span>
                    —and your database stops.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <XIDTimeline />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card: Wraparound */}
            <div className="py-8">
              <ChapterCardInline
                message="Some failures don't recover."
                accentColor={colors.glow.critical}
              />
            </div>

            {/* Scene 9: Conclusion */}
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
                    The Digestion
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
                      <span style={{ color: colors.glow.healthy }}>VACUUM</span> is digestion.
                      Without it, the organism chokes on its own waste.
                    </p>
                    <p
                      className="text-xl leading-relaxed"
                      style={{ color: colors.text.secondary }}
                    >
                      <span style={{ color: colors.glow.warning }}>Autovacuum</span> is your
                      background immune system—tune it for your workload.
                    </p>
                    <p
                      className="text-xl leading-relaxed"
                      style={{ color: colors.text.secondary }}
                    >
                      <span style={{ color: colors.glow.critical }}>Wraparound</span> is the
                      ultimate failure. Respect the 2 billion limit.
                    </p>
                    <p
                      className="text-lg leading-relaxed mt-8"
                      style={{ color: colors.text.muted }}
                    >
                      Indexes bloat too. REINDEX is your friend.
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
                      Now the organism can maintain itself.
                      <br />
                      But what happens when it needs to grow? When one server isn't enough?
                    </p>
                    <p
                      className="text-lg mt-4"
                      style={{ color: colors.glow.healthy }}
                    >
                      That's <strong>replication</strong>—Episode 10.
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
                      onClick={() => navigate('/episode/8')}
                      style={{
                        background: colors.oceanLight,
                        color: colors.text.secondary,
                        border: `1px solid ${colors.text.muted}40`,
                      }}
                    >
                      ← Episode 8: The Fever
                    </motion.button>

                    <motion.button
                      className="px-8 py-4 rounded-lg text-lg font-medium transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/')}
                      style={{
                        background: `${colors.glow.healthy}20`,
                        color: colors.glow.healthy,
                        border: `1px solid ${colors.glow.healthy}40`,
                      }}
                    >
                      Return to Organism
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
