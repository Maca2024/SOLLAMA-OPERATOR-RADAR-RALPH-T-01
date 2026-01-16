import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { RING_NAMES, type Stats } from '../types';

interface RingDistributionProps {
  stats: Stats | null;
}

const COLORS = ['#EF4444', '#F97316', '#EAB308', '#3B82F6'];

export function RingDistribution({ stats }: RingDistributionProps) {
  const data = [1, 2, 3, 4].map(ring => ({
    name: RING_NAMES[ring as keyof typeof RING_NAMES],
    value: stats?.by_ring[ring] || 0,
    ring,
  }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6"
    >
      <h2 className="text-xl font-bold text-white mb-4">Ring Distribution</h2>

      <div className="flex items-center gap-6">
        {/* Pie Chart */}
        <div className="w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {data.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;

            return (
              <div key={item.ring} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-gray-300 text-sm">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-semibold">{item.value}</span>
                  <span className="text-gray-500 text-xs w-10 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
