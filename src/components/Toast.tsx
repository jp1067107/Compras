import { X } from 'lucide-react';
import { ToastMessage } from '../types/shopping';

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-900 dark:bg-[#1E2634] text-white border border-slate-800 dark:border-[#303C50] shadow-lg shadow-slate-950/20">
        <p className="text-xs sm:text-sm font-medium leading-snug">{toast.text}</p>
        <div className="flex items-center gap-2 shrink-0">
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                onDismiss();
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              {toast.actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Fechar notificação"
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
