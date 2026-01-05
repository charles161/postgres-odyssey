import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene } from '../../components/storytelling/Scene';
import { ScrollIndicator } from '../../components/storytelling/ScrollIndicator';
import { ChapterCardInline } from '../../components/storytelling/ChapterCard';
import { colors } from '../../config/theme';
import { ReplicationDemo } from '../../components/visualizations/ReplicationDemo';
import { EpisodeNavigation } from '../../components/EpisodeNavigation';
import { useLenis } from '../../hooks/useLenis';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';

export function Episode13Replicas() {
  const [showOpening, setShowOpening] = useState(true);
  useLenis();
  useDocumentMeta({
    title: 'Episode 13: The Replicas',
    description: 'Replication, WAL streaming, and read scaling.',
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
                {/* Cell division animation */}
                <div className="relative w-32 h-32 mx-auto">
                  <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background: colors.glow.healthy + '20',
                      border: `2px solid ${colors.glow.healthy}`,
                    }}
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-3xl">🐘</span>
                  </motion.div>

                  {/* Dividing cells */}
                  <motion.div
                    className="absolute w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: colors.oceanDark,
                      border: `1px solid ${colors.glow.warning}`,
                    }}
                    animate={{
                      left: ['50%', '15%'],
                      top: ['50%', '25%'],
                      opacity: [0, 1],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                  >
                    <span className="text-lg">🐘</span>
                  </motion.div>

                  <motion.div
                    className="absolute w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: colors.oceanDark,
                      border: `1px solid ${colors.glow.warning}`,
                    }}
                    animate={{
                      left: ['50%', '75%'],
                      top: ['50%', '70%'],
                      opacity: [0, 1],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1, delay: 0.3 }}
                  >
                    <span className="text-lg">🐘</span>
                  </motion.div>
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
                style={{ color: colors.glow.warning }}
              >
                Episode 13
              </motion.p>

              <motion.h1
                className="text-5xl md:text-7xl font-light tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                style={{ color: colors.text.primary }}
              >
                Cell Division
              </motion.h1>

              <motion.p
                className="text-lg mt-4 max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{ color: colors.text.secondary }}
              >
                Creating identical copies for read scaling
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
                      You've mastered the single machine.
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed"
                      style={{ color: colors.text.muted }}
                    >
                      But one PostgreSQL instance has{' '}
                      <span style={{ color: colors.glow.critical }}>limits</span>.
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed mt-8"
                      style={{ color: colors.glow.healthy }}
                    >
                      Time to build a <strong>fleet</strong>.
                    </p>
                  </motion.div>

                  <ScrollIndicator delay={1.5} />
                </div>
              </div>
            </Scene>

            {/* Scene 2: The Limit */}
            <Scene id="limit" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    One Machine Has Limits
                  </motion.h2>

                  <motion.div
                    className="grid md:grid-cols-2 gap-8 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {/* Writes */}
                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.oceanLight,
                        border: `1px solid ${colors.glow.healthy}30`,
                      }}
                    >
                      <div className="text-4xl mb-4">✍️</div>
                      <div className="text-lg font-bold mb-2" style={{ color: colors.glow.healthy }}>
                        Writes
                      </div>
                      <p className="text-sm" style={{ color: colors.text.secondary }}>
                        ~10,000-50,000 writes/sec on good hardware. WAL is the bottleneck.
                      </p>
                      <div className="mt-4 text-xs" style={{ color: colors.text.muted }}>
                        One primary handles all writes. This is the hard limit.
                      </div>
                    </div>

                    {/* Reads */}
                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.glow.warning + '10',
                        border: `1px solid ${colors.glow.warning}40`,
                      }}
                    >
                      <div className="text-4xl mb-4">📖</div>
                      <div className="text-lg font-bold mb-2" style={{ color: colors.glow.warning }}>
                        Reads
                      </div>
                      <p className="text-sm" style={{ color: colors.text.secondary }}>
                        Limited by CPU cores and buffer pool. Eventually saturates.
                      </p>
                      <div className="mt-4 text-xs font-mono" style={{ color: colors.glow.warning }}>
                        But we can scale this! →
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="p-6 rounded-xl text-center"
                    style={{ background: colors.oceanDark }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <p className="text-lg mb-2" style={{ color: colors.text.primary }}>
                      Most applications are read-heavy
                    </p>
                    <div className="flex justify-center gap-8 mt-4">
                      <div>
                        <div className="text-2xl font-mono" style={{ color: colors.glow.healthy }}>90%</div>
                        <div className="text-xs" style={{ color: colors.text.muted }}>Reads</div>
                      </div>
                      <div>
                        <div className="text-2xl font-mono" style={{ color: colors.glow.warning }}>10%</div>
                        <div className="text-xs" style={{ color: colors.text.muted }}>Writes</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="What if we could create copies to handle all those reads?"
                accentColor={colors.text.secondary}
              />
            </div>

            {/* Scene 3: Cell Division Metaphor */}
            <Scene id="celldivision" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Cell Division
                  </motion.h2>

                  <motion.div
                    className="flex flex-col md:flex-row items-center justify-center gap-12 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {/* Primary */}
                    <div className="text-center">
                      <motion.div
                        className="w-32 h-32 rounded-full mx-auto flex items-center justify-center mb-4"
                        style={{
                          background: colors.glow.healthy + '20',
                          border: `3px solid ${colors.glow.healthy}`,
                        }}
                        animate={{
                          boxShadow: [`0 0 20px ${colors.glow.healthy}20`, `0 0 40px ${colors.glow.healthy}40`, `0 0 20px ${colors.glow.healthy}20`],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <span className="text-5xl">🐘</span>
                      </motion.div>
                      <div className="text-sm font-mono" style={{ color: colors.glow.healthy }}>PRIMARY</div>
                      <div className="text-xs mt-1" style={{ color: colors.text.muted }}>Reads + Writes</div>
                    </div>

                    {/* Division arrows */}
                    <div className="flex flex-col gap-4">
                      <motion.div
                        animate={{ x: [0, 10, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-3xl"
                        style={{ color: colors.glow.warning }}
                      >
                        →
                      </motion.div>
                      <motion.div
                        animate={{ x: [0, 10, 0] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        className="text-3xl"
                        style={{ color: colors.glow.warning }}
                      >
                        →
                      </motion.div>
                    </div>

                    {/* Replicas */}
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="text-center"
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.2 }}
                        >
                          <div
                            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-2"
                            style={{
                              background: colors.oceanDark,
                              border: `2px solid ${colors.glow.warning}`,
                            }}
                          >
                            <span className="text-3xl">🐘</span>
                          </div>
                          <div className="text-xs font-mono" style={{ color: colors.glow.warning }}>
                            REPLICA {i}
                          </div>
                          <div className="text-xs" style={{ color: colors.text.muted }}>Reads only</div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    className="p-6 rounded-xl"
                    style={{ background: colors.oceanDark }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <p className="text-center" style={{ color: colors.text.secondary }}>
                      Like a cell dividing, PostgreSQL can create exact copies of itself.
                      <br />
                      <span className="font-mono" style={{ color: colors.glow.healthy }}>Each replica can serve reads</span>,
                      multiplying your read capacity.
                    </p>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="But how do replicas stay in sync with the primary?"
                accentColor={colors.glow.healthy}
              />
            </div>

            {/* Scene 4: WAL Streaming */}
            <Scene id="walstreaming" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    WAL Streaming
                  </motion.h2>

                  <motion.div
                    className="p-6 rounded-xl mb-8"
                    style={{
                      background: colors.glow.healthy + '10',
                      border: `1px solid ${colors.glow.healthy}30`,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-2xl">💡</span>
                      <div>
                        <div className="font-bold" style={{ color: colors.glow.healthy }}>
                          Remember the WAL from Episode 3?
                        </div>
                        <p className="text-sm" style={{ color: colors.text.secondary }}>
                          The same Write-Ahead Log that ensures durability now powers replication!
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="grid md:grid-cols-3 gap-4 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    {[
                      { num: '1️⃣', text: 'Primary writes change to WAL' },
                      { num: '2️⃣', text: 'WAL records stream to replicas over network' },
                      { num: '3️⃣', text: 'Replicas replay WAL to update their data' },
                    ].map((step, i) => (
                      <motion.div
                        key={i}
                        className="p-4 rounded-lg text-center"
                        style={{ background: colors.oceanLight }}
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 * (i + 1) }}
                      >
                        <div className="text-3xl mb-2">{step.num}</div>
                        <p className="text-sm" style={{ color: colors.text.secondary }}>
                          {step.text}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.div
                    className="p-6 rounded-xl"
                    style={{ background: colors.oceanDark }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <pre className="text-sm font-mono overflow-x-auto" style={{ color: colors.text.secondary }}>
{`-- On primary: check replication status
SELECT client_addr, state, sent_lsn, replay_lsn,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes
FROM pg_stat_replication;

-- Results:
--  client_addr  |  state   |  sent_lsn  | replay_lsn | lag_bytes
-- --------------+----------+------------+------------+-----------
--  10.0.1.5     | streaming| 0/5000000  | 0/4FFF000  |     4096`}
                    </pre>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="But there's a catch—replicas might be slightly behind."
                accentColor={colors.glow.warning}
              />
            </div>

            {/* Scene 5: Replication Lag */}
            <Scene id="lag" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Eventual Consistency Problem
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
                      <div className="text-xl font-bold mb-4" style={{ color: colors.glow.warning }}>
                        The Timeline Problem
                      </div>
                      <div className="space-y-4 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: colors.glow.healthy + '30' }}>1</span>
                          <span style={{ color: colors.text.secondary }}>User updates profile on primary</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: colors.glow.warning + '30' }}>2</span>
                          <span style={{ color: colors.text.secondary }}>Page reload reads from replica</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: colors.glow.critical + '30' }}>3</span>
                          <span style={{ color: colors.glow.critical }}>"My changes disappeared!"</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.glow.healthy + '10',
                        border: `1px solid ${colors.glow.healthy}40`,
                      }}
                    >
                      <div className="text-xl font-bold mb-4" style={{ color: colors.glow.healthy }}>
                        Solutions
                      </div>
                      <ul className="space-y-3 text-sm" style={{ color: colors.text.secondary }}>
                        <li className="flex items-start gap-2">
                          <span style={{ color: colors.glow.healthy }}>✓</span>
                          <span><strong>Read-your-writes:</strong> Route reads to primary after writes</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span style={{ color: colors.glow.healthy }}>✓</span>
                          <span><strong>Session affinity:</strong> Same user → same replica</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span style={{ color: colors.glow.healthy }}>✓</span>
                          <span><strong>Synchronous replication:</strong> Wait for replica (slower)</span>
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
                      Typical replication lag: <strong style={{ color: colors.glow.healthy }}>1-10ms</strong> in same datacenter,
                      <strong style={{ color: colors.glow.warning }}> 50-200ms</strong> cross-region
                    </p>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="How does your application know where to send queries?"
                accentColor={colors.text.secondary}
              />
            </div>

            {/* Scene 6: Read/Write Routing */}
            <Scene id="routing" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Read/Write Routing
                  </motion.h2>

                  <motion.div
                    className="p-6 rounded-xl mb-8"
                    style={{ background: colors.oceanDark }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <pre className="text-sm font-mono overflow-x-auto" style={{ color: colors.text.secondary }}>
{`// Application-level routing
const db = {
  primary: new Pool({ host: 'primary.db.com' }),
  replica: new Pool({ host: 'replica.db.com' }),
};

// Writes always go to primary
async function createUser(data) {
  return db.primary.query('INSERT INTO users...');
}

// Reads can go to replica
async function getUser(id) {
  return db.replica.query('SELECT * FROM users WHERE id = $1', [id]);
}

// Read-your-writes pattern
async function updateAndRead(userId, data) {
  await db.primary.query('UPDATE users SET...', [data]);
  // Read from PRIMARY to see your own write
  return db.primary.query('SELECT * FROM users WHERE id = $1', [userId]);
}`}
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
                      style={{ background: colors.oceanLight }}
                    >
                      <div className="font-mono text-sm mb-2" style={{ color: colors.glow.healthy }}>
                        PgBouncer with Replicas
                      </div>
                      <p className="text-xs" style={{ color: colors.text.secondary }}>
                        Configure separate pools for primary and replicas. Use connection string switching.
                      </p>
                    </div>

                    <div
                      className="p-4 rounded-lg"
                      style={{ background: colors.oceanLight }}
                    >
                      <div className="font-mono text-sm mb-2" style={{ color: colors.glow.warning }}>
                        HAProxy / PgPool-II
                      </div>
                      <p className="text-xs" style={{ color: colors.text.secondary }}>
                        Load balancer routes queries based on type. Transparent to application.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="Let's see replication in action."
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
                    Replication Simulator
                  </motion.h2>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <ReplicationDemo />
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
                    The Fleet Begins
                  </motion.h2>

                  <motion.div
                    className="space-y-6 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.healthy }}>Replicas</span> multiply your read
                      capacity—but ALL writes still go to primary.
                    </p>
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.warning }}>WAL streaming</span> keeps replicas
                      in sync using the same log from Episode 3.
                    </p>
                    <p className="text-xl leading-relaxed" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.critical }}>Replication lag</span> means
                      "eventually consistent"—handle it with read-your-writes routing.
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
                      But what happens when your data grows beyond one machine?
                      <br />
                      Not just reads—the data itself.
                    </p>
                    <p className="text-lg mt-4" style={{ color: colors.glow.healthy }}>
                      Next: <strong>Organ Specialization</strong>—partitioning data across tables.
                    </p>
                  </motion.div>

                  <EpisodeNavigation currentEpisode={13} />
                </div>
              </div>
            </Scene>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
