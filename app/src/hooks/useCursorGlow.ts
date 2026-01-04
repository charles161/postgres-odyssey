import { useEffect, useState, useCallback } from 'react';
import { gsap } from '../lib/gsap';
import { motion } from '../config/animation';

interface CursorPosition {
  x: number;
  y: number;
}

export function useCursorGlow() {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
    if (!isVisible) setIsVisible(true);
  }, [isVisible]);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    // Skip on touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Track hover state on interactive elements
    const interactiveElements = document.querySelectorAll('a, button, [data-interactive]');

    const handleInteractiveEnter = () => setIsHovering(true);
    const handleInteractiveLeave = () => setIsHovering(false);

    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleInteractiveEnter);
      el.addEventListener('mouseleave', handleInteractiveLeave);
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);

      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleInteractiveEnter);
        el.removeEventListener('mouseleave', handleInteractiveLeave);
      });
    };
  }, [handleMouseMove, handleMouseLeave, handleMouseEnter]);

  return { position, isHovering, isVisible };
}

// Animate element to follow cursor with delay
export function animateCursorFollow(
  element: HTMLElement,
  position: { x: number; y: number },
  delay: number = motion.cursorGlow.delay
) {
  gsap.to(element, {
    x: position.x,
    y: position.y,
    duration: motion.cursorGlow.duration,
    ease: motion.cursorGlow.ease,
    delay,
  });
}
