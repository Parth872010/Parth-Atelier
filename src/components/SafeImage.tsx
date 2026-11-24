import { useState } from "react";
import { Compass } from "lucide-react";

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function SafeImage({ src, alt, className = "" }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#113828] via-[#0E291D] to-[#081912] text-emerald-100/90 p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Compass className="w-7 h-7 mb-2 text-emerald-400/90" />
        <span className="text-xs font-semibold text-center line-clamp-2 max-w-[90%]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
