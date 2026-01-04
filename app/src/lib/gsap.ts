import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Global defaults for Biological Noir aesthetic
gsap.defaults({
  ease: 'power2.inOut',
  duration: 0.8,
});

// Configure ScrollTrigger defaults
ScrollTrigger.defaults({
  toggleActions: 'play none none reverse',
  markers: false, // Set to true for debugging
});

// Utility to kill all ScrollTriggers (for cleanup)
export function killAllScrollTriggers() {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}

// Utility to refresh ScrollTrigger (after DOM changes)
export function refreshScrollTrigger() {
  ScrollTrigger.refresh();
}

// Export configured instances
export { gsap, ScrollTrigger };
