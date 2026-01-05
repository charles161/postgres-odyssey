import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene } from '../../components/storytelling/Scene';
import { ScrollIndicator } from '../../components/storytelling/ScrollIndicator';
import { DataTypeShowdown } from '../../components/visualizations/DataTypeShowdown';
import { ConstraintDefense } from '../../components/visualizations/ConstraintDefense';
import { EpisodeNavigation } from '../../components/EpisodeNavigation';
import { useLenis } from '../../hooks/useLenis';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { colors } from '../../config/theme';

export function Episode02Blueprint() {
  const [showOpening, setShowOpening] = useState(true);
  useLenis();
  useDocumentMeta({
    title: 'Episode 2: The Blueprint',
    description: 'Schema design decisions that haunt you for years.',
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
                {/* DNA helix visualization */}
                <div className="relative w-32 h-32 mx-auto">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute w-4 h-4 rounded-full"
                      style={{
                        background: i % 2 === 0 ? colors.glow.healthy : colors.glow.warning,
                        left: '50%',
                        top: `${10 + i * 18}%`,
                      }}
                      animate={{
                        x: [
                          Math.sin((i * Math.PI) / 3) * 30 - 8,
                          Math.sin((i * Math.PI) / 3 + Math.PI) * 30 - 8,
                          Math.sin((i * Math.PI) / 3) * 30 - 8,
                        ],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                  {/* Connecting lines */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  >
                    <div
                      className="absolute top-1/2 left-1/2 w-16 h-0.5 -translate-x-1/2 -translate-y-1/2"
                      style={{ background: `${colors.glow.healthy}40` }}
                    />
                  </motion.div>
                </div>
              </motion.div>

              <motion.p
                className="text-sm uppercase tracking-[0.3em] mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ color: colors.glow.healthy }}
              >
                Episode 2
              </motion.p>

              <motion.h1
                className="text-5xl md:text-7xl font-light tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                style={{ color: colors.text.primary }}
              >
                The Blueprint
              </motion.h1>

              <motion.p
                className="text-lg mt-4 max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{ color: colors.text.secondary }}
              >
                Schema decisions that haunt you for years
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
            {/* Scene 1: The Warning */}
            <Scene id="warning" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8">
                <div className="max-w-3xl text-center">
                  <motion.p
                    className="text-2xl md:text-3xl leading-relaxed font-light"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Before you write your first{' '}
                    <span className="font-mono" style={{ color: colors.glow.healthy }}>
                      CREATE TABLE
                    </span>
                    , understand this:
                  </motion.p>

                  <motion.p
                    className="text-3xl md:text-4xl mt-8 font-medium"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    style={{ color: colors.glow.critical }}
                  >
                    Schema decisions made on day one haunt you for years.
                  </motion.p>

                  <motion.p
                    className="text-lg mt-8 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.5 }}
                    style={{ color: colors.text.muted }}
                  >
                    The wrong data type silently corrupts. The missing constraint lets bad data slip through.
                    The application crashes at 3 AM, and you trace it back to a schema choice from 2019.
                  </motion.p>

                  <ScrollIndicator />
                </div>
              </div>
            </Scene>

            {/* Scene 2: Data Types That Matter */}
            <Scene id="data-types" minHeight="150vh">
              <div className="flex flex-col items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-light mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Data Types That Matter
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    PostgreSQL has over 40 built-in data types. Most developers use 5.
                    Here are the choices that separate production-ready schemas from ticking time bombs.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <DataTypeShowdown />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 3: Constraints */}
            <Scene id="constraints" minHeight="150vh">
              <div className="flex flex-col items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-light mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Constraints: Your Last Line of Defense
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    "The application will validate it" is how data corruption happens.
                    When your application has a bug, the database should reject bad data.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <ConstraintDefense />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 4: Key Takeaways */}
            <Scene id="takeaways" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8">
                <div className="max-w-4xl">
                  <motion.h2
                    className="text-3xl md:text-4xl font-light mb-12"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Rules of Schema Design
                  </motion.h2>

                  <div className="grid gap-6">
                    {[
                      {
                        rule: 'Always use TIMESTAMPTZ, never TIMESTAMP',
                        why: 'Timezone bugs are silent data corruption',
                        color: colors.glow.critical,
                      },
                      {
                        rule: 'Store money as INTEGER cents',
                        why: 'Floating point errors compound into real money',
                        color: colors.glow.warning,
                      },
                      {
                        rule: 'Use TEXT, not VARCHAR(n)',
                        why: 'VARCHAR limits don\'t improve performance in Postgres',
                        color: colors.glow.healthy,
                      },
                      {
                        rule: 'UUID for external IDs, SERIAL for internal',
                        why: 'Prevent enumeration attacks and allow distribution',
                        color: colors.glow.healthy,
                      },
                      {
                        rule: 'Add constraints at the database level',
                        why: 'The application will have bugs. The database shouldn\'t.',
                        color: colors.glow.critical,
                      },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        className="p-6 rounded-xl"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        style={{
                          background: colors.oceanLight,
                          border: `1px solid ${item.color}30`,
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                            style={{ background: item.color }}
                          />
                          <div>
                            <p className="text-lg font-medium" style={{ color: colors.text.primary }}>
                              {item.rule}
                            </p>
                            <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
                              {item.why}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </Scene>

            {/* Scene 5: Conclusion */}
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
                    Blueprint Complete
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Your schema is the DNA of your application. Get the types right.
                    Add the constraints. Let the database be your last line of defense.
                  </motion.p>

                  <EpisodeNavigation currentEpisode={2} />
                </div>
              </div>
            </Scene>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
