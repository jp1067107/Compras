import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-amber-500/25 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 text-xs font-medium">
        <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <span>
          Modo offline ativo · Suas compras continuam funcionando e sendo salvas normalmente no aparelho.
        </span>
      </div>
    </div>
  );
}
