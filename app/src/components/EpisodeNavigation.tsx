import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { colors } from '../config/theme';
import { useProgress } from '../hooks/useProgress';

// Episode metadata for consistent naming
const EPISODES = [
  { num: 1, title: 'Genesis', subtitle: 'The Origin' },
  { num: 2, title: 'The Blueprint', subtitle: 'Schema Design' },
  { num: 3, title: 'The First Heartbeat', subtitle: 'Write-Ahead Log' },
  { num: 4, title: 'Memory Palace', subtitle: 'Buffer Pool' },
  { num: 5, title: 'The Many Lives', subtitle: 'MVCC' },
  { num: 6, title: 'The Pathways', subtitle: 'Indexes' },
  { num: 7, title: 'The Strategy Room', subtitle: 'Query Planner' },
  { num: 8, title: 'The Rules', subtitle: 'Transactions' },
  { num: 9, title: 'The Fever', subtitle: 'Locks' },
  { num: 10, title: 'The Cleanup', subtitle: 'Vacuum' },
  { num: 11, title: 'The Memory', subtitle: 'Statistics' },
  { num: 12, title: 'The Circulation', subtitle: 'Connections' },
  { num: 13, title: 'Cell Division', subtitle: 'Replication' },
  { num: 14, title: 'Organ Specialization', subtitle: 'Partitioning' },
  { num: 15, title: 'Beyond the Machine', subtitle: 'Finale' },
];

function getEpisode(num: number) {
  return EPISODES.find(e => e.num === num);
}

interface EpisodeNavigationProps {
  currentEpisode: number;
  showComplete?: boolean; // Whether to mark episode complete when component mounts
}

export function EpisodeNavigation({
  currentEpisode,
  showComplete = true
}: EpisodeNavigationProps) {
  const navigate = useNavigate();
  const { completeEpisode } = useProgress();

  const prevEpisode = currentEpisode > 1 ? getEpisode(currentEpisode - 1) : null;
  const nextEpisode = currentEpisode < 15 ? getEpisode(currentEpisode + 1) : null;

  // Mark episode as complete when this component renders
  useEffect(() => {
    if (showComplete) {
      completeEpisode(currentEpisode);
    }
  }, [currentEpisode, showComplete, completeEpisode]);

  return (
    <motion.div
      className="flex flex-col sm:flex-row gap-4 justify-center items-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      {/* Previous Episode Button */}
      {prevEpisode && (
        <motion.button
          className="px-6 py-3 rounded-lg text-sm sm:text-base font-medium transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            window.scrollTo(0, 0);
            navigate(`/episode/${prevEpisode.num}`);
          }}
          style={{
            background: colors.oceanLight,
            color: colors.text.secondary,
            border: `1px solid ${colors.text.muted}40`,
          }}
        >
          ← Episode {prevEpisode.num}: {prevEpisode.title}
        </motion.button>
      )}

      {/* Home Button */}
      <motion.button
        className="px-6 py-3 rounded-lg text-sm sm:text-base font-medium transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          window.scrollTo(0, 0);
          navigate('/');
        }}
        style={{
          background: colors.ocean,
          color: colors.text.muted,
          border: `1px solid ${colors.text.muted}40`,
        }}
      >
        Home
      </motion.button>

      {/* Next Episode Button */}
      {nextEpisode && (
        <motion.button
          className="px-6 py-3 rounded-lg text-sm sm:text-base font-medium transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            window.scrollTo(0, 0);
            navigate(`/episode/${nextEpisode.num}`);
          }}
          style={{
            background: `${colors.glow.healthy}20`,
            color: colors.glow.healthy,
            border: `1px solid ${colors.glow.healthy}40`,
          }}
        >
          Episode {nextEpisode.num}: {nextEpisode.title} →
        </motion.button>
      )}

      {/* Final Episode - Return Home */}
      {currentEpisode === 15 && (
        <motion.button
          className="px-6 py-3 rounded-lg text-sm sm:text-base font-medium transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            window.scrollTo(0, 0);
            navigate('/');
          }}
          style={{
            background: `${colors.glow.healthy}20`,
            color: colors.glow.healthy,
            border: `1px solid ${colors.glow.healthy}40`,
          }}
        >
          Complete Journey →
        </motion.button>
      )}
    </motion.div>
  );
}
