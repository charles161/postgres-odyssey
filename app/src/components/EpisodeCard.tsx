import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { colors } from '../config/theme';

interface EpisodeCardProps {
  episodeNumber: number;
  title: string;
  tagline: string;
  route: string;
  glowColor: string;
  children: ReactNode; // The visualization component
  comingSoon?: boolean;
  isCompleted?: boolean;
}

export function EpisodeCard({
  episodeNumber,
  title,
  tagline,
  route,
  glowColor,
  children,
  comingSoon = false,
  isCompleted = false,
}: EpisodeCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Combined active state for hover or focus
  const isActive = isHovered || isFocused;

  const handleClick = () => {
    if (!comingSoon) {
      navigate(route);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden outline-none"
      style={{
        background: `linear-gradient(135deg, ${colors.oceanDark} 0%, ${colors.oceanLight} 100%)`,
        border: `2px solid ${glowColor}30`,
        cursor: comingSoon ? 'default' : 'pointer',
        opacity: comingSoon ? 0.6 : 1,
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: comingSoon ? 0.6 : 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
      whileHover={comingSoon ? {} : {
        scale: 1.02,
        borderColor: `${glowColor}60`,
      }}
      whileFocus={comingSoon ? {} : {
        scale: 1.02,
        borderColor: `${glowColor}60`,
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => !comingSoon && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => !comingSoon && setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      tabIndex={comingSoon ? -1 : 0}
      role="button"
      aria-label={`Episode ${episodeNumber}: ${title}. ${tagline}${isCompleted ? '. Completed' : ''}`}
    >
      {/* Glow effect on hover/focus */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          boxShadow: isActive
            ? `0 0 60px ${glowColor}30, inset 0 0 40px ${glowColor}10`
            : `0 0 0px transparent`,
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Top gradient fade for depth */}
      <div
        className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${colors.oceanDark}80 0%, transparent 100%)`,
        }}
      />

      {/* Episode number badge */}
      <div className="absolute top-5 left-5 z-10">
        <motion.div
          className="px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider"
          style={{
            background: `${glowColor}20`,
            color: glowColor,
            border: `1px solid ${glowColor}40`,
          }}
          animate={{
            boxShadow: isActive ? `0 0 20px ${glowColor}40` : 'none',
          }}
        >
          Episode {episodeNumber}
        </motion.div>
      </div>

      {/* Completed badge */}
      {isCompleted && (
        <motion.div
          className="absolute top-5 right-5 z-10"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: colors.glow.healthy,
              boxShadow: `0 0 15px ${colors.glow.healthy}60`,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8L6.5 11.5L13 4.5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </motion.div>
      )}

      {/* Visualization container */}
      <div className="relative h-64 flex items-center justify-center overflow-hidden">
        <motion.div
          animate={{
            scale: isActive ? 1.05 : 1,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative p-6 pt-4">
        {/* Title */}
        <motion.h3
          className="text-2xl font-semibold mb-2"
          style={{ color: colors.text.primary }}
          animate={{
            color: isActive ? glowColor : colors.text.primary,
          }}
          transition={{ duration: 0.3 }}
        >
          {title}
        </motion.h3>

        {/* Tagline */}
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          {tagline}
        </p>

        {/* Call to action */}
        <motion.div
          className="mt-4 flex items-center gap-2"
          animate={{
            opacity: isActive ? 1 : 0.6,
            x: isActive && !comingSoon ? 4 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {comingSoon ? (
            <span className="text-sm font-medium" style={{ color: colors.text.muted }}>
              Coming Soon
            </span>
          ) : (
            <>
              <span className="text-sm font-medium" style={{ color: glowColor }}>
                {isCompleted ? 'Revisit' : 'Begin Journey'}
              </span>
              <motion.svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                animate={{
                  x: isActive ? 4 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <path
                  d="M3 8H13M13 8L9 4M13 8L9 12"
                  stroke={glowColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            </>
          )}
        </motion.div>
      </div>

      {/* Bottom glow line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ background: glowColor }}
        animate={{
          opacity: isActive ? 0.8 : 0.3,
          scaleX: isActive ? 1 : 0.3,
        }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  );
}
