import { useEffect } from 'react';
import { ScrollTrigger } from '../lib/gsap';

/**
 * Native scroll hook - replaces Lenis smooth scroll
 *
 * Why native scroll over Lenis:
 * - Educational content requires immediate scroll response for reading
 * - Lenis creates a "sluggish" feeling with its 1.2s momentum
 * - Native scroll is predictable and accessible
 * - Users need to read and comprehend, not admire scroll animations
 */
export function useLenis() {
  useEffect(() => {
    // Just ensure ScrollTrigger is updated on native scroll
    const handleScroll = () => {
      ScrollTrigger.update();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Add smooth scroll for programmatic navigation only
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  // Return null - no Lenis instance needed
  return { current: null };
}

// Hook to scroll to a specific element - uses native smooth scroll
export function useScrollTo() {
  const scrollTo = (
    target: string | HTMLElement,
    options?: { offset?: number; duration?: number }
  ) => {
    const element =
      typeof target === 'string' ? document.querySelector(target) : target;

    if (element) {
      const offset = options?.offset ?? 0;
      const top = element.getBoundingClientRect().top + window.scrollY + offset;

      window.scrollTo({
        top,
        behavior: 'smooth',
      });
    }
  };

  return scrollTo;
}
