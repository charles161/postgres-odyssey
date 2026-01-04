import { motion } from 'framer-motion';
import { EpisodeCard } from '../components/EpisodeCard';
import { PagePreview } from '../components/visualizations/PagePreview';
import { HeartPreview } from '../components/visualizations/HeartPreview';
import { MemoryPreview } from '../components/visualizations/MemoryPreview';
import { ManyLivesPreview } from '../components/visualizations/ManyLivesPreview';
import { PathwaysPreview } from '../components/visualizations/PathwaysPreview';
import { StrategyPreview } from '../components/visualizations/StrategyPreview';
import { RulesPreview } from '../components/visualizations/RulesPreview';
import { FeverPreview } from '../components/visualizations/FeverPreview';
import { CleanupPreview } from '../components/visualizations/CleanupPreview';
import { colors } from '../config/theme';

export function Home() {
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
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Hero section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Main title */}
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4"
            style={{ color: colors.text.primary }}
          >
            The Machine That
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${colors.glow.healthy} 0%, ${colors.glow.critical} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
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

          {/* Decorative line */}
          <motion.div
            className="mx-auto mt-6 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${colors.glow.healthy}60, transparent)`,
              width: 200,
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </motion.div>

        {/* Episode cards grid */}
        <motion.div
          className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Episode 1 - Genesis */}
          <EpisodeCard
            episodeNumber={1}
            title="Genesis"
            tagline="How PostgreSQL stores your data at the byte level"
            route="/episode/1"
            glowColor={colors.glow.healthy}
          >
            <PagePreview />
          </EpisodeCard>

          {/* Episode 2 - The First Heartbeat */}
          <EpisodeCard
            episodeNumber={2}
            title="The First Heartbeat"
            tagline="Why the Write-Ahead Log is PostgreSQL's lifeline"
            route="/episode/2"
            glowColor={colors.glow.critical}
          >
            <HeartPreview />
          </EpisodeCard>

          {/* Episode 3 - Memory Palace */}
          <EpisodeCard
            episodeNumber={3}
            title="Memory Palace"
            tagline="Where PostgreSQL stores its thoughts"
            route="/episode/3"
            glowColor={colors.glow.healthy}
          >
            <MemoryPreview />
          </EpisodeCard>

          {/* Episode 4 - The Many Lives */}
          <EpisodeCard
            episodeNumber={4}
            title="The Many Lives"
            tagline="Why your UPDATE doesn't block reads"
            route="/episode/4"
            glowColor={colors.glow.warning}
          >
            <ManyLivesPreview />
          </EpisodeCard>

          {/* Episode 5 - The Pathways */}
          <EpisodeCard
            episodeNumber={5}
            title="The Pathways"
            tagline="Why sequential scans take hours"
            route="/episode/5"
            glowColor={colors.glow.healthy}
          >
            <PathwaysPreview />
          </EpisodeCard>

          {/* Episode 6 - The Strategy Room */}
          <EpisodeCard
            episodeNumber={6}
            title="The Strategy Room"
            tagline="How PostgreSQL picks the cheapest path"
            route="/episode/6"
            glowColor={colors.glow.warning}
          >
            <StrategyPreview />
          </EpisodeCard>

          {/* Episode 7 - The Rules */}
          <EpisodeCard
            episodeNumber={7}
            title="The Rules"
            tagline="Same moment, different truths"
            route="/episode/7"
            glowColor={colors.glow.healthy}
          >
            <RulesPreview />
          </EpisodeCard>

          {/* Episode 8 - The Fever */}
          <EpisodeCard
            episodeNumber={8}
            title="The Fever"
            tagline="When 47 queries wait while CPU sits idle"
            route="/episode/8"
            glowColor={colors.glow.critical}
          >
            <FeverPreview />
          </EpisodeCard>

          {/* Episode 9 - The Cleanup */}
          <EpisodeCard
            episodeNumber={9}
            title="The Cleanup"
            tagline="Your table is 10x larger than your data"
            route="/episode/9"
            glowColor={colors.glow.healthy}
          >
            <CleanupPreview />
          </EpisodeCard>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          className="mt-16 text-sm text-center"
          style={{ color: colors.text.muted }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          Click an episode to begin your journey
        </motion.p>
      </div>
    </div>
  );
}
