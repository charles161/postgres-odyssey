import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene } from '../../components/storytelling/Scene';
import { ChapterCardInline } from '../../components/storytelling/ChapterCard';
import { PathwaysOpening } from '../../components/visualizations/PathwaysOpening';
import { SequentialScanDemo } from '../../components/visualizations/SequentialScanDemo';
import { BTreeNavigator } from '../../components/visualizations/BTreeNavigator';
import { HeapHopVisualizer } from '../../components/visualizations/HeapHopVisualizer';
import { SplitScreenComparison } from '../../components/visualizations/SplitScreenComparison';
import { IndexAnatomyVisualizer } from '../../components/visualizations/IndexAnatomyVisualizer';
import { useLenis } from '../../hooks/useLenis';
import { ScrollTrigger } from '../../lib/gsap';
import { colors } from '../../config/theme';

const SECTIONS = [
  '#intro',
  '#heap',
  '#problem',
  '#solution',
  '#navigator',
  '#heap-hop',
  '#comparison',
  '#conclusion',
];

export function Episode05Pathways() {
  const navigate = useNavigate();
  const [showOpening, setShowOpening] = useState(true);
  useLenis(); // Smooth scroll only, no snapping

  // Track current section for potential future use
  useEffect(() => {
    if (showOpening) return;

    const triggers = SECTIONS.map((selector) => {
      return ScrollTrigger.create({
        trigger: selector,
        start: 'top center',
        end: 'bottom center',
      });
    });

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, [showOpening]);

  return (
    <div style={{ background: colors.ocean }}>
      {/* Opening - Sequential Scan Horror */}
      <AnimatePresence>
        {showOpening && (
          <PathwaysOpening onComplete={() => setShowOpening(false)} />
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
            {/* Scene 1: Introduction - with prerequisite callback */}
            <Scene id="intro" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8">
                <div className="max-w-3xl text-center">
                  {/* Prerequisite callback - bridge from earlier episodes */}
                  <motion.div
                    className="mb-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <p
                      className="text-sm uppercase tracking-widest mb-6"
                      style={{ color: colors.text.muted }}
                    >
                      Building on what you know
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center text-sm">
                      <span
                        className="px-4 py-2 rounded-full"
                        style={{
                          background: `${colors.glow.healthy}15`,
                          color: colors.glow.healthy,
                          border: `1px solid ${colors.glow.healthy}30`,
                        }}
                      >
                        Episode 1: Rows live in 8KB pages
                      </span>
                      <span
                        className="px-4 py-2 rounded-full"
                        style={{
                          background: `${colors.glow.warning}15`,
                          color: colors.glow.warning,
                          border: `1px solid ${colors.glow.warning}30`,
                        }}
                      >
                        Episode 4: Each row has xmin/xmax
                      </span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  >
                    <p
                      className="text-2xl md:text-3xl leading-relaxed font-light mb-8"
                      style={{ color: colors.text.secondary }}
                    >
                      You just watched PostgreSQL scan{' '}
                      <span style={{ color: colors.glow.warning }}>847,293 pages</span> to find one
                      row.
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed"
                      style={{ color: colors.text.muted }}
                    >
                      The data was there all along. PostgreSQL just didn't know{' '}
                      <span style={{ color: colors.glow.healthy }}>where to look</span>.
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed mt-8"
                      style={{ color: colors.glow.healthy }}
                    >
                      That's what <strong>indexes</strong> solve.
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

            {/* Scene 2: The Heap - Terminology Bridge */}
            <Scene id="heap" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Heap
                  </motion.h2>

                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      Remember those{' '}
                      <span style={{ color: colors.glow.healthy }}>8KB pages</span> holding your
                      tuples from Episode 1?
                    </p>

                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      PostgreSQL has a name for this{' '}
                      <em>entire collection</em> of pages:{' '}
                      <strong style={{ color: colors.text.primary }}>the Heap</strong>.
                    </p>

                    {/* Terminology clarification box */}
                    <div
                      className="p-5 rounded-lg"
                      style={{
                        background: `${colors.glow.healthy}10`,
                        border: `1px solid ${colors.glow.healthy}30`,
                      }}
                    >
                      <p className="text-sm font-medium mb-3" style={{ color: colors.glow.healthy }}>
                        The naming hierarchy
                      </p>

                      {/* Visual hierarchy */}
                      <div className="space-y-3 font-mono text-sm">
                        <div className="flex items-center gap-3">
                          <span
                            className="px-3 py-1.5 rounded"
                            style={{ background: colors.oceanDark, color: colors.text.primary }}
                          >
                            Table "users"
                          </span>
                          <span style={{ color: colors.text.muted }}>→ has its own</span>
                          <span
                            className="px-3 py-1.5 rounded"
                            style={{ background: `${colors.glow.warning}20`, color: colors.glow.warning }}
                          >
                            Heap (file)
                          </span>
                        </div>

                        <div className="flex items-center gap-3 pl-8">
                          <span style={{ color: colors.text.muted }}>↳ contains</span>
                          <span
                            className="px-3 py-1.5 rounded"
                            style={{ background: `${colors.glow.healthy}20`, color: colors.glow.healthy }}
                          >
                            Pages (8KB blocks)
                          </span>
                        </div>

                        <div className="flex items-center gap-3 pl-16">
                          <span style={{ color: colors.text.muted }}>↳ contain</span>
                          <span
                            className="px-3 py-1.5 rounded"
                            style={{ background: colors.ocean, color: colors.text.secondary, border: `1px solid ${colors.text.muted}40` }}
                          >
                            Tuples (rows)
                          </span>
                        </div>
                      </div>

                      <div
                        className="mt-4 pt-4"
                        style={{ borderTop: `1px solid ${colors.glow.healthy}20` }}
                      >
                        <p className="text-sm" style={{ color: colors.text.muted }}>
                          <strong style={{ color: colors.text.secondary }}>Key point:</strong> Each table has its own heap file.
                          A page only contains rows from <em>one</em> table—never mixed.
                        </p>
                      </div>
                    </div>

                    <p className="text-lg leading-relaxed" style={{ color: colors.text.muted }}>
                      Why "heap"? Because rows land wherever there's space—no sorting, no
                      ordering, just a pile.
                    </p>

                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.oceanDark,
                        border: `1px solid ${colors.text.muted}20`,
                      }}
                    >
                      <p className="text-lg mb-4" style={{ color: colors.text.secondary }}>
                        The heap is{' '}
                        <span style={{ color: colors.glow.critical }}>unordered</span>. Tuples are
                        stored wherever there's free space.
                      </p>

                      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                        {[...Array(16)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="aspect-square rounded flex items-center justify-center text-xs font-mono"
                            style={{
                              background: colors.ocean,
                              border: `1px solid ${colors.text.muted}40`,
                              color: colors.text.muted,
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.02 }}
                          >
                            {Math.floor(Math.random() * 100)}
                          </motion.div>
                        ))}
                      </div>

                      <p className="text-sm mt-4" style={{ color: colors.text.muted }}>
                        No order. ID 42 could be on page 1. ID 1 could be on page 847,293.
                      </p>
                    </div>

                    <p className="text-lg" style={{ color: colors.text.muted }}>
                      To find a specific row, PostgreSQL must scan{' '}
                      <strong>every single page</strong>. That's a{' '}
                      <span style={{ color: colors.glow.warning }}>sequential scan</span>.
                    </p>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="The heap is chaos. Indexes bring order."
                accentColor={colors.text.secondary}
              />
            </div>

            {/* Scene 3: The Problem - Sequential Scan Demo */}
            <Scene id="problem" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Brute Force
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Watch what happens when PostgreSQL searches without an index.
                    <br />
                    <span style={{ color: colors.text.muted }}>
                      Every page. Every row. Until we find the match.
                    </span>
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <SequentialScanDemo />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="What if we built a sorted shortcut?"
                accentColor={colors.glow.healthy}
              />
            </div>

            {/* Scene 4: The Solution - B-tree Intro */}
            <Scene id="solution" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The B-tree
                  </motion.h2>

                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      An index is a{' '}
                      <span style={{ color: colors.glow.healthy }}>sorted structure</span> that
                      points to the heap.
                    </p>

                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      PostgreSQL's default index is the{' '}
                      <strong style={{ color: colors.text.primary }}>B-tree</strong> (Balanced
                      tree).
                    </p>

                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.oceanDark,
                        border: `1px solid ${colors.glow.healthy}40`,
                      }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4
                            className="font-medium mb-2"
                            style={{ color: colors.glow.healthy }}
                          >
                            Sorted
                          </h4>
                          <p className="text-sm" style={{ color: colors.text.muted }}>
                            Keys are in order. We can binary search instead of scanning.
                          </p>
                        </div>
                        <div>
                          <h4
                            className="font-medium mb-2"
                            style={{ color: colors.glow.warning }}
                          >
                            Compact
                          </h4>
                          <p className="text-sm" style={{ color: colors.text.muted }}>
                            Only stores the indexed column + a pointer (ctid).
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2" style={{ color: colors.text.primary }}>
                            O(log n)
                          </h4>
                          <p className="text-sm" style={{ color: colors.text.muted }}>
                            3 levels = 3 page reads, regardless of table size.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-4 rounded-lg font-mono text-sm"
                      style={{
                        background: colors.ocean,
                        border: `1px solid ${colors.text.muted}20`,
                      }}
                    >
                      <span style={{ color: colors.glow.healthy }}>CREATE INDEX</span>
                      <span style={{ color: colors.text.secondary }}> idx_users_email </span>
                      <span style={{ color: colors.glow.healthy }}>ON</span>
                      <span style={{ color: colors.text.secondary }}> users(email)</span>
                    </div>
                  </motion.div>

                  {/* Index vs Heap Anatomy */}
                  <motion.div
                    className="mt-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <IndexAnatomyVisualizer />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 5: B-tree Navigator */}
            <Scene id="navigator" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-6xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Navigate the Tree
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Watch how PostgreSQL navigates the B-tree. At each level, it decides which
                    child to follow.
                    <br />
                    <span style={{ color: colors.text.muted }}>
                      Root → Internal Node → Leaf → Found.
                    </span>
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <BTreeNavigator />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="The index knows WHERE. But does it know IF?"
                accentColor={colors.glow.warning}
              />
            </div>

            {/* Scene 6: The Heap Hop */}
            <Scene id="heap-hop" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-6xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Heap Hop
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-4 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    The B-tree gave us{' '}
                    <span style={{ color: colors.glow.healthy }}>ctid = (38, 3)</span>. This is a{' '}
                    <strong>physical address</strong>—literally "go to page 38, slot 3 in the heap
                    file."
                  </motion.p>

                  <motion.p
                    className="text-lg leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    style={{ color: colors.text.muted }}
                  >
                    PostgreSQL seeks to{' '}
                    <span className="font-mono" style={{ color: colors.glow.warning }}>
                      page × 8KB = 304KB
                    </span>{' '}
                    in the heap file, reads that page, and finds slot 3. But the index doesn't
                    store visibility info—we still need to check{' '}
                    <span style={{ color: colors.glow.warning }}>xmin/xmax</span>.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <HeapHopVisualizer />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="Now let's see the difference in numbers."
                accentColor={colors.glow.healthy}
              />
            </div>

            {/* Scene 7: The Comparison Climax */}
            <Scene id="comparison" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Numbers Don't Lie
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Watch both approaches race to find the same row.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <SplitScreenComparison />
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
                    The Nervous System
                  </motion.h2>

                  <motion.div
                    className="space-y-6 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.healthy }}>Indexes</span> are pre-built
                      pathways—like the nervous system routing signals directly.
                    </p>
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.warning }}>The heap</span> is the body—raw,
                      unordered, complete.
                    </p>
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.text.primary }}>The hop</span> is necessary—only
                      the heap has visibility info.
                    </p>
                    <p className="text-lg leading-relaxed mt-8" style={{ color: colors.text.muted }}>
                      Unless the page is "all-visible"... but that's for Episode 9.
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
                      You now know how PostgreSQL finds data fast.
                      <br />
                      But how does it <strong>decide</strong> to use an index?
                    </p>
                    <p className="text-lg mt-4" style={{ color: colors.glow.healthy }}>
                      That's the <strong>Query Planner</strong>—Episode 6.
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
                      onClick={() => navigate('/episode/4')}
                      style={{
                        background: colors.oceanLight,
                        color: colors.text.secondary,
                        border: `1px solid ${colors.text.muted}40`,
                      }}
                    >
                      ← Episode 4: The Many Lives
                    </motion.button>

                    <motion.button
                      className="px-8 py-4 rounded-lg text-lg font-medium transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/episode/6')}
                      style={{
                        background: `${colors.glow.healthy}20`,
                        color: colors.glow.healthy,
                        border: `1px solid ${colors.glow.healthy}40`,
                      }}
                    >
                      Episode 6: The Strategy Room →
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </Scene>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
