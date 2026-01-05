import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { EpisodeCard } from '../components/EpisodeCard';
import { PagePreview } from '../components/visualizations/PagePreview';
import { BlueprintPreview } from '../components/visualizations/BlueprintPreview';
import { HeartPreview } from '../components/visualizations/HeartPreview';
import { MemoryPreview } from '../components/visualizations/MemoryPreview';
import { ManyLivesPreview } from '../components/visualizations/ManyLivesPreview';
import { PathwaysPreview } from '../components/visualizations/PathwaysPreview';
import { StrategyPreview } from '../components/visualizations/StrategyPreview';
import { RulesPreview } from '../components/visualizations/RulesPreview';
import { FeverPreview } from '../components/visualizations/FeverPreview';
import { CleanupPreview } from '../components/visualizations/CleanupPreview';
import { StatisticsPreview } from '../components/visualizations/StatisticsPreview';
import { ConnectionPreview } from '../components/visualizations/ConnectionPreview';
import { ReplicaPreview } from '../components/visualizations/ReplicaPreview';
import { PartitionPreview } from '../components/visualizations/PartitionPreview';
import { ShardPreview } from '../components/visualizations/ShardPreview';
import { colors } from '../config/theme';
import { useProgress } from '../hooks/useProgress';

export function Home() {
  const {
    isEpisodeCompleted,
    part1Progress,
    part2Progress,
    totalProgress,
    getNextEpisode,
    isPart1Complete,
    isAllComplete,
  } = useProgress();

  const nextEpisode = getNextEpisode();

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: colors.ocean }}
    >
      {/* Central glow */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.glow.healthy}08 0%, transparent 50%)`,
        }}
      />

      {/* Content container */}
      <div className="relative z-10 min-h-screen flex flex-col items-center px-6 py-12">
        {/* Hero section */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Logo + Title side by side */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
            {/* Logo */}
            <motion.img
              src="/logo.png"
              alt="PostgreSQL Odyssey"
              className="w-40 h-48 md:w-48 md:h-56 object-contain"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            />

            {/* Text content */}
            <div className="text-center md:text-left">
              {/* Main title */}
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-3"
                style={{ color: colors.text.primary }}
              >
                The Machine That
                <br />
                <span style={{ color: colors.glow.warning }}>
                  Remembers
                </span>
              </h1>

              {/* Subtitle */}
              <p
                className="text-lg md:text-xl tracking-widest uppercase"
                style={{ color: colors.text.secondary }}
              >
                A PostgreSQL Odyssey
              </p>
            </div>
          </div>

          {/* Decorative line */}
          <motion.div
            className="mx-auto mt-8 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${colors.glow.healthy}60, transparent)`,
              width: 200,
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />

          {/* Overall progress */}
          {totalProgress > 0 && (
            <motion.div
              className="mt-6 max-w-md w-full mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: colors.text.muted }}>Journey Progress</span>
                <span style={{ color: colors.glow.healthy }}>{totalProgress}%</span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: colors.text.muted + '30' }}
                role="progressbar"
                aria-valuenow={totalProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Overall journey progress"
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${colors.glow.healthy}, ${colors.glow.warning})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${totalProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          )}

          {/* Continue button */}
          {nextEpisode && totalProgress > 0 && !isAllComplete && (
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Link
                to={`/episode/${nextEpisode}`}
                className="inline-block px-6 py-2 rounded-full text-sm font-medium"
                style={{
                  background: colors.glow.healthy + '20',
                  color: colors.glow.healthy,
                  border: `1px solid ${colors.glow.healthy}40`,
                }}
              >
                Continue Episode {nextEpisode} →
              </Link>
            </motion.div>
          )}

          {isAllComplete && (
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <span
                className="px-4 py-2 rounded-full inline-block"
                style={{
                  background: colors.glow.healthy + '20',
                  border: `1px solid ${colors.glow.healthy}40`,
                  color: colors.glow.healthy,
                }}
              >
                Journey Complete! 🎉
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* PART 1: THE MACHINE */}
        <motion.div
          className="w-full max-w-7xl mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Part 1 Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div>
              <h2
                className="text-2xl md:text-3xl font-bold"
                style={{ color: colors.text.primary }}
              >
                Part 1: The Machine
              </h2>
              <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
                Master single-node PostgreSQL
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs" style={{ color: colors.text.muted }}>
                  {isPart1Complete ? 'Complete!' : `${part1Progress}% complete`}
                </div>
              </div>
              <div
                className="w-32 h-2 rounded-full overflow-hidden"
                style={{ background: colors.text.muted + '30' }}
                role="progressbar"
                aria-valuenow={part1Progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Part 1: The Machine progress"
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: colors.glow.healthy }}
                  initial={{ width: 0 }}
                  animate={{ width: `${part1Progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Part 1 Episodes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <EpisodeCard
              episodeNumber={1}
              title="Genesis"
              tagline="How PostgreSQL stores your data at the byte level"
              route="/episode/1"
              glowColor={colors.glow.healthy}
              isCompleted={isEpisodeCompleted(1)}
            >
              <PagePreview />
            </EpisodeCard>

            <EpisodeCard
              episodeNumber={2}
              title="The Blueprint"
              tagline="Schema decisions that haunt you for years"
              route="/episode/2"
              glowColor={colors.glow.warning}
              isCompleted={isEpisodeCompleted(2)}
            >
              <BlueprintPreview />
            </EpisodeCard>

            <EpisodeCard
              episodeNumber={3}
              title="The First Heartbeat"
              tagline="Why the Write-Ahead Log is PostgreSQL's lifeline"
              route="/episode/3"
              glowColor={colors.glow.critical}
              isCompleted={isEpisodeCompleted(3)}
            >
              <HeartPreview />
            </EpisodeCard>

            <EpisodeCard
              episodeNumber={4}
              title="Memory Palace"
              tagline="Where PostgreSQL stores its thoughts"
              route="/episode/4"
              glowColor={colors.glow.healthy}
              isCompleted={isEpisodeCompleted(4)}
            >
              <MemoryPreview />
            </EpisodeCard>

            <EpisodeCard
              episodeNumber={5}
              title="The Many Lives"
              tagline="Why your UPDATE doesn't block reads"
              route="/episode/5"
              glowColor={colors.glow.warning}
              isCompleted={isEpisodeCompleted(5)}
            >
              <ManyLivesPreview />
            </EpisodeCard>

            <EpisodeCard
              episodeNumber={6}
              title="The Pathways"
              tagline="Why sequential scans take hours"
              route="/episode/6"
              glowColor={colors.glow.healthy}
              isCompleted={isEpisodeCompleted(6)}
            >
              <PathwaysPreview />
            </EpisodeCard>

            <EpisodeCard
              episodeNumber={7}
              title="The Strategy Room"
              tagline="How PostgreSQL picks the cheapest path"
              route="/episode/7"
              glowColor={colors.glow.warning}
              isCompleted={isEpisodeCompleted(7)}
            >
              <StrategyPreview />
            </EpisodeCard>

            <EpisodeCard
              episodeNumber={8}
              title="The Rules"
              tagline="Same moment, different truths"
              route="/episode/8"
              glowColor={colors.glow.healthy}
              isCompleted={isEpisodeCompleted(8)}
            >
              <RulesPreview />
            </EpisodeCard>

            <EpisodeCard
              episodeNumber={9}
              title="The Fever"
              tagline="When 47 queries wait while CPU sits idle"
              route="/episode/9"
              glowColor={colors.glow.critical}
              isCompleted={isEpisodeCompleted(9)}
            >
              <FeverPreview />
            </EpisodeCard>

            <EpisodeCard
              episodeNumber={10}
              title="The Cleanup"
              tagline="Your table is 10x larger than your data"
              route="/episode/10"
              glowColor={colors.glow.healthy}
              isCompleted={isEpisodeCompleted(10)}
            >
              <CleanupPreview />
            </EpisodeCard>

            <EpisodeCard
              episodeNumber={11}
              title="The Memory"
              tagline="How PostgreSQL remembers your data's shape"
              route="/episode/11"
              glowColor={colors.glow.warning}
              isCompleted={isEpisodeCompleted(11)}
            >
              <StatisticsPreview />
            </EpisodeCard>

            <EpisodeCard
              episodeNumber={12}
              title="The Circulation"
              tagline="Why 1000 serverless functions kill your database"
              route="/episode/12"
              glowColor={colors.glow.healthy}
              isCompleted={isEpisodeCompleted(12)}
            >
              <ConnectionPreview />
            </EpisodeCard>
          </div>
        </motion.div>

        {/* Divider between parts */}
        <motion.div
          className="w-full max-w-7xl mb-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div
            className="h-px w-full mb-6"
            style={{
              background: `linear-gradient(90deg, transparent, ${colors.glow.warning}40, transparent)`,
            }}
          />
          {isPart1Complete ? (
            <p style={{ color: colors.glow.warning }}>
              You've mastered the machine. Now scale beyond it.
            </p>
          ) : (
            <p style={{ color: colors.text.muted }}>
              Complete Part 1 to unlock distributed PostgreSQL
            </p>
          )}
          <div
            className="h-px w-full mt-6"
            style={{
              background: `linear-gradient(90deg, transparent, ${colors.glow.warning}40, transparent)`,
            }}
          />
        </motion.div>

        {/* PART 2: THE FLEET */}
        <motion.div
          className="w-full max-w-7xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {/* Part 2 Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div>
              <h2
                className="text-2xl md:text-3xl font-bold"
                style={{ color: colors.text.primary }}
              >
                Part 2: The Fleet
              </h2>
              <p className="text-sm mt-1" style={{ color: colors.text.muted }}>
                Scale beyond one machine
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs" style={{ color: colors.text.muted }}>
                  {part2Progress === 100 ? 'Complete!' : `${part2Progress}% complete`}
                </div>
              </div>
              <div
                className="w-32 h-2 rounded-full overflow-hidden"
                style={{ background: colors.text.muted + '30' }}
                role="progressbar"
                aria-valuenow={part2Progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Part 2: The Fleet progress"
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: colors.glow.warning }}
                  initial={{ width: 0 }}
                  animate={{ width: `${part2Progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Part 2 Episodes Grid */}
          <div className="relative">
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              style={{ opacity: isPart1Complete ? 1 : 0.6 }}
            >
              <EpisodeCard
                episodeNumber={13}
                title="Cell Division"
                tagline="Creating identical copies for read scaling"
                route="/episode/13"
                glowColor={colors.glow.warning}
                isCompleted={isEpisodeCompleted(13)}
                comingSoon={!isPart1Complete}
              >
                <ReplicaPreview />
              </EpisodeCard>

              <EpisodeCard
                episodeNumber={14}
                title="Organ Specialization"
                tagline="Dividing one giant table into manageable pieces"
                route="/episode/14"
                glowColor={colors.glow.healthy}
                isCompleted={isEpisodeCompleted(14)}
                comingSoon={!isPart1Complete}
              >
                <PartitionPreview />
              </EpisodeCard>

              <EpisodeCard
                episodeNumber={15}
                title="Beyond the Machine"
                tagline="When one database isn't enough"
                route="/episode/15"
                glowColor={colors.glow.critical}
                isCompleted={isEpisodeCompleted(15)}
                comingSoon={!isPart1Complete}
              >
                <ShardPreview />
              </EpisodeCard>
            </div>

            {/* Lock overlay for Part 2 when Part 1 incomplete */}
            {!isPart1Complete && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div
                  className="flex flex-col items-center gap-3 px-6 py-4 rounded-xl"
                  style={{
                    background: colors.oceanDark + 'e0',
                    border: `1px solid ${colors.text.muted}40`,
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={colors.glow.warning}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                    Complete Part 1 to unlock
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          className="mt-16 text-sm text-center"
          style={{ color: colors.text.muted }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {totalProgress === 0
            ? 'Click an episode to begin your journey'
            : isAllComplete
            ? 'You have completed the PostgreSQL Odyssey!'
            : 'Your progress is saved automatically'}
        </motion.p>

        {/* Footer branding */}
        <motion.footer
          className="mt-12 pt-8 border-t text-center"
          style={{ borderColor: colors.text.muted + '20' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <p className="text-sm" style={{ color: colors.text.muted }}>
            A{' '}
            <a
              href="https://lightslips.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors"
              style={{ color: colors.glow.warning }}
            >
              lightslips.ai
            </a>
            {' '}project
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
