import { motion } from 'framer-motion';
import { RING_COLORS, RING_NAMES, type Stats } from '../types';

interface RadarVisualizationProps {
  stats: Stats | null;
}

export function RadarVisualization({ stats }: RadarVisualizationProps) {
  const rings = [1, 2, 3, 4] as const;
  const total = stats?.total_profiles || 0;

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid rounded-full opacity-30" />

      {/* Radar rings */}
      {rings.map((ring, index) => {
        const size = 100 - index * 20;
        const count = stats?.by_ring[ring] || 0;
        const colors = RING_COLORS[ring];

        return (
          <motion.div
            key={ring}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.2, duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className={`rounded-full border-2 border-opacity-40 ${colors.text.replace('text', 'border')} flex items-center justify-center`}
              style={{
                width: `${size}%`,
                height: `${size}%`,
              }}
            >
              {index === 0 && (
                <div className="text-center">
                  <motion.div
                    className="text-4xl font-bold text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    {total}
                  </motion.div>
                  <div className="text-sm text-gray-400">Total Profiles</div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Radar sweep animation */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      >
        <div
          className="w-1/2 h-0.5 bg-gradient-to-r from-transparent via-solvari-primary to-solvari-secondary origin-left"
          style={{ marginLeft: '50%' }}
        />
      </motion.div>

      {/* Ring labels */}
      {rings.map((ring, index) => {
        const angle = -90 + index * 90; // Position labels around the circle
        const distance = 55 - index * 10;
        const colors = RING_COLORS[ring];
        const count = stats?.by_ring[ring] || 0;

        const x = 50 + distance * Math.cos((angle * Math.PI) / 180);
        const y = 50 + distance * Math.sin((angle * Math.PI) / 180);

        return (
          <motion.div
            key={`label-${ring}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + index * 0.1 }}
            className="absolute"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className={`glass rounded-lg px-3 py-1 ${colors.glow}`}>
              <span className={`${colors.text} font-semibold`}>
                {count} {RING_NAMES[ring]}
              </span>
            </div>
          </motion.div>
        );
      })}

      {/* Ping effect for new discoveries */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-4 h-4 bg-solvari-secondary rounded-full radar-ping" />
      </div>
    </div>
  );
}
