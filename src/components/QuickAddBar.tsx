import React, { useMemo, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { CATEGORIES, CategoryId } from '../types/shopping';
import { formatBRL, parseLocaleNumber, roundMoney, roundQty } from '../utils/format';

interface QuickAddBarProps {
  onAddItem: (payload: {
    name: string;
    category: CategoryId;
    quantity: number;
    unitPrice: number;
  }) => void;
}

export function QuickAddBar({ onAddItem }: QuickAddBarProps) {
  const [quantityInput, setQuantityInput] = useState<string>('1');
  const [priceInput, setPriceInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [categoryInput, setCategoryInput] = useState<CategoryId>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const priceRef = useRef<HTMLInputElement>(null);

  const parsedQty = useMemo(() => parseLocaleNumber(quantityInput), [quantityInput]);
  const parsedPrice = useMemo(() => parseLocaleNumber(priceInput), [priceInput]);

  const liveSubtotal = useMemo(() => {
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) return 0;
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return 0;
    return roundMoney(parsedQty * parsedPrice);
  }, [parsedQty, parsedPrice]);

  const handleStepQuantity = (delta: number) => {
    const current = Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1;
    const next = roundQty(Math.max(1, current + delta));
    setQuantityInput(String(next).replace('.', ','));
    setErrorMessage(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const qty = parseLocaleNumber(quantityInput);
    const unitPrice = parseLocaleNumber(priceInput);

    if (!Number.isFinite(qty) || qty <= 0) {
      setErrorMessage('Informe uma quantidade maior que zero.');
      return;
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      setErrorMessage('Informe o valor unitário do produto em reais.');
      priceRef.current?.focus();
      return;
    }

    onAddItem({
      name: nameInput.trim(),
      category: categoryInput,
      quantity: roundQty(qty),
      unitPrice: roundMoney(unitPrice),
    });

    setQuantityInput('1');
    setPriceInput('');
    setNameInput('');
    setCategoryInput('');
    setErrorMessage(null);
    priceRef.current?.focus();
  };

  return (
    <section
      aria-label="Adicionar produto"
      className="bg-white dark:bg-[#151921] border border-[#DCE6F5] dark:border-[#252D3A] rounded-2xl p-5 sm:p-6"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Core Pair: Quantity (Left) × Unit Price (Right) */}
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.25fr)] gap-3 sm:gap-4 items-end">
          {/* Quantity Block */}
          <div>
            <label
              htmlFor="quick-qty"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Quantidade
            </label>
            <div className="flex items-center rounded-xl border border-[#C9DAF3] dark:border-[#2A3342] bg-[#F8FAFE] dark:bg-[#10141B] focus-within:border-blue-600 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-colors">
              <button
                type="button"
                onClick={() => handleStepQuantity(-1)}
                aria-label="Diminuir quantidade"
                className="min-w-[44px] min-h-[46px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-[#1A212D] rounded-l-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Minus className="w-4 h-4" aria-hidden="true" />
              </button>
              <input
                id="quick-qty"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={quantityInput}
                onChange={(e) => {
                  setQuantityInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                aria-label="Quantidade do produto"
                className="w-full min-w-0 h-[46px] bg-transparent text-center font-mono tabular-nums text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleStepQuantity(1)}
                aria-label="Aumentar quantidade"
                className="min-w-[44px] min-h-[46px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-[#1A212D] rounded-r-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Multiplication visual separator */}
          <div
            aria-hidden="true"
            className="hidden sm:flex h-[46px] items-center justify-center text-slate-400 dark:text-slate-500 font-mono text-base select-none"
          >
            ×
          </div>

          {/* Unit Price Block */}
          <div>
            <label
              htmlFor="quick-price"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Valor unitário
            </label>
            <div className="flex items-center rounded-xl border border-[#C9DAF3] dark:border-[#2A3342] bg-[#F8FAFE] dark:bg-[#10141B] focus-within:border-blue-600 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-colors">
              <span className="pl-3.5 pr-1.5 font-mono text-sm font-medium text-blue-700 dark:text-blue-400 select-none">
                R$
              </span>
              <input
                ref={priceRef}
                id="quick-price"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0,00"
                value={priceInput}
                onChange={(e) => {
                  setPriceInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="w-full min-w-0 h-[46px] pr-3.5 bg-transparent font-mono tabular-nums text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Optional Details: Product Name & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
          <div>
            <label
              htmlFor="quick-name"
              className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
            >
              Produto <span className="text-slate-400 dark:text-slate-500 font-normal">(opcional)</span>
            </label>
            <input
              id="quick-name"
              type="text"
              autoComplete="off"
              maxLength={80}
              placeholder="Ex: Café, Arroz 5kg, Detergente..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full h-[42px] px-3.5 rounded-xl border border-[#DCE6F5] dark:border-[#252D3A] bg-[#F8FAFE] dark:bg-[#10141B] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="quick-category"
              className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
            >
              Categoria <span className="text-slate-400 dark:text-slate-500 font-normal">(opcional)</span>
            </label>
            <select
              id="quick-category"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value as CategoryId)}
              className="w-full h-[42px] px-3 rounded-xl border border-[#DCE6F5] dark:border-[#252D3A] bg-[#F8FAFE] dark:bg-[#10141B] text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id || 'none'} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Item Subtotal Preview + Submit */}
        <div className="pt-2 border-t border-[#E6EEF9] dark:border-[#222936] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-baseline justify-between sm:justify-start gap-2.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Subtotal do item
            </span>
            <span className="font-mono tabular-nums text-lg font-semibold text-blue-700 dark:text-blue-400">
              {formatBRL(liveSubtotal)}
            </span>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 active:scale-[0.99] text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#151921]"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Adicionar produto
          </button>
        </div>

        {errorMessage && (
          <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        )}
      </form>
    </section>
  );
}
