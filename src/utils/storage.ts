import {
  ActiveDraft,
  CATEGORIES,
  CategoryId,
  SavedShoppingList,
  ShoppingItem,
  ThemeMode,
} from '../types/shopping';
import { computeListTotal, computeTotalUnits, getDefaultListTitle } from './format';

const THEME_KEY = 'somma_theme_v1';
const DRAFT_KEY = 'somma_active_draft_v1';
const HISTORY_KEY = 'somma_history_v1';

const VALID_CATEGORIES = new Set<string>(CATEGORIES.map((c) => c.id));

function sanitizeCategory(value: unknown): CategoryId {
  if (typeof value === 'string' && VALID_CATEGORIES.has(value)) {
    return value as CategoryId;
  }
  return '';
}

function sanitizeItem(raw: unknown): ShoppingItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === 'string' && obj.id.trim() ? obj.id : null;
  const quantity = typeof obj.quantity === 'number' && Number.isFinite(obj.quantity) && obj.quantity > 0 ? obj.quantity : null;
  const unitPrice = typeof obj.unitPrice === 'number' && Number.isFinite(obj.unitPrice) && obj.unitPrice >= 0 ? obj.unitPrice : null;

  if (!id || quantity === null || unitPrice === null) return null;

  return {
    id,
    name: typeof obj.name === 'string' ? obj.name : '',
    category: sanitizeCategory(obj.category),
    quantity,
    unitPrice,
    createdAt: typeof obj.createdAt === 'number' && Number.isFinite(obj.createdAt) ? obj.createdAt : Date.now(),
  };
}

export function loadTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // Ignore storage access failures
  }
  return 'dark';
}

export function saveTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore storage access failures
  }
}

export function createEmptyDraft(): ActiveDraft {
  return {
    editingHistoryId: null,
    title: getDefaultListTitle(),
    budget: null,
    items: [],
  };
}

export function loadActiveDraft(): ActiveDraft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return createEmptyDraft();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return createEmptyDraft();

    const items = Array.isArray(parsed.items)
      ? parsed.items.map(sanitizeItem).filter((item): item is ShoppingItem => item !== null)
      : [];

    const budget =
      typeof parsed.budget === 'number' && Number.isFinite(parsed.budget) && parsed.budget > 0
        ? parsed.budget
        : null;

    return {
      editingHistoryId: typeof parsed.editingHistoryId === 'string' ? parsed.editingHistoryId : null,
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title : getDefaultListTitle(),
      budget,
      items,
    };
  } catch {
    return createEmptyDraft();
  }
}

export function saveActiveDraft(draft: ActiveDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Ignore quota/storage errors
  }
}

export function loadHistory(): SavedShoppingList[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const result: SavedShoppingList[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') continue;
      const obj = entry as Record<string, unknown>;
      if (typeof obj.id !== 'string' || !obj.id.trim()) continue;
      const items = Array.isArray(obj.items)
        ? obj.items.map(sanitizeItem).filter((item): item is ShoppingItem => item !== null)
        : [];
      const savedAt = typeof obj.savedAt === 'number' && Number.isFinite(obj.savedAt) ? obj.savedAt : Date.now();
      const updatedAt = typeof obj.updatedAt === 'number' && Number.isFinite(obj.updatedAt) ? obj.updatedAt : savedAt;
      const budget =
        typeof obj.budget === 'number' && Number.isFinite(obj.budget) && obj.budget > 0
          ? obj.budget
          : null;

      result.push({
        id: obj.id,
        title: typeof obj.title === 'string' && obj.title.trim() ? obj.title : 'Compra salva',
        savedAt,
        updatedAt,
        budget,
        items,
        totalAmount: computeListTotal(items),
        totalUnits: computeTotalUnits(items),
      });
    }

    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveHistory(history: SavedShoppingList[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Ignore quota/storage errors
  }
}
