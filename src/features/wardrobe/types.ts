export const CATEGORIES = [
  { value: 'tops', label: 'Tops' },
  { value: 'bottoms', label: 'Bottoms' },
  { value: 'dresses', label: 'Dresses' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'accessories', label: 'Accessories' },
] as const;

export const FORMALITY_LEVELS = [
  {
    value: 'casual',
    label: 'Casual',
    description: 'Relaxed, everyday outfits',
  },
  {
    value: 'smart-casual',
    label: 'Smart casual',
    description: 'Polished without being too formal',
  },
  {
    value: 'formal',
    label: 'Formal',
    description: 'Ceremonies, important events, and dress codes',
  },
] as const;

export type ClothingCategory = (typeof CATEGORIES)[number]['value'];
export type ClothingFormality = (typeof FORMALITY_LEVELS)[number]['value'];
export type ClothingColor = string;

export type ClothingItem = {
  id: string;
  name: string;
  category: ClothingCategory;
  formality: ClothingFormality;
  color: ClothingColor;
  imageUri: string;
  isFavorite: boolean;
  createdAt: string;
};

export type AddClothingInput = {
  name: string;
  category: ClothingCategory;
  formality: ClothingFormality;
  color: ClothingColor;
  sourceUri: string;
};

export type UpdateClothingClassificationInput = {
  category: ClothingCategory;
  formality: ClothingFormality;
};

export function isClothingCategory(value: unknown): value is ClothingCategory {
  return CATEGORIES.some((category) => category.value === value);
}

export function isClothingFormality(value: unknown): value is ClothingFormality {
  return FORMALITY_LEVELS.some((level) => level.value === value);
}
