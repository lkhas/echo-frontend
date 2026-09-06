// src/lib/assetTypeColors.ts

// Fixed, high-contrast palette — cycles if there are more categories than colors.
const PALETTE = [
  '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#06b6d4', '#a855f7', '#eab308', '#22c55e', '#f43f5e',
  '#0ea5e9', '#d946ef', '#65a30d', '#dc2626', '#7c3aed',
];

export function getAssetCategory(assetType?: string | null): string {
  if (!assetType) return 'Uncategorized';
  const [category] = assetType.split(' - ');
  return category?.trim() || 'Uncategorized';
}

const colorCache = new Map<string, string>();

export function getAssetCategoryColor(assetType?: string | null): string {
  const category = getAssetCategory(assetType);
  if (colorCache.has(category)) return colorCache.get(category)!;

  const color = PALETTE[colorCache.size % PALETTE.length];
  colorCache.set(category, color);
  return color;
}

export function getAllKnownCategoryColors(): Record<string, string> {
  return Object.fromEntries(colorCache);
}