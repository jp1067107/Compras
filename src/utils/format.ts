import { ShoppingItem } from '../types/shopping';

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberInputFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const qtyFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundQty(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

export function formatBRL(value: number): string {
  return brlFormatter.format(roundMoney(value));
}

export function formatPriceForInput(value: number): string {
  return numberInputFormatter.format(roundMoney(value));
}

export function formatQty(value: number): string {
  return qtyFormatter.format(roundQty(value));
}

export function formatDateTime(timestamp: number): string {
  return dateFormatter.format(new Date(timestamp));
}

/**
 * Parses Brazilian or international numeric strings cleanly:
 * "12,90" -> 12.9
 * "12.90" -> 12.9
 * "1.250,50" -> 1250.5
 * "R$ 45,00" -> 45
 */
export function parseLocaleNumber(raw: string): number {
  const cleaned = raw.replace(/[^\d.,]/g, '').trim();
  if (!cleaned) return NaN;

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  let normalized = cleaned;
  if (hasComma && hasDot) {
    // Decide which is the decimal separator by last occurrence
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Only commas: treat last comma as decimal separator
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      const dec = parts.pop();
      normalized = `${parts.join('')}.${dec}`;
    } else {
      normalized = cleaned.replace(',', '.');
    }
  } else if (hasDot) {
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      const dec = parts.pop();
      normalized = `${parts.join('')}.${dec}`;
    }
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function computeItemSubtotal(item: Pick<ShoppingItem, 'quantity' | 'unitPrice'>): number {
  return roundMoney(Math.max(0, item.quantity) * Math.max(0, item.unitPrice));
}

export function computeListTotal(items: ShoppingItem[]): number {
  return roundMoney(items.reduce((sum, item) => sum + computeItemSubtotal(item), 0));
}

export function computeTotalUnits(items: ShoppingItem[]): number {
  return roundQty(items.reduce((sum, item) => sum + Math.max(0, item.quantity), 0));
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getDefaultListTitle(): string {
  const today = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date());
  return `Compras ${today}`;
}
