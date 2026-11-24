interface DangerScaleMeterProps {
  score: number;
  isVenomous: boolean;
  isPhysicallyDangerous?: boolean;
  riskType: string;
  venomousLabel?: string;
  nonVenomousLabel?: string;
  physicallyDangerousLabel?: string;
  compact?: boolean;
}

export function DangerScaleMeter({
  score,
  isVenomous,
  isPhysicallyDangerous = false,
  riskType,
  venomousLabel = "VENOMOUS",
  nonVenomousLabel = "NON-VENOMOUS",
  physicallyDangerousLabel = "HIGH PHYSICAL RISK",
  compact = false,
}: DangerScaleMeterProps) {
  const clamped = Math.max(0, Math.min(10, Math.round(score)));
  const isHighDanger = isVenomous || isPhysicallyDangerous || clamped >= 7;

  const badgeLabel = isVenomous
    ? venomousLabel
    : isPhysicallyDangerous
    ? physicallyDangerousLabel
    : nonVenomousLabel;

  const activeColor = isVenomous
    ? "bg-[#C82820]"
    : isPhysicallyDangerous || clamped >= 5
    ? "bg-amber-600 dark:bg-amber-500"
    : "bg-emerald-600 dark:bg-emerald-500";

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider ${
            isVenomous
              ? "text-[#B42318] dark:text-red-400"
              : isPhysicallyDangerous
              ? "text-amber-700 dark:text-amber-400"
              : "text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {badgeLabel}
        </span>
        <span className="font-mono-nums font-bold text-slate-700 dark:text-slate-200">
          {clamped}/10
        </span>
      </div>

      <div
        className="grid grid-cols-10 gap-1"
        role="img"
        aria-label={`Hazard score ${clamped} out of 10 (${riskType})`}
      >
        {Array.from({ length: 10 }, (_, idx) => {
          const filled = idx < clamped;
          return (
            <span
              key={idx}
              className={`h-2 rounded-sm transition-colors ${
                filled
                  ? isHighDanger && idx >= 6
                    ? "bg-[#C82820]"
                    : activeColor
                  : "bg-slate-200 dark:bg-slate-800"
              }`}
            />
          );
        })}
      </div>

      {!compact && (
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {riskType}
        </p>
      )}
    </div>
  );
}
