import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Filter,
  Navigation,
  Layers
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RING_COLORS } from '../types';

// Fix Leaflet default marker icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom marker icons for different ring types
const createRingIcon = (ring: number) => {
  const colors: Record<number, string> = {
    1: '#ef4444', // red - Vakman
    2: '#f97316', // orange - ZZP
    3: '#eab308', // yellow - Hobbyist
    4: '#3b82f6', // blue - Academy
  };

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${colors[ring] || '#6b7280'};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// KVK marker without GPS (purple with dashed border)
const kvkIcon = L.divIcon({
  className: 'kvk-marker',
  html: `<div style="
    background-color: #8b5cf6;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px dashed white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  "><span style="color: white; font-size: 10px; font-weight: bold;">K</span></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// KVK marker with real GPS (green border)
const kvkGeoIcon = L.divIcon({
  className: 'kvk-marker-geo',
  html: `<div style="
    background-color: #8b5cf6;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 3px solid #22c55e;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  "><span style="color: white; font-size: 10px; font-weight: bold;">K</span></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

interface KvkResult {
  kvkNummer: string;
  vestigingsnummer?: string;
  naam: string;
  adres?: {
    binnenlandsAdres?: {
      straatnaam?: string;
      huisnummer?: number;
      postcode?: string;
      plaats?: string;
    };
  };
  type: string;
  sbiActiviteiten?: Array<{
    sbiCode: string;
    sbiOmschrijving: string;
  }>;
  geoData?: {
    gpsLatitude?: number;
    gpsLongitude?: number;
  };
}

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: 'kvk' | 'scraped' | 'target';
  ring?: number;
  kvkNummer?: string;
  details?: any;
}

interface RadarMapProps {
  onTargetSelect?: (targets: KvkResult[]) => void;
  onRunRadar?: (location: string, searchType: string) => void;
}

// Netherlands center and bounds
const NL_CENTER: [number, number] = [52.1326, 5.2913];
const NL_BOUNDS: [[number, number], [number, number]] = [
  [50.75, 3.35], // Southwest
  [53.5, 7.25],  // Northeast
];

// Dutch cities with coordinates
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
  { id: 'bouw', label: 'Bouw & Constructie' },
  { id: 'loodgieter', label: 'Loodgieters' },
  { id: 'elektra', label: 'Elektriciens' },
  { id: 'schilder', label: 'Schilders' },
  { id: 'timmerman', label: 'Timmerlieden' },
  { id: 'dakdekker', label: 'Dakdekkers' },
  { id: 'tuinman', label: 'Hoveniers' },
  { id: 'schoonmaak', label: 'Schoonmaak' },
];

// Component to handle map centering
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

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
  const [mapCenter, setMapCenter] = useState<[number, number]>(NL_CENTER);
  const [mapZoom, setMapZoom] = useState(7);
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite'>('street');

  // Search KVK API with real GPS coordinates
  const searchKvK = useCallback(async () => {
    if (!searchQuery && !selectedCity && !selectedTrade) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Build search query
      if (searchQuery) {
        params.append('naam', searchQuery);
      } else if (selectedTrade) {
        params.append('naam', selectedTrade);
      } else {
        params.append('naam', 'test'); // Use test data
      }

      if (selectedCity) {
        params.append('plaats', selectedCity.name);
      }

      // Fetch search results
      const response = await fetch(`http://localhost:8001/api/v1/kvk/search?${params}`);
      if (!response.ok) {
        throw new Error('KVK search failed');
      }

      const data = await response.json();
      const resultaten = data.resultaten || [];
      setKvkResults(resultaten);

      // Fetch GPS coordinates for each result with vestigingsnummer
      const newMarkers: MapMarker[] = [];
      const geoPromises = resultaten
        .filter((r: KvkResult) => r.vestigingsnummer)
        .map(async (r: KvkResult) => {
          try {
            const geoResponse = await fetch(
              `http://localhost:8001/api/v1/kvk/vestigingsprofiel/${r.vestigingsnummer}?geoData=true`
            );
            if (geoResponse.ok) {
              const vestiging = await geoResponse.json();
              // Find address with valid GPS coordinates (bezoekadres preferred)
              const adresWithGeo = vestiging.adressen?.find(
                (a: any) => a.geoData?.gpsLatitude && a.geoData?.gpsLatitude !== 0
              );
              if (adresWithGeo?.geoData) {
                return {
                  kvkNummer: r.kvkNummer,
                  vestigingsnummer: r.vestigingsnummer,
                  lat: adresWithGeo.geoData.gpsLatitude,
                  lng: adresWithGeo.geoData.gpsLongitude,
                  adres: adresWithGeo,
                };
              }
            }
          } catch (err) {
            console.warn(`Could not fetch geo for ${r.vestigingsnummer}:`, err);
          }
          return null;
        });

      const geoResults = await Promise.all(geoPromises);
      const geoMap = new Map(
        geoResults
          .filter((g): g is NonNullable<typeof g> => g !== null)
          .map((g) => [g.kvkNummer, g])
      );

      // Create markers with real coordinates or fallback to city center
      for (const r of resultaten) {
        const geo = geoMap.get(r.kvkNummer);

        let lat: number;
        let lng: number;
        let hasRealGeo = false;

        if (geo?.lat && geo?.lng) {
          // Use real GPS from vestigingsprofiel
          lat = geo.lat;
          lng = geo.lng;
          hasRealGeo = true;
        } else if (selectedCity) {
          // Fallback: place near selected city with small offset
          lat = selectedCity.lat + (Math.random() - 0.5) * 0.02;
          lng = selectedCity.lng + (Math.random() - 0.5) * 0.02;
        } else {
          // Fallback: place in Netherlands center with offset
          lat = NL_CENTER[0] + (Math.random() - 0.5) * 0.5;
          lng = NL_CENTER[1] + (Math.random() - 0.5) * 0.5;
        }

        newMarkers.push({
          id: `${r.kvkNummer}-${r.vestigingsnummer || 'main'}`,
          lat,
          lng,
          name: r.naam,
          type: 'kvk',
          kvkNummer: r.kvkNummer,
          details: {
            ...r,
            hasRealGeo,
            geoData: geo ? { gpsLatitude: geo.lat, gpsLongitude: geo.lng } : undefined,
          },
        });
      }

      setMarkers(newMarkers);

      // Center map on first result with real coordinates, or selected city
      const firstWithGeo = newMarkers.find(m => m.details?.hasRealGeo);
      if (firstWithGeo) {
        setMapCenter([firstWithGeo.lat, firstWithGeo.lng]);
        setMapZoom(13);
      } else if (selectedCity) {
        setMapCenter([selectedCity.lat, selectedCity.lng]);
        setMapZoom(12);
      }

    } catch (error) {
      console.error('KVK search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCity, selectedTrade]);

  // Fetch GPS data for a specific vestiging
  const fetchGeoData = useCallback(async (vestigingsnummer: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(`/api/v1/kvk/vestigingsprofiel/${vestigingsnummer}?geoData=true`);
      if (response.ok) {
        const data = await response.json();
        const geoData = data.adressen?.find((a: any) => a.geoData?.gpsLatitude)?.geoData;
        if (geoData?.gpsLatitude && geoData?.gpsLongitude) {
          return { lat: geoData.gpsLatitude, lng: geoData.gpsLongitude };
        }
      }
    } catch (error) {
      console.error('Failed to fetch geoData:', error);
    }
    return null;
  }, []);

  // Handle city selection
  const handleCitySelect = (city: typeof DUTCH_CITIES[0]) => {
    setSelectedCity(city);
    setMapCenter([city.lat, city.lng]);
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

  // Memoized tile layer URL
  const tileLayerUrl = useMemo(() => {
    if (mapLayer === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  }, [mapLayer]);

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🗺️</span> Radar Map - Nederland
            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded ml-2">
              Live KVK Data
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMapLayer(mapLayer === 'street' ? 'satellite' : 'street')}
              className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-gray-300 text-sm transition-colors"
            >
              <Layers className="w-4 h-4" />
              {mapLayer === 'street' ? 'Satellite' : 'Street'}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
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
                  placeholder="Zoek op bedrijfsnaam, KvK-nummer of 'test' voor demo data..."
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
                  <label className="text-sm text-gray-400 mb-2 block">Vakgebied:</label>
                  <div className="flex flex-wrap gap-2">
                    {TRADE_CATEGORIES.map((trade) => (
                      <button
                        key={trade.id}
                        onClick={() => setSelectedTrade(selectedTrade === trade.id ? '' : trade.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          selectedTrade === trade.id
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
                disabled={loading}
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
                    Zoeken in KvK (Live API)
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map Container */}
      <div className="h-[450px] relative">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="h-full w-full"
          maxBounds={NL_BOUNDS}
          minZoom={6}
          maxZoom={18}
        >
          <MapController center={mapCenter} zoom={mapZoom} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={tileLayerUrl}
          />

          {/* City highlight circle */}
          {selectedCity && (
            <Circle
              center={[selectedCity.lat, selectedCity.lng]}
              radius={3000}
              pathOptions={{
                color: '#ff6b35',
                fillColor: '#ff6b35',
                fillOpacity: 0.1,
              }}
            />
          )}

          {/* KVK Result Markers */}
          {markers.map((marker) => {
            // Determine icon: selected (red), GPS exact (green border), or estimated (dashed)
            let icon;
            if (selectedResults.has(marker.kvkNummer || marker.id)) {
              icon = createRingIcon(1); // Red for selected
            } else if (marker.details?.hasRealGeo) {
              icon = kvkGeoIcon; // Green border for GPS exact
            } else {
              icon = kvkIcon; // Dashed border for estimated
            }

            return (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={icon}
              eventHandlers={{
                click: () => toggleResultSelection(marker.kvkNummer || marker.id),
              }}
            >
              <Popup>
                <div className="min-w-[220px]">
                  <h3 className="font-bold text-gray-900">{marker.name}</h3>
                  <p className="text-sm text-gray-600">KvK: {marker.kvkNummer}</p>
                  {marker.details?.adres?.binnenlandsAdres && (
                    <p className="text-sm text-gray-500">
                      📍 {marker.details.adres.binnenlandsAdres.straatnaam}{' '}
                      {marker.details.adres.binnenlandsAdres.huisnummer},{' '}
                      {marker.details.adres.binnenlandsAdres.plaats}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {marker.details?.type}
                    </span>
                    {marker.details?.hasRealGeo ? (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                        ✓ GPS Exact
                      </span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                        ~ Geschat
                      </span>
                    )}
                  </div>
                  {marker.details?.hasRealGeo && (
                    <p className="text-xs text-gray-400 mt-1">
                      Lat: {marker.lat.toFixed(5)}, Lng: {marker.lng.toFixed(5)}
                    </p>
                  )}
                  <button
                    onClick={() => toggleResultSelection(marker.kvkNummer || marker.id)}
                    className={`mt-2 w-full py-1 rounded text-sm font-medium ${
                      selectedResults.has(marker.kvkNummer || marker.id)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {selectedResults.has(marker.kvkNummer || marker.id) ? '✓ Geselecteerd' : 'Selecteren'}
                  </button>
                </div>
              </Popup>
            </Marker>
            );
          })}
        </MapContainer>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-300 z-[1000]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-500 border border-white"></div>
              <span>KvK Bedrijf</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
              <span>Geselecteerd</span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-white/20">
            <div className="flex items-center gap-1">
              <span className="text-green-400">✓</span>
              <span>GPS Exact ({markers.filter(m => m.details?.hasRealGeo).length})</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">~</span>
              <span>Geschat ({markers.filter(m => !m.details?.hasRealGeo).length})</span>
            </div>
          </div>
          <div className="mt-1 text-gray-500">
            Totaal: {markers.length} | Geselecteerd: {selectedResults.size}
          </div>
        </div>

        {/* Zoom to Netherlands button */}
        <button
          onClick={() => {
            setMapCenter(NL_CENTER);
            setMapZoom(7);
            setSelectedCity(null);
          }}
          className="absolute top-4 right-4 z-[1000] bg-white/90 hover:bg-white p-2 rounded-lg shadow-lg"
          title="Zoom naar Nederland"
        >
          <Navigation className="w-5 h-5 text-gray-700" />
        </button>
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
                key={result.kvkNummer + (result.vestigingsnummer || '')}
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
                        {result.adres?.binnenlandsAdres?.straatnaam || 'Adres'},{' '}
                        {result.adres?.binnenlandsAdres?.plaats || 'onbekend'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-white/10 rounded">
                        KvK: {result.kvkNummer}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                        {result.type}
                      </span>
                      {result.sbiActiviteiten?.slice(0, 1).map((sbi) => (
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
              Start Radar Scan ({selectedResults.size} bedrijven)
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
