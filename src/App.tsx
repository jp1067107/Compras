import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, Check, Pencil } from 'lucide-react';
import { Header } from './components/Header';
import { HistoryView } from './components/HistoryView';
import { ItemList } from './components/ItemList';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { QuickAddBar } from './components/QuickAddBar';
import { SummaryPanel } from './components/SummaryPanel';
import { Toast } from './components/Toast';
import {
  ActiveDraft,
  ActiveTab,
  CategoryId,
  SavedShoppingList,
  ShoppingItem,
  ThemeMode,
  ToastMessage,
} from './types/shopping';
import {
  computeListTotal,
  computeTotalUnits,
  formatBRL,
  formatQty,
  generateId,
  getDefaultListTitle,
  roundMoney,
  roundQty,
} from './utils/format';
import {
  createEmptyDraft,
  loadActiveDraft,
  loadHistory,
  loadTheme,
  parseBackup,
  saveActiveDraft,
  saveHistory,
  saveTheme,
  serializeBackup,
} from './utils/storage';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
  const [activeTab, setActiveTab] = useState<ActiveTab>('current');
  const [draft, setDraft] = useState<ActiveDraft>(() => loadActiveDraft());
  const [history, setHistory] = useState<SavedShoppingList[]>(() => loadHistory());

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(draft.title);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const toastTimerRef = useRef<number | null>(null);

  // Sync theme to <html class="dark">, mobile browser theme-color, and localStorage
  useEffect(() => {
    const root = document.documentElement;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (theme === 'dark') {
      root.classList.add('dark');
      if (metaTheme) metaTheme.setAttribute('content', '#0E1116');
    } else {
      root.classList.remove('dark');
      if (metaTheme) metaTheme.setAttribute('content', '#2563EB');
    }
    saveTheme(theme);
  }, [theme]);

  // Persist draft and history automatically
  useEffect(() => {
    saveActiveDraft(draft);
  }, [draft]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // Cleanup toast timer
  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback(
    (text: string, options?: { actionLabel?: string; onAction?: () => void }) => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      const id = generateId();
      setToast({
        id,
        text,
        actionLabel: options?.actionLabel,
        onAction: options?.onAction,
      });
      toastTimerRef.current = window.setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const totalAmount = useMemo(() => computeListTotal(draft.items), [draft.items]);
  const totalUnits = useMemo(() => computeTotalUnits(draft.items), [draft.items]);

  const mobileBudgetState = useMemo(() => {
    if (draft.budget === null || draft.budget <= 0) return null;
    const rawPct = (totalAmount / draft.budget) * 100;
    const clampedPct = Math.min(100, Math.max(0, rawPct));
    const status = totalAmount > draft.budget ? 'exceeded' : rawPct >= 80 ? 'warning' : 'ok';
    return {
      rawPct: Math.round(rawPct),
      clampedPct,
      status,
      remaining: roundMoney(draft.budget - totalAmount),
      exceeded: roundMoney(totalAmount - draft.budget),
    };
  }, [draft.budget, totalAmount]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleStartTitleEdit = () => {
    setTitleInput(draft.title);
    setIsEditingTitle(true);
  };

  const handleCommitTitle = () => {
    const trimmed = titleInput.trim();
    setDraft((prev) => ({
      ...prev,
      title: trimmed || getDefaultListTitle(),
    }));
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCommitTitle();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setTitleInput(draft.title);
      setIsEditingTitle(false);
    }
  };

  const handleAddItem = (payload: {
    name: string;
    category: CategoryId;
    quantity: number;
    unitPrice: number;
  }) => {
    const newItem: ShoppingItem = {
      id: generateId(),
      name: payload.name,
      category: payload.category,
      quantity: payload.quantity,
      unitPrice: payload.unitPrice,
      createdAt: Date.now(),
    };
    setDraft((prev) => ({
      ...prev,
      items: [newItem, ...prev.items],
    }));
  };

  const handleStepQuantity = (id: string, delta: number) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item;
        const nextQty = roundQty(Math.max(1, item.quantity + delta));
        return { ...item, quantity: nextQty };
      }),
    }));
  };

  const handleUpdateItem = (
    id: string,
    updates: { name: string; category: CategoryId; quantity: number; unitPrice: number }
  ) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id
          ? {
              ...item,
              name: updates.name,
              category: updates.category,
              quantity: updates.quantity,
              unitPrice: updates.unitPrice,
            }
          : item
      ),
    }));
    showToast('Produto atualizado.');
  };

  const handleDeleteItem = (id: string) => {
    const index = draft.items.findIndex((item) => item.id === id);
    if (index === -1) return;
    const removed = draft.items[index];

    setDraft((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));

    showToast(removed.name ? `"${removed.name}" removido.` : 'Produto removido.', {
      actionLabel: 'Desfazer',
      onAction: () => {
        setDraft((prev) => {
          if (prev.items.some((i) => i.id === removed.id)) return prev;
          const next = [...prev.items];
          const insertAt = Math.min(index, next.length);
          next.splice(insertAt, 0, removed);
          return { ...prev, items: next };
        });
      },
    });
  };

  const handleSetBudget = (budget: number | null) => {
    setDraft((prev) => ({ ...prev, budget }));
    showToast(budget !== null ? `Orçamento definido em ${formatBRL(budget)}.` : 'Limite de orçamento removido.');
  };

  const handleSaveList = () => {
    if (draft.items.length === 0) return;

    const now = Date.now();
    const cleanTitle = draft.title.trim() || getDefaultListTitle();
    const clonedItems = draft.items.map((item) => ({ ...item }));
    const total = computeListTotal(clonedItems);
    const units = computeTotalUnits(clonedItems);

    if (draft.editingHistoryId) {
      const exists = history.some((entry) => entry.id === draft.editingHistoryId);
      if (exists) {
        setHistory((prev) =>
          prev
            .map((entry) =>
              entry.id === draft.editingHistoryId
                ? {
                    ...entry,
                    title: cleanTitle,
                    updatedAt: now,
                    budget: draft.budget,
                    items: clonedItems,
                    totalAmount: total,
                    totalUnits: units,
                  }
                : entry
            )
            .sort((a, b) => b.updatedAt - a.updatedAt)
        );
        showToast(`Lista "${cleanTitle}" atualizada no histórico.`);
        return;
      }
    }

    const newRecord: SavedShoppingList = {
      id: generateId(),
      title: cleanTitle,
      savedAt: now,
      updatedAt: now,
      budget: draft.budget,
      items: clonedItems,
      totalAmount: total,
      totalUnits: units,
    };

    setHistory((prev) => [newRecord, ...prev]);
    setDraft((prev) => ({
      ...prev,
      title: cleanTitle,
      editingHistoryId: newRecord.id,
    }));
    showToast(`Compra "${cleanTitle}" salva no histórico.`);
  };

  const handleSaveAsNewList = () => {
    if (draft.items.length === 0) return;

    const now = Date.now();
    const baseTitle = draft.title.trim() || getDefaultListTitle();
    const newTitle = `${baseTitle} (cópia)`;
    const clonedItems = draft.items.map((item) => ({ ...item, id: generateId() }));
    const total = computeListTotal(clonedItems);
    const units = computeTotalUnits(clonedItems);

    const newRecord: SavedShoppingList = {
      id: generateId(),
      title: newTitle,
      savedAt: now,
      updatedAt: now,
      budget: draft.budget,
      items: clonedItems,
      totalAmount: total,
      totalUnits: units,
    };

    setHistory((prev) => [newRecord, ...prev]);
    setDraft((prev) => ({
      ...prev,
      title: newTitle,
      editingHistoryId: newRecord.id,
      items: clonedItems,
    }));
    showToast(`Salva como nova compra "${newTitle}".`);
  };

  const handleResetList = () => {
    const fresh = createEmptyDraft();
    setDraft(fresh);
    setTitleInput(fresh.title);
    setIsEditingTitle(false);
    showToast('Nova lista em branco iniciada.');
  };

  const handleCancelEditingSaved = () => {
    setDraft((prev) => ({
      ...prev,
      editingHistoryId: null,
    }));
    showToast('Desvinculado do histórico. Agora é um novo rascunho.');
  };

  const handleEditSavedList = (saved: SavedShoppingList) => {
    const loaded: ActiveDraft = {
      editingHistoryId: saved.id,
      title: saved.title,
      budget: saved.budget,
      items: saved.items.map((item) => ({ ...item })),
    };
    setDraft(loaded);
    setTitleInput(loaded.title);
    setIsEditingTitle(false);
    setActiveTab('current');
    showToast(`Editando "${saved.title}".`);
  };

  const handleDuplicateSavedList = (saved: SavedShoppingList) => {
    const duplicatedTitle = `${saved.title} (nova)`;
    const loaded: ActiveDraft = {
      editingHistoryId: null,
      title: duplicatedTitle,
      budget: saved.budget,
      items: saved.items.map((item) => ({ ...item, id: generateId() })),
    };
    setDraft(loaded);
    setTitleInput(duplicatedTitle);
    setIsEditingTitle(false);
    setActiveTab('current');
    showToast(`Lista duplicada como novo rascunho.`);
  };

  const handleDeleteSavedList = (id: string) => {
    const target = history.find((entry) => entry.id === id);
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
    if (draft.editingHistoryId === id) {
      setDraft((prev) => ({ ...prev, editingHistoryId: null }));
    }
    showToast(target ? `"${target.title}" removida do histórico.` : 'Compra removida do histórico.');
  };

  const handleExportBackup = () => {
    try {
      const json = serializeBackup(draft, history);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `somma-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Backup exportado com sucesso.');
    } catch {
      showToast('Não foi possível exportar o arquivo de backup.');
    }
  };

  const handleImportBackup = (jsonText: string) => {
    const restored = parseBackup(jsonText);
    if (!restored) {
      showToast('Arquivo de backup inválido.');
      return;
    }
    setDraft(restored.draft);
    setTitleInput(restored.draft.title);
    setHistory(restored.history);
    showToast(
      `Backup restaurado (${restored.history.length} ${
        restored.history.length === 1 ? 'compra' : 'compras'
      } no histórico).`
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        historyCount={history.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <OfflineIndicator />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'current' ? (
          <div className="space-y-6">
            {/* Editable Active List Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 max-w-md">
                    <input
                      type="text"
                      autoFocus
                      maxLength={60}
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      onBlur={handleCommitTitle}
                      onKeyDown={handleTitleKeyDown}
                      aria-label="Nome da lista de compras"
                      className="w-full h-10 px-3 rounded-xl border border-blue-600 dark:border-blue-500 bg-white dark:bg-[#151921] font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleCommitTitle}
                      aria-label="Confirmar nome da lista"
                      className="min-w-[40px] min-h-[40px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Check className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 truncate">
                      {draft.title}
                    </h1>
                    <button
                      type="button"
                      onClick={handleStartTitleEdit}
                      aria-label="Renomear lista atual"
                      title="Renomear lista"
                      className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#1C222D] transition-colors shrink-0 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {draft.editingHistoryId && (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Editando compra salva do histórico</span>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={handleCancelEditingSaved}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                    >
                      Desvincular como nova
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center shrink-0">
                <PWAInstallButton
                  onInstalled={() => showToast('Somma instalado no seu aparelho.')}
                />
              </div>
            </div>

            {/* Mobile Real-Time Total Glance Bar (keeps live sum visible right above inputs on smartphones) */}
            <div className="lg:hidden rounded-2xl bg-blue-600 dark:bg-[#171E2A] border border-blue-700/20 dark:border-[#263042] px-5 py-4 text-white">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-xs text-blue-100 dark:text-slate-400">Total em tempo real</p>
                  <p
                    aria-live="polite"
                    className="mt-0.5 font-mono tabular-nums text-2xl font-bold tracking-tight text-white"
                  >
                    {formatBRL(totalAmount)}
                  </p>
                </div>
                <div className="text-right text-xs text-blue-100/90 dark:text-slate-400 tabular-nums">
                  <p>
                    {draft.items.length} {draft.items.length === 1 ? 'produto' : 'produtos'}
                  </p>
                  <p>
                    {formatQty(totalUnits)} {totalUnits === 1 ? 'unidade' : 'unidades'}
                  </p>
                </div>
              </div>

              {mobileBudgetState && draft.budget !== null && (
                <div className="mt-3 pt-3 border-t border-white/15 dark:border-[#252F40] space-y-1.5">
                  <div className="h-1.5 w-full rounded-full bg-white/20 dark:bg-[#252F40] overflow-hidden">
                    <div
                      style={{ transform: `scaleX(${mobileBudgetState.clampedPct / 100})` }}
                      className={`h-full w-full origin-left rounded-full transition-transform duration-200 ${
                        mobileBudgetState.status === 'exceeded'
                          ? 'bg-red-300 dark:bg-red-500'
                          : mobileBudgetState.status === 'warning'
                          ? 'bg-amber-300 dark:bg-amber-400'
                          : 'bg-white dark:bg-blue-400'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-blue-50 dark:text-slate-300">
                      {mobileBudgetState.status === 'exceeded' ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-red-200 dark:text-red-400" aria-hidden="true" />
                          Excedido em{' '}
                          <strong className="font-mono tabular-nums">
                            {formatBRL(mobileBudgetState.exceeded)}
                          </strong>
                        </>
                      ) : mobileBudgetState.status === 'warning' ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-200 dark:text-amber-400" aria-hidden="true" />
                          Restam{' '}
                          <strong className="font-mono tabular-nums">
                            {formatBRL(mobileBudgetState.remaining)}
                          </strong>
                        </>
                      ) : (
                        <>
                          Restam{' '}
                          <strong className="font-mono tabular-nums">
                            {formatBRL(mobileBudgetState.remaining)}
                          </strong>
                        </>
                      )}
                    </span>
                    <span className="font-mono tabular-nums text-blue-100 dark:text-slate-400">
                      {mobileBudgetState.rawPct}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Balanced 2-Column Desktop Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
              <div className="space-y-5 min-w-0">
                <QuickAddBar onAddItem={handleAddItem} />
                <ItemList
                  items={draft.items}
                  onStepQuantity={handleStepQuantity}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                />
              </div>

              <SummaryPanel
                items={draft.items}
                totalAmount={totalAmount}
                totalUnits={totalUnits}
                budget={draft.budget}
                isEditingSaved={draft.editingHistoryId !== null}
                onSetBudget={handleSetBudget}
                onSaveList={handleSaveList}
                onSaveAsNewList={handleSaveAsNewList}
                onResetList={handleResetList}
              />
            </div>
          </div>
        ) : (
          <HistoryView
            history={history}
            activeEditingId={draft.editingHistoryId}
            onEditSavedList={handleEditSavedList}
            onDuplicateSavedList={handleDuplicateSavedList}
            onDeleteSavedList={handleDeleteSavedList}
            onGoToCurrent={() => setActiveTab('current')}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        )}
      </main>

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
