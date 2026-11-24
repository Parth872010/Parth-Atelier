import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  Camera,
  Upload,
  AlertTriangle,
  MapPin,
  PhoneCall,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  X,
  Stethoscope,
} from "lucide-react";
import { SafeImage } from "./SafeImage";
import { DangerScaleMeter } from "./DangerScaleMeter";
import { INDIAN_REPTILES } from "../data/reptiles";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import type {
  CoordsState,
  LanguageCode,
  ReptileSpecies,
  ScanResult,
} from "../types";
import type { UITranslations } from "../i18n/translations";

interface ScannerViewProps {
  t: UITranslations;
  language: LanguageCode;
  coords: CoordsState;
  scanResult: ScanResult | null;
  pendingFile: File | null;
  autoOpenCamera: boolean;
  onCameraTriggerHandled: () => void;
  onClearPendingFile: () => void;
  onResultReady: (result: ScanResult | null) => void;
  onFindNearestHospital: () => void;
  onOpenEmergencyModal: () => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

export function ScannerView({
  t,
  language,
  coords,
  scanResult,
  pendingFile,
  autoOpenCamera,
  onCameraTriggerHandled,
  onClearPendingFile,
  onResultReady,
  onFindNearestHospital,
  onOpenEmergencyModal,
}: ScannerViewProps) {
  const isOnline = useOnlineStatus();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const analyzeImageDataUrl = useCallback(
    async (dataUrl: string, mimeType = "image/jpeg") => {
      if (!navigator.onLine) {
        setPreviewUrl(dataUrl);
        setAnalysisError(
          "No cellular/internet connection for cloud AI scan. Compare your photo side-by-side with the cached Indian reptile cards on the right, or call 108 / 112 immediately."
        );
        return;
      }

      setAnalyzing(true);
      setAnalysisError(null);
      setPreviewUrl(dataUrl);

      try {
        const res = await fetch("/api/identify-reptile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: dataUrl,
            mimeType,
            language,
            city: coords.city || "",
            state: coords.state || "",
          }),
        });

        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload?.error || "Reptile identification failed.");
        }

        const result: ScanResult = {
          isReptileDetected: Boolean(payload.isReptileDetected),
          category: payload.category || "snake",
          commonName: payload.commonName || "Unknown Reptile",
          localIndianNames: payload.localIndianNames || "",
          scientificName: payload.scientificName || "Reptilia sp.",
          imageUrl: dataUrl,
          confidencePercent: Number(payload.confidencePercent) || 0,
          isVenomous: Boolean(payload.isVenomous),
          isPhysicallyDangerous: Boolean(payload.isPhysicallyDangerous),
          dangerScale: Number(payload.dangerScale) || 5,
          venomOrRiskType:
            payload.venomOrRiskType || "Treat with caution until verified",
          wpaSchedule: payload.wpaSchedule || "Protected under WPA 1972",
          conservationStatus: payload.conservationStatus || "Indian Fauna",
          indianHabitatZones: payload.indianHabitatZones || "India",
          summary: payload.summary || "",
          identifyingFeatures: Array.isArray(payload.identifyingFeatures)
            ? payload.identifyingFeatures
            : [],
          threatsAndBehavior: Array.isArray(payload.threatsAndBehavior)
            ? payload.threatsAndBehavior
            : [],
          lookAlikeNote: payload.lookAlikeNote || "",
          immediateAction:
            payload.immediateAction ||
            "Maintain safe distance and contact local rescue.",
          hospitalPrepNote: payload.hospitalPrepNote || "",
          source: "ai-vision",
        };
        onResultReady(result);
      } catch (err) {
        setAnalysisError(
          err instanceof Error
            ? err.message
            : "Unable to complete AI reptile analysis."
        );
      } finally {
        setAnalyzing(false);
      }
    },
    [coords.city, coords.state, language, onResultReady]
  );

  useEffect(() => {
    if (!pendingFile) return;
    let cancelled = false;
    readFileAsDataUrl(pendingFile)
      .then((dataUrl) => {
        if (!cancelled) {
          stopCamera();
          analyzeImageDataUrl(dataUrl, pendingFile.type || "image/jpeg");
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setAnalysisError(
            e instanceof Error ? e.message : "Failed to read file."
          );
        }
      })
      .finally(() => {
        onClearPendingFile();
      });
    return () => {
      cancelled = true;
    };
  }, [pendingFile, onClearPendingFile, analyzeImageDataUrl, stopCamera]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setAnalysisError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "Live camera access is unavailable in this browser. Please upload a photo instead."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      onResultReady(null);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 60);
    } catch {
      setCameraError(
        "Camera permission was blocked or no rear camera was detected. You can upload a photo from your device."
      );
      setCameraOpen(false);
    }
  }, [onResultReady]);

  // Contextual auto-open camera when user taps "Scan" CTA or nav button
  useEffect(() => {
    if (autoOpenCamera) {
      onCameraTriggerHandled();
      if (!scanResult && !analyzing) {
        startCamera();
      }
    }
  }, [
    autoOpenCamera,
    onCameraTriggerHandled,
    scanResult,
    analyzing,
    startCamera,
  ]);

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    stopCamera();
    analyzeImageDataUrl(dataUrl, "image/jpeg");
  };

  const handleUploadChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    stopCamera();
    const dataUrl = await readFileAsDataUrl(file);
    await analyzeImageDataUrl(dataUrl, file.type || "image/jpeg");
  };

  const handleLoadSample = (species: ReptileSpecies) => {
    stopCamera();
    setAnalysisError(null);
    setPreviewUrl(species.imageUrl);
    onResultReady({
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
        ? "Requires immediate hospital assessment and Indian Polyvalent Anti-Snake Venom (ASV) availability check."
        : species.isPhysicallyDangerous
        ? "Non-venomous; heavy jaw/claw trauma requires immediate ER wound care and tetanus prophylaxis."
        : "Harmless species. No anti-venom needed; clean minor scratches with soap and water.",
      source: "sample",
    });
  };

  const resetScanner = () => {
    stopCamera();
    onResultReady(null);
    setPreviewUrl(null);
    setAnalysisError(null);
  };

  const sampleButtons = isOnline
    ? INDIAN_REPTILES.filter((_, idx) => [0, 1, 8, 10, 12].includes(idx))
    : INDIAN_REPTILES.slice(0, 8);

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {t.scannerTitle}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {t.scannerSubtitle}
          </p>
        </div>

        {(scanResult || previewUrl || cameraOpen) && (
          <button
            type="button"
            onClick={resetScanner}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 dark:border-emerald-900/50 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-emerald-950/40 inline-flex items-center gap-2 self-start cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            {t.scanAnother}
          </button>
        )}
      </div>

      {/* Camera / Upload / Analyzing View */}
      {!scanResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-3xl bg-white dark:bg-[#111C18] border border-slate-200/80 dark:border-emerald-900/40 p-5 sm:p-7 space-y-5 shadow-sm">
            {cameraOpen ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[16/10]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 bg-black/60 backdrop-blur-md rounded-2xl p-3">
                    <span className="text-xs font-medium text-emerald-100">
                      Stay 3+ meters back &amp; zoom cleanly
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        {t.cancel}
                      </button>
                      <button
                        type="button"
                        onClick={captureFromCamera}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#071A12] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        {t.captureAndIdentify}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : analyzing ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                {previewUrl && (
                  <div className="w-44 h-32 rounded-2xl overflow-hidden border border-emerald-500/40 shadow-md">
                    <img
                      src={previewUrl}
                      alt="Analyzing reptile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="w-9 h-9 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin" />
                <div>
                  <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    Analyzing Indian Reptile Features...
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Checking scale pattern, head shields, risk score &amp; WPA 1972 status
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-emerald-900/60 bg-slate-50/70 dark:bg-[#0B1411] p-8 sm:p-12 text-center space-y-5">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Camera className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    Identify Snakes, Lizards, Crocodiles &amp; Tortoises
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    Never approach or handle an unknown reptile. Capture from distance or upload an existing photo.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="min-h-[46px] px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    {t.openLiveCamera}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[46px] px-5 py-2.5 rounded-xl bg-white dark:bg-[#14231E] border border-slate-300 dark:border-emerald-900/50 hover:bg-slate-100 dark:hover:bg-emerald-950/60 text-slate-800 dark:text-emerald-100 font-semibold text-sm inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    {t.uploadEncounterPhoto}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadChange}
                  className="hidden"
                />
              </div>
            )}

            {cameraError && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}

            {analysisError && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3.5 text-xs text-red-800 dark:text-red-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{analysisError}</span>
              </div>
            )}
          </div>

          {/* Quick Specimens Sidebar */}
          <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-[#111C18] border border-slate-200/80 dark:border-emerald-900/40 p-5 space-y-3.5 shadow-sm">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Quick Sample Specimens
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Preview full identification reports across Indian reptile classes
            </p>
            <div className="space-y-2.5">
              {sampleButtons.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => handleLoadSample(sp)}
                  className="w-full min-h-[56px] p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-[#0B1411] dark:hover:bg-emerald-950/50 border border-slate-200/80 dark:border-emerald-900/30 flex items-center gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <SafeImage
                      src={sp.imageUrl}
                      alt={sp.commonName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {sp.commonName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                      {sp.category} · {sp.dangerScale}/10 hazard
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analysis Result Card */}
      {scanResult && (
        <div className="rounded-3xl bg-white dark:bg-[#111C18] border border-slate-200/80 dark:border-emerald-900/40 overflow-hidden shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-5 bg-slate-100 dark:bg-[#0B1411] relative min-h-[260px]">
              <SafeImage
                src={scanResult.imageUrl}
                alt={scanResult.commonName}
                className="w-full h-full object-cover max-h-[420px]"
              />
            </div>

            <div className="lg:col-span-7 p-6 sm:p-8 space-y-5">
              {!scanResult.isReptileDetected && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    No clear reptile detected in frame. Always assume hidden grass or debris could conceal wildlife and capture a clearer zoomed shot if safe.
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  {scanResult.category} · {scanResult.confidencePercent}% Match ·{" "}
                  {scanResult.wpaSchedule}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {scanResult.commonName}
                </h2>
                <p className="text-sm italic text-slate-500 dark:text-slate-400">
                  {scanResult.scientificName}
                  {scanResult.localIndianNames
                    ? ` · ${scanResult.localIndianNames}`
                    : ""}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-[#0B1411] p-4 border border-slate-200/70 dark:border-emerald-900/30">
                <DangerScaleMeter
                  score={scanResult.dangerScale}
                  isVenomous={scanResult.isVenomous}
                  isPhysicallyDangerous={scanResult.isPhysicallyDangerous}
                  riskType={scanResult.venomOrRiskType}
                  venomousLabel={t.venomousLabel}
                  nonVenomousLabel={t.nonVenomousLabel}
                  physicallyDangerousLabel={t.physicallyDangerousLabel}
                />
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {scanResult.summary}
              </p>

              {/* Immediate Action Banner */}
              <div
                className={`rounded-2xl p-4 space-y-1.5 ${
                  scanResult.isVenomous || scanResult.dangerScale >= 7
                    ? "bg-red-50 dark:bg-red-950/35 border border-red-200 dark:border-red-900/60"
                    : "bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-900/60"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  <ShieldAlert className="w-4 h-4 text-[#C82820] dark:text-red-400" />
                  Immediate Field Action
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {scanResult.immediateAction}
                </p>
              </div>

              {scanResult.hospitalPrepNote && (
                <div className="rounded-2xl bg-slate-50 dark:bg-[#0B1411] border border-slate-200/70 dark:border-emerald-900/30 p-4 flex items-start gap-3">
                  <Stethoscope className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong className="text-slate-900 dark:text-white">
                      Medical Note:
                    </strong>{" "}
                    {scanResult.hospitalPrepNote}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Key Identifying Features
                  </h3>
                  <ul className="space-y-1.5">
                    {scanResult.identifyingFeatures.map((feat, i) => (
                      <li
                        key={i}
                        className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Look-Alike &amp; Indian Distribution
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                    {scanResult.lookAlikeNote}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <strong>Regions:</strong> {scanResult.indianHabitatZones}
                  </p>
                </div>
              </div>

              {/* Contextual Direct Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/80 dark:border-emerald-900/40">
                <button
                  type="button"
                  onClick={onFindNearestHospital}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  Find Nearest Hospital on Map
                </button>
                <button
                  type="button"
                  onClick={onOpenEmergencyModal}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#C82820] hover:bg-[#A61F18] text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  Call Local Rescuers / 108
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
