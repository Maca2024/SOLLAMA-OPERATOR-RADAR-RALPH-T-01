import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Filter } from 'lucide-react';
import {
  Header,
  RadarVisualization,
  StatsCards,
  ProfileCard,
  PipelineControl,
  RingDistribution,
} from './components';
import { useStats, useProfiles } from './hooks/useApi';
import { RING_NAMES } from './types';

function App() {
  const [selectedRing, setSelectedRing] = useState<number | undefined>();
  const { stats, loading: statsLoading, refetch: refetchStats } = useStats();
  const { profiles, loading: profilesLoading, refetch: refetchProfiles } = useProfiles(selectedRing);

  const handlePipelineComplete = () => {
    refetchStats();
    refetchProfiles();
  };

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

        {/* Main Grid */}
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

          {/* Pipeline Control */}
          <div className="lg:col-span-2">
            <PipelineControl onComplete={handlePipelineComplete} />
          </div>
        </div>

        {/* Ring Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <RingDistribution stats={stats} />

          {/* Ring Legend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6 lg:col-span-2"
          >
            <h2 className="text-xl font-bold text-white mb-4">The 4-Ring System</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { ring: 1, emoji: '🔴', desc: 'Established businesses (>5 years)', hooks: ['Agenda-vulling', 'Instant Payouts'] },
                { ring: 2, emoji: '🟠', desc: 'Growing freelancers, tech-savvy', hooks: ['Admin-Bot', 'Lead Radar'] },
                { ring: 3, emoji: '🟡', desc: 'Part-timers & starters', hooks: ['Starter Program', 'ZZP Wizard'] },
                { ring: 4, emoji: '🔵', desc: 'Internal Solvari staff', hooks: ['Dashboard', 'Monitoring'] },
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
                Use the pipeline control above to start discovering contractors
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
            Powered by AI | Built for the Dutch market
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
