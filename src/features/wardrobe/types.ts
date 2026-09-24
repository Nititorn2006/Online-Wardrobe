export const CATEGORIES = [
  { value: 'tops', label: 'Tops' },
  { value: 'bottoms', label: 'Bottoms' },
  { value: 'dresses', label: 'Dresses' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'accessories', label: 'Accessories' },
] as const;

export type ClothingCategory = (typeof CATEGORIES)[number]['value'];
export type ClothingColor = string;

export type ClothingItem = {
  id: string;
  name: string;
  category: ClothingCategory;
  color: ClothingColor;
  imageUri: string;
  isFavorite: boolean;
  createdAt: string;
};

export type AddClothingInput = {
  name: string;
  category: ClothingCategory;
  color: ClothingColor;
  sourceUri: string;
};

export function isClothingCategory(value: unknown): value is ClothingCategory {
  return CATEGORIES.some((category) => category.value === value);
}
