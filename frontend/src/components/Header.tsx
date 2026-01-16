import { motion } from 'framer-motion';
import { Radio, Activity, Zap } from 'lucide-react';
import { useHealthCheck } from '../hooks/useApi';

export function Header() {
  const healthy = useHealthCheck();

  return (
    <header className="border-b border-white/10 bg-solvari-dark/80 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <Radio className="w-8 h-8 text-solvari-primary" />
              <motion.div
                className="absolute inset-0 rounded-full bg-solvari-primary"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Solvari <span className="text-solvari-primary">Radar</span>
              </h1>
              <p className="text-xs text-gray-500">Autonomous Acquisition Engine</p>
            </div>
          </motion.div>

          {/* Status indicators */}
          <div className="flex items-center gap-6">
            {/* Modules status */}
            <div className="hidden md:flex items-center gap-4 text-sm">
              <ModuleStatus name="RADAR" emoji="🔭" active />
              <ModuleStatus name="BRAIN" emoji="🧠" active />
              <ModuleStatus name="HOOK" emoji="🎣" active />
            </div>

            {/* API status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                healthy === null ? 'bg-gray-500' :
                healthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-400">
                {healthy === null ? 'Checking...' :
                 healthy ? 'API Online' : 'API Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function ModuleStatus({ name, emoji, active }: { name: string; emoji: string; active: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span>{emoji}</span>
      <span className={active ? 'text-green-400' : 'text-gray-500'}>{name}</span>
      {active && <Zap className="w-3 h-3 text-yellow-400" />}
    </div>
  );
}
