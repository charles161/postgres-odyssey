import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

interface SkipIntroProps {
  onSkip: () => void;
  delay?: number;
}

export function SkipIntro({ onSkip, delay = 2 }: SkipIntroProps) {
  return (
    <motion.button
      className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm z-50"
      style={{ color: colors.text.muted }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.5 }}
      transition={{ delay }}
      whileHover={{ opacity: 1 }}
      onClick={onSkip}
    >
      Skip intro
    </motion.button>
  );
}
