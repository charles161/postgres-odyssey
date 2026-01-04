import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene } from '../../components/storytelling/Scene';
import { InteractiveWAL } from '../../components/visualizations/InteractiveWAL';
import { useLenis } from '../../hooks/useLenis';
import { colors } from '../../config/theme';

export function Episode02Heartbeat() {
  const navigate = useNavigate();
  const [showOpening, setShowOpening] = useState(true);
  useLenis();

  // Auto-start after brief pause
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOpening(false);
    }, 3000);
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
                {/* Radiating pulse rings */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: `2px solid ${colors.glow.critical}`,
                      left: '50%',
                      top: '50%',
                      width: 96,
                      height: 96,
                      marginLeft: -48,
                      marginTop: -48,
                    }}
                    animate={{
                      scale: [1, 2.5, 2.5],
                      opacity: [0.6, 0, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: 'easeOut',
                    }}
                  />
                ))}

                {/* Heartbeat SVG */}
                <motion.div
                  className="w-24 h-24 mx-auto rounded-full flex items-center justify-center relative z-10"
                  style={{ background: `${colors.glow.critical}20` }}
                  animate={{
                    scale: [1, 1.25, 1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    times: [0, 0.1, 0.2, 0.3, 1],
                    ease: 'easeInOut',
                  }}
                >
                  {/* SVG Heart */}
                  <svg
                    viewBox="0 0 24 24"
                    className="w-12 h-12"
                    fill={colors.glow.critical}
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </motion.div>

                {/* EKG Line */}
                <motion.svg
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-16 pointer-events-none"
                  viewBox="0 0 320 64"
                  style={{ marginTop: 60 }}
                >
                  <motion.path
                    d="M0,32 L80,32 L90,32 L100,10 L110,54 L120,32 L130,32 L240,32 L250,32 L260,10 L270,54 L280,32 L290,32 L320,32"
                    fill="none"
                    stroke={colors.glow.critical}
                    strokeWidth="2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                </motion.svg>
              </motion.div>

              <motion.p
                className="text-sm font-mono uppercase tracking-widest mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ color: colors.glow.critical }}
              >
                Episode 2
              </motion.p>

              <motion.h1
                className="text-4xl md:text-6xl font-light"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                style={{ color: colors.text.primary }}
              >
                The First Heartbeat
              </motion.h1>

              <motion.p
                className="text-xl mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{ color: colors.text.muted }}
              >
                Write-Ahead Logging
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
                    Every living organism has a heartbeat—a rhythm that keeps it alive
                    even when everything else fails.
                  </motion.p>

                  <motion.p
                    className="text-xl md:text-2xl mt-8 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    style={{ color: colors.text.muted }}
                  >
                    PostgreSQL's heartbeat is the{' '}
                    <span style={{ color: colors.glow.critical }}>Write-Ahead Log</span>—
                    a continuous pulse that ensures no data is ever truly lost.
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
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 2: The Problem */}
            <Scene id="problem" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8">
                <div className="max-w-4xl">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Danger of Memory
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Databases don't write directly to disk—it's too slow. Instead, changes
                    live in <span style={{ color: colors.glow.healthy }}>memory</span> first,
                    in something called the buffer pool.
                  </motion.p>

                  <motion.div
                    className="p-6 rounded-xl border-l-4 mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    style={{
                      background: colors.oceanLight,
                      borderColor: colors.glow.warning,
                    }}
                  >
                    <p className="text-lg" style={{ color: colors.text.secondary }}>
                      <span style={{ color: colors.glow.warning }}>But memory is volatile.</span>{' '}
                      If the power goes out, if the server crashes, if anything interrupts
                      the system—everything in memory vanishes instantly.
                    </p>
                  </motion.div>

                  <motion.p
                    className="text-lg leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    style={{ color: colors.text.muted }}
                  >
                    Your user just transferred $10,000. The database acknowledged it.
                    Then the server crashed. Without a safety net, that transaction is{' '}
                    <span style={{ color: colors.glow.critical }}>gone forever</span>.
                  </motion.p>
                </div>
              </div>
            </Scene>

            {/* Scene 3: The Solution */}
            <Scene id="solution" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8">
                <div className="max-w-4xl">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Write-Ahead: The Golden Rule
                  </motion.h2>

                  <motion.div
                    className="p-8 rounded-xl mb-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{
                      background: `linear-gradient(135deg, ${colors.oceanLight} 0%, ${colors.glow.critical}08 100%)`,
                      border: `2px solid ${colors.glow.critical}40`,
                    }}
                  >
                    <p
                      className="text-2xl md:text-3xl font-light text-center"
                      style={{ color: colors.text.primary }}
                    >
                      "Before changing any data,{' '}
                      <span style={{ color: colors.glow.critical }}>
                        write a record of the change to disk first.
                      </span>"
                    </p>
                  </motion.div>

                  <motion.p
                    className="text-xl leading-relaxed mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    style={{ color: colors.text.secondary }}
                  >
                    This is the WAL promise: every change is logged to a sequential file
                    on disk <em>before</em> it touches your actual data. If the system crashes,
                    we can replay the log to recover.
                  </motion.p>

                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    {[
                      { step: '1', label: 'Log to WAL', desc: 'Write change record to disk', color: colors.glow.critical },
                      { step: '2', label: 'Apply in Memory', desc: 'Update the buffer pool', color: colors.glow.healthy },
                      { step: '3', label: 'Acknowledge', desc: 'Tell the client "done"', color: colors.glow.healthy },
                    ].map((item) => (
                      <div
                        key={item.step}
                        className="p-4 rounded-lg text-center"
                        style={{ background: colors.oceanDark }}
                      >
                        <div
                          className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center font-mono text-lg"
                          style={{ background: item.color + '20', color: item.color }}
                        >
                          {item.step}
                        </div>
                        <p className="font-medium mb-1" style={{ color: colors.text.primary }}>
                          {item.label}
                        </p>
                        <p className="text-sm" style={{ color: colors.text.muted }}>
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 4: WAL in Action */}
            <Scene id="wal-action" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-4xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Inside the WAL
                  </motion.h2>

                  <motion.p
                    className="text-lg leading-relaxed mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Click any WAL record to understand what Postgres logs for each operation.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <InteractiveWAL />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 5: Checkpoints */}
            <Scene id="checkpoint" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8">
                <div className="max-w-4xl">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Checkpoints: The Exhale
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    The WAL can't grow forever. Periodically, Postgres takes a{' '}
                    <span style={{ color: colors.glow.healthy }}>checkpoint</span>—flushing
                    all dirty buffers from memory to the actual data files.
                  </motion.p>

                  <motion.div
                    className="p-6 rounded-xl mb-6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    style={{ background: colors.oceanLight }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: colors.glow.healthy + '20' }}
                      >
                        💨
                      </div>
                      <div>
                        <p className="font-medium mb-2" style={{ color: colors.text.primary }}>
                          Think of it like breathing
                        </p>
                        <p style={{ color: colors.text.secondary }}>
                          WAL writes are the <strong>inhale</strong>—fast, continuous, accumulating changes.
                          Checkpoints are the <strong>exhale</strong>—slower, periodic, syncing everything to stable storage.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <div className="p-4 rounded-lg" style={{ background: colors.oceanDark }}>
                      <p className="font-mono text-sm mb-2" style={{ color: colors.glow.healthy }}>
                        After checkpoint
                      </p>
                      <p className="text-sm" style={{ color: colors.text.muted }}>
                        Old WAL files can be recycled—we don't need them for recovery anymore
                        since the data is safely on disk.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ background: colors.oceanDark }}>
                      <p className="font-mono text-sm mb-2" style={{ color: colors.glow.warning }}>
                        Recovery starts here
                      </p>
                      <p className="text-sm" style={{ color: colors.text.muted }}>
                        If we crash, we only need to replay WAL records <em>after</em> the
                        last checkpoint—not the entire history.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 6: Conclusion */}
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
                    The Heart Never Stops
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Every INSERT, UPDATE, DELETE—every change you make—first passes through
                    the WAL. This heartbeat is what makes Postgres <strong>durable</strong>.
                    Your data survives crashes, power failures, and chaos.
                  </motion.p>

                  <motion.div
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <motion.button
                      className="px-8 py-4 rounded-lg text-lg font-medium transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/episode/1')}
                      style={{
                        background: colors.oceanLight,
                        color: colors.text.secondary,
                        border: `1px solid ${colors.text.muted}40`,
                      }}
                    >
                      ← Episode 1: Genesis
                    </motion.button>

                    <motion.button
                      className="px-8 py-4 rounded-lg text-lg font-medium transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/')}
                      style={{
                        background: `${colors.glow.critical}20`,
                        color: colors.glow.critical,
                        border: `1px solid ${colors.glow.critical}40`,
                      }}
                    >
                      Return to Organism
                    </motion.button>
                  </motion.div>

                  <motion.button
                    className="mt-8 px-6 py-3 rounded-lg text-sm font-medium transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/episode/3')}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    style={{
                      background: `${colors.glow.healthy}20`,
                      color: colors.glow.healthy,
                      border: `1px solid ${colors.glow.healthy}40`,
                    }}
                  >
                    Next: Episode 3 — Memory Palace →
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
