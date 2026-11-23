export type ThemeMode = 'dark' | 'light';

export type ActiveTab = 'current' | 'history';

export type CategoryId =
  | ''
  | 'mercado'
  | 'hortifruti'
  | 'carnes'
  | 'padaria'
  | 'bebidas'
  | 'limpeza'
  | 'higiene'
  | 'outros';

export interface CategoryOption {
  id: CategoryId;
  label: string;
}

export const CATEGORIES: CategoryOption[] = [
  { id: '', label: 'Sem categoria' },
  { id: 'mercado', label: 'Mercado' },
  { id: 'hortifruti', label: 'Hortifruti' },
  { id: 'carnes', label: 'Carnes' },
  { id: 'padaria', label: 'Padaria' },
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'limpeza', label: 'Limpeza' },
  { id: 'higiene', label: 'Higiene' },
  { id: 'outros', label: 'Outros' },
];

export const CATEGORY_LABEL_MAP: Record<CategoryId, string> = CATEGORIES.reduce(
  (acc, item) => {
    acc[item.id] = item.label;
    return acc;
  },
  {} as Record<CategoryId, string>
);

export interface ShoppingItem {
  id: string;
  name: string;
  category: CategoryId;
  quantity: number;
  unitPrice: number;
  createdAt: number;
}

export interface ActiveDraft {
  editingHistoryId: string | null;
  title: string;
  budget: number | null;
  items: ShoppingItem[];
}

export interface SavedShoppingList {
  id: string;
  title: string;
  savedAt: number;
  updatedAt: number;
  budget: number | null;
  items: ShoppingItem[];
  totalAmount: number;
  totalUnits: number;
}

export interface ToastMessage {
  id: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}
