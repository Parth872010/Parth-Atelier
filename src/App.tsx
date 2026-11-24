import { useCallback, useEffect, useRef, useState } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import {
  Home,
  Camera,
  BookOpen,
  MapPin,
  PhoneCall,
  Sun,
  Moon,
  Globe,
  AlertTriangle,
  X,
} from "lucide-react";
import { AntidoteLogo } from "./components/AntidoteLogo";
import { SplashScreen } from "./components/SplashScreen";
import { HomeView } from "./components/HomeView";
import { ScannerView } from "./components/ScannerView";
import { AtlasView } from "./components/AtlasView";
import { RescueMapView } from "./components/RescueMapView";
import { EmergencyModal } from "./components/EmergencyModal";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { PWAInstallButton } from "./components/PWAInstallButton";
import { INDIAN_REPTILES } from "./data/reptiles";
import { DEFAULT_INDIA_COORDS } from "./data/indiaLocations";
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from "./i18n/translations";
import type {
  AtlasSection,
  CoordsState,
  LanguageCode,
  RealHospitalPlace,
  ReptileSpecies,
  ScanResult,
  TabId,
} from "./types";

const ENV_MAPS_KEY = (
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
).trim();

function buildInitialScan(species: ReptileSpecies): ScanResult {
  return {
    isReptileDetected: true,
    category: species.category,
    commonName: species.commonName,
    localIndianNames: species.localNames,
    scientificName: species.scientificName,
    imageUrl: species.imageUrl,
    confidencePercent: 98,
    isVenomous: species.isVenomous,
    isPhysicallyDangerous: species.isPhysicallyDangerous,
    dangerScale: species.dangerScale,
    venomOrRiskType: species.venomOrRiskType,
    wpaSchedule: species.wpaSchedule,
    conservationStatus: species.conservationStatus,
    indianHabitatZones: species.indianRegions.join(", "),
    summary: species.summary,
    identifyingFeatures: species.identifyingFeatures,
    threatsAndBehavior: species.threatsAndBehavior,
    lookAlikeNote: species.lookAlikeNote,
    immediateAction: species.immediateAction,
    hospitalPrepNote: species.isVenomous
      ? "Requires urgent hospital assessment & Indian Polyvalent Anti-Snake Venom (ASV)."
      : species.isPhysicallyDangerous
      ? "Non-venomous; heavy physical injury risk requires urgent ER trauma care."
      : "Non-venomous & harmless. Clean minor scratches with antiseptic.",
    source: "sample",
  };
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [atlasSection, setAtlasSection] = useState<AtlasSection>("guide");
  const [language, setLanguage] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem("antidote_lang") as LanguageCode | null;
    return saved && TRANSLATIONS[saved] ? saved : "en";
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("antidote_theme") === "dark";
  });

  const [mapsApiKey, setMapsApiKey] = useState<string>(ENV_MAPS_KEY);
  const [quotaBannerDismissed, setQuotaBannerDismissed] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const [coords, setCoords] = useState<CoordsState>(() => {
    try {
      const saved = localStorage.getItem("antidote_cached_coords");
      if (saved) return JSON.parse(saved) as CoordsState;
    } catch {
      // ignore
    }
    return {
      lat: DEFAULT_INDIA_COORDS.lat,
      lng: DEFAULT_INDIA_COORDS.lng,
      isLiveGps: false,
      isTracking: false,
      city: DEFAULT_INDIA_COORDS.city,
      state: DEFAULT_INDIA_COORDS.state,
    };
  });
  const [searchRadiusMeters, setSearchRadiusMeters] = useState<number>(35000);

  const [hospitals, setHospitals] = useState<RealHospitalPlace[]>(() => {
    try {
      const saved = localStorage.getItem("antidote_cached_hospitals");
      if (saved) return JSON.parse(saved) as RealHospitalPlace[];
    } catch {
      // ignore
    }
    return [];
  });
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [hospitalsError, setHospitalsError] = useState<string | null>(null);
  const [selectedHospital, setSelectedHospital] =
    useState<RealHospitalPlace | null>(null);

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [autoOpenCamera, setAutoOpenCamera] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const lastFetchedLocRef = useRef<string>("");
  const hasUserSelectedLocationRef = useRef<boolean>(false);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Apply dark mode class to root HTML element
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("antidote_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("antidote_lang", language);
  }, [language]);

  // Listen for global Google Maps quota-exceeded events (Case A Defense)
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener("gmp-quota-exceeded", handleQuota);
    return () => window.removeEventListener("gmp-quota-exceeded", handleQuota);
  }, []);

  // Load Maps API key from server config if not baked into VITE_ env at build time
  useEffect(() => {
    if (mapsApiKey) return;
    fetch("/api/maps-config")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.apiKey === "string" && data.apiKey.trim()) {
          setMapsApiKey(data.apiKey.trim());
        }
      })
      .catch(() => {});
  }, [mapsApiKey]);

  const reverseGeocodeCoords = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `/api/geocode/reverse?lat=${lat}&lng=${lng}&language=${encodeURIComponent(language)}`
        );
        if (res.status === 429) {
          window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        setCoords((prev) => ({
          ...prev,
          formattedAddress: data.formattedAddress || prev.formattedAddress,
          locality: data.locality || prev.locality,
          city: data.city || prev.city,
          state: data.state || prev.state,
          postalCode: data.postalCode || prev.postalCode,
          plusCode: data.plusCode || prev.plusCode,
        }));
      } catch {
        // Ignore transient geocode errors
      }
    },
    [language]
  );

  useEffect(() => {
    try {
      localStorage.setItem("antidote_cached_coords", JSON.stringify(coords));
    } catch {
      // ignore storage quota errors
    }
  }, [coords]);

  const fetchNearbyHospitals = useCallback(
    async (lat: number, lng: number, query = "", radiusOverride?: number) => {
      if (!navigator.onLine) {
        setHospitalsLoading(false);
        return;
      }
      setHospitalsLoading(true);
      setHospitalsError(null);
      try {
        const res = await fetch("/api/places/nearby-hospitals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat,
            lng,
            radiusMeters: radiusOverride ?? searchRadiusMeters,
            query,
            languageCode: language,
          }),
        });
        const data = await res.json();
        if (res.status === 429 || data?.quotaExceeded) {
          window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
          setHospitalsError(
            "Google Maps Places quota limit reached. You can still call 108 / 112 / 1926 directly."
          );
          return;
        }
        if (!res.ok) {
          throw new Error(data?.error || "Failed to fetch hospitals.");
        }
        const list = Array.isArray(data.hospitals)
          ? (data.hospitals as RealHospitalPlace[])
          : [];
        setHospitals(list);
        try {
          localStorage.setItem(
            "antidote_cached_hospitals",
            JSON.stringify(list)
          );
        } catch {
          // ignore
        }
      } catch (err) {
        setHospitalsError(
          err instanceof Error
            ? err.message
            : "Could not load nearby hospitals."
        );
      } finally {
        setHospitalsLoading(false);
      }
    },
    [language, searchRadiusMeters]
  );

  // Trigger reverse geocode + nearby hospitals whenever coordinates, radius, or language change
  useEffect(() => {
    const roundedKey = `${coords.lat.toFixed(3)},${coords.lng.toFixed(3)},${searchRadiusMeters},${language}`;
    if (lastFetchedLocRef.current === roundedKey) return;
    lastFetchedLocRef.current = roundedKey;

    reverseGeocodeCoords(coords.lat, coords.lng);
    fetchNearbyHospitals(coords.lat, coords.lng);
  }, [
    coords.lat,
    coords.lng,
    searchRadiusMeters,
    language,
    reverseGeocodeCoords,
    fetchNearbyHospitals,
  ]);

  const stopGpsWatch = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setCoords((prev) => ({ ...prev, isTracking: false }));
  }, []);

  const startGpsWatch = useCallback(() => {
    if (!navigator.geolocation) return;
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setCoords((prev) => ({ ...prev, isTracking: true }));
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords((prev) => ({
          ...prev,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
          isLiveGps: true,
          isTracking: true,
        }));
        setSelectedHospital(null);
      },
      () => {
        setCoords((prev) => ({ ...prev, isTracking: false }));
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  }, []);

  const requestOneTimeGps = useCallback((isInitialAuto = false) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (isInitialAuto && hasUserSelectedLocationRef.current) {
          return;
        }
        setHospitals([]);
        setCoords((prev) => ({
          ...prev,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
          isLiveGps: true,
        }));
        setSelectedHospital(null);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Attempt an initial silent GPS fix on load unless user already picked a location
  useEffect(() => {
    requestOneTimeGps(true);
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [requestOneTimeGps]);

  const handleToggleTracking = () => {
    if (coords.isTracking) {
      stopGpsWatch();
    } else {
      startGpsWatch();
    }
  };

  const handleSelectManualLocation = (
    lat: number,
    lng: number,
    city?: string,
    state?: string,
    formattedAddress?: string,
    locality?: string
  ) => {
    hasUserSelectedLocationRef.current = true;
    lastFetchedLocRef.current = "";
    stopGpsWatch();
    setSelectedHospital(null);
    setHospitals([]);
    setHospitalsError(null);
    setCoords({
      lat,
      lng,
      isLiveGps: false,
      isTracking: false,
      locality: locality || "",
      city: city || "",
      state: state || "",
      formattedAddress: formattedAddress || undefined,
    });
  };

  const handleShareLocation = async (): Promise<boolean> => {
    setActiveTab("rescue");
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;
    const shareText = `ANTIDOTE Wildlife Rescue Location: ${
      [coords.city, coords.state].filter(Boolean).join(", ") || "India"
    } (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}) ${
      coords.plusCode ? `Plus Code: ${coords.plusCode} ` : ""
    }${mapsUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "ANTIDOTE Live GPS Pin",
          text: shareText,
          url: mapsUrl,
        });
        return true;
      } catch {
        // User canceled or unsupported
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const handleOpenCameraScan = () => {
    setScanResult(null);
    setActiveTab("scan");
    setAutoOpenCamera(true);
  };

  const handleUploadFromHome = (file: File) => {
    setScanResult(null);
    setPendingFile(file);
    setAutoOpenCamera(false);
    setActiveTab("scan");
  };

  const handleQuickTestSpecies = (species: ReptileSpecies) => {
    setAutoOpenCamera(false);
    setScanResult(buildInitialScan(species));
    setActiveTab("scan");
  };

  const navItems: Array<{ id: TabId; label: string; icon: typeof Home }> = [
    { id: "home", label: t.navHome, icon: Home },
    { id: "scan", label: t.navScan, icon: Camera },
    { id: "atlas", label: t.navAtlas, icon: BookOpen },
    { id: "rescue", label: t.navRescue, icon: MapPin },
  ];

  const mainShell = (
    <div className="min-h-screen flex flex-col bg-[#F4F6F5] text-slate-900 dark:bg-[#0B1210] dark:text-slate-100">
      {/* Case A: Google Maps Quota Exceeded Banner */}
      {quotaExceeded && !quotaBannerDismissed && (
        <div className="sticky top-0 z-50 bg-amber-500 text-slate-950 px-4 py-2.5 text-xs sm:text-sm font-medium shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                The Google Maps Platform free demo key quota was reached. Direct 108 / 112 / 1926 dialing and AI reptile scan continue to work normally.{" "}
                <a
                  href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-bold"
                >
                  Learn how to use your own Google Cloud key
                </a>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setQuotaBannerDismissed(true)}
              aria-label="Dismiss quota notice"
              className="p-1.5 rounded-lg hover:bg-black/10 shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Clean 3-Zone Header (Brand + Primary Tabs + Language/Theme/SOS) */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-emerald-900/40 bg-white/90 dark:bg-[#0E1814]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Left: Preserved Brand Name & AntidoteLogo */}
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className="flex items-center gap-2.5 text-left cursor-pointer shrink-0"
          >
            <AntidoteLogo size="sm" className="w-8 h-9" />
            <div className="leading-tight">
              <span className="font-display text-lg font-black tracking-[0.06em] text-slate-900 dark:text-white block">
                ANTIDOTE
              </span>
              <span className="hidden sm:block text-[10px] font-semibold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                {t.appTagline}
              </span>
            </div>
          </button>

          {/* Center: Desktop Primary Navigation */}
          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Primary"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === "scan") {
                      handleOpenCameraScan();
                    } else {
                      setAutoOpenCamera(false);
                      setActiveTab(item.id);
                    }
                  }}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                    active
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-emerald-950/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Install PWA, Language Switcher, Dark Mode Toggle, SOS Rescue */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />
            <label className="relative inline-flex items-center">
              <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-emerald-400 absolute left-2.5 pointer-events-none" />
              <select
                aria-label="Select Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="min-h-[40px] pl-7 pr-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#111C18] border border-slate-200 dark:border-emerald-900/50 text-xs font-semibold text-slate-800 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeLabel}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label="Toggle dark mode"
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#111C18] dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-emerald-900/50 flex items-center justify-center text-slate-700 dark:text-emerald-200 cursor-pointer"
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setEmergencyModalOpen(true)}
              className="min-h-[40px] px-3.5 sm:px-4 py-2 rounded-xl bg-[#C82820] hover:bg-[#A61F18] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span className="hidden sm:inline">{t.sosButton}</span>
              <span className="sm:hidden">SOS</span>
            </button>
          </div>
        </div>
      </header>

      <OfflineIndicator />

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-10">
        {activeTab === "home" && (
          <HomeView
            t={t}
            coords={coords}
            nearbyHospitals={hospitals}
            hospitalsLoading={hospitalsLoading}
            onStartCameraScan={handleOpenCameraScan}
            onUploadFile={handleUploadFromHome}
            onQuickTestSpecies={handleQuickTestSpecies}
            onNavigateTab={(tab) => {
              setAutoOpenCamera(false);
              setActiveTab(tab);
            }}
            onOpenLocalAreaAtlas={() => {
              setAtlasSection("local");
              setActiveTab("atlas");
            }}
            onOpenFirstAid={() => {
              setAtlasSection("firstaid");
              setActiveTab("atlas");
            }}
            onOpenEmergencyModal={() => setEmergencyModalOpen(true)}
            onToggleTracking={handleToggleTracking}
            onShareLocation={handleShareLocation}
            onSelectHospitalRoute={(hospital) => {
              setSelectedHospital(hospital);
              setActiveTab("rescue");
            }}
          />
        )}

        {activeTab === "scan" && (
          <ScannerView
            t={t}
            language={language}
            coords={coords}
            scanResult={scanResult}
            pendingFile={pendingFile}
            autoOpenCamera={autoOpenCamera}
            onCameraTriggerHandled={() => setAutoOpenCamera(false)}
            onClearPendingFile={() => setPendingFile(null)}
            onResultReady={setScanResult}
            onFindNearestHospital={() => setActiveTab("rescue")}
            onOpenEmergencyModal={() => setEmergencyModalOpen(true)}
          />
        )}

        {activeTab === "atlas" && (
          <AtlasView
            t={t}
            language={language}
            coords={coords}
            activeSection={atlasSection}
            onSectionChange={setAtlasSection}
            onSelectCityPreset={(city, state, lat, lng) =>
              handleSelectManualLocation(lat, lng, city, state)
            }
            onOpenRescueMap={() => setActiveTab("rescue")}
          />
        )}

        {activeTab === "rescue" && (
          <RescueMapView
            t={t}
            language={language}
            mapsApiKey={mapsApiKey}
            coords={coords}
            searchRadiusMeters={searchRadiusMeters}
            onChangeSearchRadius={(radius) => setSearchRadiusMeters(radius)}
            hospitals={hospitals}
            hospitalsLoading={hospitalsLoading}
            hospitalsError={hospitalsError}
            selectedHospital={selectedHospital}
            onSelectHospital={setSelectedHospital}
            onSearchHospitals={(q) =>
              fetchNearbyHospitals(coords.lat, coords.lng, q)
            }
            onSelectLocation={handleSelectManualLocation}
            onRequestLiveGps={() => requestOneTimeGps(false)}
            onToggleTracking={handleToggleTracking}
            onShareLocation={handleShareLocation}
            onOpenEmergencyModal={() => setEmergencyModalOpen(true)}
          />
        )}

        {/* Compliance & Safety Disclaimer */}
        <footer className="mt-8 pt-5 border-t border-slate-200/80 dark:border-emerald-900/40 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-3xl mx-auto">
            {t.disclaimerNote}
          </p>
        </footer>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0E1814]/95 backdrop-blur-md border-t border-slate-200 dark:border-emerald-900/50 pb-safe"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-4 gap-1 px-2 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "scan") {
                    handleOpenCameraScan();
                  } else {
                    setAutoOpenCamera(false);
                    setActiveTab(item.id);
                  }
                }}
                className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                  active
                    ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Emergency SOS & Grounded Local Wildlife Rescuers Modal */}
      <EmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        t={t}
        language={language}
        coords={coords}
        nearestHospital={hospitals[0] || null}
        onOpenRescueMap={() => setActiveTab("rescue")}
      />

      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}
    </div>
  );

  if (!mapsApiKey) {
    return mainShell;
  }

  return (
    <APIProvider
      apiKey={mapsApiKey}
      language={language}
      region="IN"
      libraries={["marker", "routes"]}
    >
      {mainShell}
    </APIProvider>
  );
}

// Keep unused reference guard clean if needed
export { INDIAN_REPTILES };
