import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene } from '../../components/storytelling/Scene';
import { ScrollIndicator } from '../../components/storytelling/ScrollIndicator';
import { ChapterCardInline } from '../../components/storytelling/ChapterCard';
import { colors } from '../../config/theme';
import { PartitionDemo } from '../../components/visualizations/PartitionDemo';
import { EpisodeNavigation } from '../../components/EpisodeNavigation';
import { useLenis } from '../../hooks/useLenis';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';

export function Episode14Partitioning() {
  const [showOpening, setShowOpening] = useState(true);
  useLenis();
  useDocumentMeta({
    title: 'Episode 14: Partitioning',
    description: 'Table partitioning and partition pruning.',
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
                {/* Table division animation */}
                <div className="relative w-64 h-32 mx-auto flex items-center justify-center">
                  {/* Single large table */}
                  <motion.div
                    className="absolute w-16 h-24 rounded-lg"
                    style={{
                      background: colors.glow.critical + '30',
                      border: `2px solid ${colors.glow.critical}`,
                    }}
                    animate={{
                      scaleX: [1, 0.5, 0],
                      x: [0, -20, -40],
                      opacity: [1, 0.5, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />

                  {/* Split into partitions */}
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute w-10 h-16 rounded"
                      style={{
                        background: colors.glow.healthy + '30',
                        border: `1px solid ${colors.glow.healthy}`,
                        left: `${30 + i * 50}px`,
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: [0, 1, 1],
                        scale: [0, 1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                        delay: 1 + i * 0.15,
                      }}
                    />
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="text-xs font-mono mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ color: colors.glow.warning }}
              >
                PART 2: THE FLEET
              </motion.div>

              <motion.p
                className="text-sm uppercase tracking-[0.3em] mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ color: colors.glow.healthy }}
              >
                Episode 14
              </motion.p>

              <motion.h1
                className="text-5xl md:text-7xl font-light tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                style={{ color: colors.text.primary }}
              >
                Organ Specialization
              </motion.h1>

              <motion.p
                className="text-lg mt-4 max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{ color: colors.text.secondary }}
              >
                Dividing one giant table into manageable pieces
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
                      Replicas handle read scaling.
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed"
                      style={{ color: colors.text.muted }}
                    >
                      But what happens when a single{' '}
                      <span style={{ color: colors.glow.critical }}>table</span> grows to billions of rows?
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed mt-8"
                      style={{ color: colors.glow.healthy }}
                    >
                      Time to <strong>divide and conquer</strong>.
                    </p>
                  </motion.div>

                  <ScrollIndicator delay={1.5} />
                </div>
              </div>
            </Scene>

            {/* Scene 2: The Problem */}
            <Scene id="problem" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    One Table, Billions of Rows
                  </motion.h2>

                  <motion.div
                    className="p-6 rounded-xl mb-8"
                    style={{
                      background: colors.glow.critical + '10',
                      border: `1px solid ${colors.glow.critical}40`,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <div className="grid md:grid-cols-3 gap-6 text-center">
                      <div>
                        <div className="text-3xl font-mono mb-2" style={{ color: colors.glow.critical }}>
                          2B
                        </div>
                        <div className="text-sm" style={{ color: colors.text.muted }}>rows in orders table</div>
                      </div>
                      <div>
                        <div className="text-3xl font-mono mb-2" style={{ color: colors.glow.critical }}>
                          500GB
                        </div>
                        <div className="text-sm" style={{ color: colors.text.muted }}>table size on disk</div>
                      </div>
                      <div>
                        <div className="text-3xl font-mono mb-2" style={{ color: colors.glow.critical }}>
                          4hrs
                        </div>
                        <div className="text-sm" style={{ color: colors.text.muted }}>to VACUUM</div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="grid md:grid-cols-2 gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <div
                      className="p-4 rounded-lg"
                      style={{ background: colors.oceanLight }}
                    >
                      <div className="text-sm font-bold mb-2" style={{ color: colors.glow.critical }}>
                        Problems
                      </div>
                      <ul className="text-sm space-y-2" style={{ color: colors.text.secondary }}>
                        <li>• Index scans still slow (too many rows)</li>
                        <li>• VACUUM takes hours, locks resources</li>
                        <li>• Can't drop old data easily</li>
                        <li>• Backup/restore takes forever</li>
                      </ul>
                    </div>

                    <div
                      className="p-4 rounded-lg"
                      style={{ background: colors.oceanLight }}
                    >
                      <div className="text-sm font-bold mb-2" style={{ color: colors.text.secondary }}>
                        Common Scenario
                      </div>
                      <p className="text-sm" style={{ color: colors.text.muted }}>
                        "We need orders from March 2024, but query scans the entire table
                        even with an index on created_at. Index has 2 billion entries!"
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="What if we could organize data by when it's accessed?"
                accentColor={colors.text.secondary}
              />
            </div>

            {/* Scene 3: Organ Specialization Metaphor */}
            <Scene id="specialization" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Organ Specialization
                  </motion.h2>

                  <motion.div
                    className="grid md:grid-cols-2 gap-8 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <div
                      className="p-6 rounded-xl text-center"
                      style={{
                        background: colors.glow.critical + '10',
                        border: `1px solid ${colors.glow.critical}40`,
                      }}
                    >
                      <div className="text-4xl mb-4">🫀</div>
                      <div className="text-lg font-bold mb-2" style={{ color: colors.glow.critical }}>
                        One Giant Organ
                      </div>
                      <p className="text-sm" style={{ color: colors.text.secondary }}>
                        Everything in one place. Works, but inefficient as it grows.
                      </p>
                    </div>

                    <div
                      className="p-6 rounded-xl text-center"
                      style={{
                        background: colors.glow.healthy + '10',
                        border: `1px solid ${colors.glow.healthy}40`,
                      }}
                    >
                      <div className="text-4xl mb-4">🫁❤️🧠🦴</div>
                      <div className="text-lg font-bold mb-2" style={{ color: colors.glow.healthy }}>
                        Specialized Organs
                      </div>
                      <p className="text-sm" style={{ color: colors.text.secondary }}>
                        Each part handles its own domain. Scale and maintain independently.
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="p-6 rounded-xl"
                    style={{ background: colors.oceanDark }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <div className="text-center" style={{ color: colors.text.secondary }}>
                      <p className="mb-4">
                        <strong style={{ color: colors.glow.healthy }}>Partitioning</strong> divides one
                        logical table into multiple physical tables.
                      </p>
                      <p className="text-sm" style={{ color: colors.text.muted }}>
                        Your app still sees one "orders" table. PostgreSQL routes queries to the right partition.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="Three strategies for splitting data."
                accentColor={colors.glow.healthy}
              />
            </div>

            {/* Scene 4: Partition Types */}
            <Scene id="types" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Three Ways to Partition
                  </motion.h2>

                  <div className="space-y-6">
                    {/* Range */}
                    <motion.div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.glow.healthy + '10',
                        border: `1px solid ${colors.glow.healthy}40`,
                      }}
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-24 h-16 rounded flex items-center justify-center text-sm font-mono flex-shrink-0"
                          style={{
                            background: colors.glow.healthy + '30',
                            color: colors.glow.healthy,
                          }}
                        >
                          RANGE
                        </div>
                        <div>
                          <p className="mb-2" style={{ color: colors.text.secondary }}>
                            Split by value ranges. Perfect for <strong>time-series data</strong>.
                          </p>
                          <code className="text-xs block p-2 rounded" style={{ background: colors.oceanDark, color: colors.text.muted }}>
                            PARTITION BY RANGE (created_at)
                            <br />
                            -- orders_2024_01, orders_2024_02, ...
                          </code>
                        </div>
                      </div>
                    </motion.div>

                    {/* List */}
                    <motion.div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.glow.warning + '10',
                        border: `1px solid ${colors.glow.warning}40`,
                      }}
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-24 h-16 rounded flex items-center justify-center text-sm font-mono flex-shrink-0"
                          style={{
                            background: colors.glow.warning + '30',
                            color: colors.glow.warning,
                          }}
                        >
                          LIST
                        </div>
                        <div>
                          <p className="mb-2" style={{ color: colors.text.secondary }}>
                            Split by specific values. Good for <strong>categories, regions</strong>.
                          </p>
                          <code className="text-xs block p-2 rounded" style={{ background: colors.oceanDark, color: colors.text.muted }}>
                            PARTITION BY LIST (region)
                            <br />
                            -- orders_us, orders_eu, orders_apac
                          </code>
                        </div>
                      </div>
                    </motion.div>

                    {/* Hash */}
                    <motion.div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.oceanLight,
                        border: `1px solid ${colors.text.muted}30`,
                      }}
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-24 h-16 rounded flex items-center justify-center text-sm font-mono flex-shrink-0"
                          style={{
                            background: colors.text.muted + '30',
                            color: colors.text.secondary,
                          }}
                        >
                          HASH
                        </div>
                        <div>
                          <p className="mb-2" style={{ color: colors.text.secondary }}>
                            Split evenly by hash. For <strong>even distribution</strong>.
                          </p>
                          <code className="text-xs block p-2 rounded" style={{ background: colors.oceanDark, color: colors.text.muted }}>
                            PARTITION BY HASH (user_id)
                            <br />
                            -- orders_p0, orders_p1, orders_p2, orders_p3
                          </code>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="The real magic: partition pruning."
                accentColor={colors.glow.warning}
              />
            </div>

            {/* Scene 5: Partition Pruning */}
            <Scene id="pruning" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Partition Pruning: The Magic
                  </motion.h2>

                  <motion.div
                    className="p-6 rounded-xl mb-8"
                    style={{ background: colors.oceanDark }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <pre className="text-sm font-mono overflow-x-auto" style={{ color: colors.text.secondary }}>
{`-- Query for March 2024 orders
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE created_at >= '2024-03-01'
  AND created_at < '2024-04-01';

-- Result:
-- Append  (cost=0.00..1523.00 rows=50000 ...)
--   ->  Seq Scan on orders_2024_03  <- ONLY this partition!
--         Filter: (created_at >= ... AND created_at < ...)

-- Partitions pruned: 11 of 12`}
                    </pre>
                  </motion.div>

                  <motion.div
                    className="grid md:grid-cols-2 gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <div
                      className="p-4 rounded-lg"
                      style={{
                        background: colors.glow.healthy + '10',
                        border: `1px solid ${colors.glow.healthy}30`,
                      }}
                    >
                      <div className="text-sm font-bold mb-2" style={{ color: colors.glow.healthy }}>
                        What Happened
                      </div>
                      <ul className="text-sm space-y-1" style={{ color: colors.text.secondary }}>
                        <li>• PostgreSQL saw WHERE clause</li>
                        <li>• Checked partition boundaries</li>
                        <li>• Skipped 11 partitions entirely</li>
                        <li>• Only scanned March partition</li>
                      </ul>
                    </div>

                    <div
                      className="p-4 rounded-lg"
                      style={{
                        background: colors.glow.warning + '10',
                        border: `1px solid ${colors.glow.warning}30`,
                      }}
                    >
                      <div className="text-sm font-bold mb-2" style={{ color: colors.glow.warning }}>
                        When Pruning Works
                      </div>
                      <ul className="text-sm space-y-1" style={{ color: colors.text.secondary }}>
                        <li>• Query includes partition key in WHERE</li>
                        <li>• Condition is on the exact column</li>
                        <li>• No functions on the column</li>
                        <li>• ✗ WHERE date_trunc('month', created_at)</li>
                      </ul>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="Partitioning isn't free. Know when to use it."
                accentColor={colors.text.secondary}
              />
            </div>

            {/* Scene 6: When to Partition */}
            <Scene id="when" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    When to Partition
                  </motion.h2>

                  <motion.div
                    className="grid md:grid-cols-2 gap-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.glow.healthy + '10',
                        border: `1px solid ${colors.glow.healthy}40`,
                      }}
                    >
                      <div className="text-lg font-bold mb-4" style={{ color: colors.glow.healthy }}>
                        Good Candidates
                      </div>
                      <ul className="text-sm space-y-3" style={{ color: colors.text.secondary }}>
                        <li>
                          <strong>Time-series data</strong>
                          <br />
                          <span style={{ color: colors.text.muted }}>Logs, events, orders with dates</span>
                        </li>
                        <li>
                          <strong>100M+ rows</strong>
                          <br />
                          <span style={{ color: colors.text.muted }}>Smaller tables don't need it</span>
                        </li>
                        <li>
                          <strong>Queries always filter by partition key</strong>
                          <br />
                          <span style={{ color: colors.text.muted }}>WHERE created_at = ...</span>
                        </li>
                        <li>
                          <strong>Need to drop old data</strong>
                          <br />
                          <span style={{ color: colors.text.muted }}>DROP PARTITION is instant</span>
                        </li>
                      </ul>
                    </div>

                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.glow.critical + '10',
                        border: `1px solid ${colors.glow.critical}40`,
                      }}
                    >
                      <div className="text-lg font-bold mb-4" style={{ color: colors.glow.critical }}>
                        Bad Candidates
                      </div>
                      <ul className="text-sm space-y-3" style={{ color: colors.text.secondary }}>
                        <li>
                          <strong>Small tables</strong>
                          <br />
                          <span style={{ color: colors.text.muted }}>Under 10M rows, not worth complexity</span>
                        </li>
                        <li>
                          <strong>Queries don't use partition key</strong>
                          <br />
                          <span style={{ color: colors.text.muted }}>No pruning = scan all partitions</span>
                        </li>
                        <li>
                          <strong>Many cross-partition queries</strong>
                          <br />
                          <span style={{ color: colors.text.muted }}>JOINs across partitions are expensive</span>
                        </li>
                        <li>
                          <strong>"Just in case"</strong>
                          <br />
                          <span style={{ color: colors.text.muted }}>Premature optimization</span>
                        </li>
                      </ul>
                    </div>
                  </motion.div>

                  <motion.div
                    className="p-4 rounded-lg text-center"
                    style={{ background: colors.oceanDark }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <p className="text-sm" style={{ color: colors.text.muted }}>
                      <strong style={{ color: colors.glow.warning }}>Remember:</strong> Same machine,
                      better organized. Partitioning doesn't add capacity—it makes existing capacity more efficient.
                    </p>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="Let's see partitioning in action."
                accentColor={colors.glow.healthy}
              />
            </div>

            {/* Scene 7: Interactive Demo */}
            <Scene id="demo" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Partition Pruning Simulator
                  </motion.h2>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <PartitionDemo />
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
                    Divide and Conquer
                  </motion.h2>

                  <motion.div
                    className="space-y-6 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.healthy }}>Partitioning</span> divides giant
                      tables into manageable physical pieces.
                    </p>
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.warning }}>Partition pruning</span> skips
                      irrelevant partitions entirely—like having a smaller index.
                    </p>
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.critical }}>DROP PARTITION</span> is instant—no
                      more DELETE of millions of rows.
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
                      You've mastered the fleet: replicas for reads, partitions for data size.
                      <br />
                      But what lies beyond the single database?
                    </p>
                    <p className="text-lg mt-4" style={{ color: colors.glow.healthy }}>
                      Next: <strong>Beyond the Machine</strong>—the finale awaits.
                    </p>
                  </motion.div>

                  <EpisodeNavigation currentEpisode={14} />
                </div>
              </div>
            </Scene>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
