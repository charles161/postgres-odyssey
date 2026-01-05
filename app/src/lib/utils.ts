import { useState, useEffect } from 'react';

/**
 * Cancellable delay with AbortSignal support
 * Use with AbortController to cancel pending delays on unmount or reset
 */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

/**
 * Pre-generate random values for render stability
 * Call once at module level or in useMemo to avoid re-generating on each render
 */
export function generateRandomValues(count: number, max: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * max));
}

/**
 * Generate random values within a range
 */
export function generateRandomInRange(count: number, min: number, max: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min)) + min);
}

/**
 * Generate random float values (0-1)
 */
export function generateRandomFloats(count: number): number[] {
  return Array.from({ length: count }, () => Math.random());
}

/**
 * Hook to detect user's prefers-reduced-motion preference
 * Returns true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);

    const handler = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener('change', handler);

    return () => query.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

/**
 * Check if running async operation was aborted
 * Use after each await to early-exit if aborted
 */
export function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
}

/**
 * Helper to safely handle AbortError in async functions
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
