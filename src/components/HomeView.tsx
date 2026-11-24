import { useRef, type ChangeEvent } from "react";
import {
  Camera,
  Upload,
  MapPin,
  Navigation,
  PhoneCall,
  ArrowRight,
  Compass,
  ShieldCheck,
  Share2,
  Clock,
  Star,
} from "lucide-react";
import { SafeImage } from "./SafeImage";
import { DangerScaleMeter } from "./DangerScaleMeter";
import { INDIAN_REPTILES } from "../data/reptiles";
import { SAFETY_TIPS } from "../data/safety";
import type {
  CoordsState,
  RealHospitalPlace,
  ReptileSpecies,
  TabId,
} from "../types";
import type { UITranslations } from "../i18n/translations";

interface HomeViewProps {
  t: UITranslations;
  coords: CoordsState;
  nearbyHospitals: RealHospitalPlace[];
  hospitalsLoading: boolean;
  onStartCameraScan: () => void;
  onUploadFile: (file: File) => void;
  onQuickTestSpecies: (species: ReptileSpecies) => void;
  onNavigateTab: (tab: TabId) => void;
  onOpenLocalAreaAtlas: () => void;
  onOpenFirstAid: () => void;
  onOpenEmergencyModal: () => void;
  onToggleTracking: () => void;
  onShareLocation: () => void;
  onSelectHospitalRoute: (hospital: RealHospitalPlace) => void;
}

