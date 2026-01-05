import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene } from '../../components/storytelling/Scene';
import { ScrollIndicator } from '../../components/storytelling/ScrollIndicator';
import { MemoryHierarchy } from '../../components/visualizations/MemoryHierarchy';
import { InteractiveBufferCache } from '../../components/visualizations/InteractiveBufferCache';
import { BufferEvictionDemo } from '../../components/visualizations/BufferEvictionDemo';
import { EpisodeNavigation } from '../../components/EpisodeNavigation';
import { useLenis } from '../../hooks/useLenis';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { colors } from '../../config/theme';

export function Episode04MemoryPalace() {
  const [showOpening, setShowOpening] = useState(true);
  useLenis();
  useDocumentMeta({
    title: 'Episode 4: The Memory Palace',
    description: 'How the buffer pool makes databases fast.',
  });

  // Auto-start after brief pause
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
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
                className="mb-8 relative"
              >
                {/* Memory visualization - glowing neurons */}
                <div className="relative w-32 h-32 mx-auto">
                  {/* Central neuron */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: `${colors.glow.healthy}30` }}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />

                  {/* Orbiting memory fragments */}
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute w-3 h-3 rounded-full"
                      style={{
                        background: i % 2 === 0 ? colors.glow.healthy : colors.glow.warning,
                        left: '50%',
                        top: '50%',
                        marginLeft: -6,
                        marginTop: -6,
                      }}
                      animate={{
                        x: [
                          Math.cos((i * Math.PI * 2) / 6) * 50,
                          Math.cos((i * Math.PI * 2) / 6 + Math.PI) * 50,
                          Math.cos((i * Math.PI * 2) / 6) * 50,
                        ],
                        y: [
                          Math.sin((i * Math.PI * 2) / 6) * 50,
                          Math.sin((i * Math.PI * 2) / 6 + Math.PI) * 50,
                          Math.sin((i * Math.PI * 2) / 6) * 50,
                        ],
                        opacity: [0.8, 0.3, 0.8],
                        scale: [1, 0.6, 1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}

                  {/* Brain/Memory icon */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-12 h-12"
                      fill="none"
                      stroke={colors.glow.healthy}
                      strokeWidth="1.5"
                    >
                      <path d="M12 2C9.5 2 7 3.5 7 6c0 1.5.5 2.5 1.5 3.5C7 10.5 6 12 6 14c0 2.5 1.5 4 3 5 0 1 .5 3 3 3s3-2 3-3c1.5-1 3-2.5 3-5 0-2-1-3.5-2.5-4.5C16.5 8.5 17 7.5 17 6c0-2.5-2.5-4-5-4z" />
                      <path d="M12 6v4M9 12h6M12 16v2" strokeLinecap="round" />
                    </svg>
                  </motion.div>
                </div>
              </motion.div>

              <motion.p
                className="text-sm font-mono uppercase tracking-widest mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ color: colors.glow.healthy }}
              >
                Episode 4
              </motion.p>

              <motion.h1
                className="text-4xl md:text-6xl font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                style={{ color: colors.text.primary }}
              >
                Memory Palace
              </motion.h1>

              <motion.p
                className="text-xl mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{ color: colors.text.muted }}
              >
                Where PostgreSQL stores its thoughts
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
                  <motion.p
                    className="text-2xl md:text-3xl leading-relaxed font-light"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    style={{ color: colors.text.secondary }}
                  >
                    You're sitting at dinner with an old friend, and they mention a name
                    from college. For a moment, nothing. Then, slowly, the face forms
                    in your mind.
                  </motion.p>

                  <motion.p
                    className="text-xl md:text-2xl mt-8 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    style={{ color: colors.text.muted }}
                  >
                    The database knows this feeling. Right now, inside{' '}
                    <span style={{ color: colors.glow.healthy }}>shared_buffers</span>,
                    PostgreSQL is holding its recent memories—the rows you just queried,
                    the indexes you just walked.
                  </motion.p>

                  <motion.p
                    className="text-lg mt-8 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.5 }}
                    style={{ color: colors.text.muted }}
                  >
                    Ask for something it remembers, and the response is{' '}
                    <span style={{ color: colors.glow.healthy }}>instant</span>.
                    Ask for something it's forgotten, and you'll feel the pause.
                  </motion.p>

                  <ScrollIndicator delay={2.5} />
                </div>
              </div>
            </Scene>

            {/* Scene 2: Memory Hierarchy */}
            <Scene id="hierarchy" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Memory Hierarchy
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Not all memory is created equal. The closer to the CPU, the faster—
                    but also smaller and more expensive. Click any layer to learn more.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <MemoryHierarchy />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 3: Buffer Cache */}
            <Scene id="buffers" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Inside shared_buffers
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    PostgreSQL's working memory is a pool of{' '}
                    <span style={{ color: colors.glow.healthy }}>8KB buffer slots</span>.
                    Each slot can hold one page from disk. Hot data glows bright;
                    forgotten data fades to darkness.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <InteractiveBufferCache />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 4: Eviction - The Signature Moment */}
            <Scene id="eviction" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-6xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-bold mb-4 glow-text-critical"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{
                      color: colors.text.primary,
                      textShadow: `0 0 30px ${colors.glow.critical}30`,
                    }}
                  >
                    The Art of Forgetting
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    When the buffer pool is full, PostgreSQL must decide{' '}
                    <span style={{ color: colors.glow.critical }}>what to forget</span>.
                    Watch the clock-sweep algorithm in action—the same way your brain
                    lets memories fade when you don't revisit them.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <BufferEvictionDemo />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 5: Performance */}
            <Scene id="performance" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8">
                <div className="max-w-4xl">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Buffer Hit Ratio
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    The <span style={{ color: colors.glow.healthy }}>buffer hit ratio</span> tells
                    you what percentage of reads come from memory vs. disk.
                    A healthy database should be above 99%.
                  </motion.p>

                  <motion.div
                    className="p-8 rounded-xl mb-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    style={{
                      background: `linear-gradient(135deg, ${colors.oceanLight} 0%, ${colors.glow.healthy}08 100%)`,
                      border: `2px solid ${colors.glow.healthy}40`,
                    }}
                  >
                    <p
                      className="font-mono text-sm mb-4"
                      style={{ color: colors.text.muted }}
                    >
                      Check your hit ratio:
                    </p>
                    <code
                      className="block p-4 rounded-lg text-sm overflow-x-auto"
                      style={{ background: colors.oceanDark, color: colors.glow.healthy }}
                    >
                      SELECT<br />
                      &nbsp;&nbsp;sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS ratio<br />
                      FROM pg_statio_user_tables;
                    </code>
                  </motion.div>

                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    {[
                      { ratio: '< 90%', status: 'Critical', color: colors.glow.critical, desc: 'Add more shared_buffers or review queries' },
                      { ratio: '90-99%', status: 'Okay', color: colors.glow.warning, desc: 'Could be improved with tuning' },
                      { ratio: '> 99%', status: 'Healthy', color: colors.glow.healthy, desc: 'Working set fits in memory' },
                    ].map((item) => (
                      <div
                        key={item.ratio}
                        className="p-4 rounded-lg text-center"
                        style={{ background: colors.oceanDark }}
                      >
                        <p className="font-mono text-2xl mb-1" style={{ color: item.color }}>
                          {item.ratio}
                        </p>
                        <p className="font-medium mb-2" style={{ color: colors.text.primary }}>
                          {item.status}
                        </p>
                        <p className="text-xs" style={{ color: colors.text.muted }}>
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 6: Conclusion - Return to Metaphor */}
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
                    Memory Is Performance
                  </motion.h2>

                  {/* Return to the dinner metaphor */}
                  <motion.p
                    className="text-xl leading-relaxed mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Remember that face from college? That moment of retrieval—the pause
                    before recognition—your database experiences this{' '}
                    <span style={{ color: colors.glow.healthy }}>thousands of times per second</span>.
                  </motion.p>

                  <motion.p
                    className="text-lg leading-relaxed mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    style={{ color: colors.text.muted }}
                  >
                    The difference between a 1ms query and a 100ms query often comes down
                    to one thing: was the data in{' '}
                    <span style={{ color: colors.glow.healthy }}>shared_buffers</span>,
                    or did PostgreSQL have to reach into cold storage?
                  </motion.p>

                  <motion.div
                    className="p-6 rounded-xl mb-12"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    style={{
                      background: `linear-gradient(135deg, ${colors.oceanLight} 0%, ${colors.glow.healthy}08 100%)`,
                      border: `1px solid ${colors.glow.healthy}30`,
                    }}
                  >
                    <p className="text-lg" style={{ color: colors.text.secondary }}>
                      Your database's <span style={{ color: colors.glow.healthy }}>working set</span>{' '}
                      should fit in shared_buffers. If it doesn't, every query becomes
                      that awkward pause at dinner—except your users won't wait politely.
                    </p>
                  </motion.div>

                  <EpisodeNavigation currentEpisode={4} />
                </div>
              </div>
            </Scene>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
