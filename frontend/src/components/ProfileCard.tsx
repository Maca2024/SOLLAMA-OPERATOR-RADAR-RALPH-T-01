import { motion } from 'framer-motion';
import { MapPin, Star, ExternalLink, Mail, MessageCircle } from 'lucide-react';
import { RING_COLORS, type Profile } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface ProfileCardProps {
  profile: Profile;
  index: number;
  onGenerateOutreach?: (profileId: string) => void;
}

export function ProfileCard({ profile, index, onGenerateOutreach }: ProfileCardProps) {
  const colors = RING_COLORS[profile.ring as keyof typeof RING_COLORS] || RING_COLORS[2];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass rounded-xl p-4 hover:scale-[1.02] transition-all ${colors.glow}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-lg`}>
            {profile.ring_emoji}
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {profile.name || 'Unknown Profile'}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} bg-opacity-20 ${colors.text}`}>
              {profile.ring_name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-yellow-400">
          <Star className="w-4 h-4 fill-current" />
          <span className="font-mono text-sm">{profile.quality_score.toFixed(1)}</span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm text-gray-400">
        {profile.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{profile.location}</span>
          </div>
        )}

        {profile.specialization.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.specialization.slice(0, 3).map((spec, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-white/5 rounded text-xs"
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
          </span>

          <div className="flex items-center gap-2">
            {profile.outreach_sent ? (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Sent
              </span>
            ) : onGenerateOutreach && (
              <button
                onClick={() => onGenerateOutreach(profile.id)}
                className="text-xs text-solvari-primary hover:text-solvari-secondary flex items-center gap-1 transition-colors"
              >
                <MessageCircle className="w-3 h-3" /> Generate
              </button>
            )}

            <a
              href={profile.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
