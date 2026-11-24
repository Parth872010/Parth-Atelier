import { useEffect, useRef, useState } from "react";
import {
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import {
  MapPin,
  Navigation,
  PhoneCall,
  Search,
  Share2,
  ExternalLink,
  LocateFixed,
  Star,
  Clock,
  Check,
  Route as RouteIcon,
  WifiOff,
} from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { INDIAN_CITY_PRESETS } from "../data/indiaLocations";
import type {
  CoordsState,
  LanguageCode,
  RealHospitalPlace,
} from "../types";
import type { UITranslations } from "../i18n/translations";

interface RescueMapViewProps {
  t: UITranslations;
  language: LanguageCode;
  mapsApiKey: string;
  coords: CoordsState;
  searchRadiusMeters: number;
  onChangeSearchRadius: (radiusMeters: number) => void;
  hospitals: RealHospitalPlace[];
  hospitalsLoading: boolean;
  hospitalsError: string | null;
  selectedHospital: RealHospitalPlace | null;
  onSelectHospital: (hospital: RealHospitalPlace | null) => void;
  onSearchHospitals: (query: string) => void;
  onSelectLocation: (
    lat: number,
    lng: number,
    city?: string,
    state?: string,
    formattedAddress?: string,
    locality?: string
  ) => void;
  onRequestLiveGps: () => void;
  onToggleTracking: () => void;
  onShareLocation: () => Promise<boolean>;
  onOpenEmergencyModal: () => void;
}

interface AutocompleteSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface RouteMetrics {
  distanceMeters: number;
  durationMillis: number;
}

interface MapPolyline {
  setMap: (map: unknown | null) => void;
  setOptions: (options: {
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
  }) => void;
}

function getZoomForRadius(radiusMeters: number): number {
  if (radiusMeters >= 45000) return 10;
  if (radiusMeters >= 25000) return 11;
  return 12;
}

function MapViewportController({
  coords,
  hospitals,
  searchRadiusMeters,
  hasSelectedHospital,
}: {
  coords: { lat: number; lng: number };
  hospitals: RealHospitalPlace[];
  searchRadiusMeters: number;
  hasSelectedHospital: boolean;
}) {
  const map = useMap();
  const coreLib = useMapsLibrary("core");

  useEffect(() => {
    if (!map || hasSelectedHospital) return;

    const mapApi = map as unknown as {
      setCenter: (center: { lat: number; lng: number }) => void;
      setZoom: (zoom: number) => void;
      fitBounds: (bounds: unknown, padding?: number) => void;
    };

    if (coreLib && hospitals.length > 0) {
      const LatLngBoundsCtor = (
        coreLib as unknown as {
          LatLngBounds?: new () => {
            extend: (point: { lat: number; lng: number }) => void;
          };
        }
      ).LatLngBounds;

      if (LatLngBoundsCtor) {
        const bounds = new LatLngBoundsCtor();
        bounds.extend({ lat: coords.lat, lng: coords.lng });
        hospitals.slice(0, 8).forEach((h) => {
          bounds.extend({ lat: h.lat, lng: h.lng });
        });
        mapApi.fitBounds(bounds, 56);
        return;
      }
    }

    mapApi.setCenter({ lat: coords.lat, lng: coords.lng });
    mapApi.setZoom(getZoomForRadius(searchRadiusMeters));
  }, [
    map,
    coreLib,
    coords.lat,
    coords.lng,
    hospitals,
    searchRadiusMeters,
    hasSelectedHospital,
  ]);

  return null;
}

function RoutePolylineLayer({
  origin,
  destination,
  onRouteMetrics,
}: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number } | null;
  onRouteMetrics: (metrics: RouteMetrics | null) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");
  const polylinesRef = useRef<MapPolyline[]>([]);

  useEffect(() => {
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    onRouteMetrics(null);

    if (!map || !routesLib || !destination) return;

    let cancelled = false;
    const request = {
      origin,
      destination,
      travelMode: "DRIVING",
      fields: ["path", "distanceMeters", "durationMillis", "viewport", "legs"],
    };

    const routeClass = (
      routesLib as unknown as {
        Route?: {
          computeRoutes: (
            req: typeof request
          ) => Promise<{
            routes: Array<{
              createPolylines: () => MapPolyline[];
              viewport?: unknown;
              distanceMeters?: number;
              durationMillis?: number;
            }>;
          }>;
        };
      }
    ).Route;

    if (!routeClass?.computeRoutes) return;

    routeClass
      .computeRoutes(request)
      .then(({ routes }) => {
        if (cancelled || !routes || routes.length === 0) return;
        const primaryRoute = routes[0];
        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline) => {
          polyline.setOptions({
            strokeColor: "#047857",
            strokeOpacity: 0.9,
            strokeWeight: 6,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;
        if (primaryRoute.viewport) {
          (
            map as unknown as {
              fitBounds: (bounds: unknown, padding?: number) => void;
            }
          ).fitBounds(primaryRoute.viewport, 60);
        }
        onRouteMetrics({
          distanceMeters: primaryRoute.distanceMeters ?? 0,
          durationMillis: primaryRoute.durationMillis ?? 0,
        });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("429") ||
          msg.toLowerCase().includes("quota")
        ) {
          window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
        }
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [
    map,
    routesLib,
    origin.lat,
    origin.lng,
    destination?.lat,
    destination?.lng,
    onRouteMetrics,
  ]);

  return null;
}

function HospitalMarker({
  hospital,
  isSelected,
  onClick,
}: {
  hospital: RealHospitalPlace;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: hospital.lat, lng: hospital.lng }}
        onClick={onClick}
        title={hospital.name}
      >
        <Pin
          background={isSelected ? "#991B1B" : "#C82820"}
          borderColor="#FFFFFF"
          glyphColor="#FFFFFF"
          scale={isSelected ? 1.2 : 1.0}
        />
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow anchor={marker} onCloseClick={onClick}>
          <div className="p-1 max-w-[240px] space-y-1.5 text-slate-900">
            <p className="font-bold text-sm leading-tight">{hospital.name}</p>
            <p className="text-xs text-slate-600">{hospital.address}</p>
            <p className="text-xs font-semibold text-emerald-700">
              {hospital.distanceKm} km away
              {hospital.openingHoursText
                ? ` · ${hospital.openingHoursText}`
                : ""}
            </p>
            <div className="flex items-center gap-2 pt-1">
              {hospital.phone && (
                <a
                  href={`tel:${hospital.phone.replace(/[^+\d]/g, "")}`}
                  className="px-2.5 py-1 rounded-lg bg-[#C82820] text-white text-xs font-bold"
                >
                  Call
                </a>
              )}
              <a
                href={hospital.directionsUri || hospital.googleMapsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-xs font-semibold"
              >
                Google Maps
              </a>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

const RADIUS_OPTIONS = [
  { meters: 15000, label: "15 km" },
  { meters: 35000, label: "35 km (City)" },
  { meters: 50000, label: "50 km (District)" },
];

export function RescueMapView({
  t,
  language,
  mapsApiKey,
  coords,
  searchRadiusMeters,
  onChangeSearchRadius,
  hospitals,
  hospitalsLoading,
  hospitalsError,
  selectedHospital,
  onSelectHospital,
  onSearchHospitals,
  onSelectLocation,
  onRequestLiveGps,
  onToggleTracking,
  onShareLocation,
  onOpenEmergencyModal,
}: RescueMapViewProps) {
  const isOnline = useOnlineStatus();
  const [cityQuery, setCityQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [locationResolving, setLocationResolving] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hospitalFilter, setHospitalFilter] = useState("");
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  // Debounced Places Autocomplete for Indian locations
  useEffect(() => {
    const q = cityQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: q, languageCode: language }),
        });
        if (res.status === 429) {
          window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
          return;
        }
        const data = await res.json();
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [cityQuery, language]);

  const resolveByTextQuery = async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;
    setLocationResolving(true);
    setLocationError(null);
    setSuggestions([]);
    try {
      const res = await fetch("/api/places/geocode-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, languageCode: language }),
      });
      if (res.status === 429) {
        window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
        setLocationError("Google Maps quota limit reached.");
        return;
      }
      const data = await res.json();
      if (!res.ok || typeof data.lat !== "number" || typeof data.lng !== "number") {
        setLocationError(
          data?.error || `Could not locate "${trimmed}" in India.`
        );
        return;
      }
      setHospitalFilter("");
      onSelectLocation(
        data.lat,
        data.lng,
        data.city || data.name || trimmed,
        data.state || "",
        data.formattedAddress || trimmed,
        data.locality || ""
      );
    } catch {
      setLocationError("Network unavailable to search location.");
    } finally {
      setLocationResolving(false);
    }
  };

  const handleChooseSuggestion = async (item: AutocompleteSuggestion) => {
    setCityQuery(item.description);
    setSuggestions([]);
    setLocationResolving(true);
    setLocationError(null);
    try {
      const res = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(item.placeId)}&language=${encodeURIComponent(language)}`
      );
      if (res.status === 429) {
        window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
        setLocationError("Google Maps quota limit reached.");
        return;
      }
      const data = await res.json();
      if (res.ok && typeof data.lat === "number" && typeof data.lng === "number") {
        setHospitalFilter("");
        onSelectLocation(
          data.lat,
          data.lng,
          data.city || item.mainText,
          data.state || "",
          data.formattedAddress || item.description,
          data.locality || ""
        );
      } else {
        await resolveByTextQuery(item.description);
      }
    } catch {
      await resolveByTextQuery(item.description);
    } finally {
      setLocationResolving(false);
    }
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      await handleChooseSuggestion(suggestions[0]);
    } else if (cityQuery.trim()) {
      await resolveByTextQuery(cityQuery);
    }
  };

  const handleShareClick = async () => {
    const ok = await onShareLocation();
    if (ok) {
      setCopiedShare(true);
      window.setTimeout(() => setCopiedShare(false), 2600);
    }
  };

  const locationDisplay = [coords.locality, coords.city, coords.state]
    .filter((v, idx, arr) => Boolean(v) && arr.indexOf(v) === idx)
    .join(", ");

  const quickCityPresets = INDIAN_CITY_PRESETS.filter((p) =>
    [
      "bhopal",
      "bengaluru",
      "mumbai",
      "delhi",
      "pune",
      "chennai",
      "kolkata",
      "hyderabad",
    ].includes(p.id)
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header + Live Coordinate Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {t.rescueTitle}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {t.rescueSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onRequestLiveGps}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            <LocateFixed className="w-4 h-4" />
            {t.refreshGps}
          </button>

          <button
            type="button"
            onClick={onToggleTracking}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
              coords.isTracking
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200"
                : "bg-white border-slate-300 text-slate-700 dark:bg-[#111C18] dark:border-emerald-900/50 dark:text-slate-200"
            }`}
          >
            {coords.isTracking ? t.stopTracking : t.enableLiveGps}
          </button>

          <button
            type="button"
            onClick={handleShareClick}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            {copiedShare ? (
              <>
                <Check className="w-4 h-4" />
                Pin Copied / Shared
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                {t.sharePinOnMap}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenEmergencyModal}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C82820] hover:bg-[#A61F18] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            108 / Rescuers
          </button>
        </div>
      </div>

      {/* Location Search, Hospital Filter & Map Scale / Radius Controls */}
      <div className="rounded-3xl bg-white dark:bg-[#111C18] border border-slate-200/80 dark:border-emerald-900/40 p-4 sm:p-5 space-y-3.5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Set Indian Area / City
            </label>
            <form onSubmit={handleLocationSubmit} className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={cityQuery}
                  onChange={(e) => {
                    setCityQuery(e.target.value);
                    setLocationError(null);
                  }}
                  placeholder="e.g. Patel Nagar Bhopal, Pune, Jaipur..."
                  className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-[#0B1411] border border-slate-200 dark:border-emerald-900/40 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1.5 rounded-2xl bg-white dark:bg-[#111C18] border border-slate-200 dark:border-emerald-800 shadow-xl overflow-hidden">
                    {suggestions.map((s) => (
                      <button
                        key={s.placeId}
                        type="button"
                        onClick={() => handleChooseSuggestion(s)}
                        className="w-full px-4 py-3 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border-b last:border-b-0 border-slate-100 dark:border-emerald-900/30 cursor-pointer"
                      >
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {s.mainText}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {s.secondaryText}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={locationResolving || !cityQuery.trim()}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold cursor-pointer shrink-0"
              >
                {locationResolving ? "..." : "Set Area"}
              </button>
            </form>
            {locationError && (
              <p className="text-xs text-[#B42318] dark:text-red-400 pt-0.5">
                {locationError}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Filter Nearby Hospitals (Optional)
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchHospitals(hospitalFilter);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={hospitalFilter}
                  onChange={(e) => setHospitalFilter(e.target.value)}
                  placeholder={t.searchHospitalPlaceholder}
                  className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-[#0B1411] border border-slate-200 dark:border-emerald-900/40 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <button
                type="submit"
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold cursor-pointer shrink-0"
              >
                Find
              </button>
            </form>
          </div>
        </div>

        {/* City Quick Presets + Widened Map Scale Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {quickCityPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  onSelectLocation(
                    preset.lat,
                    preset.lng,
                    preset.city,
                    preset.state
                  )
                }
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  coords.city?.toLowerCase() === preset.city.toLowerCase()
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#0B1411] dark:text-slate-300"
                }`}
              >
                {preset.city}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Map Scale:
            </span>
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.meters}
                type="button"
                onClick={() => onChangeSearchRadius(opt.meters)}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  searchRadiusMeters === opt.meters
                    ? "bg-slate-900 text-white dark:bg-emerald-600"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#0B1411] dark:text-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs font-mono-nums text-slate-600 dark:text-emerald-300 pt-1 border-t border-slate-100 dark:border-emerald-900/30">
          {locationDisplay || "India"} · {coords.lat.toFixed(5)},{" "}
          {coords.lng.toFixed(5)}
          {coords.plusCode ? ` · ${coords.plusCode}` : ""}
        </div>
      </div>

      {/* Main Map + Real Hospitals List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Interactive Google Map Container */}
        <div className="lg:col-span-7 space-y-3">
          <div className="h-[420px] lg:h-[560px] w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-emerald-900/50 bg-slate-200 dark:bg-[#0B1411] shadow-md relative">
            {mapsApiKey ? (
              <GoogleMap
                defaultCenter={{ lat: coords.lat, lng: coords.lng }}
                defaultZoom={getZoomForRadius(searchRadiusMeters)}
                mapId="DEMO_MAP_ID"
                gestureHandling="greedy"
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
              >
                <MapViewportController
                  coords={{ lat: coords.lat, lng: coords.lng }}
                  hospitals={hospitals}
                  searchRadiusMeters={searchRadiusMeters}
                  hasSelectedHospital={Boolean(selectedHospital)}
                />

                {/* User Live Location Pin */}
                <AdvancedMarker
                  position={{ lat: coords.lat, lng: coords.lng }}
                  title="Your Location"
                >
                  <Pin
                    background="#047857"
                    borderColor="#FFFFFF"
                    glyphColor="#FFFFFF"
                    scale={1.15}
                  />
                </AdvancedMarker>

                {/* Real Google Places Hospital Markers */}
                {hospitals.map((hospital) => (
                  <HospitalMarker
                    key={hospital.id}
                    hospital={hospital}
                    isSelected={selectedHospital?.id === hospital.id}
                    onClick={() =>
                      onSelectHospital(
                        selectedHospital?.id === hospital.id ? null : hospital
                      )
                    }
                  />
                ))}

                {/* Real Driving Route Polyline */}
                <RoutePolylineLayer
                  origin={{ lat: coords.lat, lng: coords.lng }}
                  destination={
                    selectedHospital
                      ? { lat: selectedHospital.lat, lng: selectedHospital.lng }
                      : null
                  }
                  onRouteMetrics={setRouteMetrics}
                />
              </GoogleMap>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2">
                <MapPin className="w-8 h-8 text-emerald-700" />
                <p className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Google Maps initializing...
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm">
                  If the interactive map does not appear, use the external Google Maps directions buttons on each hospital below.
                </p>
              </div>
            )}
          </div>

          {selectedHospital && routeMetrics && (
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <RouteIcon className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Driving Route to {selectedHospital.name}
                  </p>
                  <p className="text-xs font-mono-nums text-emerald-800 dark:text-emerald-300">
                    {(routeMetrics.distanceMeters / 1000).toFixed(2)} km ·{" "}
                    {Math.max(1, Math.round(routeMetrics.durationMillis / 60000))}{" "}
                    min estimated drive
                  </p>
                </div>
              </div>
              <a
                href={
                  selectedHospital.directionsUri ||
                  selectedHospital.googleMapsUri
                }
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t.openGoogleMaps}
              </a>
            </div>
          )}
        </div>

        {/* Real Hospitals Directory */}
        <div className="lg:col-span-5 space-y-3 max-h-[580px] overflow-y-auto pr-1">
          {!isOnline && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>
                Offline mode — showing last cached nearby hospitals. Dial{" "}
                <strong>108 / 112 / 1926</strong> directly anytime.
              </span>
            </div>
          )}

          {hospitalsError && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 text-xs text-amber-900 dark:text-amber-200">
              {hospitalsError}
            </div>
          )}

          {hospitalsLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-2xl bg-slate-200/70 dark:bg-emerald-950/30 animate-pulse"
                />
              ))}
            </div>
          ) : hospitals.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#111C18] border border-slate-200 dark:border-emerald-900/40 p-6 text-center space-y-2">
              <p className="font-display text-base font-bold text-slate-900 dark:text-white">
                No hospitals returned for this filter
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Try widening Map Scale to 50 km (District) or clearing the hospital keyword filter.
              </p>
            </div>
          ) : (
            hospitals.map((hospital) => {
              const active = selectedHospital?.id === hospital.id;
              return (
                <div
                  key={hospital.id}
                  className={`rounded-2xl p-4 border transition-all space-y-3 ${
                    active
                      ? "bg-emerald-50/70 border-emerald-600 dark:bg-emerald-950/50 dark:border-emerald-500 shadow-md"
                      : "bg-white border-slate-200/80 dark:bg-[#111C18] dark:border-emerald-900/40 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {hospital.name}
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {hospital.address}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono-nums text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {hospital.distanceKm} km
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    {hospital.openingHoursText && (
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        {hospital.openingHoursText}
                      </span>
                    )}
                    {hospital.rating && (
                      <span className="inline-flex items-center gap-1 font-mono-nums">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {hospital.rating.toFixed(1)}
                        {hospital.userRatingCount
                          ? ` (${hospital.userRatingCount})`
                          : ""}
                      </span>
                    )}
                    {hospital.phone && (
                      <span className="font-mono-nums">{hospital.phone}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectHospital(hospital)}
                      className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {t.getDirections}
                    </button>

                    {hospital.phone && (
                      <a
                        href={`tel:${hospital.phone.replace(/[^+\d]/g, "")}`}
                        className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#C82820] hover:bg-[#A61F18] text-white text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        {t.callHospital}
                      </a>
                    )}

                    <a
                      href={hospital.directionsUri || hospital.googleMapsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0B1411] dark:hover:bg-emerald-950/60 text-slate-800 dark:text-emerald-200 text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
