// Biological Noir Theme Configuration

export const colors = {
  // Ocean Depths - Primary backgrounds
  ocean: '#0a1628',
  oceanLight: '#142238',
  oceanDark: '#060d18',

  // Bioluminescent Glows
  glow: {
    healthy: '#00d4ff',
    warning: '#ff9d00',
    critical: '#ff3366',
    dead: '#4a4a6a',
  },

  // Text Colors
  text: {
    primary: '#f0f0f5',
    secondary: '#a0a0b0',
    muted: '#606070',
  },
} as const;

export const typography = {
  fontDisplay: '"Inter", system-ui, sans-serif',
  fontMono: '"JetBrains Mono", monospace',
} as const;

// Organ types for the organism diagram
export type OrganType =
  | 'heart'      // WAL Writer
  | 'brain'      // Query Planner
  | 'skeleton'   // Storage Layer
  | 'digestive'  // VACUUM
  | 'nervous'    // Lock Queues
  | 'circulatory'; // Connections

export interface OrganConfig {
  type: OrganType;
  label: string;
  subtitle: string;
  episode: number;
  position: { x: number; y: number };
  unlocked: boolean;
}

export const organs: OrganConfig[] = [
  {
    type: 'skeleton',
    label: 'Storage Layer',
    subtitle: 'Genesis',
    episode: 1,
    position: { x: 50, y: 75 },
    unlocked: true,
  },
  {
    type: 'heart',
    label: 'WAL Writer',
    subtitle: 'The First Heartbeat',
    episode: 2,
    position: { x: 50, y: 45 },
    unlocked: false,
  },
  {
    type: 'brain',
    label: 'Query Planner',
    subtitle: 'The Nervous System',
    episode: 8,
    position: { x: 50, y: 20 },
    unlocked: false,
  },
  {
    type: 'digestive',
    label: 'VACUUM',
    subtitle: 'The Digestion',
    episode: 6,
    position: { x: 30, y: 55 },
    unlocked: false,
  },
  {
    type: 'nervous',
    label: 'Lock Queues',
    subtitle: 'The Fever',
    episode: 5,
    position: { x: 70, y: 55 },
    unlocked: false,
  },
  {
    type: 'circulatory',
    label: 'Connections',
    subtitle: 'Circulatory System',
    episode: 9,
    position: { x: 50, y: 35 },
    unlocked: false,
  },
];
