import { useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onInstalled?: () => void;
}

export function PWAInstallButton({ onInstalled }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Automatically hide once running as an installed standalone PWA
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        onInstalled?.();
      }
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3.5 py-2 rounded-xl border border-[#C9DAF3] dark:border-[#2A3446] bg-[#F5F9FF] dark:bg-[#171D28] text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#1F2736] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Instalar app</span>
      </button>

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-[#DCE6F5] dark:border-[#273040] bg-white dark:bg-[#151921] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-[#1D2636] text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" aria-hidden="true" />
                </div>
                <h2
                  id="pwa-guide-title"
                  className="font-display text-base font-semibold text-slate-900 dark:text-slate-50"
                >
                  Instalar Somma no celular
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Fechar instruções"
                className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1F2633] cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              O Somma funciona em tela cheia como aplicativo nativo e continua operando mesmo sem internet dentro do mercado.
            </p>

            {isIOS ? (
              <ol className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300 pt-1">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                    01.
                  </span>
                  <span>
                    No Safari, toque no botão{' '}
                    <strong className="font-semibold text-slate-900 dark:text-white inline-flex items-center gap-1">
                      Compartilhar <Share className="w-3.5 h-3.5 inline" aria-hidden="true" />
                    </strong>{' '}
                    na barra inferior.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                    02.
                  </span>
                  <span>
                    Role as opções e toque em{' '}
                    <strong className="font-semibold text-slate-900 dark:text-white">
                      Adicionar à Tela de Início
                    </strong>
                    .
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                    03.
                  </span>
                  <span>
                    Confirme em{' '}
                    <strong className="font-semibold text-slate-900 dark:text-white">
                      Adicionar
                    </strong>{' '}
                    no canto superior direito.
                  </span>
                </li>
              </ol>
            ) : (
              <div className="space-y-3 pt-1 text-sm text-slate-700 dark:text-slate-300">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Android (Chrome ou Edge)
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Toque no menu do navegador (<strong className="text-slate-800 dark:text-slate-200">⋮</strong>) e selecione{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      Instalar aplicativo
                    </strong>{' '}
                    ou{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      Adicionar à tela inicial
                    </strong>
                    .
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#E6EEF9] dark:border-[#232A36] space-y-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    iPhone / iPad (Safari)
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Toque em <strong className="text-slate-800 dark:text-slate-200">Compartilhar</strong> e depois em{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      Adicionar à Tela de Início
                    </strong>
                    .
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
