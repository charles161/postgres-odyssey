import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { gsap, ScrollTrigger } from '../lib/gsap';

interface ScrollProgressOptions {
  start?: string;
  end?: string;
  scrub?: boolean | number;
  pin?: boolean;
  onEnter?: () => void;
  onLeave?: () => void;
  onEnterBack?: () => void;
  onLeaveBack?: () => void;
}

export function useScrollProgress(
  triggerRef: RefObject<HTMLElement | null>,
  options: ScrollProgressOptions = {}
) {
  const [progress, setProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!triggerRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: triggerRef.current,
      start: options.start ?? 'top center',
      end: options.end ?? 'bottom center',
      scrub: options.scrub ?? true,
      pin: options.pin ?? false,
      onUpdate: (self) => {
        setProgress(self.progress);
      },
      onEnter: () => {
        setIsInView(true);
        options.onEnter?.();
      },
      onLeave: () => {
        setIsInView(false);
        options.onLeave?.();
      },
      onEnterBack: () => {
        setIsInView(true);
        options.onEnterBack?.();
      },
      onLeaveBack: () => {
        setIsInView(false);
        options.onLeaveBack?.();
      },
    });

    return () => {
      trigger.kill();
    };
  }, [triggerRef, options]);

  return { progress, isInView };
}

// Hook for creating scroll-scrubbed animations
export function useScrollAnimation(
  triggerRef: RefObject<HTMLElement | null>,
  targetRef: RefObject<HTMLElement | null>,
  animation: gsap.TweenVars,
  options: ScrollProgressOptions = {}
) {
  useEffect(() => {
    if (!triggerRef.current || !targetRef.current) return;

    const tween = gsap.to(targetRef.current, {
      ...animation,
      scrollTrigger: {
        trigger: triggerRef.current,
        start: options.start ?? 'top center',
        end: options.end ?? 'bottom center',
        scrub: options.scrub ?? 0.5,
        pin: options.pin ?? false,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [triggerRef, targetRef, animation, options]);
}

// Hook for pinned sections with timeline
export function usePinnedTimeline(
  containerRef: RefObject<HTMLElement | null>,
  options: {
    end?: string;
    scrub?: number;
  } = {}
) {
  const [timeline, setTimeline] = useState<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: options.end ?? '+=200%',
        pin: true,
        scrub: options.scrub ?? 1,
        anticipatePin: 1,
      },
    });

    setTimeline(tl);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [containerRef, options]);

  return timeline;
}
