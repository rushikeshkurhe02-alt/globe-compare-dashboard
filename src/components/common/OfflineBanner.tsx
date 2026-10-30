import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-500 px-4 py-2 text-xs font-medium text-center flex items-center justify-center gap-2">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>You are currently offline. Showing cached country data where available.</span>
    </div>
  );
}
