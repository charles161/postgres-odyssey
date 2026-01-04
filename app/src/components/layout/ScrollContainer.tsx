import type { ReactNode } from 'react';
import { useLenis } from '../../hooks/useLenis';

interface ScrollContainerProps {
  children: ReactNode;
}

export function ScrollContainer({ children }: ScrollContainerProps) {
  // Initialize Lenis smooth scroll
  useLenis();

  return <>{children}</>;
}
