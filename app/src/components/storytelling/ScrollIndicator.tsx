import { motion } from 'framer-motion';
import { colors } from '../../config/theme';

interface ScrollIndicatorProps {
  text?: string;
  delay?: number;
}

export function ScrollIndicator({ text = 'Scroll to continue', delay = 2 }: ScrollIndicatorProps) {
  return (
    <motion.div
      className="mt-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      <p
        className="text-sm uppercase tracking-widest text-center"
        style={{ color: colors.text.muted }}
      >
        {text}
      </p>
      <motion.div
        className="mt-4 w-6 h-10 border-2 rounded-full mx-auto relative"
        style={{ borderColor: colors.glow.healthy + '40' }}
      >
        <motion.div
          className="w-1.5 h-1.5 rounded-full absolute left-1/2 -translate-x-1/2"
          style={{ background: colors.glow.healthy }}
          animate={{ y: [8, 20, 8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  );
}
