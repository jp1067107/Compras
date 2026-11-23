import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erro inesperado ao carregar a interface.',
    };
  }

  componentDidCatch(error: Error): void {
    console.error('Somma ErrorBoundary:', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndReload = () => {
    try {
      localStorage.removeItem('somma_active_draft_v1');
      localStorage.removeItem('somma_history_v1');
      localStorage.removeItem('somma_theme_v1');
    } catch {
      // Ignore storage access errors
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0E1116] text-[#F3F6FA]">
        <div className="w-full max-w-md rounded-2xl border border-[#252D3A] bg-[#151921] p-6 space-y-4">
          <h1 className="font-display text-lg font-bold text-white">
            Não foi possível exibir o Somma
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Ocorreu um erro inesperado ao abrir o aplicativo. Você pode recarregar a página ou redefinir os dados locais caso algum registro esteja corrompido.
          </p>
          {this.state.errorMessage && (
            <p className="text-xs font-mono text-slate-400 bg-[#0E1116] border border-[#252D3A] rounded-xl p-3 break-words">
              {this.state.errorMessage}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium cursor-pointer"
            >
              Recarregar página
            </button>
            <button
              type="button"
              onClick={this.handleResetAndReload}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-[#2D3748] text-slate-300 hover:bg-[#1E2532] text-sm font-medium cursor-pointer"
            >
              Limpar dados locais
            </button>
          </div>
        </div>
      </div>
    );
  }
}
