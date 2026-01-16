import axios from 'axios';
import type { Stats, Profile, RingInfo, PipelineResult, OutreachMessage } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
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

// KVK API functions
export interface KvKSearchParams {
  query?: string;
  kvkNummer?: string;
  handelsnaam?: string;
  straatnaam?: string;
  plaats?: string;
  postcode?: string;
  sbi?: string;
  type?: string;
  pagina?: number;
  resultatenPerPagina?: number;
}

export interface KvKResult {
  kvkNummer: string;
  vestigingsnummer?: string;
  naam: string;
  adres?: {
    binnenlandsAdres?: {
      type?: string;
      straatnaam?: string;
      huisnummer?: number;
      postcode?: string;
      plaats?: string;
    };
  };
  type: string;
  sbiActiviteiten?: Array<{
    sbiCode: string;
    sbiOmschrijving: string;
  }>;
}

export interface KvKSearchResponse {
  pagina: number;
  resultatenPerPagina: number;
  totaal: number;
  resultaten: KvKResult[];
}

// Search KVK Handelsregister
export async function searchKvK(params: KvKSearchParams): Promise<KvKSearchResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const { data } = await api.get<KvKSearchResponse>(`/kvk/search?${searchParams}`);
  return data;
}

// Search for vakmensen (contractors) by location and trade
export async function searchVakmensen(params: {
  plaats?: string;
  vakgebied?: string;
  sbi?: string;
}): Promise<{
  pagina: number;
  totaal: number;
  vakmensen: Array<{
    kvkNummer: string;
    naam: string;
    plaats?: string;
    adres?: string;
    type: string;
    activiteiten: string[];
  }>;
}> {
  const searchParams = new URLSearchParams();
  if (params.plaats) searchParams.append('plaats', params.plaats);
  if (params.vakgebied) searchParams.append('vakgebied', params.vakgebied);
  if (params.sbi) searchParams.append('sbi', params.sbi);

  const { data } = await api.get(`/kvk/vakmensen?${searchParams}`);
  return data;
}

// Get company basic profile from KVK
export async function getKvKBasisprofiel(kvkNummer: string): Promise<{
  kvkNummer: string;
  naam?: string;
  formeleRegistratiedatum?: string;
  sbiActiviteiten?: Array<{
    sbiCode: string;
    sbiOmschrijving: string;
    indHoofdactiviteit?: string;
  }>;
}> {
  const { data } = await api.get(`/kvk/basisprofiel/${kvkNummer}`);
  return data;
}

// Get vestigingsprofiel with GPS coordinates
export interface KvKGeoData {
  gpsLatitude: number;
  gpsLongitude: number;
}

export interface KvKAdres {
  type: string;
  volledigAdres?: string;
  straatnaam?: string;
  huisnummer?: number;
  postcode?: string;
  plaats?: string;
  land?: string;
  geoData?: KvKGeoData;
}

export interface KvKVestigingsprofiel {
  vestigingsnummer: string;
  kvkNummer?: string;
  eersteHandelsnaam?: string;
  indHoofdvestiging?: string;
  adressen?: KvKAdres[];
  sbiActiviteiten?: Array<{
    sbiCode: string;
    sbiOmschrijving: string;
  }>;
  totaalWerkzamePersonen?: number;
}

export async function getKvKVestigingsprofiel(
  vestigingsnummer: string,
  geoData = true
): Promise<KvKVestigingsprofiel> {
  const { data } = await api.get(`/kvk/vestigingsprofiel/${vestigingsnummer}?geoData=${geoData}`);
  return data;
}

// Scan KVK profiles and classify them
export async function scanKvKProfiles(kvkNummers: string[], autoGenerateOutreach = true): Promise<{
  scanned: number;
  results: Array<{
    kvkNummer: string;
    success: boolean;
    profile_id?: string;
    ring?: number;
    ring_name?: string;
    quality_score?: number;
    outreach_channel?: string;
    error?: string;
  }>;
}> {
  const { data } = await api.post('/kvk/scan', {
    kvk_nummers: kvkNummers,
    auto_generate_outreach: autoGenerateOutreach,
  });
  return data;
}

export default api;
