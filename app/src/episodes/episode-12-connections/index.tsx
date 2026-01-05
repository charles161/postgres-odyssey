import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene } from '../../components/storytelling/Scene';
import { ScrollIndicator } from '../../components/storytelling/ScrollIndicator';
import { ChapterCardInline } from '../../components/storytelling/ChapterCard';
import { ConnectionPoolDemo } from '../../components/visualizations/ConnectionPoolDemo';
import { EpisodeNavigation } from '../../components/EpisodeNavigation';
import { useLenis } from '../../hooks/useLenis';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { colors } from '../../config/theme';

export function Episode12Connections() {
  const [showOpening, setShowOpening] = useState(true);
  useLenis();
  useDocumentMeta({
    title: 'Episode 12: The Connections',
    description: 'Connection pooling and why 1000 serverless functions kill your database.',
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
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <div className="text-sm font-mono mb-4" style={{ color: colors.glow.healthy }}>
                  EPISODE 12
                </div>
                <h1
                  className="text-5xl md:text-7xl font-bold mb-6"
                  style={{ color: colors.text.primary }}
                >
                  The Circulation
                </h1>
                <p
                  className="text-xl md:text-2xl mb-8"
                  style={{ color: colors.text.secondary }}
                >
                  Why 1000 serverless functions kill your database
                </p>
              </motion.div>

              {/* Visual: Connection explosion */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="relative w-80 h-48 mx-auto"
              >
                {/* Database */}
                <motion.div
                  className="absolute right-8 top-1/2 -translate-y-1/2 w-20 h-24 rounded-lg flex items-center justify-center"
                  style={{
                    background: colors.oceanDark,
                    border: `2px solid ${colors.glow.critical}`,
                  }}
                  animate={{
                    borderColor: [colors.glow.critical, colors.glow.warning, colors.glow.critical],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <span className="text-2xl">🐘</span>
                </motion.div>

                {/* Incoming connections */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute left-4 w-3 h-3 rounded-full"
                    style={{
                      background: colors.glow.warning,
                      top: `${15 + (i % 6) * 12}%`,
                    }}
                    animate={{
                      x: [0, 180, 0],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}

                {/* Warning text */}
                <motion.div
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-mono"
                  style={{ color: colors.glow.critical }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  "too many connections"
                </motion.div>
              </motion.div>
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
                      Part 1 was about one PostgreSQL instance.
                      <br />
                      Part 2 is about <span style={{ color: colors.glow.healthy }}>scaling beyond</span>.
                    </p>

                    <p
                      className="text-xl md:text-2xl leading-relaxed"
                      style={{ color: colors.text.muted }}
                    >
                      But first: why does your database crash when you deploy to serverless?
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
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Serverless Connection Explosion
                  </motion.h2>

                  <motion.div
                    className="grid md:grid-cols-2 gap-8 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {/* Traditional server */}
                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.oceanLight,
                        border: `1px solid ${colors.glow.healthy}30`,
                      }}
                    >
                      <div className="text-sm font-mono mb-4" style={{ color: colors.glow.healthy }}>
                        Traditional Server
                      </div>
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 rounded-lg flex items-center justify-center"
                          style={{ background: colors.oceanDark }}
                        >
                          <span className="text-2xl">🖥️</span>
                        </div>
                        <div className="text-sm" style={{ color: colors.text.secondary }}>
                          <p>1 server</p>
                          <p>1 connection pool</p>
                          <p className="font-mono" style={{ color: colors.glow.healthy }}>~10 connections</p>
                        </div>
                      </div>
                    </div>

                    {/* Serverless */}
                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.oceanLight,
                        border: `1px solid ${colors.glow.critical}30`,
                      }}
                    >
                      <div className="text-sm font-mono mb-4" style={{ color: colors.glow.critical }}>
                        Serverless (Vercel, Netlify)
                      </div>
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 rounded-lg flex items-center justify-center relative"
                          style={{ background: colors.oceanDark }}
                        >
                          <span className="text-2xl">⚡</span>
                          <span className="absolute -top-1 -right-1 text-xs">×100</span>
                        </div>
                        <div className="text-sm" style={{ color: colors.text.secondary }}>
                          <p>100 function instances</p>
                          <p>Each opens own connection</p>
                          <p className="font-mono" style={{ color: colors.glow.critical }}>~100+ connections</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="p-6 rounded-xl text-center"
                    style={{
                      background: colors.glow.critical + '10',
                      border: `1px solid ${colors.glow.critical}40`,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <div className="text-lg font-mono mb-2" style={{ color: colors.glow.critical }}>
                      FATAL: too many connections for role "postgres"
                    </div>
                    <div className="text-sm" style={{ color: colors.text.muted }}>
                      PostgreSQL default: max_connections = 100
                    </div>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="Your database isn't slow. It's drowning in connections."
                accentColor={colors.glow.critical}
              />
            </div>

            {/* Scene 3: Why Connections Are Expensive */}
            <Scene id="expensive" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Why Connections Are Expensive
                  </motion.h2>

                  <motion.div
                    className="grid md:grid-cols-3 gap-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {/* Memory */}
                    <div
                      className="p-6 rounded-xl text-center"
                      style={{
                        background: colors.oceanLight,
                        border: `1px solid ${colors.text.muted}30`,
                      }}
                    >
                      <div className="text-4xl mb-4">🧠</div>
                      <div className="text-2xl font-mono mb-2" style={{ color: colors.glow.warning }}>
                        ~10 MB
                      </div>
                      <div className="text-sm" style={{ color: colors.text.muted }}>
                        Memory per connection
                      </div>
                      <div className="mt-4 text-xs" style={{ color: colors.text.secondary }}>
                        100 connections = 1 GB RAM
                      </div>
                    </div>

                    {/* Process */}
                    <div
                      className="p-6 rounded-xl text-center"
                      style={{
                        background: colors.oceanLight,
                        border: `1px solid ${colors.text.muted}30`,
                      }}
                    >
                      <div className="text-4xl mb-4">🔀</div>
                      <div className="text-2xl font-mono mb-2" style={{ color: colors.glow.warning }}>
                        fork()
                      </div>
                      <div className="text-sm" style={{ color: colors.text.muted }}>
                        New process per connection
                      </div>
                      <div className="mt-4 text-xs" style={{ color: colors.text.secondary }}>
                        Process creation overhead
                      </div>
                    </div>

                    {/* Context switches */}
                    <div
                      className="p-6 rounded-xl text-center"
                      style={{
                        background: colors.oceanLight,
                        border: `1px solid ${colors.text.muted}30`,
                      }}
                    >
                      <div className="text-4xl mb-4">🔄</div>
                      <div className="text-2xl font-mono mb-2" style={{ color: colors.glow.warning }}>
                        Switching
                      </div>
                      <div className="text-sm" style={{ color: colors.text.muted }}>
                        CPU context switches
                      </div>
                      <div className="mt-4 text-xs" style={{ color: colors.text.secondary }}>
                        More processes = more overhead
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="p-6 rounded-xl"
                    style={{ background: colors.oceanDark }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <pre className="text-sm font-mono overflow-x-auto" style={{ color: colors.text.secondary }}>
{`-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- See what they're doing
SELECT pid, usename, state, query_start, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;`}
                    </pre>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Chapter Card */}
            <div className="py-8">
              <ChapterCardInline
                message="PostgreSQL's process-per-connection model doesn't scale."
                accentColor={colors.text.secondary}
              />
            </div>

            {/* Scene 4: The Solution - Connection Pooler */}
            <Scene id="pooler" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Solution: Connection Pooler
                  </motion.h2>

                  <motion.div
                    className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {/* Clients */}
                    <div className="text-center">
                      <div className="text-sm font-mono mb-4" style={{ color: colors.text.muted }}>
                        1000 Clients
                      </div>
                      <div className="grid grid-cols-10 gap-1">
                        {Array.from({ length: 40 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full"
                            style={{ background: colors.glow.warning }}
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ delay: i * 0.02 }}
                          />
                        ))}
                      </div>
                      <div className="text-xs mt-2" style={{ color: colors.text.muted }}>
                        +960 more...
                      </div>
                    </div>

                    {/* Arrow */}
                    <motion.div
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-2xl"
                      style={{ color: colors.text.muted }}
                    >
                      →
                    </motion.div>

                    {/* PgBouncer */}
                    <motion.div
                      className="p-6 rounded-xl text-center"
                      style={{
                        background: colors.glow.healthy + '20',
                        border: `2px solid ${colors.glow.healthy}`,
                      }}
                    >
                      <div className="text-lg font-bold mb-2" style={{ color: colors.glow.healthy }}>
                        PgBouncer
                      </div>
                      <div className="text-xs font-mono" style={{ color: colors.text.muted }}>
                        Connection Pooler
                      </div>
                      <div className="mt-4 flex gap-2 justify-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-4 h-4 rounded"
                            style={{ background: colors.glow.healthy }}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                      <div className="text-xs mt-2" style={{ color: colors.text.muted }}>
                        20 connections
                      </div>
                    </motion.div>

                    {/* Arrow */}
                    <motion.div
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-2xl"
                      style={{ color: colors.text.muted }}
                    >
                      →
                    </motion.div>

                    {/* PostgreSQL */}
                    <div
                      className="p-6 rounded-xl text-center"
                      style={{
                        background: colors.oceanDark,
                        border: `1px solid ${colors.text.muted}40`,
                      }}
                    >
                      <span className="text-4xl">🐘</span>
                      <div className="text-sm font-mono mt-2" style={{ color: colors.text.muted }}>
                        PostgreSQL
                      </div>
                      <div className="text-xs mt-2" style={{ color: colors.glow.healthy }}>
                        Only 20 connections!
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="grid md:grid-cols-2 gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <div
                      className="p-4 rounded-lg"
                      style={{ background: colors.oceanLight }}
                    >
                      <div className="font-mono text-sm mb-2" style={{ color: colors.glow.healthy }}>
                        PgBouncer
                      </div>
                      <ul className="text-sm space-y-1" style={{ color: colors.text.secondary }}>
                        <li>• Lightweight C application</li>
                        <li>• Single-threaded, event-driven</li>
                        <li>• Handles 10,000+ clients easily</li>
                        <li>• Used by: Supabase, Heroku, etc.</li>
                      </ul>
                    </div>

                    <div
                      className="p-4 rounded-lg"
                      style={{ background: colors.oceanLight }}
                    >
                      <div className="font-mono text-sm mb-2" style={{ color: colors.glow.warning }}>
                        Alternatives
                      </div>
                      <ul className="text-sm space-y-1" style={{ color: colors.text.secondary }}>
                        <li>• <strong>Supavisor</strong> - Elixir-based, multi-tenant</li>
                        <li>• <strong>pgcat</strong> - Rust, sharding support</li>
                        <li>• <strong>Odyssey</strong> - Yandex, multi-threaded</li>
                      </ul>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 5: Pooling Modes */}
            <Scene id="modes" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Pooling Modes
                  </motion.h2>

                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {/* Session Mode */}
                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.oceanLight,
                        border: `1px solid ${colors.text.muted}30`,
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-24 h-12 rounded flex items-center justify-center text-sm font-mono flex-shrink-0"
                          style={{
                            background: colors.glow.warning + '20',
                            color: colors.glow.warning,
                          }}
                        >
                          SESSION
                        </div>
                        <div>
                          <p className="mb-2" style={{ color: colors.text.secondary }}>
                            Connection assigned for <strong>entire client session</strong>. Only released when client disconnects.
                          </p>
                          <p className="text-sm" style={{ color: colors.text.muted }}>
                            ✓ All PostgreSQL features work<br />
                            ✗ Connections sit idle between queries
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Mode */}
                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.glow.healthy + '10',
                        border: `1px solid ${colors.glow.healthy}40`,
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-24 h-12 rounded flex items-center justify-center text-sm font-mono flex-shrink-0"
                          style={{
                            background: colors.glow.healthy + '30',
                            color: colors.glow.healthy,
                          }}
                        >
                          TRANSACTION
                        </div>
                        <div>
                          <p className="mb-2" style={{ color: colors.text.secondary }}>
                            Connection assigned per <strong>transaction</strong>. Returned to pool after COMMIT/ROLLBACK.
                          </p>
                          <p className="text-sm" style={{ color: colors.text.muted }}>
                            ✓ Maximum connection efficiency<br />
                            ✗ Prepared statements don't work (different connection each time)
                          </p>
                          <div className="mt-2 px-2 py-1 inline-block rounded text-xs" style={{ background: colors.glow.healthy + '20', color: colors.glow.healthy }}>
                            Recommended for most apps
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Statement Mode */}
                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.oceanLight,
                        border: `1px solid ${colors.text.muted}30`,
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-24 h-12 rounded flex items-center justify-center text-sm font-mono flex-shrink-0"
                          style={{
                            background: colors.glow.critical + '20',
                            color: colors.glow.critical,
                          }}
                        >
                          STATEMENT
                        </div>
                        <div>
                          <p className="mb-2" style={{ color: colors.text.secondary }}>
                            Connection assigned per <strong>statement</strong>. Most aggressive reuse.
                          </p>
                          <p className="text-sm" style={{ color: colors.text.muted }}>
                            ✗ Multi-statement transactions broken<br />
                            ✗ Only for autocommit workloads
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 6: Trade-offs */}
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
                    The Prepared Statement Trade-off
                  </motion.h2>

                  <motion.div
                    className="p-6 rounded-xl mb-8"
                    style={{ background: colors.oceanDark }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <pre className="text-sm font-mono overflow-x-auto" style={{ color: colors.text.secondary }}>
{`-- Prepared statements in PostgreSQL
PREPARE get_user(int) AS
  SELECT * FROM users WHERE id = $1;

EXECUTE get_user(123);  -- Uses cached plan

-- The problem with transaction pooling:
-- Connection A: PREPARE get_user ...
-- (connection returned to pool)
-- Connection B: EXECUTE get_user(123)
-- ERROR: prepared statement "get_user" does not exist`}
                    </pre>
                  </motion.div>

                  <motion.div
                    className="grid md:grid-cols-2 gap-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.glow.warning + '10',
                        border: `1px solid ${colors.glow.warning}40`,
                      }}
                    >
                      <div className="font-mono text-sm mb-4" style={{ color: colors.glow.warning }}>
                        Features That Break in Transaction Mode
                      </div>
                      <ul className="text-sm space-y-2" style={{ color: colors.text.secondary }}>
                        <li>• PREPARE / EXECUTE (prepared statements)</li>
                        <li>• LISTEN / NOTIFY</li>
                        <li>• LOAD statements</li>
                        <li>• Cursors WITH HOLD</li>
                        <li>• Protocol-level prepared statements</li>
                      </ul>
                    </div>

                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.glow.healthy + '10',
                        border: `1px solid ${colors.glow.healthy}40`,
                      }}
                    >
                      <div className="font-mono text-sm mb-4" style={{ color: colors.glow.healthy }}>
                        Solutions
                      </div>
                      <ul className="text-sm space-y-2" style={{ color: colors.text.secondary }}>
                        <li>• Disable prepared statements in ORM</li>
                        <li>• Use statement_cache: false (Prisma)</li>
                        <li>• Use pgBouncer's prepared_statements option</li>
                        <li>• Accept slightly higher latency</li>
                      </ul>
                    </div>
                  </motion.div>

                  <motion.div
                    className="p-4 rounded-lg text-center"
                    style={{ background: colors.oceanLight }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      <strong style={{ color: colors.glow.healthy }}>In practice:</strong> The performance gain
                      from connection pooling far outweighs the loss from disabled prepared statements.
                    </p>
                  </motion.div>
                </div>
              </div>
            </Scene>

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
                    Connection Pool Simulator
                  </motion.h2>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <ConnectionPoolDemo />
                  </motion.div>

                  <motion.div
                    className="mt-8 p-6 rounded-xl"
                    style={{
                      background: colors.glow.healthy + '10',
                      border: `1px solid ${colors.glow.healthy}30`,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <h3 className="text-lg font-bold mb-4" style={{ color: colors.glow.healthy }}>
                      Key Takeaways
                    </h3>
                    <ul className="space-y-2 text-sm" style={{ color: colors.text.secondary }}>
                      <li>• <strong>Without pooling:</strong> Each client = new PostgreSQL process = memory explosion</li>
                      <li>• <strong>With pooling:</strong> Many clients share few connections = sustainable</li>
                      <li>• <strong>Transaction mode:</strong> Best efficiency, but prepared statements need care</li>
                      <li>• <strong>Rule of thumb:</strong> Pool size ≈ CPU cores × 2 to 4</li>
                    </ul>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Conclusion */}
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
                    The Blood Vessels
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
                      <span style={{ color: colors.glow.healthy }}>Connection poolers</span> are the blood vessels of modern PostgreSQL.
                    </p>
                    <p
                      className="text-xl leading-relaxed"
                      style={{ color: colors.text.secondary }}
                    >
                      They let your database breathe—handling thousands of clients with the resources for tens.
                    </p>
                    <p
                      className="text-lg leading-relaxed mt-8"
                      style={{ color: colors.text.muted }}
                    >
                      But what happens when one PostgreSQL instance can't handle the load?
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
                      That's when you need <span style={{ color: colors.glow.healthy }}>replicas</span>.
                    </p>
                    <p className="text-lg mt-4" style={{ color: colors.glow.healthy }}>
                      Coming up: <strong>Cell Division</strong>—replication.
                    </p>
                  </motion.div>

                  <EpisodeNavigation currentEpisode={12} />
                </div>
              </div>
            </Scene>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
