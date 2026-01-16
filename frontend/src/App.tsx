import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Filter } from 'lucide-react';
import {
  Header,
  RadarVisualization,
  StatsCards,
  ProfileCard,
  PipelineControl,
  RingDistribution,
  RadarMap,
} from './components';
import { useStats, useProfiles, usePipeline } from './hooks/useApi';
import { RING_NAMES } from './types';

function App() {
  const [selectedRing, setSelectedRing] = useState<number | undefined>();
  const { stats, loading: statsLoading, refetch: refetchStats } = useStats();
  const { profiles, loading: profilesLoading, refetch: refetchProfiles } = useProfiles(selectedRing);
  const { execute: executePipeline } = usePipeline();

  const handlePipelineComplete = () => {
    refetchStats();
    refetchProfiles();
  };

  // Handle KVK targets from RadarMap
  const handleKvkTargets = useCallback(async (targets: any[]) => {
    if (targets.length === 0) return;

    // Convert KVK results to URLs for pipeline
    const urls = targets.map(t => `kvk://${t.kvkNummer}`);
    try {
      await executePipeline(urls, 'kvk');
      refetchStats();
      refetchProfiles();
    } catch (error) {
      console.error('Pipeline failed:', error);
    }
  }, [executePipeline, refetchStats, refetchProfiles]);

  return (
    <div className="min-h-screen bg-solvari-dark bg-grid">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-solvari-primary to-solvari-secondary bg-clip-text text-transparent">
              AI-Powered
            </span>{' '}
            Contractor Discovery
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Automatically detect, classify, and engage with potential contractors using the 4-Ring system.
            From established professionals to ambitious starters.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <section className="mb-8">
          <StatsCards stats={stats} loading={statsLoading} />
        </section>

        {/* Pipeline Control - Full Width */}
        <section className="mb-8">
          <PipelineControl onComplete={handlePipelineComplete} />
        </section>

        {/* Radar Map - Full Width - KVK Integration */}
        <section className="mb-8">
          <RadarMap
            onTargetSelect={handleKvkTargets}
            onRunRadar={(location, type) => {
              console.log(`Radar scan: ${location} - ${type}`);
            }}
          />
        </section>

        {/* Secondary Grid: Radar Viz + Ring Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Radar Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🔭</span> Live Radar
            </h2>
            <RadarVisualization stats={stats} />
          </motion.div>

          {/* Ring Distribution */}
          <RingDistribution stats={stats} />

          {/* Ring Legend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">The 4-Ring System</h2>
            <div className="space-y-3">
              {[
                { ring: 1, emoji: '🔴', desc: 'Gevestigd (>5 jaar)', hooks: ['Agenda-vulling', 'Instant Payouts'] },
                { ring: 2, emoji: '🟠', desc: 'Groeiende ZZP\'er', hooks: ['Admin-Bot', 'Lead Radar'] },
                { ring: 3, emoji: '🟡', desc: 'Starters & Hobbyisten', hooks: ['Starter Program', 'ZZP Wizard'] },
                { ring: 4, emoji: '🔵', desc: 'Intern Solvari team', hooks: ['Dashboard', 'Monitoring'] },
              ].map(({ ring, emoji, desc, hooks }) => (
                <div key={ring} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{emoji}</span>
                    <span className="font-semibold text-white">
                      Ring {ring}: {RING_NAMES[ring as keyof typeof RING_NAMES]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {hooks.map(hook => (
                      <span key={hook} className="text-xs px-2 py-0.5 bg-white/10 rounded">
                        {hook}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Profiles Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Discovered Profiles</h2>
            <div className="flex items-center gap-4">
              {/* Ring Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedRing ?? ''}
                  onChange={(e) => setSelectedRing(e.target.value ? Number(e.target.value) : undefined)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-solvari-primary"
                >
                  <option value="">All Rings</option>
                  <option value="1">🔴 Vakman</option>
                  <option value="2">🟠 ZZP'er</option>
                  <option value="3">🟡 Hobbyist</option>
                </select>
              </div>

              {/* Refresh */}
              <button
                onClick={refetchProfiles}
                disabled={profilesLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${profilesLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Profile Grid */}
          {profiles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 glass rounded-xl"
            >
              <div className="text-6xl mb-4">🔭</div>
              <h3 className="text-xl font-semibold text-white mb-2">No profiles yet</h3>
              <p className="text-gray-400">
                Use the pipeline control or Radar Map above to start discovering contractors
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map((profile, index) => (
                <ProfileCard key={profile.id} profile={profile} index={index} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16 py-8">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
          <p>
            ⟁ <span className="text-solvari-primary">Solvari Radar</span> - Autonomous Supply-Side Acquisition Engine
          </p>
          <p className="mt-1">
            Powered by AI | Built for the Dutch market | KVK Integrated
          </p>
          <p className="mt-2 text-xs">
            &copy; 2026 Aetherlink.ai - MIT License
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
