import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Building2,
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Zap,
  Target,
  Filter
} from 'lucide-react';
import { RING_COLORS, RING_NAMES } from '../types';

interface KvkResult {
  kvkNummer: string;
  naam: string;
  adres?: {
    straatnaam?: string;
    plaats?: string;
    volledigAdres?: string;
  };
  type: string;
  sbiActiviteiten?: Array<{
    sbiCode: string;
    sbiOmschrijving: string;
  }>;
}

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: 'kvk' | 'scraped' | 'target';
  ring?: number;
  kvkNummer?: string;
}

interface RadarMapProps {
  onTargetSelect?: (targets: KvkResult[]) => void;
  onRunRadar?: (location: string, searchType: string) => void;
}

// Netherlands coordinates
const NL_CENTER = { lat: 52.1326, lng: 5.2913 };
const NL_BOUNDS = {
  north: 53.5,
  south: 50.75,
  west: 3.35,
  east: 7.25
};

// Dutch cities for quick selection
const DUTCH_CITIES = [
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { name: 'Rotterdam', lat: 51.9244, lng: 4.4777 },
  { name: 'Den Haag', lat: 52.0705, lng: 4.3007 },
  { name: 'Utrecht', lat: 52.0907, lng: 5.1214 },
  { name: 'Eindhoven', lat: 51.4416, lng: 5.4697 },
  { name: 'Groningen', lat: 53.2194, lng: 6.5665 },
  { name: 'Tilburg', lat: 51.5555, lng: 5.0913 },
  { name: 'Almere', lat: 52.3508, lng: 5.2647 },
];

// Trade categories for vakmensen search
const TRADE_CATEGORIES = [
  { id: 'bouw', label: 'Bouw & Constructie', sbi: '41' },
  { id: 'loodgieter', label: 'Loodgieters', sbi: '4322' },
  { id: 'elektra', label: 'Elektriciens', sbi: '4321' },
  { id: 'schilder', label: 'Schilders', sbi: '4334' },
  { id: 'timmerman', label: 'Timmerlieden', sbi: '4332' },
  { id: 'dakdekker', label: 'Dakdekkers', sbi: '4391' },
  { id: 'tuinman', label: 'Hoveniers', sbi: '8130' },
  { id: 'schoonmaak', label: 'Schoonmaak', sbi: '8121' },
];

