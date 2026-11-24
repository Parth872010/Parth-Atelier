import { useEffect, useState } from "react";
import { AntidoteLogo } from "./AntidoteLogo";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(14);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setProgress(52), 260);
    const t2 = window.setTimeout(() => setProgress(86), 900);
    const t3 = window.setTimeout(() => setProgress(100), 1450);
    const t4 = window.setTimeout(() => setFading(true), 1850);
    const t5 = window.setTimeout(() => onComplete(), 2200);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
      window.clearTimeout(t5);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#081312] text-white px-6 transition-opacity duration-300 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 42%, rgba(16, 185, 129, 0.16) 0%, rgba(11, 27, 24, 0.92) 45%, #07100F 100%)",
      }}
      role="status"
      aria-label="Loading ANTIDOTE"
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <div className="mb-6">
          <AntidoteLogo size="lg" className="w-32 h-36 sm:w-36 sm:h-40" />
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black tracking-[0.08em] text-white">
          ANTIDOTE
        </h1>
        <p className="mt-2 text-xs sm:text-sm font-semibold tracking-[0.2em] text-emerald-200/85 uppercase">
          India Reptile Identifier &amp; Rescue
        </p>
        <div className="mt-10 w-52 space-y-2.5">
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] font-medium text-emerald-100/60">
            Preparing reptile field guide &amp; live GPS rescue
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFading(true);
            window.setTimeout(() => onComplete(), 220);
          }}
          className="mt-8 min-h-[44px] px-5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-200 transition-colors"
        >
          Open App
        </button>
      </div>
    </div>
  );
}
