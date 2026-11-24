import { useCallback, useEffect, useState } from "react";
import {
  PhoneCall,
  X,
  MapPin,
  ShieldAlert,
  ExternalLink,
  Navigation,
  RefreshCw,
} from "lucide-react";
import { VERIFIED_INDIA_HELPLINES } from "../data/indiaLocations";
import type {
  CoordsState,
  LanguageCode,
  RealHospitalPlace,
} from "../types";
import type { UITranslations } from "../i18n/translations";

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: UITranslations;
  language: LanguageCode;
  coords: CoordsState;
  nearestHospital: RealHospitalPlace | null;
  onOpenRescueMap: () => void;
}

interface RescuerSearchResponse {
  area: string;
  summaryText: string;
  sources: Array<{ title: string; uri: string }>;
  isFallback?: boolean;
}

function extractPhoneLinks(text: string): string[] {
  const matches = text.match(
    /(?:\+91[\s-]?)?(?:0?\d{2,5}[\s-]?\d{6,8}|[6-9]\d{9}|\b108\b|\b112\b|\b101\b|\b1926\b)/g
  );
  if (!matches) return [];
  const unique = new Set<string>();
  matches.forEach((raw) => {
    const cleaned = raw.replace(/[\s-]/g, "");
    if (cleaned.length >= 3) unique.add(cleaned);
  });
  return Array.from(unique).slice(0, 8);
}

