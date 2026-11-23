import { Moon, Sun } from 'lucide-react';
import { ActiveTab, ThemeMode } from '../types/shopping';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  historyCount: number;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export function Header({
  activeTab,
  onTabChange,
  historyCount,
  theme,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 border-b border-[#DCE6F5] dark:border-[#232A36] bg-white/90 dark:bg-[#0E1116]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          type="button"
          onClick={() => onTabChange('current')}
          className="font-display text-lg sm:text-xl font-bold tracking-tight text-blue-700 dark:text-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
        >
          Somma
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav aria-label="Navegação principal" className="flex items-center gap-5 sm:gap-8 h-full">
          <button
            type="button"
            onClick={() => onTabChange('current')}
            aria-current={activeTab === 'current' ? 'page' : undefined}
            className={`relative h-full inline-flex items-center text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              activeTab === 'current'
                ? 'text-blue-700 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Compra atual
            {activeTab === 'current' && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('history')}
            aria-current={activeTab === 'history' ? 'page' : undefined}
            className={`relative h-full inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              activeTab === 'history'
                ? 'text-blue-700 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <span>Histórico</span>
            {historyCount > 0 && (
              <span className="font-mono tabular-nums text-xs text-slate-400 dark:text-slate-500">
                ({historyCount})
              </span>
            )}
            {activeTab === 'history' && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
              />
            )}
          </button>
        </nav>

        {/* Zone 3: Single theme action control */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3 sm:px-3.5 py-2 rounded-xl border border-[#DCE6F5] dark:border-[#272F3C] bg-[#F5F9FF] dark:bg-[#171C24] text-xs sm:text-sm font-medium text-blue-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-[#1F2632] transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Modo claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Modo escuro</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
