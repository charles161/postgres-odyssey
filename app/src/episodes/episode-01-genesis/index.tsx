import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene } from '../../components/storytelling/Scene';
import { OpeningReveal } from '../../components/storytelling/TextReveal';
import { InteractiveTuple } from '../../components/visualizations/InteractiveTuple';
import { useLenis } from '../../hooks/useLenis';
import { colors } from '../../config/theme';

export function Episode01Genesis() {
  const navigate = useNavigate();
  const [showOpening, setShowOpening] = useState(true);
  useLenis();

  const handleOpeningComplete = useCallback(() => {
    // Wait a moment before transitioning to scroll content
    setTimeout(() => {
      setShowOpening(false);
    }, 1500);
  }, []);

  return (
    <div style={{ background: colors.ocean }}>
      {/* Opening cinematic reveal */}
      <AnimatePresence>
        {showOpening && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <OpeningReveal onComplete={handleOpeningComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll content - appears after opening */}
      <AnimatePresence>
        {!showOpening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Scene 1: Post-opening continuation */}
            <Scene id="intro" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8">
                <div className="max-w-3xl text-center">
                  <motion.p
                    className="text-2xl md:text-3xl leading-relaxed font-light"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Every night, while you sleep, something extraordinary happens
                    in server rooms across the world.
                  </motion.p>

                  <motion.p
                    className="text-xl md:text-2xl mt-8 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    style={{ color: colors.text.muted }}
                  >
                    Millions of PostgreSQL instances hold vigil—not as cold, mechanical
                    systems, but as{' '}
                    <span className="glow-text">living custodians</span> of human memory.
                  </motion.p>

                  <motion.div
                    className="mt-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                  >
                    <p
                      className="text-sm uppercase tracking-widest"
                      style={{ color: colors.text.muted }}
                    >
                      Scroll to continue
                    </p>
                    <motion.div
                      className="mt-4 w-6 h-10 border-2 rounded-full mx-auto relative"
                      style={{ borderColor: colors.glow.healthy + '40' }}
                    >
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full absolute left-1/2 -translate-x-1/2"
                        style={{ background: colors.glow.healthy }}
                        animate={{ y: [8, 20, 8] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 2: Zoom into the structure */}
            <Scene id="zoom" minHeight="150vh">
              <div className="flex items-center justify-center min-h-screen px-8">
                <div className="max-w-4xl">
                  <motion.h2
                    className="text-3xl md:text-5xl font-light mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Fundamental Unit
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    At the heart of every PostgreSQL database lies a deceptively simple structure:
                    the <span className="glow-text font-mono">8KB page</span>.
                  </motion.p>

                  <motion.p
                    className="text-lg leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    style={{ color: colors.text.muted }}
                  >
                    This isn't an arbitrary choice. Like cells in a living organism,
                    pages are the smallest unit of life in the database. Everything—tables,
                    indexes, your most precious data—exists as collections of these 8,192-byte
                    containers.
                  </motion.p>

                  {/* Page visualization placeholder */}
                  <motion.div
                    className="mt-12 p-8 rounded-lg border"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    style={{
                      background: colors.oceanLight,
                      borderColor: colors.glow.healthy + '30',
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="text-sm font-mono"
                        style={{ color: colors.glow.healthy }}
                      >
                        PAGE STRUCTURE
                      </span>
                      <span
                        className="text-xs font-mono"
                        style={{ color: colors.text.muted }}
                      >
                        8,192 bytes
                      </span>
                    </div>

                    {/* Simple page diagram */}
                    <div
                      className="h-64 rounded border-2 relative overflow-hidden"
                      style={{ borderColor: colors.glow.healthy + '40' }}
                    >
                      {/* Header */}
                      <div
                        className="h-8 flex items-center px-3 text-xs font-mono"
                        style={{
                          background: colors.glow.healthy + '20',
                          color: colors.glow.healthy,
                        }}
                      >
                        Page Header (24 bytes)
                      </div>

                      {/* Line pointers */}
                      <div className="h-12 border-b px-3 py-2" style={{ borderColor: colors.glow.healthy + '20' }}>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="w-8 h-6 rounded text-xs flex items-center justify-center font-mono"
                              style={{
                                background: colors.oceanDark,
                                color: colors.text.muted,
                              }}
                            >
                              lp{i}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Free space */}
                      <div
                        className="flex-1 flex items-center justify-center text-sm"
                        style={{ color: colors.text.muted }}
                      >
                        Free Space
                      </div>

                      {/* Tuples at bottom */}
                      <div className="absolute bottom-0 left-0 right-0">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-10 border-t flex items-center px-3 text-xs font-mono"
                            style={{
                              borderColor: colors.glow.healthy + '20',
                              background: colors.oceanDark,
                              color: colors.text.secondary,
                            }}
                          >
                            Tuple {4 - i}: row data...
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 3: Understanding tuples */}
            <Scene id="tuples" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-4xl font-light mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Inside the Tuple
                  </motion.h2>

                  <motion.p
                    className="text-lg leading-relaxed mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Click any field to discover what Postgres hides beneath your data.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <InteractiveTuple />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 4: Conclusion */}
            <Scene id="conclusion" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8">
                <div className="max-w-3xl text-center">
                  <motion.h2
                    className="text-3xl md:text-5xl font-light mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Genesis Complete
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    You've seen the foundation. Pages hold tuples. Tuples carry time.
                    But this is just the beginning of the organism.
                  </motion.p>

                  <motion.button
                    className="px-8 py-4 rounded-lg text-lg font-medium transition-all"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/')}
                    style={{
                      background: `${colors.glow.healthy}20`,
                      color: colors.glow.healthy,
                      border: `1px solid ${colors.glow.healthy}40`,
                    }}
                  >
                    Return to the Organism
                  </motion.button>

                  <motion.button
                    className="mt-8 px-6 py-3 rounded-lg text-sm font-medium transition-all"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/episode/2')}
                    style={{
                      background: `${colors.glow.critical}15`,
                      color: colors.glow.critical,
                      border: `1px solid ${colors.glow.critical}40`,
                    }}
                  >
                    Next: Episode 2 — The First Heartbeat →
                  </motion.button>
                </div>
              </div>
            </Scene>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
