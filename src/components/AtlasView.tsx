import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  MapPin,
  CheckCircle2,
  XCircle,
  X,
  Compass,
  ShieldAlert,
  RefreshCw,
  FileText,
} from "lucide-react";
import { SafeImage } from "./SafeImage";
import { DangerScaleMeter } from "./DangerScaleMeter";
import { INDIAN_REPTILES } from "../data/reptiles";
import { INDIAN_CITY_PRESETS } from "../data/indiaLocations";
import { FIRST_AID_DOS, FIRST_AID_DONTS } from "../data/safety";
import type {
  AtlasSection,
  CoordsState,
  LanguageCode,
  LocalAreaReport,
  ReptileCategory,
  ReptileSpecies,
} from "../types";
import type { UITranslations } from "../i18n/translations";

interface AtlasViewProps {
  t: UITranslations;
  language: LanguageCode;
  coords: CoordsState;
  activeSection: AtlasSection;
  onSectionChange: (section: AtlasSection) => void;
  onSelectCityPreset: (
    city: string,
    state: string,
    lat: number,
    lng: number
  ) => void;
  onOpenRescueMap: () => void;
}

export function AtlasView({
  t,
  language,
  coords,
  activeSection,
  onSectionChange,
  onSelectCityPreset,
  onOpenRescueMap,
}: AtlasViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | ReptileCategory
  >("all");
  const [riskFilter, setRiskFilter] = useState<"all" | "venomous" | "safe">(
    "all"
  );
  const [selectedSpecies, setSelectedSpecies] = useState<ReptileSpecies | null>(
    null
  );

  // Local Area Reptiles state
  const [localReport, setLocalReport] = useState<LocalAreaReport | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const lastFetchedKeyRef = useRef<string>("");

  const activeLocality = coords.locality || "";
  const activeCity = coords.city || "Bengaluru";
  const activeState = coords.state || "Karnataka";
  const displayAreaTitle = [activeLocality, activeCity, activeState]
    .filter((v, idx, arr) => Boolean(v) && arr.indexOf(v) === idx)
    .join(", ");

  const fetchLocalReptiles = useCallback(
    async (
      locality: string,
      city: string,
      state: string,
      formattedAddress: string,
      lat: number,
      lng: number
    ) => {
      const requestKey = `${locality}|${city}|${state}|${language}`;
      const cacheKey = `antidote_local_reptiles_${requestKey}`;
      lastFetchedKeyRef.current = requestKey;
      setLocalLoading(true);
      setLocalError(null);

      let cachedReport: LocalAreaReport | null = null;
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          cachedReport = JSON.parse(raw) as LocalAreaReport;
        }
      } catch {
        // ignore storage errors
      }

      if (!navigator.onLine) {
        if (cachedReport) {
          setLocalReport(cachedReport);
          setLocalError(null);
        } else {
          setLocalError(
            "You are offline and this area's checklist is not cached yet. Browse All Indian Reptiles & First-Aid offline anytime."
          );
        }
        setLocalLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/local-reptiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locality,
            city,
            state,
            formattedAddress,
            lat,
            lng,
            language,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data?.error || "Failed to load local reptile checklist."
          );
        }
        setLocalReport(data as LocalAreaReport);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch {
          // ignore storage quota errors
        }
      } catch (err) {
        if (cachedReport) {
          setLocalReport(cachedReport);
        } else {
          setLocalError(
            err instanceof Error
              ? err.message
              : "Could not fetch local area reptile guide."
          );
        }
      } finally {
        setLocalLoading(false);
      }
    },
    [language]
  );

  useEffect(() => {
    const key = `${activeLocality}|${activeCity}|${activeState}|${language}`;
    if (activeSection === "local" && key !== lastFetchedKeyRef.current) {
      fetchLocalReptiles(
        activeLocality,
        activeCity,
        activeState,
        coords.formattedAddress || "",
        coords.lat,
        coords.lng
      );
    }
  }, [
    activeSection,
    activeLocality,
    activeCity,
    activeState,
    language,
    coords.formattedAddress,
    coords.lat,
    coords.lng,
    fetchLocalReptiles,
  ]);

  const filteredSpecies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return INDIAN_REPTILES.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      if (riskFilter === "venomous" && !item.isVenomous) return false;
      if (riskFilter === "safe" && item.isVenomous) return false;
      if (!q) return true;
      return (
        item.commonName.toLowerCase().includes(q) ||
        item.localNames.toLowerCase().includes(q) ||
        item.scientificName.toLowerCase().includes(q) ||
        item.indianRegions.some((r) => r.toLowerCase().includes(q)) ||
        item.summary.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory, riskFilter]);

  const categoryButtons: Array<{ id: "all" | ReptileCategory; label: string }> = [
    { id: "all", label: t.catAll },
    { id: "snake", label: t.catSnake },
    { id: "lizard", label: t.catLizard },
    { id: "crocodilian", label: t.catCrocodilian },
    { id: "turtle", label: t.catTurtle },
  ];

  const isBhopalContext =
    `${displayAreaTitle} ${coords.formattedAddress || ""}`
      .toLowerCase()
      .includes("bhopal") ||
    `${displayAreaTitle} ${coords.formattedAddress || ""}`
      .toLowerCase()
      .includes("madhya pradesh");

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {t.atlasTitle}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {t.atlasSubtitle}
          </p>
        </div>

        {/* Section Switcher */}
        <div className="inline-flex flex-wrap rounded-2xl bg-slate-200/70 dark:bg-[#111C18] p-1 border border-slate-200 dark:border-emerald-900/40">
          {(
            [
              { id: "guide", label: t.tabAllSpecies },
              { id: "local", label: t.tabLocalArea },
              { id: "firstaid", label: t.tabFirstAid },
            ] as Array<{ id: AtlasSection; label: string }>
          ).map((sec) => {
            const active = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onSectionChange(sec.id)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  active
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-emerald-950/50"
                }`}
              >
                {sec.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: ALL REPTILES FIELD GUIDE */}
      {activeSection === "guide" && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-white dark:bg-[#111C18] border border-slate-200/80 dark:border-emerald-900/40 p-4 space-y-3.5 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchSpeciesPlaceholder}
                  className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-[#0B1411] border border-slate-200 dark:border-emerald-900/40 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: "all", label: t.filterAllRisk },
                    { id: "venomous", label: t.filterVenomous },
                    { id: "safe", label: t.filterNonVenomous },
                  ] as const
                ).map((rf) => (
                  <button
                    key={rf.id}
                    type="button"
                    onClick={() => setRiskFilter(rf.id)}
                    className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      riskFilter === rf.id
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-emerald-600 dark:border-emerald-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-[#0B1411] dark:text-slate-300 dark:border-emerald-900/40"
                    }`}
                  >
                    {rf.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {categoryButtons.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-emerald-700 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#0B1411] dark:text-slate-300 dark:hover:bg-emerald-950/60"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {filteredSpecies.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#111C18] border border-slate-200 dark:border-emerald-900/40 p-10 text-center space-y-2">
              <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
                No matching Indian reptiles found
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Try clearing filters or use AI Camera Scan on an encounter photo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSpecies.map((species) => (
                <button
                  key={species.id}
                  type="button"
                  onClick={() => setSelectedSpecies(species)}
                  className="group text-left rounded-2xl overflow-hidden bg-white dark:bg-[#111C18] border border-slate-200/80 dark:border-emerald-900/40 hover:border-emerald-500/60 transition-all shadow-sm flex flex-col cursor-pointer"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <SafeImage
                      src={species.imageUrl}
                      alt={species.commonName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        {species.category} · {species.wpaSchedule}
                      </p>
                      <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {species.commonName}
                      </h2>
                      <p className="text-xs italic text-slate-500 dark:text-slate-400">
                        {species.scientificName} · {species.localNames}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 pt-1">
                        {species.summary}
                      </p>
                    </div>

                    <DangerScaleMeter
                      score={species.dangerScale}
                      isVenomous={species.isVenomous}
                      isPhysicallyDangerous={species.isPhysicallyDangerous}
                      riskType={species.venomOrRiskType}
                      venomousLabel={t.venomousLabel}
                      nonVenomousLabel={t.nonVenomousLabel}
                      physicallyDangerousLabel={t.physicallyDangerousLabel}
                      compact
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: LOCAL AREA REPTILES */}
      {activeSection === "local" && (
        <div className="space-y-5">
          <div className="rounded-3xl bg-white dark:bg-[#111C18] border border-slate-200/80 dark:border-emerald-900/40 p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <Compass className="w-4 h-4" />
                  India District &amp; Regional Wildlife Field Guide
                </div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  {displayAreaTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-nums">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                  {coords.formattedAddress
                    ? ` · ${coords.formattedAddress}`
                    : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    fetchLocalReptiles(
                      activeLocality,
                      activeCity,
                      activeState,
                      coords.formattedAddress || "",
                      coords.lat,
                      coords.lng
                    )
                  }
                  disabled={localLoading}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${localLoading ? "animate-spin" : ""}`}
                  />
                  Refresh Local Guide
                </button>
                <button
                  type="button"
                  onClick={onOpenRescueMap}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-slate-800 dark:text-emerald-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Change Area on Map
                </button>
              </div>
            </div>

            {/* Quick Indian Cities / Biogeographic Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {INDIAN_CITY_PRESETS.map((preset) => {
                const selected =
                  activeCity.toLowerCase() === preset.city.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      onSelectCityPreset(
                        preset.city,
                        preset.state,
                        preset.lat,
                        preset.lng
                      )
                    }
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      selected
                        ? "bg-emerald-700 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#0B1411] dark:text-slate-300 dark:hover:bg-emerald-950/50"
                    }`}
                  >
                    {preset.city}
                  </button>
                );
              })}
            </div>
          </div>

          {isBhopalContext && (
            <div className="rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Municipal Biodiversity Example · Bhopal (MPSBB / WII 2023)
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Includes snakes, geckos, skinks, monitors, Bhoj Wetland turtles, Mugger &amp; Gharial baseline reference.
                </p>
              </div>
              <a
                href="/assets/aistudio/Bhopal_Reptiles_Field_and_Safety_Guide_c975f326.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] shrink-0 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Open Example Bhopal PDF Guide
              </a>
            </div>
          )}

          {localLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-2xl bg-slate-200/70 dark:bg-emerald-950/30 animate-pulse"
                />
              ))}
            </div>
          ) : localError ? (
            <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-5 text-sm text-red-800 dark:text-red-200">
              {localError}
            </div>
          ) : localReport ? (
            <div className="space-y-5">
              <div className="rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                    Biogeographic Zone
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {localReport.biogeographicZone}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                    Seasonal Sighting Pattern
                  </p>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                    {localReport.seasonalRiskNote}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                    District Safety Advisory
                  </p>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                    {localReport.safetyAdvisory}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {localReport.commonLocalSpecies.map((sp, i) => (
                  <div
                    key={`${sp.scientificName}-${i}`}
                    className="rounded-2xl bg-white dark:bg-[#111C18] border border-slate-200/80 dark:border-emerald-900/40 p-5 flex flex-col justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        {sp.category}
                      </p>
                      <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                        {sp.commonName}
                      </h3>
                      <p className="text-xs italic text-slate-500 dark:text-slate-400">
                        {sp.scientificName}
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-200">
                        <strong>Local Habitat:</strong> {sp.whereFoundLocally}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        <strong>Field Tip:</strong> {sp.quickTip}
                      </p>
                    </div>

                    <DangerScaleMeter
                      score={sp.dangerScale}
                      isVenomous={sp.isVenomous}
                      riskType={
                        sp.isVenomous
                          ? t.venomousLabel
                          : t.nonVenomousLabel
                      }
                      venomousLabel={t.venomousLabel}
                      nonVenomousLabel={t.nonVenomousLabel}
                      physicallyDangerousLabel={t.physicallyDangerousLabel}
                      compact
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* SECTION 3: FIRST-AID DO'S & DON'TS */}
      {activeSection === "firstaid" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white dark:bg-[#111C18] border border-emerald-200 dark:border-emerald-900/50 p-6 space-y-4 shadow-sm">
            <h2 className="font-display text-xl font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {t.firstAidDosTitle}
            </h2>
            <div className="space-y-3">
              {FIRST_AID_DOS.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-emerald-50/70 dark:bg-[#0B1411] p-4 space-y-1 border border-emerald-200/70 dark:border-emerald-900/30"
                >
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#111C18] border border-red-200 dark:border-red-900/50 p-6 space-y-4 shadow-sm">
            <h2 className="font-display text-xl font-bold text-[#B42318] dark:text-red-400 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {t.firstAidDontsTitle}
            </h2>
            <div className="space-y-3">
              {FIRST_AID_DONTS.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-red-50/70 dark:bg-red-950/20 p-4 space-y-1 border border-red-200/70 dark:border-red-900/30"
                >
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Species Modal Detail */}
      {selectedSpecies && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedSpecies(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#111C18] border border-slate-200 dark:border-emerald-900/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64 bg-slate-100 dark:bg-slate-900">
              <SafeImage
                src={selectedSpecies.imageUrl}
                alt={selectedSpecies.commonName}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedSpecies(null)}
                aria-label="Close species detail"
                className="absolute top-3 right-3 w-11 h-11 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  {selectedSpecies.category} · {selectedSpecies.wpaSchedule} ·{" "}
                  {selectedSpecies.averageLength}
                </p>
                <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {selectedSpecies.commonName}
                </h2>
                <p className="text-sm italic text-slate-500 dark:text-slate-400">
                  {selectedSpecies.scientificName} · {selectedSpecies.localNames}
                </p>
              </div>

              <DangerScaleMeter
                score={selectedSpecies.dangerScale}
                isVenomous={selectedSpecies.isVenomous}
                isPhysicallyDangerous={selectedSpecies.isPhysicallyDangerous}
                riskType={selectedSpecies.venomOrRiskType}
                venomousLabel={t.venomousLabel}
                nonVenomousLabel={t.nonVenomousLabel}
                physicallyDangerousLabel={t.physicallyDangerousLabel}
              />

              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {selectedSpecies.summary}
              </p>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Identifying Features
                </h3>
                <ul className="space-y-1">
                  {selectedSpecies.identifyingFeatures.map((f, i) => (
                    <li
                      key={i}
                      className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-[#0B1411] p-4 space-y-1.5 border border-slate-200/70 dark:border-emerald-900/30">
                <p className="text-xs text-slate-700 dark:text-slate-200">
                  <strong>Indian Regions:</strong>{" "}
                  {selectedSpecies.indianRegions.join(", ")}
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-200">
                  <strong>Look-Alike Caution:</strong>{" "}
                  {selectedSpecies.lookAlikeNote}
                </p>
              </div>

              <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#B42318] dark:text-red-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Immediate Action
                </p>
                <p className="text-xs text-slate-800 dark:text-slate-100 leading-relaxed">
                  {selectedSpecies.immediateAction}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
