// Animation Configuration - Motion Hierarchy
// Principle: Stillness makes movement precious. NOT everything breathes.

export const motion = {
  // Heart/WAL - Continuous subtle pulse (only element that always animates)
  heart: {
    duration: 1.8,
    scale: [0.97, 1.03],
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
  },

  // Other organs - Only on hover
  organHover: {
    duration: 0.3,
    scale: 1.05,
    ease: 'power2.out',
  },

  // Background particles - Imperceptible drift
  particles: {
    duration: 20,
    ease: 'none',
  },

  // Text reveal animations
  textReveal: {
    stagger: 0.12,
    duration: 0.6,
    ease: 'power3.out',
    y: 50,
  },

  // Page construction (signature moment)
  pageConstruct: {
    duration: 2.4,
    ease: 'power2.inOut',
    stagger: 0.1,
  },

  // Cursor glow
  cursorGlow: {
    delay: 0.1, // 100ms delay for trailing effect
    duration: 0.15,
    ease: 'power2.out',
  },

  // Scene transitions
  sceneTransition: {
    duration: 0.8,
    ease: 'power3.inOut',
  },

  // Pulse ring (for heart and interactive elements)
  pulseRing: {
    duration: 2,
    scale: 2,
    opacity: 0,
    ease: 'power2.out',
  },
} as const;

// Episode 5: Pathways - Nervous System Metaphor
// The B-tree is like a nerve pathway - signals travel down, branches light up or dim
export const pathwayMotion = {
  // Nerve signal traveling down a pathway (when traversing B-tree)
  synapseTravel: {
    duration: 0.4,
    ease: 'power4.out',
  },

  // Branch rejection - fading out non-selected paths
  pathwayDim: {
    duration: 0.5,
    opacity: 0.15,
    ease: 'power2.in',
    scale: 0.97,
  },

  // Branch selection - lighting up the chosen path
  pathwayIgnite: {
    duration: 0.3,
    ease: 'power3.out',
    glowBlur: 12,
    glowSpread: 4,
  },

  // ctid reveal - the address moment (signature moment)
  addressReveal: {
    duration: 0.6,
    stagger: 0.2,
    ease: 'back.out(1.4)',
    y: -20,
  },

  // Heap hop - the jump from index leaf to heap page
  heapHop: {
    duration: 0.8,
    ease: 'power2.inOut',
    arcHeight: 30, // pixels of upward arc for the beam
  },

  // Counter roll - for split screen comparison animation
  counterRoll: {
    duration: 2,
    ease: 'power2.out',
  },

  // Decision text - showing comparison at each B-tree node
  decisionText: {
    duration: 0.3,
    stagger: 0.05,
    ease: 'power2.out',
  },
} as const;

// B-tree Navigator - Centralized timing for consistent animations
export const btreeNavigation = {
  // Timing (in milliseconds for delay(), seconds for framer-motion)
  timing: {
    rootInspection: 1200,    // ms - time to examine root
    signalTravel: 600,       // ms - signal traveling between nodes
    nodeInspection: 800,     // ms - time at each internal node
    leafScan: 600,           // ms - scanning leaf entries
    questionReveal: 500,     // ms - showing the question
    answerReveal: 400,       // ms - revealing the answer
  },
  // Easing functions - standardized for predictability
  easing: {
    stateChange: 'easeOut',  // For opacity, scale, filter changes
    entrance: [0.34, 1.56, 0.64, 1], // Spring-like overshoot for entrances
    signal: 'linear',        // Constant speed for traveling signals
  },
  // Pulse ring configuration - unified for all nodes
  pulseRing: {
    duration: 1.2,
    scale: 1.4,              // Same for TreeNodeBox and LeafNodeBox
    stagger: 0.4,            // Delay between rings
  },
  // Breathing animation - synchronized across all path elements
  breathing: {
    duration: 2,             // Slower, more relaxed
    opacity: [0.7, 1, 0.7],
    ease: 'easeInOut',
  },
} as const;

// ScrollTrigger defaults
export const scrollConfig = {
  // Default scrub value (smoothness)
  scrub: 0.5,

  // Lock point pause duration (ms)
  lockPauseDuration: 300,

  // Scene heights
  sceneHeights: {
    opening: '100vh',
    cosmicZoom: '200vh',
    pageAnatomy: '300vh', // Signature moment gets more scroll
    tupleStructure: '150vh',
    conclusion: '100vh',
  },
} as const;

// Easing functions for GSAP
export const easing = {
  // Organic feel
  organic: 'power2.inOut',

  // Breathe animation
  breathe: 'sine.inOut',

  // Enter animations
  enter: 'power3.out',

  // Exit animations
  exit: 'power3.in',

  // Dramatic reveals
  dramatic: 'expo.out',

  // Elastic/springy
  elastic: 'elastic.out(1, 0.3)',

  // Linear for continuous
  linear: 'none',
} as const;

// Timing constants (in seconds)
export const timing = {
  // Text reveal opening sequence
  openingSequence: {
    initialBlack: 1.5,
    beforeFadeIn: 0.4,
    beforeHold: 0.8,
    queryReveal: 0.12, // stagger per word
    ellipsisPause: 0.3,
    dimScreen: 0.3,
    pageReveal: 0.6,
  },

  // Cosmic zoom
  cosmicZoom: {
    galaxyScale: 0.8,
    crossfade: 0.8,
    pageReveal: 0.8,
  },
} as const;
