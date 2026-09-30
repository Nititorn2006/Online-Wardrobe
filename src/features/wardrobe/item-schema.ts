import {
  isClothingCategory,
  isClothingFormality,
  type ClothingItem,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function normalizeClothingItem(value: unknown): ClothingItem | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    typeof value.name !== 'string' ||
    value.name.length === 0 ||
    !isClothingCategory(value.category) ||
    typeof value.color !== 'string' ||
    value.color.length === 0 ||
    typeof value.imageUri !== 'string' ||
    value.imageUri.length === 0 ||
    typeof value.isFavorite !== 'boolean' ||
    typeof value.createdAt !== 'string' ||
    Number.isNaN(Date.parse(value.createdAt))
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    category: value.category,
    formality: isClothingFormality(value.formality)
      ? value.formality
      : 'casual',
    color: value.color,
    imageUri: value.imageUri,
    isFavorite: value.isFavorite,
    createdAt: value.createdAt,
  };
}