export function EmergencyModal({
  isOpen,
  onClose,
  t,
  language,
  coords,
  nearestHospital,
  onOpenRescueMap,
}: EmergencyModalProps) {
  const [rescuerData, setRescuerData] = useState<RescuerSearchResponse | null>(
    null
  );
  const [loadingRescuers, setLoadingRescuers] = useState(false);
  const [rescuerError, setRescuerError] = useState<string | null>(null);
  const [lastQueryKey, setLastQueryKey] = useState("");

  const activeLocality = coords.locality || "";
  const activeCity = coords.city || "Bengaluru";
  const activeState = coords.state || "Karnataka";
  const areaTitle = [activeLocality, activeCity, activeState]
    .filter((v, idx, arr) => Boolean(v) && arr.indexOf(v) === idx)
    .join(", ");

  const fetchRescuers = useCallback(async () => {
    const cacheKey = `antidote_rescuers_${activeCity}_${activeState}_${language}`;
    if (!navigator.onLine) {
      const saved = localStorage.getItem(cacheKey);
      if (saved) {
        try {
          setRescuerData(JSON.parse(saved) as RescuerSearchResponse);
          setRescuerError(null);
          return;
        } catch {
          // ignore parse error
        }
      }
      setRescuerData({
        area: areaTitle,
        summaryText:
          "Offline Mode: Use direct cellular emergency numbers 112 (Integrated Emergency), 108 (Ambulance), 1926 (Forest Helpline), or 101 (Fire). All verified NGO numbers below work offline.",
        sources: [],
        isFallback: true,
      });
      return;
    }

    setLoadingRescuers(true);
    setRescuerError(null);
    try {
      const res = await fetch("/api/local-rescuers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locality: activeLocality,
          city: activeCity,
          state: activeState,
          formattedAddress: coords.formattedAddress || "",
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to fetch local rescue contacts.");
      }
      setRescuerData(data as RescuerSearchResponse);
      localStorage.setItem(cacheKey, JSON.stringify(data));
      setLastQueryKey(`${activeLocality}|${activeCity}|${activeState}|${language}`);
    } catch (err) {
      const saved = localStorage.getItem(cacheKey);
      if (saved) {
        try {
          setRescuerData(JSON.parse(saved) as RescuerSearchResponse);
          return;
        } catch {
          // ignore
        }
      }
      setRescuerError(
        err instanceof Error
          ? err.message
          : "Could not load local wildlife rescuers. Use 112 / 108 / 1926 above."
      );
    } finally {
      setLoadingRescuers(false);
    }
  }, [activeLocality, activeCity, activeState, areaTitle, coords.formattedAddress, language]);

  useEffect(() => {
    if (!isOpen) return;
    const key = `${activeLocality}|${activeCity}|${activeState}|${language}`;
    if (key === lastQueryKey && rescuerData) return;
    fetchRescuers();
  }, [
    isOpen,
    activeLocality,
    activeCity,
    activeState,
    language,
    lastQueryKey,
    rescuerData,
    fetchRescuers,
  ]);

  if (!isOpen) return null;

  const detectedPhones = rescuerData
    ? extractPhoneLinks(rescuerData.summaryText)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.sosModalTitle}
    >
      <div
        className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#101A16] border border-slate-200 dark:border-emerald-900/50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Red Emergency Top Header */}
        <div className="bg-[#B42318] text-white px-6 py-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-100">
              <ShieldAlert className="w-4 h-4" />
              {areaTitle} · India Emergency
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold">
              {t.sosModalTitle}
            </h2>
            <p className="text-xs text-red-100/90">{t.sosModalSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close emergency dialog"
            className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Primary Pan-India Direct Dial Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <a
              href="tel:108"
              className="min-h-[68px] rounded-2xl bg-[#C82820] hover:bg-[#A61F18] text-white p-3.5 flex flex-col justify-between transition-colors shadow-sm"
            >
              <span className="text-[11px] font-semibold text-red-100">
                {t.ambulanceIndia}
              </span>
              <span className="font-mono-nums text-lg font-black flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4" /> 108
              </span>
            </a>

            <a
              href="tel:112"
              className="min-h-[68px] rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-900/60 dark:hover:bg-emerald-900 text-white p-3.5 flex flex-col justify-between transition-colors shadow-sm"
            >
              <span className="text-[11px] font-semibold text-slate-300">
                {t.nationalEmergency}
              </span>
              <span className="font-mono-nums text-lg font-black flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4" /> 112
              </span>
            </a>

            <a
              href="tel:1926"
              className="min-h-[68px] rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white p-3.5 flex flex-col justify-between transition-colors shadow-sm"
            >
              <span className="text-[11px] font-semibold text-emerald-100">
                {t.forestHelpline}
              </span>
              <span className="font-mono-nums text-lg font-black flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4" /> 1926
              </span>
            </a>

            <a
              href="tel:101"
              className="min-h-[68px] rounded-2xl bg-amber-600 hover:bg-amber-700 text-white p-3.5 flex flex-col justify-between transition-colors shadow-sm"
            >
              <span className="text-[11px] font-semibold text-amber-100">
                Fire &amp; Rescue
              </span>
              <span className="font-mono-nums text-lg font-black flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4" /> 101
              </span>
            </a>
          </div>

          {/* Nearest Real Hospital Card */}
          {nearestHospital && (
            <div className="rounded-2xl bg-emerald-50/80 dark:bg-[#0B1411] border border-emerald-200 dark:border-emerald-900/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Nearest Hospital ({nearestHospital.distanceKm} km)
                </p>
                <p className="font-display text-base font-bold text-slate-900 dark:text-white">
                  {nearestHospital.name}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {nearestHospital.address}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {nearestHospital.phone && (
                  <a
                    href={`tel:${nearestHospital.phone.replace(/[^+\d]/g, "")}`}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-[#C82820] hover:bg-[#A61F18] text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    {t.callNow}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRescueMap();
                  }}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Map
                </button>
              </div>
            </div>
          )}

          {/* Grounded Local Wildlife Rescuers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {t.localRescuersTitle} ({activeCity}, {activeState})
              </h3>
              <button
                type="button"
                onClick={fetchRescuers}
                disabled={loadingRescuers}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingRescuers ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>

            {loadingRescuers ? (
              <div className="rounded-2xl bg-slate-50 dark:bg-[#0B1411] p-4 text-xs text-slate-600 dark:text-slate-300">
                {t.loadingLocalRescuers}
              </div>
            ) : rescuerError ? (
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 text-xs text-amber-900 dark:text-amber-200">
                {rescuerError}
              </div>
            ) : rescuerData ? (
              <div className="rounded-2xl bg-slate-50 dark:bg-[#0B1411] border border-slate-200 dark:border-emerald-900/40 p-4 space-y-3">
                {detectedPhones.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {detectedPhones.map((phone) => (
                      <a
                        key={phone}
                        href={`tel:${phone}`}
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-mono-nums text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        {phone}
                      </a>
                    ))}
                  </div>
                )}

                <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                  {rescuerData.summaryText}
                </p>

                {rescuerData.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/70 dark:border-emerald-900/30">
                    {rescuerData.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {src.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Verified National & Major Metro Wildlife Helplines */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Verified Wildlife NGOs &amp; Forest Helplines
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {VERIFIED_INDIA_HELPLINES.slice(3).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-slate-50 dark:bg-[#0B1411] border border-slate-200/80 dark:border-emerald-900/30 p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.cityOrRegion}
                    </p>
                  </div>
                  <a
                    href={`tel:${item.phone}`}
                    className="shrink-0 min-h-[38px] px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    {t.callNow}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenRescueMap();
            }}
            className="w-full min-h-[48px] rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <MapPin className="w-4 h-4" />
            {t.shareGpsMap} ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
          </button>
        </div>
      </div>
    </div>
  );
}
