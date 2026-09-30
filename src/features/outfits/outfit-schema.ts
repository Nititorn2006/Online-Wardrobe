import { isClothingFormality } from '../wardrobe/types';
import { isOutfitOccasion, type SavedOutfit } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isDateValue(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function normalizeSavedOutfit(value: unknown): SavedOutfit | null {
  if (!isRecord(value)) {
    return null;
  }

  const itemIds = Array.isArray(value.itemIds)
    ? [...new Set(value.itemIds.filter((id): id is string => typeof id === 'string' && id.length > 0))]
    : [];

  if (
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    typeof value.name !== 'string' ||
    value.name.length === 0 ||
    itemIds.length < 2 ||
    !isClothingFormality(value.formality) ||
    !isOutfitOccasion(value.occasion) ||
    !isDateValue(value.plannedFor) ||
    typeof value.createdAt !== 'string' ||
    Number.isNaN(Date.parse(value.createdAt))
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    itemIds,
    formality: value.formality,
    occasion: value.occasion,
    plannedFor: value.plannedFor,
    createdAt: value.createdAt,
  };
}
