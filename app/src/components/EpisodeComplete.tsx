import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { colors } from '../config/theme';
import { useProgress } from '../hooks/useProgress';
import { Link } from 'react-router-dom';

interface EpisodeCompleteProps {
  episodeNumber: number;
  episodeTitle: string;
  nextEpisode?: number;
}

// Episode-specific insights for better share text
const EPISODE_INSIGHTS: Record<number, string> = {
  1: 'how PostgreSQL stores data at the byte level (tuples, pages, and heaps)',
  2: 'schema design decisions that haunt you for years',
  3: 'why the Write-Ahead Log is PostgreSQL\'s lifeline',
  4: 'how the buffer pool makes databases fast',
  5: 'how MVCC lets reads and writes happen simultaneously',
  6: 'why indexes are the difference between 10ms and 10 minutes',
  7: 'how the query planner picks the cheapest execution path',
  8: 'ACID transactions and isolation levels',
  9: 'locks, deadlocks, and why 47 queries wait while CPU sits idle',
  10: 'VACUUM and why your table is 10x larger than your data',
  11: 'how PostgreSQL uses statistics to plan queries',
  12: 'connection pooling and why 1000 serverless functions kill your database',
  13: 'replication, WAL streaming, and read scaling',
  14: 'table partitioning and partition pruning',
  15: 'sharding, CAP theorem, and distributed PostgreSQL',
};

export function EpisodeComplete({ episodeNumber, episodeTitle, nextEpisode }: EpisodeCompleteProps) {
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const {
    completeEpisode,
    isEpisodeCompleted,
    part1Progress,
    part2Progress,
    isPart1Complete,
    isAllComplete,
    PART_1_EPISODES,
  } = useProgress();

  const isPart1 = PART_1_EPISODES.includes(episodeNumber);
  const wasAlreadyComplete = isEpisodeCompleted(episodeNumber);

  useEffect(() => {
    // Mark episode as completed
    completeEpisode(episodeNumber);

    // Trigger confetti if not already completed
    if (!wasAlreadyComplete && !hasTriggeredConfetti) {
      setHasTriggeredConfetti(true);

      // Confetti burst
      const duration = 2000;
      const animationEnd = Date.now() + duration;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: [colors.glow.healthy, colors.glow.warning, colors.glow.critical],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: [colors.glow.healthy, colors.glow.warning, colors.glow.critical],
        });
      }, 50);

      // Special celebration for milestones
      if (isPart1Complete || isAllComplete) {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: [colors.glow.healthy, colors.glow.warning, '#9333ea', '#ec4899'],
          });
        }, 500);
      }

      return () => clearInterval(interval);
    }
  }, [episodeNumber, completeEpisode, wasAlreadyComplete, hasTriggeredConfetti, isPart1Complete, isAllComplete]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const insight = EPISODE_INSIGHTS[episodeNumber] || episodeTitle;
  const shareText = `Just learned ${insight} in PostgreSQL Odyssey 🐘\n\n${shareUrl}`;

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    }
  };

  return (
    <motion.div
      className="p-8 rounded-xl text-center"
      style={{
        background: colors.glow.healthy + '10',
        border: `1px solid ${colors.glow.healthy}40`,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Celebration icon */}
      <motion.div
        className="text-5xl mb-4"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: 2 }}
      >
        🎉
      </motion.div>

      {/* Title */}
      <h3
        className="text-2xl font-bold mb-2"
        style={{ color: colors.glow.healthy }}
      >
        Episode {episodeNumber} Complete!
      </h3>

      <p className="mb-6" style={{ color: colors.text.secondary }}>
        {episodeTitle}
      </p>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: colors.text.muted }}>
            {isPart1 ? 'Part 1 Progress' : 'Part 2 Progress'}
          </span>
          <span style={{ color: colors.glow.healthy }}>
            {isPart1 ? `${part1Progress}%` : `${part2Progress}%`}
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: colors.text.muted + '30' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: colors.glow.healthy }}
            initial={{ width: 0 }}
            animate={{ width: `${isPart1 ? part1Progress : part2Progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Milestone message */}
      {isPart1Complete && isPart1 && episodeNumber === 12 && (
        <motion.div
          className="p-4 rounded-lg mb-6"
          style={{
            background: colors.glow.warning + '20',
            border: `1px solid ${colors.glow.warning}40`,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="font-bold" style={{ color: colors.glow.warning }}>
            Part 1 Complete! 🏆
          </p>
          <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
            You've mastered the machine. Ready for The Fleet?
          </p>
        </motion.div>
      )}

      {isAllComplete && (
        <motion.div
          className="p-4 rounded-lg mb-6"
          style={{
            background: colors.glow.critical + '20',
            border: `1px solid ${colors.glow.critical}40`,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="font-bold text-lg" style={{ color: colors.glow.critical }}>
            Journey Complete! 🎊
          </p>
          <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
            You've mastered PostgreSQL from bytes to distributed systems!
          </p>
        </motion.div>
      )}

      {/* Next episode button - primary CTA */}
      {nextEpisode && nextEpisode <= 15 && (
        <Link
          to={`/episode/${nextEpisode}`}
          className="inline-block px-6 py-3 rounded-full font-medium mb-6"
          style={{
            background: colors.glow.healthy + '20',
            color: colors.glow.healthy,
            border: `1px solid ${colors.glow.healthy}`,
          }}
        >
          Continue to Episode {nextEpisode} →
        </Link>
      )}

      {episodeNumber === 15 && (
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-full font-medium mb-6"
          style={{
            background: colors.glow.healthy + '20',
            color: colors.glow.healthy,
            border: `1px solid ${colors.glow.healthy}`,
          }}
        >
          Return to Home →
        </Link>
      )}

      {/* Share buttons */}
      <div className="flex flex-wrap justify-center gap-3 relative">
        <button
          onClick={handleTwitterShare}
          className="px-4 py-2 rounded text-sm font-mono flex items-center gap-2 cursor-pointer"
          style={{
            background: '#1DA1F2' + '20',
            color: '#1DA1F2',
            border: '1px solid #1DA1F2',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share on X
        </button>

        <button
          onClick={handleLinkedInShare}
          className="px-4 py-2 rounded text-sm font-mono flex items-center gap-2 cursor-pointer"
          style={{
            background: '#0A66C2' + '20',
            color: '#0A66C2',
            border: '1px solid #0A66C2',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          Share on LinkedIn
        </button>

        <button
          onClick={handleCopyLink}
          className="px-4 py-2 rounded text-sm font-mono flex items-center gap-2 cursor-pointer"
          style={{
            background: colors.text.muted + '20',
            color: colors.text.secondary,
            border: `1px solid ${colors.text.muted}`,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Copy Link
        </button>

        {/* Toast notification */}
        {showCopiedToast && (
          <motion.div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-mono"
            style={{
              background: colors.glow.healthy,
              color: colors.ocean,
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            Link copied!
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
