import React, { useMemo, useState } from 'react';
import { Check, Minus, Pencil, Plus, Search, ShoppingBag, Trash2, X } from 'lucide-react';
import { CATEGORIES, CATEGORY_LABEL_MAP, CategoryId, ShoppingItem } from '../types/shopping';
import {
  computeItemSubtotal,
  formatBRL,
  formatPriceForInput,
  formatQty,
  parseLocaleNumber,
  roundMoney,
  roundQty,
} from '../utils/format';

interface ItemListProps {
  items: ShoppingItem[];
  onStepQuantity: (id: string, delta: number) => void;
  onUpdateItem: (
    id: string,
    updates: { name: string; category: CategoryId; quantity: number; unitPrice: number }
  ) => void;
  onDeleteItem: (id: string) => void;
}

interface EditDraftState {
  name: string;
  category: CategoryId;
  quantity: string;
  unitPrice: string;
  error: string | null;
}

export function ItemList({
  items,
  onStepQuantity,
  onUpdateItem,
  onDeleteItem,
}: ItemListProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraftState | null>(null);

  // Assign stable display numbers for unnamed items based on creation order
  const fallbackNumberMap = useMemo(() => {
    const sorted = [...items].sort((a, b) => a.createdAt - b.createdAt);
    const map = new Map<string, number>();
    sorted.forEach((item, index) => {
      map.set(item.id, index + 1);
    });
    return map;
  }, [items]);

  const usedCategories = useMemo(() => {
    const set = new Set<CategoryId>();
    for (const item of items) {
      if (item.category) set.add(item.category);
    }
    return CATEGORIES.filter((cat) => cat.id !== '' && set.has(cat.id));
  }, [items]);

  const effectiveCategory =
    selectedCategory !== 'all' && !items.some((i) => i.category === selectedCategory)
      ? 'all'
      : selectedCategory;

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (effectiveCategory !== 'all' && item.category !== effectiveCategory) {
        return false;
      }
      if (!q) return true;
      const fallbackName = `produto ${String(fallbackNumberMap.get(item.id) ?? 1).padStart(2, '0')}`;
      const displayName = (item.name || fallbackName).toLowerCase();
      const catLabel = item.category ? CATEGORY_LABEL_MAP[item.category].toLowerCase() : '';
      return displayName.includes(q) || catLabel.includes(q);
    });
  }, [items, effectiveCategory, searchQuery, fallbackNumberMap]);

  const filteredSubtotal = useMemo(() => {
    return roundMoney(filteredItems.reduce((sum, item) => sum + computeItemSubtotal(item), 0));
  }, [filteredItems]);

  const startEditing = (item: ShoppingItem) => {
    setEditingId(item.id);
    setEditDraft({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity).replace('.', ','),
      unitPrice: formatPriceForInput(item.unitPrice),
      error: null,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const commitEditing = (id: string) => {
    if (!editDraft) return;
    const qty = parseLocaleNumber(editDraft.quantity);
    const price = parseLocaleNumber(editDraft.unitPrice);

    if (!Number.isFinite(qty) || qty <= 0) {
      setEditDraft({ ...editDraft, error: 'A quantidade deve ser maior que zero.' });
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setEditDraft({ ...editDraft, error: 'Informe um valor unitário válido.' });
      return;
    }

    onUpdateItem(id, {
      name: editDraft.name.trim(),
      category: editDraft.category,
      quantity: roundQty(qty),
      unitPrice: roundMoney(price),
    });
    setEditingId(null);
    setEditDraft(null);
  };

  const handleEditKeyDown = (event: React.KeyboardEvent, id: string) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      commitEditing(id);
    }
  };

  if (items.length === 0) {
    return (
      <section
        aria-label="Lista de produtos"
        className="bg-white dark:bg-[#151921] border border-[#DCE6F5] dark:border-[#252D3A] rounded-2xl px-6 py-12 text-center"
      >
        <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-[#1C2330] text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-5 h-5" aria-hidden="true" />
        </div>
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
          Sua lista está pronta
        </h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          Informe a quantidade de um lado e o valor unitário do outro para ver os subtotais e o total somando em tempo real.
        </p>
      </section>
    );
  }

  const isFiltered = effectiveCategory !== 'all' || searchQuery.trim().length > 0;

  return (
    <section
      aria-label="Produtos adicionados"
      className="bg-white dark:bg-[#151921] border border-[#DCE6F5] dark:border-[#252D3A] rounded-2xl overflow-hidden"
    >
      {/* List Header + Optional Filters */}
      <div className="px-5 sm:px-6 py-4 border-b border-[#E6EEF9] dark:border-[#232A36] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline gap-2.5">
            <h2 className="font-display text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
              Itens no carrinho
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {items.length} {items.length === 1 ? 'produto' : 'produtos'}
            </span>
          </div>

          {isFiltered && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Filtro:</span>
              <span className="font-mono tabular-nums font-medium text-blue-700 dark:text-blue-400">
                {formatBRL(filteredSubtotal)}
              </span>
            </div>
          )}
        </div>

        {(usedCategories.length > 0 || items.length >= 4) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {usedCategories.length > 0 && (
              <div
                role="tablist"
                aria-label="Filtrar por categoria"
                className="flex items-center gap-1 overflow-x-auto pb-0.5 -mx-1 px-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={effectiveCategory === 'all'}
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    effectiveCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-[#EDF3FD] dark:hover:bg-[#1E2532] hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Todos
                </button>
                {usedCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={effectiveCategory === cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      effectiveCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-[#EDF3FD] dark:hover:bg-[#1E2532] hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {items.length >= 4 && (
              <div className="relative sm:w-52 shrink-0">
                <Search
                  className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar item..."
                  aria-label="Buscar produto na lista"
                  className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#DCE6F5] dark:border-[#252D3A] bg-[#F8FAFE] dark:bg-[#10141B] text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Items Ledger */}
      {filteredItems.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nenhum item encontrado para esse filtro.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-[#E6EEF9] dark:divide-[#222936]">
          {filteredItems.map((item) => {
            const isEditing = editingId === item.id && editDraft !== null;
            const fallbackLabel = `Produto ${String(fallbackNumberMap.get(item.id) ?? 1).padStart(2, '0')}`;
            const displayName = item.name || fallbackLabel;
            const subtotal = computeItemSubtotal(item);

            if (isEditing && editDraft) {
              const editQtyParsed = parseLocaleNumber(editDraft.quantity);
              const editPriceParsed = parseLocaleNumber(editDraft.unitPrice);
              const editSubtotal =
                Number.isFinite(editQtyParsed) &&
                editQtyParsed > 0 &&
                Number.isFinite(editPriceParsed) &&
                editPriceParsed >= 0
                  ? roundMoney(editQtyParsed * editPriceParsed)
                  : 0;

              return (
                <li
                  key={item.id}
                  onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                  className="px-5 sm:px-6 py-4 bg-[#F5F9FF] dark:bg-[#1A202B] space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Nome do produto
                      </label>
                      <input
                        type="text"
                        value={editDraft.name}
                        onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                        placeholder={fallbackLabel}
                        className="w-full h-10 px-3 rounded-lg border border-[#C9DAF3] dark:border-[#2E3849] bg-white dark:bg-[#11151C] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Categoria
                      </label>
                      <select
                        value={editDraft.category}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, category: e.target.value as CategoryId })
                        }
                        className="w-full h-10 px-3 rounded-lg border border-[#C9DAF3] dark:border-[#2E3849] bg-white dark:bg-[#11151C] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.id || 'none'} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Quantidade
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editDraft.quantity}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, quantity: e.target.value, error: null })
                        }
                        className="w-full h-10 px-3 rounded-lg border border-[#C9DAF3] dark:border-[#2E3849] bg-white dark:bg-[#11151C] font-mono tabular-nums text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Valor unitário (R$)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editDraft.unitPrice}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, unitPrice: e.target.value, error: null })
                        }
                        className="w-full h-10 px-3 rounded-lg border border-[#C9DAF3] dark:border-[#2E3849] bg-white dark:bg-[#11151C] font-mono tabular-nums text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {editDraft.error && (
                    <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
                      {editDraft.error}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Novo subtotal:{' '}
                      <span className="font-mono tabular-nums font-semibold text-blue-700 dark:text-blue-400">
                        {formatBRL(editSubtotal)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-[#C9DAF3] dark:border-[#2E3849] text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-[#151921] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => commitEditing(item.id)}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        Salvar alteração
                      </button>
                    </div>
                  </div>
                </li>
              );
            }

            return (
              <li
                key={item.id}
                className="px-5 sm:px-6 py-4 hover:bg-[#F9FBFF] dark:hover:bg-[#191E28]/70 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Product Name & Clean Unboxed Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <p
                        className={`text-sm sm:text-[15px] font-medium truncate ${
                          item.name
                            ? 'text-slate-900 dark:text-slate-100'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {displayName}
                      </p>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono tabular-nums">
                        {formatBRL(item.unitPrice)} / un
                      </span>
                      {item.category && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{CATEGORY_LABEL_MAP[item.category]}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stepper + Subtotal + Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 shrink-0">
                    {/* Quick +/- quantity stepper */}
                    <div className="inline-flex items-center rounded-xl border border-[#DCE6F5] dark:border-[#272F3C] bg-[#F8FAFE] dark:bg-[#10141B]">
                      <button
                        type="button"
                        onClick={() => onStepQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                        aria-label={`Diminuir quantidade de ${displayName}`}
                        className="min-w-[40px] min-h-[40px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 disabled:opacity-35 disabled:cursor-not-allowed rounded-l-xl transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <span
                        aria-label="Quantidade"
                        className="min-w-[2.25rem] px-1.5 text-center font-mono tabular-nums text-sm font-semibold text-slate-900 dark:text-slate-100"
                      >
                        {formatQty(item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onStepQuantity(item.id, 1)}
                        aria-label={`Aumentar quantidade de ${displayName}`}
                        className="min-w-[40px] min-h-[40px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 rounded-r-xl transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Right-aligned Tabular Subtotal */}
                    <div className="min-w-[6.25rem] text-right">
                      <p className="font-mono tabular-nums text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-50">
                        {formatBRL(subtotal)}
                      </p>
                    </div>

                    {/* Edit & Remove buttons */}
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => startEditing(item)}
                        aria-label={`Editar ${displayName}`}
                        title="Editar produto"
                        className="min-w-[40px] min-h-[40px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#1E2532] transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        aria-label={`Remover ${displayName}`}
                        title="Remover produto"
                        className="min-w-[40px] min-h-[40px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