export function HomeView({
  t,
  coords,
  nearbyHospitals,
  hospitalsLoading,
  onStartCameraScan,
  onUploadFile,
  onQuickTestSpecies,
  onNavigateTab,
  onOpenLocalAreaAtlas,
  onOpenFirstAid,
  onOpenEmergencyModal,
  onToggleTracking,
  onShareLocation,
  onSelectHospitalRoute,
}: HomeViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sampleSpecies = INDIAN_REPTILES.filter((r) => r.isSample).slice(0, 5);
  const featuredHospitals = nearbyHospitals.slice(0, 3);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      e.target.value = "";
    }
  };

  const citySummary =
    [coords.locality, coords.city, coords.state]
      .filter((v, idx, arr) => Boolean(v) && arr.indexOf(v) === idx)
      .join(", ") || "India";

  return (
    <div className="space-y-8 pb-6">
      {/* Modern Hero + Live GPS Bento */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B2219] via-[#103023] to-[#174230] text-white p-6 sm:p-8 lg:p-10 shadow-xl">
          <div className="max-w-2xl space-y-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300/90">
              {t.heroEyebrow}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-[1.12] text-balance">
              {t.heroHeadline}
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/85 leading-relaxed max-w-xl">
              {t.heroSubheadline}
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onStartCameraScan}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#071A12] font-bold text-sm inline-flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950/30 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                {t.scanCameraCta}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-white/10 hover:bg-white/18 border border-white/20 text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                {t.uploadPhotoCta}
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("rescue")}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-white/10 hover:bg-white/18 border border-white/20 text-emerald-100 font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-emerald-300" />
                {t.openMapCta}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Right Card: Real Live Coordinates & Instant Rescue Dispatch */}
        <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-[#111C18] border border-slate-200/80 dark:border-emerald-900/40 p-6 flex flex-col justify-between gap-5 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {coords.isTracking ? t.liveGpsActive : "India Field Location"}
              </span>
              <button
                type="button"
                onClick={onToggleTracking}
                className="min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
              >
                {coords.isTracking ? t.stopTracking : t.enableLiveGps}
              </button>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                {citySummary}
              </h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                {coords.formattedAddress ||
                  "Enable live GPS or select an Indian city on the Rescue Map."}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-[#0B1411] px-3.5 py-2.5 border border-slate-200/70 dark:border-emerald-900/30 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono-nums text-slate-600 dark:text-slate-300">
                <span>GPS</span>
                <span className="font-semibold text-slate-900 dark:text-emerald-200">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </span>
              </div>
              {coords.plusCode && (
                <div className="flex items-center justify-between text-[11px] font-mono-nums text-slate-600 dark:text-slate-300">
                  <span>Plus Code</span>
                  <span>{coords.plusCode}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onShareLocation}
              className="min-h-[44px] px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-slate-800 dark:text-emerald-200 font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              {t.sharePinOnMap}
            </button>

            <button
              type="button"
              onClick={onOpenEmergencyModal}
              className="min-h-[44px] px-3 py-2.5 rounded-xl bg-[#C82820] hover:bg-[#A61F18] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              {t.sosButton}
            </button>
          </div>
        </div>
      </section>

      {/* Local Area Reptile Intelligence Callout */}
      <section className="rounded-3xl bg-white dark:bg-[#111C18] border border-slate-200/80 dark:border-emerald-900/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <Compass className="w-4 h-4" />
            <span>{citySummary}</span>
          </div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            {t.localReptilesCardTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t.localReptilesSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenLocalAreaAtlas}
          className="min-h-[46px] shrink-0 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {t.exploreLocalArea}
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* Sample Specimens Across All Reptiles */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {t.sampleSectionTitle}
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab("scan")}
            className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            {t.openScannerLink}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {sampleSpecies.map((species) => (
            <button
              key={species.id}
              type="button"
              onClick={() => onQuickTestSpecies(species)}
              className="group text-left rounded-2xl overflow-hidden bg-white dark:bg-[#111C18] border border-slate-200/80 dark:border-emerald-900/40 hover:border-emerald-500/60 transition-all shadow-sm flex flex-col cursor-pointer"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                <SafeImage
                  src={species.imageUrl}
                  alt={species.commonName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    {species.category} · {species.wpaSchedule.split("(")[0].trim()}
                  </p>
                  <h3 className="mt-0.5 font-display text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {species.commonName}
                  </h3>
                  <p className="text-xs italic text-slate-500 dark:text-slate-400">
                    {species.scientificName}
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
      </section>

      {/* Real Nearby Medical Centres (Google Places API) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {t.nearbyHospitalsTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live Google Places results near {citySummary}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("rescue")}
            className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            {t.openFullMap} →
          </button>
        </div>

        {hospitalsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-slate-200/70 dark:bg-emerald-950/30 animate-pulse"
              />
            ))}
          </div>
        ) : featuredHospitals.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#111C18] border border-slate-200/80 dark:border-emerald-900/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Open the Rescue Map to search hospitals around any Indian district or enable live GPS.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab("rescue")}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold cursor-pointer"
            >
              {t.openFullMap}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredHospitals.map((hospital) => (
              <div
                key={hospital.id}
                className="rounded-2xl bg-white dark:bg-[#111C18] border border-slate-200/80 dark:border-emerald-900/40 p-5 flex flex-col justify-between gap-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {hospital.name}
                    </h3>
                    <span className="shrink-0 font-mono-nums text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {hospital.distanceKm} km
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {hospital.address}
                  </p>
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
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectHospitalRoute(hospital)}
                    className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    {t.getDirections}
                  </button>
                  {hospital.phone && (
                    <a
                      href={`tel:${hospital.phone.replace(/[^+\d]/g, "")}`}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-slate-900 dark:text-emerald-200 text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      {t.callHospital}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Field Safety Protocol */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            {t.safetyProtocolTitle}
          </h2>
          <button
            type="button"
            onClick={onOpenFirstAid}
            className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            {t.firstAidLink} →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAFETY_TIPS.map((tip) => (
            <div
              key={tip.id}
              className="rounded-2xl bg-white dark:bg-[#111C18] border border-slate-200/80 dark:border-emerald-900/40 p-5 space-y-2 shadow-sm"
            >
              <span className="font-mono-nums text-xs font-bold text-emerald-700 dark:text-emerald-400">
                STEP {tip.number}
              </span>
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {tip.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {tip.detail}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
