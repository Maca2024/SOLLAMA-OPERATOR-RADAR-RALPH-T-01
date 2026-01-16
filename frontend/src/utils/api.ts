import axios from 'axios';
import type { Stats, Profile, RingInfo, PipelineResult, OutreachMessage } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

const api = axios.create({
  baseURL: `${API_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health check
export async function healthCheck(): Promise<{ status: string }> {
  const { data } = await api.get('/health');
  return data;
}

// Get dashboard stats
export async function getStats(): Promise<Stats> {
  const { data } = await api.get<Stats>('/stats');
  return data;
}

// Get profiles
export async function getProfiles(ring?: number, limit = 50): Promise<Profile[]> {
  const params = new URLSearchParams();
  if (ring !== undefined) params.append('ring', ring.toString());
  params.append('limit', limit.toString());

  const { data } = await api.get<Profile[]>(`/profiles?${params}`);
  return data;
}

// Get single profile
export async function getProfile(profileId: string): Promise<Profile> {
  const { data } = await api.get<Profile>(`/profiles/${profileId}`);
  return data;
}

// Get ring information
export async function getRingInfo(): Promise<{ rings: RingInfo[] }> {
  const { data } = await api.get('/rings');
  return data;
}

// Run pipeline
export async function runPipeline(
  urls: string[],
  sourceType = 'generic',
  autoGenerateOutreach = true
): Promise<PipelineResult[]> {
  const { data } = await api.post<PipelineResult[]>('/pipeline', {
    urls,
    source_type: sourceType,
    auto_generate_outreach: autoGenerateOutreach,
  });
  return data;
}

// Classify text
export async function classifyContent(text: string, sourceUrl?: string): Promise<{
  ring: number;
  ring_name: string;
  quality_score: number;
  confidence: number;
  reasoning: string;
  recommended_hook: string;
}> {
  const { data } = await api.post('/classify', {
    text,
    source_url: sourceUrl,
  });
  return data;
}

// Generate outreach
export async function generateOutreach(
  profileId: string,
  channel?: string
): Promise<OutreachMessage> {
  const { data } = await api.post<OutreachMessage>('/outreach/generate', {
    profile_id: profileId,
    channel,
  });
  return data;
}

// Scrape URLs
export async function scrapeUrls(urls: string[], sourceType = 'generic'): Promise<{
  scraped: number;
  results: Array<{
    url: string;
    text_length: number;
    source_type: string;
    metadata: Record<string, unknown>;
  }>;
}> {
  const { data } = await api.post('/scrape', {
    urls,
    source_type: sourceType,
  });
  return data;
}

export default api;
