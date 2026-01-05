import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { colors } from '../config/theme';

export function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: colors.ocean }}
    >
      {/* Background glow */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.glow.critical}10 0%, transparent 50%)`,
        }}
      />

      <motion.div
        className="relative z-10 text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 404 Number */}
        <motion.div
          className="text-8xl md:text-9xl font-bold mb-4"
          style={{
            background: `linear-gradient(135deg, ${colors.glow.critical} 0%, ${colors.glow.warning} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          animate={{
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          404
        </motion.div>

        {/* Error Message */}
        <h1
          className="text-2xl font-semibold mb-4"
          style={{ color: colors.text.primary }}
        >
          Page Not Found
        </h1>

        <p className="mb-8" style={{ color: colors.text.secondary }}>
          Looks like this page got lost in the WAL. The data might have been
          VACUUMed, or perhaps it never existed.
        </p>

        {/* Database-themed visual */}
        <motion.div
          className="mb-8 p-4 rounded-lg font-mono text-sm text-left"
          style={{ background: colors.oceanDark }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div style={{ color: colors.text.muted }}>-- Query failed</div>
          <div>
            <span style={{ color: colors.glow.healthy }}>SELECT</span>
            <span style={{ color: colors.text.secondary }}> * </span>
            <span style={{ color: colors.glow.healthy }}>FROM</span>
            <span style={{ color: colors.text.primary }}> pages</span>
          </div>
          <div>
            <span style={{ color: colors.glow.healthy }}>WHERE</span>
            <span style={{ color: colors.text.secondary }}> path = </span>
            <span style={{ color: colors.glow.warning }}>'{window.location.pathname}'</span>
            <span style={{ color: colors.text.secondary }}>;</span>
          </div>
          <div className="mt-2" style={{ color: colors.glow.critical }}>
            ERROR: relation "page" does not exist
          </div>
        </motion.div>

        {/* Back to Home Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all"
          style={{
            background: colors.glow.healthy + '20',
            color: colors.glow.healthy,
            border: `1px solid ${colors.glow.healthy}`,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M13 8H3M3 8L7 4M3 8L7 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Return to Home
        </Link>

        {/* Decorative line */}
        <motion.div
          className="mx-auto mt-8 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.text.muted}40, transparent)`,
            width: 200,
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />

        <p className="mt-4 text-xs" style={{ color: colors.text.muted }}>
          The PostgreSQL Odyssey
        </p>
      </motion.div>
    </div>
  );
}
