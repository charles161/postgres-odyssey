import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene } from '../../components/storytelling/Scene';
import { ScrollIndicator } from '../../components/storytelling/ScrollIndicator';
import { ChapterCardInline } from '../../components/storytelling/ChapterCard';
import { colors } from '../../config/theme';
import { ShardingDemo } from '../../components/visualizations/ShardingDemo';
import { EpisodeComplete } from '../../components/EpisodeComplete';
import { useLenis } from '../../hooks/useLenis';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';

export function Episode15Finale() {
  const [showOpening, setShowOpening] = useState(true);
  useLenis();
  useDocumentMeta({
    title: 'Episode 15: The Finale',
    description: 'Sharding, CAP theorem, and distributed PostgreSQL.',
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
                {/* Multiple databases animation */}
                <div className="relative w-64 h-32 mx-auto flex items-center justify-center gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-12 h-14 rounded-lg flex items-center justify-center"
                      style={{
                        background: colors.oceanDark,
                        border: `2px solid ${
                          [colors.glow.healthy, colors.glow.warning, colors.glow.critical, '#9333ea'][i]
                        }`,
                      }}
                      animate={{
                        y: [0, -8, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    >
                      <span className="text-lg">🐘</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="text-xs font-mono mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ color: colors.glow.critical }}
              >
                THE FINALE
              </motion.div>

              <motion.p
                className="text-sm uppercase tracking-[0.3em] mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ color: colors.glow.critical }}
              >
                Episode 15
              </motion.p>

              <motion.h1
                className="text-5xl md:text-7xl font-light tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                style={{ color: colors.text.primary }}
              >
                Beyond the Machine
              </motion.h1>

              <motion.p
                className="text-lg mt-4 max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{ color: colors.text.secondary }}
              >
                When one database isn't enough
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
                      You've mastered the single machine and the fleet.
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed"
                      style={{ color: colors.text.muted }}
                    >
                      But what happens when even that{' '}
                      <span style={{ color: colors.glow.critical }}>isn't enough</span>?
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed mt-8"
                      style={{ color: colors.glow.healthy }}
                    >
                      Welcome to the <strong>final frontier</strong>.
                    </p>
                  </motion.div>

                  <ScrollIndicator delay={1.5} />
                </div>
              </div>
            </Scene>

            {/* Scene 2: Sharding Intro */}
            <Scene id="sharding" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Sharding: Multiple Machines
                  </motion.h2>

                  <motion.div
                    className="grid md:grid-cols-2 gap-8 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.glow.warning + '10',
                        border: `1px solid ${colors.glow.warning}40`,
                      }}
                    >
                      <div className="text-lg font-bold mb-4" style={{ color: colors.glow.warning }}>
                        The Limit We Hit
                      </div>
                      <ul className="text-sm space-y-2" style={{ color: colors.text.secondary }}>
                        <li>• Replicas scale reads, but writes still bottleneck</li>
                        <li>• Partitioning organizes data, but still one machine</li>
                        <li>• Disk space runs out (even 10TB isn't enough)</li>
                        <li>• One primary can't handle write load</li>
                      </ul>
                    </div>

                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.glow.healthy + '10',
                        border: `1px solid ${colors.glow.healthy}40`,
                      }}
                    >
                      <div className="text-lg font-bold mb-4" style={{ color: colors.glow.healthy }}>
                        Sharding: The Solution
                      </div>
                      <ul className="text-sm space-y-2" style={{ color: colors.text.secondary }}>
                        <li>• Split data across multiple databases</li>
                        <li>• Each shard is its own PostgreSQL instance</li>
                        <li>• Router directs queries to correct shard</li>
                        <li>• Linear horizontal scaling</li>
                      </ul>
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
                      <p className="mb-2">
                        <strong style={{ color: colors.glow.warning }}>Colony Organism:</strong> Multiple
                        independent databases coordinating as one system.
                      </p>
                      <p className="text-sm" style={{ color: colors.text.muted }}>
                        Like ants in a colony—each works independently, but together they achieve more.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="The most critical decision: choosing your shard key."
                accentColor={colors.glow.critical}
              />
            </div>

            {/* Scene 3: Shard Key */}
            <Scene id="shardkey" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Shard Key
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
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <div className="font-bold" style={{ color: colors.glow.critical }}>
                          Choose Wrong, Suffer Forever
                        </div>
                        <p className="text-sm" style={{ color: colors.text.secondary }}>
                          Resharding is extremely painful. Pick the right key from the start.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="grid md:grid-cols-2 gap-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <div
                      className="p-4 rounded-lg"
                      style={{ background: colors.oceanLight }}
                    >
                      <div className="font-mono text-sm mb-2" style={{ color: colors.glow.healthy }}>
                        Good Shard Keys
                      </div>
                      <ul className="text-sm space-y-2" style={{ color: colors.text.secondary }}>
                        <li><strong>tenant_id</strong> - Multi-tenant SaaS</li>
                        <li><strong>user_id</strong> - User-centric apps</li>
                        <li><strong>region</strong> - Geographic isolation</li>
                      </ul>
                      <p className="text-xs mt-2" style={{ color: colors.text.muted }}>
                        Key should be in every query, distribute evenly
                      </p>
                    </div>

                    <div
                      className="p-4 rounded-lg"
                      style={{ background: colors.oceanLight }}
                    >
                      <div className="font-mono text-sm mb-2" style={{ color: colors.glow.critical }}>
                        Bad Shard Keys
                      </div>
                      <ul className="text-sm space-y-2" style={{ color: colors.text.secondary }}>
                        <li><strong>created_at</strong> - All writes hit one shard</li>
                        <li><strong>status</strong> - Low cardinality, uneven</li>
                        <li><strong>random UUID</strong> - Cross-shard queries everywhere</li>
                      </ul>
                      <p className="text-xs mt-2" style={{ color: colors.text.muted }}>
                        Hot spots or scattered queries
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <ShardingDemo />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="The hidden cost: cross-shard queries."
                accentColor={colors.glow.warning}
              />
            </div>

            {/* Scene 4: Cross-Shard Queries */}
            <Scene id="crossshard" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Cross-Shard Problem
                  </motion.h2>

                  <motion.div
                    className="grid md:grid-cols-2 gap-8 mb-8"
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
                        Single-Shard Query
                      </div>
                      <pre className="text-xs font-mono p-3 rounded" style={{ background: colors.oceanDark, color: colors.text.muted }}>
{`SELECT * FROM orders
WHERE tenant_id = 'acme'
  AND created_at > '2024-01-01';

-- Route to shard_2
-- Fast: one database`}
                      </pre>
                    </div>

                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.glow.critical + '10',
                        border: `1px solid ${colors.glow.critical}40`,
                      }}
                    >
                      <div className="text-lg font-bold mb-4" style={{ color: colors.glow.critical }}>
                        Cross-Shard Query
                      </div>
                      <pre className="text-xs font-mono p-3 rounded" style={{ background: colors.oceanDark, color: colors.text.muted }}>
{`SELECT SUM(amount)
FROM orders
WHERE created_at > '2024-01-01';

-- Query ALL shards
-- Aggregate results
-- SLOW: coordination overhead`}
                      </pre>
                    </div>
                  </motion.div>

                  <motion.div
                    className="p-6 rounded-xl"
                    style={{ background: colors.oceanDark }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <div className="text-sm" style={{ color: colors.text.secondary }}>
                      <strong style={{ color: colors.glow.warning }}>Cross-shard challenges:</strong>
                      <ul className="mt-2 space-y-1" style={{ color: colors.text.muted }}>
                        <li>• JOINs across shards are expensive (scatter-gather)</li>
                        <li>• Transactions across shards require 2-phase commit</li>
                        <li>• Global aggregations touch all shards</li>
                        <li>• Foreign keys across shards don't work</li>
                      </ul>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="The fundamental law of distributed systems."
                accentColor={colors.text.secondary}
              />
            </div>

            {/* Scene 5: CAP Theorem */}
            <Scene id="cap" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    CAP Theorem
                  </motion.h2>

                  <motion.div
                    className="relative mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {/* Triangle */}
                    <div className="flex justify-center mb-8">
                      <svg width="300" height="260" viewBox="0 0 300 260">
                        {/* Triangle */}
                        <motion.path
                          d="M150 20 L280 220 L20 220 Z"
                          fill="none"
                          stroke={colors.text.muted}
                          strokeWidth="2"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          transition={{ duration: 1 }}
                        />

                        {/* Labels */}
                        <text x="150" y="15" textAnchor="middle" fill={colors.glow.healthy} fontSize="14" fontWeight="bold">
                          Consistency
                        </text>
                        <text x="290" y="240" textAnchor="end" fill={colors.glow.warning} fontSize="14" fontWeight="bold">
                          Availability
                        </text>
                        <text x="10" y="240" textAnchor="start" fill={colors.glow.critical} fontSize="14" fontWeight="bold">
                          Partition Tolerance
                        </text>

                        {/* PostgreSQL position */}
                        <motion.circle
                          cx="85"
                          cy="120"
                          r="8"
                          fill={colors.glow.healthy}
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          transition={{ delay: 1 }}
                        />
                        <text x="100" y="110" fill={colors.text.secondary} fontSize="12">
                          PostgreSQL
                        </text>
                        <text x="100" y="125" fill={colors.text.muted} fontSize="10">
                          (CP system)
                        </text>
                      </svg>
                    </div>
                  </motion.div>

                  <motion.div
                    className="grid md:grid-cols-3 gap-4 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <div
                      className="p-4 rounded-lg"
                      style={{
                        background: colors.glow.healthy + '10',
                        border: `1px solid ${colors.glow.healthy}40`,
                      }}
                    >
                      <div className="font-bold mb-2" style={{ color: colors.glow.healthy }}>
                        Consistency
                      </div>
                      <p className="text-xs" style={{ color: colors.text.muted }}>
                        All nodes see the same data at the same time. Reads return latest write.
                      </p>
                    </div>

                    <div
                      className="p-4 rounded-lg"
                      style={{
                        background: colors.glow.warning + '10',
                        border: `1px solid ${colors.glow.warning}40`,
                      }}
                    >
                      <div className="font-bold mb-2" style={{ color: colors.glow.warning }}>
                        Availability
                      </div>
                      <p className="text-xs" style={{ color: colors.text.muted }}>
                        Every request receives a response. System never refuses to answer.
                      </p>
                    </div>

                    <div
                      className="p-4 rounded-lg"
                      style={{
                        background: colors.glow.critical + '10',
                        border: `1px solid ${colors.glow.critical}40`,
                      }}
                    >
                      <div className="font-bold mb-2" style={{ color: colors.glow.critical }}>
                        Partition Tolerance
                      </div>
                      <p className="text-xs" style={{ color: colors.text.muted }}>
                        System works even when network between nodes fails.
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="p-4 rounded-lg text-center"
                    style={{ background: colors.oceanDark }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <p className="text-sm" style={{ color: colors.text.muted }}>
                      <strong style={{ color: colors.glow.warning }}>Pick 2 of 3.</strong> In distributed
                      systems, network partitions happen. So you really choose between C and A.
                    </p>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="Where does PostgreSQL fit?"
                accentColor={colors.glow.healthy}
              />
            </div>

            {/* Scene 6: PostgreSQL's Tradeoffs */}
            <Scene id="tradeoffs" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    PostgreSQL's Choice
                  </motion.h2>

                  <motion.div
                    className="p-6 rounded-xl mb-8"
                    style={{
                      background: colors.glow.healthy + '10',
                      border: `1px solid ${colors.glow.healthy}40`,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold mb-2" style={{ color: colors.glow.healthy }}>
                        PostgreSQL = CP System
                      </div>
                      <p style={{ color: colors.text.secondary }}>
                        Chooses Consistency + Partition Tolerance over Availability
                      </p>
                      <p className="text-sm mt-2" style={{ color: colors.text.muted }}>
                        During a network partition, PostgreSQL will refuse writes rather than risk inconsistent data.
                      </p>
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
                      <div className="font-mono text-sm mb-2" style={{ color: colors.glow.healthy }}>
                        When PostgreSQL Shines
                      </div>
                      <ul className="text-sm space-y-1" style={{ color: colors.text.secondary }}>
                        <li>• Financial transactions</li>
                        <li>• Inventory management</li>
                        <li>• User authentication</li>
                        <li>• Any ACID-critical workload</li>
                      </ul>
                    </div>

                    <div
                      className="p-4 rounded-lg"
                      style={{ background: colors.oceanLight }}
                    >
                      <div className="font-mono text-sm mb-2" style={{ color: colors.glow.warning }}>
                        When to Consider Alternatives
                      </div>
                      <ul className="text-sm space-y-1" style={{ color: colors.text.secondary }}>
                        <li>• Analytics at petabyte scale (ClickHouse)</li>
                        <li>• Session/cache data (Redis)</li>
                        <li>• Document-centric apps (MongoDB)</li>
                        <li>• Global low-latency writes (CockroachDB)</li>
                      </ul>
                    </div>
                  </motion.div>

                  <motion.div
                    className="mt-6 p-4 rounded-lg"
                    style={{ background: colors.oceanDark }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <p className="text-sm text-center" style={{ color: colors.text.muted }}>
                      <strong style={{ color: colors.glow.warning }}>Polyglot Persistence:</strong> Use
                      the right database for each job. PostgreSQL for transactions,
                      Redis for caching, ClickHouse for analytics.
                    </p>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 7: Finale */}
            <Scene id="finale" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8">
                <div className="max-w-4xl w-full text-center">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                  >
                    <div className="text-6xl mb-6">🎉</div>
                    <h2
                      className="text-4xl md:text-5xl font-medium mb-6"
                      style={{ color: colors.text.primary }}
                    >
                      Journey Complete
                    </h2>
                    <p
                      className="text-xl mb-8"
                      style={{ color: colors.text.secondary }}
                    >
                      You've mastered PostgreSQL from bytes to distributed systems
                    </p>
                  </motion.div>

                  <motion.div
                    className="p-8 rounded-xl mb-8"
                    style={{
                      background: colors.glow.healthy + '10',
                      border: `1px solid ${colors.glow.healthy}40`,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <h3 className="text-lg font-bold mb-6" style={{ color: colors.glow.healthy }}>
                      What You Now Understand
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4 text-left">
                      <div>
                        <div className="text-sm font-mono mb-2" style={{ color: colors.glow.healthy }}>
                          Part 1: The Machine
                        </div>
                        <ul className="text-xs space-y-1" style={{ color: colors.text.muted }}>
                          <li>✓ How pages and tuples store your data</li>
                          <li>✓ Why schema decisions haunt you</li>
                          <li>✓ How WAL keeps your data safe</li>
                          <li>✓ Why MVCC enables concurrent access</li>
                          <li>✓ How indexes make queries fast</li>
                          <li>✓ How the query planner thinks</li>
                          <li>✓ Why transactions need isolation</li>
                          <li>✓ How VACUUM reclaims space</li>
                          <li>✓ How statistics guide the planner</li>
                          <li>✓ Why connection pooling matters</li>
                        </ul>
                      </div>

                      <div>
                        <div className="text-sm font-mono mb-2" style={{ color: colors.glow.warning }}>
                          Part 2: The Fleet
                        </div>
                        <ul className="text-xs space-y-1" style={{ color: colors.text.muted }}>
                          <li>✓ How replicas scale read capacity</li>
                          <li>✓ How partitioning organizes big tables</li>
                          <li>✓ How sharding splits data across machines</li>
                          <li>✓ Why CAP theorem constrains all databases</li>
                          <li>✓ When PostgreSQL is the right choice</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>

                  {/* Episode Complete with confetti and sharing */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8"
                  >
                    <EpisodeComplete
                      episodeNumber={15}
                      episodeTitle="Beyond the Machine"
                    />
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
