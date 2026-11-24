import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
        <WifiOff className="w-3.5 h-3.5 shrink-0" />
        <span>
          Offline Mode — Cached reptile Field Guide, visual specimen matching, First Aid &amp; 108/112/1926 emergency contacts remain active.
        </span>
      </div>
    </div>
  );
}
