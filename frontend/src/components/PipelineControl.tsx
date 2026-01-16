import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2, CheckCircle2, XCircle, Plus, Trash2 } from 'lucide-react';
import { usePipeline } from '../hooks/useApi';
import { RING_COLORS, RING_NAMES, type PipelineResult } from '../types';

interface PipelineControlProps {
  onComplete?: () => void;
}

export function PipelineControl({ onComplete }: PipelineControlProps) {
  const [urls, setUrls] = useState<string[]>(['']);
  const [showResults, setShowResults] = useState(false);
  const { execute, loading, results, error } = usePipeline();

  const addUrl = () => setUrls([...urls, '']);
  const removeUrl = (index: number) => setUrls(urls.filter((_, i) => i !== index));
  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleRun = async () => {
    const validUrls = urls.filter(u => u.trim());
    if (validUrls.length === 0) return;

    try {
      await execute(validUrls);
      setShowResults(true);
      onComplete?.();
    } catch (err) {
      console.error('Pipeline failed:', err);
    }
  };

  return (
    <div className="glass rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">🚀</span> Pipeline Control
      </h2>

      {/* URL Inputs */}
      <div className="space-y-3 mb-4">
        {urls.map((url, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => updateUrl(index, e.target.value)}
              placeholder="Enter URL to analyze..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-solvari-primary"
            />
            {urls.length > 1 && (
              <button
                onClick={() => removeUrl(index)}
                className="p-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={addUrl}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add URL
        </button>

        <button
          onClick={handleRun}
          disabled={loading || !urls.some(u => u.trim())}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-solvari-primary to-solvari-secondary rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Run Pipeline
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400"
        >
          {error.message}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {showResults && results && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 border-t border-white/10 pt-4"
          >
            <h3 className="text-lg font-semibold text-white mb-3">Results</h3>
            <div className="space-y-2">
              {results.map((result: PipelineResult, index: number) => (
                <ResultRow key={index} result={result} />
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Processed:</span>
                <span className="text-white">{results.length} URLs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Successful:</span>
                <span className="text-green-400">
                  {results.filter((r: PipelineResult) => r.success).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Failed:</span>
                <span className="text-red-400">
                  {results.filter((r: PipelineResult) => !r.success).length}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultRow({ result }: { result: PipelineResult }) {
  const colors = result.ring ? RING_COLORS[result.ring as keyof typeof RING_COLORS] : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center justify-between p-3 rounded-lg ${
        result.success ? 'bg-green-500/10' : 'bg-red-500/10'
      }`}
    >
      <div className="flex items-center gap-3">
        {result.success ? (
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        ) : (
          <XCircle className="w-5 h-5 text-red-400" />
        )}
        <span className="text-gray-300 text-sm truncate max-w-xs">
          {result.url}
        </span>
      </div>

      {result.success && result.ring && colors && (
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs ${colors.bg} bg-opacity-20 ${colors.text}`}>
            {RING_NAMES[result.ring as keyof typeof RING_NAMES]}
          </span>
          <span className="text-yellow-400 text-sm font-mono">
            {result.quality_score?.toFixed(1)}
          </span>
        </div>
      )}

      {!result.success && result.error && (
        <span className="text-red-400 text-xs truncate max-w-xs">
          {result.error}
        </span>
      )}
    </motion.div>
  );
}
