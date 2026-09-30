import type { ClothingFormality, ClothingItem } from '../wardrobe/types';

export const OUTFIT_OCCASIONS = [
  { value: 'everyday', label: 'Everyday', icon: '☀' },
  { value: 'work', label: 'Work / school', icon: '▣' },
  { value: 'date', label: 'Date', icon: '♥' },
  { value: 'party', label: 'Party', icon: '✦' },
  { value: 'wedding', label: 'Wedding', icon: '◇' },
  { value: 'travel', label: 'Travel', icon: '↗' },
] as const;

export type OutfitOccasion = (typeof OUTFIT_OCCASIONS)[number]['value'];

export type OutfitRequest = {
  formality: ClothingFormality;
  occasion: OutfitOccasion;
  plannedFor: string;
  seed: number;
};

export type OutfitRecommendation = {
  items: ClothingItem[];
  isComplete: boolean;
  missingMessage: string | null;
  canTryAnother: boolean;
  tryAnotherLabel: string;
  variationMessage: string | null;
};

export type SavedOutfit = {
  id: string;
  name: string;
  itemIds: string[];
  formality: ClothingFormality;
  occasion: OutfitOccasion;
  plannedFor: string;
  createdAt: string;
};

export type SaveOutfitInput = {
  itemIds: string[];
  formality: ClothingFormality;
  occasion: OutfitOccasion;
  plannedFor: string;
};

export function isOutfitOccasion(value: unknown): value is OutfitOccasion {
  return OUTFIT_OCCASIONS.some((occasion) => occasion.value === value);
}
