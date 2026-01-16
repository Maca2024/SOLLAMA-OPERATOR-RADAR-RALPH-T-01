import { useState, useEffect, useCallback } from 'react';
import * as api from '../utils/api';
import type { Stats, Profile } from '../types';

// Hook for fetching stats
export function useStats(refreshInterval = 30000) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  return { stats, loading, error, refetch: fetchStats };
}

// Hook for fetching profiles
export function useProfiles(ring?: number, limit = 50) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProfiles(ring, limit);
      setProfiles(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [ring, limit]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return { profiles, loading, error, refetch: fetchProfiles };
}

// Hook for pipeline execution
export function usePipeline() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Awaited<ReturnType<typeof api.runPipeline>> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (
    urls: string[],
    sourceType = 'generic',
    autoGenerateOutreach = true
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.runPipeline(urls, sourceType, autoGenerateOutreach);
      setResults(data);
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, results, error };
}

// Hook for health check
export function useHealthCheck() {
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        await api.healthCheck();
        setHealthy(true);
      } catch {
        setHealthy(false);
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  return healthy;
}
