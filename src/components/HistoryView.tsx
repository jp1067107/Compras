import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react';
import { CATEGORY_LABEL_MAP, SavedShoppingList } from '../types/shopping';
import {
  computeItemSubtotal,
  formatBRL,
  formatDateTime,
  formatQty,
  roundMoney,
} from '../utils/format';

interface HistoryViewProps {
  history: SavedShoppingList[];
  activeEditingId: string | null;
  onEditSavedList: (list: SavedShoppingList) => void;
  onDuplicateSavedList: (list: SavedShoppingList) => void;
  onDeleteSavedList: (id: string) => void;
  onGoToCurrent: () => void;
}

export function HistoryView({
  history,
  activeEditingId,
  onEditSavedList,
  onDuplicateSavedList,
  onDeleteSavedList,
  onGoToCurrent,
}: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const cumulative = roundMoney(history.reduce((sum, entry) => sum + entry.totalAmount, 0));
    const average = history.length > 0 ? roundMoney(cumulative / history.length) : 0;
    return {
      count: history.length,
      cumulative,
      average,
    };
  }, [history]);

  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return history;
    return history.filter((entry) => {
      if (entry.title.toLowerCase().includes(q)) return true;
      return entry.items.some((item) => item.name.toLowerCase().includes(q));
    });
  }, [history, searchQuery]);

  if (history.length === 0) {
    return (
      <section className="bg-white dark:bg-[#151921] border border-[#DCE6F5] dark:border-[#252D3A] rounded-2xl px-6 py-16 text-center max-w-2xl mx-auto">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-[#1C2330] text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-5 h-5" aria-hidden="true" />
        </div>
        <h1 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
          Nenhuma compra salva ainda
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Quando terminar de somar seus produtos, clique em <strong className="font-medium text-slate-700 dark:text-slate-200">Salvar no histórico</strong> para consultar valores antigos ou editar suas listas depois.
        </p>
        <button
          type="button"
          onClick={onGoToCurrent}
          className="mt-6 min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors cursor-pointer"
        >
          Voltar para compra atual
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Aggregate Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Histórico de compras
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Consulte compras anteriores, reabra para editar ou duplique uma lista como base.
          </p>
        </div>

        <div className="relative sm:w-64">
          <Search
            className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar lista ou produto..."
            aria-label="Buscar no histórico de compras"
            className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#DCE6F5] dark:border-[#252D3A] bg-white dark:bg-[#151921] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
          />
        </div>
      </div>

      {/* Single-elevation horizontal KPI bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E6EEF9] dark:divide-[#232A36] bg-white dark:bg-[#151921] border border-[#DCE6F5] dark:border-[#252D3A] rounded-2xl">
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Compras salvas</p>
          <p className="mt-1 font-mono tabular-nums text-xl font-semibold text-slate-900 dark:text-slate-50">
            {stats.count}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total acumulado</p>
          <p className="mt-1 font-mono tabular-nums text-xl font-semibold text-blue-700 dark:text-blue-400">
            {formatBRL(stats.cumulative)}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Média por compra</p>
          <p className="mt-1 font-mono tabular-nums text-xl font-semibold text-slate-900 dark:text-slate-50">
            {formatBRL(stats.average)}
          </p>
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white dark:bg-[#151921] border border-[#DCE6F5] dark:border-[#252D3A] rounded-2xl px-6 py-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nenhuma compra encontrada para &ldquo;{searchQuery}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#151921] border border-[#DCE6F5] dark:border-[#252D3A] rounded-2xl divide-y divide-[#E6EEF9] dark:divide-[#232A36] overflow-hidden">
          {filteredHistory.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const isConfirmingDelete = confirmDeleteId === entry.id;
            const isCurrentlyEditing = activeEditingId === entry.id;

            const budgetOutcome =
              entry.budget !== null
                ? entry.totalAmount > entry.budget
                  ? `Acima do limite (${formatBRL(entry.budget)})`
                  : `Dentro do limite (${formatBRL(entry.budget)})`
                : null;

            return (
              <article key={entry.id} className="px-5 sm:px-6 py-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Title & Clean Unboxed Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {entry.title}
                      </h2>
                      {isCurrentlyEditing && (
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          Em edição
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatDateTime(entry.updatedAt)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {entry.items.length} {entry.items.length === 1 ? 'produto' : 'produtos'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {formatQty(entry.totalUnits)}{' '}
                        {entry.totalUnits === 1 ? 'unidade' : 'unidades'}
                      </span>
                      {budgetOutcome && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              entry.budget !== null && entry.totalAmount > entry.budget
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : 'text-slate-600 dark:text-slate-300'
                            }
                          >
                            {budgetOutcome}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Total & Actions */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 sm:gap-4 shrink-0">
                    <p className="font-mono tabular-nums text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50">
                      {formatBRL(entry.totalAmount)}
                    </p>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEditSavedList(entry)}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        Editar lista
                      </button>

                      <button
                        type="button"
                        onClick={() => onDuplicateSavedList(entry)}
                        title="Usar como nova lista"
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#DCE6F5] dark:border-[#2A3342] text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[#F4F7FC] dark:hover:bg-[#1E2532] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">Duplicar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Ocultar itens' : 'Ver itens da compra'}
                        className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg border border-[#DCE6F5] dark:border-[#2A3342] text-slate-600 dark:text-slate-300 hover:bg-[#F4F7FC] dark:hover:bg-[#1E2532] transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>

                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1 pl-1">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteSavedList(entry.id);
                              setConfirmDeleteId(null);
                            }}
                            className="min-h-[38px] px-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium cursor-pointer"
                          >
                            Excluir
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="min-h-[38px] px-2 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(entry.id)}
                          aria-label={`Excluir ${entry.title}`}
                          title="Excluir do histórico"
                          className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded item breakdown */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#E6EEF9] dark:border-[#232A36]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-[#E6EEF9] dark:border-[#232A36]">
                            <th className="pb-2 font-medium">Produto</th>
                            <th className="pb-2 font-medium text-right">Qtd × Unitário</th>
                            <th className="pb-2 font-medium text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EEF3FA] dark:divide-[#1E2430]">
                          {entry.items.map((item, idx) => (
                            <tr key={item.id}>
                              <td className="py-2.5 pr-4">
                                <span className="text-slate-900 dark:text-slate-100 font-medium">
                                  {item.name || `Produto ${String(idx + 1).padStart(2, '0')}`}
                                </span>
                                {item.category && (
                                  <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                                    · {CATEGORY_LABEL_MAP[item.category]}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {formatQty(item.quantity)} × {formatBRL(item.unitPrice)}
                              </td>
                              <td className="py-2.5 pl-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                {formatBRL(computeItemSubtotal(item))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
