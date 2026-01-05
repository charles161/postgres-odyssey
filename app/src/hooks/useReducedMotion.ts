import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

/**
 * Hook that detects if the user has requested reduced motion.
 * Uses Framer Motion's built-in hook which checks prefers-reduced-motion media query.
 *
 * Usage:
 * const prefersReducedMotion = useReducedMotion();
 * if (prefersReducedMotion) {
 *   // Skip animations or provide simpler alternatives
 * }
 */
export function useReducedMotion(): boolean {
  const shouldReduceMotion = useFramerReducedMotion();
  return shouldReduceMotion ?? false;
}
