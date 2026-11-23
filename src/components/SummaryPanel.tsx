import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BookmarkCheck,
  Check,
  CopyPlus,
  RotateCcw,
  Save,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { CATEGORY_LABEL_MAP, ShoppingItem } from '../types/shopping';
import {
  computeItemSubtotal,
  formatBRL,
  formatPriceForInput,
  formatQty,
  parseLocaleNumber,
  roundMoney,
} from '../utils/format';

interface SummaryPanelProps {
  items: ShoppingItem[];
  totalAmount: number;
  totalUnits: number;
  budget: number | null;
  isEditingSaved: boolean;
  onSetBudget: (budget: number | null) => void;
  onSaveList: () => void;
  onSaveAsNewList: () => void;
  onResetList: () => void;
}

export function SummaryPanel({
  items,
  totalAmount,
  totalUnits,
  budget,
  isEditingSaved,
  onSetBudget,
  onSaveList,
  onSaveAsNewList,
  onResetList,
}: SummaryPanelProps) {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState('');
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const openBudgetEditor = () => {
    setBudgetDraft(budget !== null ? formatPriceForInput(budget) : '');
    setBudgetError(null);
    setIsEditingBudget(true);
  };

  const handleSaveBudget = (event: React.FormEvent) => {
    event.preventDefault();
    const cleaned = budgetDraft.trim();
    if (!cleaned) {
      onSetBudget(null);
      setIsEditingBudget(false);
      setBudgetError(null);
      return;
    }

    const parsed = parseLocaleNumber(cleaned);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setBudgetError('Informe um limite maior que R$ 0,00.');
      return;
    }

    onSetBudget(roundMoney(parsed));
    setIsEditingBudget(false);
    setBudgetError(null);
  };

  const budgetMetrics = useMemo(() => {
    if (budget === null || budget <= 0) return null;
    const rawPct = (totalAmount / budget) * 100;
    const clampedPct = Math.min(100, Math.max(0, rawPct));
    const remaining = roundMoney(budget - totalAmount);
    const exceeded = roundMoney(totalAmount - budget);

    let status: 'ok' | 'warning' | 'exceeded' = 'ok';
    if (totalAmount > budget) {
      status = 'exceeded';
    } else if (rawPct >= 80) {
      status = 'warning';
    }

    return {
      rawPct: Math.round(rawPct),
      clampedPct,
      remaining,
      exceeded,
      status,
    };
  }, [budget, totalAmount]);

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of items) {
      const key = item.category || '__none__';
      totals.set(key, roundMoney((totals.get(key) ?? 0) + computeItemSubtotal(item)));
    }
    const entries = Array.from(totals.entries())
      .filter(([key, value]) => value > 0 && (key !== '__none__' || totals.size > 1))
      .map(([key, value]) => ({
        key,
        label:
          key === '__none__'
            ? 'Sem categoria'
            : CATEGORY_LABEL_MAP[key as keyof typeof CATEGORY_LABEL_MAP] || 'Outros',
        amount: value,
        pct: totalAmount > 0 ? Math.round((value / totalAmount) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return entries;
  }, [items, totalAmount]);

  return (
    <aside
      aria-label="Resumo da compra e orçamento"
      className="bg-white dark:bg-[#151921] border border-[#DCE6F5] dark:border-[#252D3A] rounded-2xl overflow-hidden lg:sticky lg:top-24"
    >
      {/* Hero Real-Time Total Block */}
      <div className="px-5 sm:px-6 py-5 sm:py-6 bg-blue-600 dark:bg-[#1A212E] text-white border-b border-blue-700/30 dark:border-[#263042]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-blue-100 dark:text-slate-400">
            Total em tempo real
          </span>
          {isEditingSaved && (
            <span className="text-xs font-medium text-blue-100 dark:text-blue-400">
              Editando lista salva
            </span>
          )}
        </div>

        <p
          aria-live="polite"
          className="mt-2 font-mono tabular-nums text-3xl sm:text-[2.125rem] leading-tight font-bold tracking-tight text-white"
        >
          {formatBRL(totalAmount)}
        </p>

        <div className="mt-2.5 flex items-center gap-2 text-xs text-blue-100/90 dark:text-slate-400 tabular-nums">
          <span>
            {items.length} {items.length === 1 ? 'produto' : 'produtos'}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {formatQty(totalUnits)} {totalUnits === 1 ? 'unidade' : 'unidades'}
          </span>
        </div>
      </div>

      {/* Budget Section */}
      <div className="px-5 sm:px-6 py-5 border-b border-[#E6EEF9] dark:border-[#222936]">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
            Limite de orçamento
          </h3>

          {!isEditingBudget && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openBudgetEditor}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                {budget !== null ? 'Alterar' : 'Definir limite'}
              </button>
              {budget !== null && (
                <button
                  type="button"
                  onClick={() => onSetBudget(null)}
                  className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                >
                  Remover
                </button>
              )}
            </div>
          )}
        </div>

        {isEditingBudget ? (
          <form onSubmit={handleSaveBudget} className="mt-3 space-y-2.5">
            <div className="flex items-center rounded-xl border border-[#C9DAF3] dark:border-[#2D3748] bg-[#F8FAFE] dark:bg-[#10141B] focus-within:border-blue-600 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
              <span className="pl-3 pr-1 font-mono text-xs font-medium text-blue-700 dark:text-blue-400">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                placeholder="Ex: 350,00"
                value={budgetDraft}
                onChange={(e) => {
                  setBudgetDraft(e.target.value);
                  if (budgetError) setBudgetError(null);
                }}
                aria-label="Valor limite do orçamento em reais"
                className="w-full h-10 pr-3 bg-transparent font-mono tabular-nums text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none"
              />
            </div>

            {budgetError && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                {budgetError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditingBudget(false);
                  setBudgetError(null);
                }}
                className="min-h-[36px] px-3 rounded-lg border border-[#DCE6F5] dark:border-[#2A3342] text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-[#F4F7FC] dark:hover:bg-[#1D2430] inline-flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[36px] px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                Aplicar
              </button>
            </div>
          </form>
        ) : budget !== null && budgetMetrics ? (
          <div className="mt-3 space-y-2.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Teto definido:{' '}
                <strong className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                  {formatBRL(budget)}
                </strong>
              </span>
              <span
                className={`font-mono tabular-nums font-semibold ${
                  budgetMetrics.status === 'exceeded'
                    ? 'text-red-600 dark:text-red-400'
                    : budgetMetrics.status === 'warning'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-blue-700 dark:text-blue-400'
                }`}
              >
                {budgetMetrics.rawPct}%
              </span>
            </div>

            {/* Progress bar track */}
            <div
              role="progressbar"
              aria-label="Progresso do orçamento"
              aria-valuenow={budgetMetrics.rawPct}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 w-full rounded-full bg-[#E5EEF9] dark:bg-[#232B38] overflow-hidden"
            >
              <div
                style={{ transform: `scaleX(${budgetMetrics.clampedPct / 100})` }}
                className={`h-full w-full origin-left transition-transform duration-200 ease-out rounded-full ${
                  budgetMetrics.status === 'exceeded'
                    ? 'bg-red-500'
                    : budgetMetrics.status === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-blue-600 dark:bg-blue-500'
                }`}
              />
            </div>

            {/* Dual-signal status text (never color alone) */}
            {budgetMetrics.status === 'exceeded' ? (
              <div className="flex items-start gap-2 pt-0.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="leading-snug">
                  <span className="font-semibold">Orçamento ultrapassado.</span> Excedido em{' '}
                  <span className="font-mono tabular-nums font-semibold">
                    {formatBRL(budgetMetrics.exceeded)}
                  </span>
                  .
                </p>
              </div>
            ) : budgetMetrics.status === 'warning' ? (
              <div className="flex items-start gap-2 pt-0.5 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="leading-snug">
                  <span className="font-semibold">Próximo do limite.</span> Restam{' '}
                  <span className="font-mono tabular-nums font-semibold">
                    {formatBRL(budgetMetrics.remaining)}
                  </span>
                  .
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Dentro do orçamento · Restam{' '}
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                  {formatBRL(budgetMetrics.remaining)}
                </span>
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Defina um teto em reais para acompanhar o gasto em tempo real e receber alertas ao se aproximar do limite.
          </p>
        )}
      </div>

      {/* Category Distribution (only when categories are used) */}
      {categoryBreakdown.length > 0 && (
        <div className="px-5 sm:px-6 py-4 border-b border-[#E6EEF9] dark:border-[#222936] space-y-2.5">
          <h3 className="font-display text-xs font-semibold text-slate-600 dark:text-slate-400">
            Resumo por categoria
          </h3>
          <ul className="space-y-2">
            {categoryBreakdown.slice(0, 5).map((cat) => (
              <li key={cat.key} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-slate-700 dark:text-slate-300 truncate">{cat.label}</span>
                  <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100 shrink-0">
                    {formatBRL(cat.amount)}
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-[#EDF3FD] dark:bg-[#212835] overflow-hidden">
                  <div
                    style={{ transform: `scaleX(${Math.max(0.03, cat.pct / 100)})` }}
                    className="h-full w-full origin-left bg-blue-600/80 dark:bg-blue-500/80 rounded-full transition-transform duration-200"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Save & List Lifecycle Actions */}
      <div className="px-5 sm:px-6 py-5 space-y-2.5">
        <button
          type="button"
          onClick={onSaveList}
          disabled={items.length === 0}
          className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {isEditingSaved ? (
            <>
              <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
              Atualizar lista salva
            </>
          ) : (
            <>
              <Save className="w-4 h-4" aria-hidden="true" />
              Salvar no histórico
            </>
          )}
        </button>

        {isEditingSaved && items.length > 0 && (
          <button
            type="button"
            onClick={onSaveAsNewList}
            className="w-full min-h-[42px] px-4 py-2 rounded-xl border border-[#C9DAF3] dark:border-[#2B3546] bg-[#F5F9FF] dark:bg-[#1B222E] hover:bg-blue-50 dark:hover:bg-[#222B3A] text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <CopyPlus className="w-4 h-4" aria-hidden="true" />
            Salvar como nova compra
          </button>
        )}

        {items.length > 0 && (
          <div className="pt-1">
            {confirmingReset ? (
              <div className="p-3 rounded-xl border border-[#DCE6F5] dark:border-[#2A3342] bg-[#F8FAFE] dark:bg-[#10141B] space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Iniciar uma nova lista vazia? Os itens atuais não salvos serão limpos.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingReset(false)}
                    className="min-h-[34px] px-3 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#1A202B] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onResetList();
                      setConfirmingReset(false);
                    }}
                    className="min-h-[34px] px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium cursor-pointer"
                  >
                    Confirmar limpeza
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingReset(true)}
                className="w-full min-h-[40px] px-4 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-[#F4F7FC] dark:hover:bg-[#1C222D] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Nova lista em branco
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