export function RadarMap({ onTargetSelect, onRunRadar }: RadarMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'vakmensen' | 'werk'>('vakmensen');
  const [selectedCity, setSelectedCity] = useState<typeof DUTCH_CITIES[0] | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<string>('');
  const [kvkResults, setKvkResults] = useState<KvkResult[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [mapZoom, setMapZoom] = useState(7);
  const [mapCenter, setMapCenter] = useState(NL_CENTER);

  // Simulate KVK API search (since we need API key, we'll mock it)
  const searchKvK = useCallback(async () => {
    if (!searchQuery && !selectedCity && !selectedTrade) return;

    setLoading(true);
    try {
      // Call our backend KVK endpoint
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedCity) params.append('plaats', selectedCity.name);
      if (selectedTrade) params.append('sbi', selectedTrade);

      const response = await fetch(`/api/v1/kvk/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setKvkResults(data.resultaten || []);

        // Convert to markers
        const newMarkers: MapMarker[] = (data.resultaten || []).map((r: KvkResult, i: number) => ({
          id: r.kvkNummer,
          lat: selectedCity ? selectedCity.lat + (Math.random() - 0.5) * 0.05 : NL_CENTER.lat + (Math.random() - 0.5) * 0.5,
          lng: selectedCity ? selectedCity.lng + (Math.random() - 0.5) * 0.05 : NL_CENTER.lng + (Math.random() - 0.5) * 0.5,
          name: r.naam,
          type: 'kvk' as const,
          kvkNummer: r.kvkNummer,
        }));
        setMarkers(newMarkers);
      } else {
        // Mock data for demo
        const mockResults: KvkResult[] = [
          {
            kvkNummer: '12345678',
            naam: 'Van der Berg Loodgieters BV',
            adres: { straatnaam: 'Kerkstraat', plaats: selectedCity?.name || 'Amsterdam', volledigAdres: 'Kerkstraat 42, Amsterdam' },
            type: 'hoofdvestiging',
            sbiActiviteiten: [{ sbiCode: '4322', sbiOmschrijving: 'Loodgieterswerk' }]
          },
          {
            kvkNummer: '87654321',
            naam: 'Jansen Elektrotechniek',
            adres: { straatnaam: 'Hoofdweg', plaats: selectedCity?.name || 'Amsterdam', volledigAdres: 'Hoofdweg 15, Amsterdam' },
            type: 'hoofdvestiging',
            sbiActiviteiten: [{ sbiCode: '4321', sbiOmschrijving: 'Elektrotechnische installatie' }]
          },
          {
            kvkNummer: '11223344',
            naam: 'De Gouden Hamer Bouw',
            adres: { straatnaam: 'Industrieweg', plaats: selectedCity?.name || 'Amsterdam', volledigAdres: 'Industrieweg 88, Amsterdam' },
            type: 'hoofdvestiging',
            sbiActiviteiten: [{ sbiCode: '41', sbiOmschrijving: 'Algemene burgerlijke en utiliteitsbouw' }]
          },
        ];
        setKvkResults(mockResults);
      }
    } catch (error) {
      console.error('KVK search failed:', error);
      // Show demo data on error
      setKvkResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCity, selectedTrade]);

  // Handle city selection
  const handleCitySelect = (city: typeof DUTCH_CITIES[0]) => {
    setSelectedCity(city);
    setMapCenter({ lat: city.lat, lng: city.lng });
    setMapZoom(12);
  };

  // Toggle result selection
  const toggleResultSelection = (kvkNummer: string) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(kvkNummer)) {
      newSelected.delete(kvkNummer);
    } else {
      newSelected.add(kvkNummer);
    }
    setSelectedResults(newSelected);
  };

  // Run radar on selected targets
  const handleRunRadar = () => {
    const selectedTargets = kvkResults.filter(r => selectedResults.has(r.kvkNummer));
    onTargetSelect?.(selectedTargets);
    onRunRadar?.(selectedCity?.name || searchQuery, searchType);
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🗺️</span> Radar Map - Nederland
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Search & Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4"
            >
              {/* Search Type Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSearchType('vakmensen')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                    searchType === 'vakmensen'
                      ? 'bg-solvari-primary text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Vakmensen Zoeken
                </button>
                <button
                  onClick={() => setSearchType('werk')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                    searchType === 'werk'
                      ? 'bg-solvari-secondary text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Werk Aangeboden
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Zoek op naam, straat, gemeente of KvK-nummer..."
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-solvari-primary"
                />
              </div>

              {/* Quick City Selection */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Snelle selectie - Gemeente:</label>
                <div className="flex flex-wrap gap-2">
                  {DUTCH_CITIES.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => handleCitySelect(city)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        selectedCity?.name === city.name
                          ? 'bg-solvari-primary text-white'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trade Category Selection */}
              {searchType === 'vakmensen' && (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Vakgebied (SBI-code):</label>
                  <div className="flex flex-wrap gap-2">
                    {TRADE_CATEGORIES.map((trade) => (
                      <button
                        key={trade.id}
                        onClick={() => setSelectedTrade(selectedTrade === trade.sbi ? '' : trade.sbi)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          selectedTrade === trade.sbi
                            ? 'bg-solvari-secondary text-white'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {trade.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Button */}
              <button
                onClick={searchKvK}
                disabled={loading || (!searchQuery && !selectedCity && !selectedTrade)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-solvari-primary to-solvari-secondary rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Zoeken in KvK Handelsregister...
                  </>
                ) : (
                  <>
                    <Building2 className="w-5 h-5" />
                    Zoeken in KvK
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map Container */}
      <div className="relative h-[400px] bg-solvari-dark">
        {/* Interactive Map Placeholder - Using CSS Grid for Netherlands shape */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full overflow-hidden">
            {/* Netherlands Map Background */}
            <svg viewBox="0 0 400 500" className="absolute inset-0 w-full h-full opacity-20">
              <path
                d="M200,20 L280,60 L320,100 L350,180 L380,280 L360,360 L320,420 L260,460 L180,480 L120,460 L60,400 L40,320 L50,240 L80,160 L120,100 L160,50 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-solvari-primary"
              />
            </svg>

            {/* Radar Animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="absolute w-64 h-64 border-2 border-solvari-primary/30 rounded-full"
                animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                className="absolute w-48 h-48 border-2 border-solvari-secondary/40 rounded-full"
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              />
              <div className="w-32 h-32 bg-gradient-to-br from-solvari-primary/20 to-solvari-secondary/20 rounded-full flex items-center justify-center">
                <Target className="w-12 h-12 text-solvari-primary" />
              </div>
            </div>

            {/* Map Markers */}
            {markers.map((marker, index) => (
              <motion.div
                key={marker.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="absolute cursor-pointer"
                style={{
                  left: `${((marker.lng - NL_BOUNDS.west) / (NL_BOUNDS.east - NL_BOUNDS.west)) * 100}%`,
                  top: `${((NL_BOUNDS.north - marker.lat) / (NL_BOUNDS.north - NL_BOUNDS.south)) * 100}%`,
                }}
              >
                <div
                  className={`w-4 h-4 rounded-full ${
                    selectedResults.has(marker.id)
                      ? 'bg-green-500 ring-2 ring-green-300'
                      : 'bg-solvari-primary'
                  } shadow-lg`}
                />
              </motion.div>
            ))}

            {/* Selected City Highlight */}
            {selectedCity && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute"
                style={{
                  left: `${((selectedCity.lng - NL_BOUNDS.west) / (NL_BOUNDS.east - NL_BOUNDS.west)) * 100}%`,
                  top: `${((NL_BOUNDS.north - selectedCity.lat) / (NL_BOUNDS.north - NL_BOUNDS.south)) * 100}%`,
                }}
              >
                <div className="w-8 h-8 -ml-4 -mt-4 rounded-full bg-solvari-primary/30 animate-ping" />
                <MapPin className="w-6 h-6 -ml-3 -mt-8 text-solvari-primary" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          <button
            onClick={() => setMapZoom(Math.min(mapZoom + 1, 15))}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-colors"
          >
            +
          </button>
          <button
            onClick={() => setMapZoom(Math.max(mapZoom - 1, 5))}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-colors"
          >
            -
          </button>
        </div>

        {/* Map Info */}
        <div className="absolute left-4 bottom-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-300">
          <div>Zoom: {mapZoom}x</div>
          <div>Markers: {markers.length}</div>
          {selectedCity && <div>Focus: {selectedCity.name}</div>}
        </div>
      </div>

      {/* Results Panel */}
      {kvkResults.length > 0 && (
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-solvari-primary" />
              KvK Resultaten ({kvkResults.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedResults(new Set(kvkResults.map(r => r.kvkNummer)))}
                className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-gray-300"
              >
                Selecteer Alles
              </button>
              <button
                onClick={() => setSelectedResults(new Set())}
                className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-gray-300"
              >
                Deselecteer
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {kvkResults.map((result) => (
              <motion.div
                key={result.kvkNummer}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => toggleResultSelection(result.kvkNummer)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedResults.has(result.kvkNummer)
                    ? 'bg-solvari-primary/20 border border-solvari-primary/50'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-white">{result.naam}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {result.adres?.volledigAdres || result.adres?.plaats || 'Adres onbekend'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-white/10 rounded">
                        KvK: {result.kvkNummer}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                        {result.type}
                      </span>
                      {result.sbiActiviteiten?.slice(0, 2).map((sbi) => (
                        <span key={sbi.sbiCode} className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                          {sbi.sbiOmschrijving}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedResults.has(result.kvkNummer)
                      ? 'bg-solvari-primary border-solvari-primary'
                      : 'border-gray-500'
                  }`}>
                    {selectedResults.has(result.kvkNummer) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Run Radar Button */}
          {selectedResults.size > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleRunRadar}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
            >
              <Zap className="w-5 h-5" />
              Start Radar Scan ({selectedResults.size} targets)
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
