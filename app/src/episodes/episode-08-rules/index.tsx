import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene } from '../../components/storytelling/Scene';
import { ScrollIndicator } from '../../components/storytelling/ScrollIndicator';
import { ChapterCardInline } from '../../components/storytelling/ChapterCard';
import { RulesOpening } from '../../components/visualizations/RulesOpening';
import { AnomalyZoo } from '../../components/visualizations/AnomalyZoo';
import { PermeabilitySpectrum } from '../../components/visualizations/PermeabilitySpectrum';
import { SnapshotFreeze } from '../../components/visualizations/SnapshotFreeze';
import { LockDemo } from '../../components/visualizations/LockDemo';
import { EpisodeNavigation } from '../../components/EpisodeNavigation';
import { useLenis } from '../../hooks/useLenis';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { colors } from '../../config/theme';

export function Episode08Rules() {
  const [showOpening, setShowOpening] = useState(true);
  useLenis();
  useDocumentMeta({
    title: 'Episode 8: The Rules',
    description: 'ACID transactions and isolation levels.',
  });

  return (
    <div style={{ background: colors.ocean }}>
      {/* Opening - Phantom Deposit */}
      <AnimatePresence>
        {showOpening && (
          <RulesOpening onComplete={() => setShowOpening(false)} />
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
                      Same database. Same moment.{' '}
                      <span style={{ color: colors.glow.warning }}>Different answers</span>.
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed"
                      style={{ color: colors.text.muted }}
                    >
                      That's not a bug. That's a{' '}
                      <span style={{ color: colors.glow.healthy }}>feature</span>.
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed mt-8"
                      style={{ color: colors.text.primary }}
                    >
                      Isolation levels let you choose{' '}
                      <span style={{ color: colors.glow.healthy }}>your reality</span>.
                    </p>
                  </motion.div>

                  <ScrollIndicator delay={1.5} />
                </div>
              </div>
            </Scene>

            {/* Scene 2: Anomaly Zoo */}
            <Scene id="anomalies" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Anomalies
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Without isolation, transactions can interfere with each other. These are the
                    problems that isolation levels prevent.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <AnomalyZoo />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="More isolation = fewer anomalies, but also more conflicts."
                accentColor={colors.text.secondary}
              />
            </div>

            {/* Scene 3: Permeability Spectrum */}
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
                    Four Levels of Isolation
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Think of isolation levels as membranes with different permeability. Higher
                    isolation blocks more of the outside world.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <PermeabilitySpectrum />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="REPEATABLE READ freezes your view at transaction start."
                accentColor={colors.glow.healthy}
              />
            </div>

            {/* Scene 4: Snapshot Freeze */}
            <Scene id="snapshot" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Photograph
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    With REPEATABLE READ, your transaction gets a photograph of the database at{' '}
                    <span style={{ color: colors.glow.healthy }}>BEGIN</span>. The world changes,
                    but your photo stays the same.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <SnapshotFreeze />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 5: MVCC Connection */}
            <Scene id="mvcc" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Why This Works
                  </motion.h2>

                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      Remember <span style={{ color: colors.glow.warning }}>Episode 5</span>? MVCC
                      keeps multiple versions of each row. Each version has{' '}
                      <code
                        className="px-2 py-1 rounded text-sm"
                        style={{ background: colors.oceanDark, color: colors.glow.healthy }}
                      >
                        xmin
                      </code>{' '}
                      and{' '}
                      <code
                        className="px-2 py-1 rounded text-sm"
                        style={{ background: colors.oceanDark, color: colors.glow.critical }}
                      >
                        xmax
                      </code>
                      .
                    </p>

                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.oceanDark,
                        border: `1px solid ${colors.glow.healthy}40`,
                      }}
                    >
                      <p className="text-lg mb-4" style={{ color: colors.text.secondary }}>
                        This is <strong>why</strong> we have xmin/xmax:
                      </p>

                      <div className="space-y-3 text-sm">
                        <p style={{ color: colors.text.secondary }}>
                          <span style={{ color: colors.glow.healthy }}>xmin</span> = "I was created
                          by transaction X"
                        </p>
                        <p style={{ color: colors.text.secondary }}>
                          <span style={{ color: colors.glow.critical }}>xmax</span> = "I was deleted
                          by transaction Y"
                        </p>
                        <p className="mt-4" style={{ color: colors.text.muted }}>
                          Your snapshot knows which transactions were committed at BEGIN. If
                          xmin's transaction is in your snapshot, you see the row. Otherwise, you
                          don't.
                        </p>
                      </div>
                    </div>

                    <p className="text-lg" style={{ color: colors.text.muted }}>
                      MVCC provides most isolation guarantees "for free"—without blocking readers.
                    </p>

                    <div
                      className="p-4 rounded-lg"
                      style={{
                        background: `${colors.glow.warning}10`,
                        border: `1px solid ${colors.glow.warning}40`,
                      }}
                    >
                      <p className="font-medium" style={{ color: colors.glow.warning }}>
                        But what about concurrent writes?
                      </p>
                      <p className="text-sm mt-2" style={{ color: colors.text.secondary }}>
                        MVCC handles read anomalies. But when two transactions try to modify the
                        same row, we need <strong>locks</strong>.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="When reads aren't enough—locks protect concurrent writes."
                accentColor={colors.glow.critical}
              />
            </div>

            {/* Scene 6: Locks */}
            <Scene id="locks" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Locks: Protecting Writes
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    When two transactions want to modify the same row, one must wait.{' '}
                    <span className="font-mono" style={{ color: colors.glow.healthy }}>
                      SELECT ... FOR UPDATE
                    </span>{' '}
                    lets you lock rows before modification—and{' '}
                    <span className="font-mono" style={{ color: colors.glow.critical }}>
                      SERIALIZABLE
                    </span>{' '}
                    detects conflicts automatically.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <LockDemo />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 7: Conclusion */}
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
                    The Nervous System
                  </motion.h2>

                  <motion.div
                    className="space-y-6 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.healthy }}>Isolation levels</span> control
                      what your transaction can see—like adjusting membrane permeability.
                    </p>
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.warning }}>Locks</span> coordinate writes—
                      like neurons preventing conflicting signals.
                    </p>
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.critical }}>SERIALIZABLE</span> gives full
                      isolation but requires your app to handle error{' '}
                      <span className="font-mono">40001</span> and retry.
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
                      You now understand how PostgreSQL coordinates concurrent access.
                      <br />
                      But what happens when 47 queries are waiting and CPU sits idle?
                    </p>
                    <p className="text-lg mt-4" style={{ color: colors.glow.critical }}>
                      That's <strong>The Fever</strong>—lock contention and deadlocks.
                    </p>
                  </motion.div>

                  <EpisodeNavigation currentEpisode={8} />
                </div>
              </div>
            </Scene>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
