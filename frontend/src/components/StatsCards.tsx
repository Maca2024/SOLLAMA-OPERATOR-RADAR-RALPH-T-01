import { motion } from 'framer-motion';
import { Users, Target, Star, Send } from 'lucide-react';
import type { Stats } from '../types';

interface StatsCardsProps {
  stats: Stats | null;
  loading: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Profiles',
      value: stats?.total_profiles || 0,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      description: 'Discovered contractors',
    },
    {
      title: 'Avg Quality',
      value: stats?.average_quality_score?.toFixed(1) || '0.0',
      icon: Star,
      color: 'from-yellow-500 to-orange-500',
      description: 'Quality score (0-10)',
    },
    {
      title: 'Outreach Sent',
      value: stats?.outreach_sent || 0,
      icon: Send,
      color: 'from-green-500 to-emerald-500',
      description: 'Messages generated',
    },
    {
      title: 'Conversion',
      value: stats?.total_profiles
        ? `${((stats.outreach_sent / stats.total_profiles) * 100).toFixed(0)}%`
        : '0%',
      icon: Target,
      color: 'from-purple-500 to-pink-500',
      description: 'Outreach rate',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass rounded-xl p-6 hover:scale-105 transition-transform cursor-default"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm">{card.title}</p>
              <p className="text-3xl font-bold mt-1 text-white">
                {loading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  card.value
                )}
              </p>
              <p className="text-gray-500 text-xs mt-1">{card.description}</p>
            </div>
            <div className={`p-3 rounded-lg bg-gradient-to-br ${card.color}`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
