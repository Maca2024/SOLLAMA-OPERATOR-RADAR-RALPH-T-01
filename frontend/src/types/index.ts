// API Types for Solvari Radar

export interface Profile {
  id: string;
  name: string | null;
  ring: number;
  ring_name: string;
  ring_emoji: string;
  quality_score: number;
  location: string | null;
  specialization: string[];
  source_url: string;
  outreach_sent: boolean;
  created_at: string;
}

export interface Stats {
  total_profiles: number;
  by_ring: Record<number, number>;
  average_quality_score: number;
  outreach_sent: number;
}

export interface RingInfo {
  number: number;
  name: string;
  emoji: string;
  description: string;
  hooks: string[];
}

export interface PipelineResult {
  url: string;
  success: boolean;
  profile_id: string | null;
  ring: number | null;
  ring_name: string | null;
  quality_score: number | null;
  outreach_channel: string | null;
  error: string | null;
}

export interface OutreachMessage {
  id: string;
  channel: string;
  subject: string | null;
  body: string;
}

// Ring colors and styling
export const RING_COLORS = {
  1: { bg: 'bg-red-500', text: 'text-red-400', glow: 'glow-red', gradient: 'from-red-500 to-red-600' },
  2: { bg: 'bg-orange-500', text: 'text-orange-400', glow: 'glow-orange', gradient: 'from-orange-500 to-orange-600' },
  3: { bg: 'bg-yellow-500', text: 'text-yellow-400', glow: 'glow-yellow', gradient: 'from-yellow-500 to-yellow-600' },
  4: { bg: 'bg-blue-500', text: 'text-blue-400', glow: 'glow-blue', gradient: 'from-blue-500 to-blue-600' },
} as const;

export const RING_NAMES = {
  1: 'Vakman',
  2: "ZZP'er",
  3: 'Hobbyist',
  4: 'Academy',
} as const;

export const RING_EMOJIS = {
  1: '🔴',
  2: '🟠',
  3: '🟡',
  4: '🔵',
} as const;
