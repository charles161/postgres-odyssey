import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene } from '../../components/storytelling/Scene';
import { TupleVersionChain } from '../../components/visualizations/TupleVersionChain';
import { VisibilityChecker } from '../../components/visualizations/VisibilityChecker';
import { MVCCTimeMachine } from '../../components/visualizations/MVCCTimeMachine';
import { useLenis } from '../../hooks/useLenis';
import { colors } from '../../config/theme';

export function Episode04ManyLives() {
  const navigate = useNavigate();
  const [showOpening, setShowOpening] = useState(true);
  useLenis();

  // Auto-start after opening animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOpening(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ background: colors.ocean }}>
      {/* Opening - The Quantum Split */}
      <AnimatePresence>
        {showOpening && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: colors.ocean }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-center relative">
              {/* The tuple that will split */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                {/* Single tuple - initial state */}
                <motion.div
                  className="relative"
                  animate={{
                    x: [0, 0, 0],
                  }}
                >
                  {/* Left transaction */}
                  <motion.div
                    className="absolute -left-48 top-1/2 -translate-y-1/2"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5, duration: 0.6 }}
                  >
                    <div
                      className="px-4 py-2 rounded-lg font-mono text-sm"
                      style={{
                        background: colors.glow.healthy + '20',
                        border: `1px solid ${colors.glow.healthy}40`,
                        color: colors.glow.healthy,
                      }}
                    >
                      TXN 100
                    </div>
                    {/* Connection line */}
                    <motion.div
                      className="absolute right-0 top-1/2 h-px"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${colors.glow.healthy})`,
                        width: 40,
                        right: -40,
                      }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 2, duration: 0.5 }}
                    />
                  </motion.div>

                  {/* Right transaction */}
                  <motion.div
                    className="absolute -right-48 top-1/2 -translate-y-1/2"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5, duration: 0.6 }}
                  >
                    <div
                      className="px-4 py-2 rounded-lg font-mono text-sm"
                      style={{
                        background: colors.glow.warning + '20',
                        border: `1px solid ${colors.glow.warning}40`,
                        color: colors.glow.warning,
                      }}
                    >
                      TXN 105
                    </div>
                    {/* Connection line */}
                    <motion.div
                      className="absolute left-0 top-1/2 h-px"
                      style={{
                        background: `linear-gradient(270deg, transparent, ${colors.glow.warning})`,
                        width: 40,
                        left: -40,
                      }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 2, duration: 0.5 }}
                    />
                  </motion.div>

                  {/* The tuple card - splits into two */}
                  <div className="relative">
                    {/* Original tuple (fades and splits) */}
                    <motion.div
                      className="px-8 py-4 rounded-xl font-mono"
                      style={{
                        background: colors.oceanDark,
                        border: `2px solid ${colors.glow.healthy}40`,
                        minWidth: 250,
                      }}
                      animate={{
                        opacity: [1, 1, 0],
                        scale: [1, 1, 0.8],
                      }}
                      transition={{
                        duration: 1,
                        delay: 2.5,
                        times: [0, 0.3, 1],
                      }}
                    >
                      <div className="text-sm mb-2" style={{ color: colors.text.muted }}>
                        accounts.balance
                      </div>
                      <div className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                        ???
                      </div>
                    </motion.div>

                    {/* Split version 1 (left - sees old value) */}
                    <motion.div
                      className="absolute inset-0 px-8 py-4 rounded-xl font-mono"
                      style={{
                        background: colors.oceanDark,
                        border: `2px solid ${colors.glow.healthy}`,
                        boxShadow: `0 0 30px ${colors.glow.healthy}30`,
                      }}
                      initial={{ opacity: 0, x: 0 }}
                      animate={{
                        opacity: [0, 0, 1],
                        x: [0, 0, -80],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: 2.5,
                        times: [0, 0.3, 1],
                        ease: 'easeOut',
                      }}
                    >
                      <div className="text-sm mb-2" style={{ color: colors.glow.healthy }}>
                        TXN 100 sees
                      </div>
                      <div className="text-3xl font-bold" style={{ color: colors.glow.healthy }}>
                        $1,000
                      </div>
                    </motion.div>

                    {/* Split version 2 (right - sees new value) */}
                    <motion.div
                      className="absolute inset-0 px-8 py-4 rounded-xl font-mono"
                      style={{
                        background: colors.oceanDark,
                        border: `2px solid ${colors.glow.warning}`,
                        boxShadow: `0 0 30px ${colors.glow.warning}30`,
                      }}
                      initial={{ opacity: 0, x: 0 }}
                      animate={{
                        opacity: [0, 0, 1],
                        x: [0, 0, 80],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: 2.5,
                        times: [0, 0.3, 1],
                        ease: 'easeOut',
                      }}
                    >
                      <div className="text-sm mb-2" style={{ color: colors.glow.warning }}>
                        TXN 105 sees
                      </div>
                      <div className="text-3xl font-bold" style={{ color: colors.glow.warning }}>
                        $1,500
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Text reveals */}
              <motion.p
                className="text-sm font-mono uppercase tracking-widest mt-16 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4.5 }}
                style={{ color: colors.glow.healthy }}
              >
                Episode 4
              </motion.p>

              <motion.h1
                className="text-4xl md:text-6xl font-medium mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 5, duration: 0.8 }}
                style={{ color: colors.text.primary }}
              >
                The Many Lives
              </motion.h1>

              <motion.p
                className="text-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 5.5 }}
                style={{ color: colors.text.muted }}
              >
                Same row. Same moment. Different truths.
              </motion.p>

              {/* Skip button */}
              <motion.button
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm"
                style={{ color: colors.text.muted }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 2 }}
                whileHover={{ opacity: 1 }}
                onClick={() => setShowOpening(false)}
              >
                Skip intro
              </motion.button>
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
                    What if I told you that right now, at this very moment, your
                    database is holding{' '}
                    <span style={{ color: colors.glow.healthy }}>
                      multiple versions of the truth
                    </span>
                    ?
                  </motion.p>

                  <motion.p
                    className="text-xl md:text-2xl mt-8 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    style={{ color: colors.text.muted }}
                  >
                    Not because it's confused, but because it understands something
                    we often forget:{' '}
                    <span style={{ color: colors.glow.warning }}>
                      truth depends on when you're looking
                    </span>
                    .
                  </motion.p>

                  <motion.p
                    className="text-lg mt-8 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.5 }}
                    style={{ color: colors.text.muted }}
                  >
                    This is <span style={{ color: colors.glow.healthy }}>MVCC</span>{' '}
                    — Multi-Version Concurrency Control. It's why your UPDATE
                    doesn't block reads, and why PostgreSQL can handle thousands of
                    concurrent queries without grinding to a halt.
                  </motion.p>

                  <motion.div
                    className="mt-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5 }}
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

            {/* Scene 2: Version Chains */}
            <Scene id="versions" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-5xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The Version Chain
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    When you UPDATE a row, PostgreSQL doesn't overwrite it. Instead,
                    it creates a{' '}
                    <span style={{ color: colors.glow.healthy }}>new version</span>{' '}
                    and marks the old one as dead. Each version has a birth
                    certificate (<span style={{ color: colors.glow.healthy }}>xmin</span>)
                    and a death certificate (
                    <span style={{ color: colors.glow.critical }}>xmax</span>).
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <TupleVersionChain />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 3: Visibility Rules */}
            <Scene id="visibility" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-4xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Which Version Do I See?
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Every transaction gets a{' '}
                    <span style={{ color: colors.glow.healthy }}>snapshot</span> when
                    it starts — a frozen view of which transactions were committed at
                    that moment. This snapshot determines which versions are visible.
                  </motion.p>

                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.oceanLight,
                        border: `1px solid ${colors.glow.healthy}30`,
                      }}
                    >
                      <h3
                        className="font-mono text-lg mb-3"
                        style={{ color: colors.glow.healthy }}
                      >
                        VISIBLE if:
                      </h3>
                      <ul
                        className="space-y-2 text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        <li>• xmin was committed before my snapshot</li>
                        <li>• AND xmax is either empty (still alive)</li>
                        <li>• OR xmax wasn't committed when I started</li>
                      </ul>
                    </div>

                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background: colors.oceanLight,
                        border: `1px solid ${colors.glow.critical}30`,
                      }}
                    >
                      <h3
                        className="font-mono text-lg mb-3"
                        style={{ color: colors.glow.critical }}
                      >
                        NOT VISIBLE if:
                      </h3>
                      <ul
                        className="space-y-2 text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        <li>• xmin wasn't committed yet (future data)</li>
                        <li>• OR xmax was committed before my snapshot</li>
                        <li>• (meaning it was deleted before I started)</li>
                      </ul>
                    </div>
                  </motion.div>

                  <motion.p
                    className="text-lg mt-8 text-center mb-12"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    style={{ color: colors.text.muted }}
                  >
                    The key insight: your transaction is{' '}
                    <span style={{ color: colors.glow.healthy }}>frozen in time</span>.
                    Changes made by others after you started are invisible to you.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    <p
                      className="text-sm font-mono uppercase tracking-wider mb-4"
                      style={{ color: colors.text.muted }}
                    >
                      Try it yourself — adjust the values and watch the decision tree:
                    </p>
                    <VisibilityChecker />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 4: Time Machine (HERO) */}
            <Scene id="timemachine" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8 py-16">
                <div className="max-w-6xl w-full">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    The MVCC Time Machine
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-8 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Drag the slider to travel through time. Watch how different
                    transactions see different versions of the same row.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <MVCCTimeMachine />
                  </motion.div>
                </div>
              </div>
            </Scene>

            {/* Scene 5: Implications */}
            <Scene id="implications" minHeight="100vh">
              <div className="flex items-center justify-center min-h-screen px-8">
                <div className="max-w-4xl">
                  <motion.h2
                    className="text-3xl md:text-5xl font-medium mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ color: colors.text.primary }}
                  >
                    Why This Matters
                  </motion.h2>

                  <motion.div
                    className="p-8 rounded-xl mb-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{
                      background: `linear-gradient(135deg, ${colors.oceanLight} 0%, ${colors.glow.healthy}08 100%)`,
                      border: `2px solid ${colors.glow.healthy}40`,
                    }}
                  >
                    <p
                      className="text-2xl font-medium mb-4"
                      style={{ color: colors.glow.healthy }}
                    >
                      Readers never block writers. Writers never block readers.
                    </p>
                    <p className="text-lg" style={{ color: colors.text.secondary }}>
                      This is PostgreSQL's superpower. While one transaction is
                      reading a million rows, another can update them freely. They
                      each see their own version of reality.
                    </p>
                  </motion.div>

                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <div
                      className="p-6 rounded-xl"
                      style={{ background: colors.oceanDark }}
                    >
                      <p
                        className="font-mono text-sm mb-2"
                        style={{ color: colors.glow.healthy }}
                      >
                        The Benefit
                      </p>
                      <p className="text-sm" style={{ color: colors.text.muted }}>
                        Massive concurrency without lock contention. Your analytics
                        query won't block your checkout flow.
                      </p>
                    </div>
                    <div
                      className="p-6 rounded-xl"
                      style={{ background: colors.oceanDark }}
                    >
                      <p
                        className="font-mono text-sm mb-2"
                        style={{ color: colors.glow.warning }}
                      >
                        The Cost
                      </p>
                      <p className="text-sm" style={{ color: colors.text.muted }}>
                        Dead tuples accumulate. Old versions stick around until
                        VACUUM cleans them up. That's Episode 9.
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
                    Temporally Aware
                  </motion.h2>

                  <motion.p
                    className="text-xl leading-relaxed mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ color: colors.text.secondary }}
                  >
                    Your database isn't confused when it shows different values to
                    different transactions. It's{' '}
                    <span style={{ color: colors.glow.healthy }}>temporally aware</span>
                    —understanding that truth is relative to when you started looking.
                  </motion.p>

                  <motion.p
                    className="text-lg leading-relaxed mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    style={{ color: colors.text.muted }}
                  >
                    But what happens when two transactions try to{' '}
                    <span style={{ color: colors.glow.critical }}>write</span> to the
                    same row? MVCC handles readers beautifully, but writers still
                    need to coordinate. That's where locks come in.
                  </motion.p>

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
                      onClick={() => navigate('/episode/3')}
                      style={{
                        background: colors.oceanLight,
                        color: colors.text.secondary,
                        border: `1px solid ${colors.text.muted}40`,
                      }}
                    >
                      ← Episode 3: Memory Palace
                    </motion.button>

                    <motion.button
                      className="px-8 py-4 rounded-lg text-lg font-medium transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/episode/5')}
                      style={{
                        background: `${colors.glow.healthy}20`,
                        color: colors.glow.healthy,
                        border: `1px solid ${colors.glow.healthy}40`,
                      }}
                    >
                      Next: Episode 5 — The Pathways →
                    </motion.button>
                  </motion.div>

                  <motion.p
                    className="mt-8 text-sm"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    style={{ color: colors.text.muted }}
                  >
                    Why sequential scans take hours
                  </motion.p>
                </div>
              </div>
            </Scene>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
