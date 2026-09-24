import AsyncStorage from '@react-native-async-storage/async-storage';

import { isClothingCategory, type ClothingItem } from './types';

export const WARDROBE_STORAGE_KEY = '@matchclothes/wardrobe:v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isClothingItem(value: unknown): value is ClothingItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    isClothingCategory(value.category) &&
    typeof value.color === 'string' &&
    value.color.length > 0 &&
    typeof value.imageUri === 'string' &&
    value.imageUri.length > 0 &&
    typeof value.isFavorite === 'boolean' &&
    typeof value.createdAt === 'string' &&
    !Number.isNaN(Date.parse(value.createdAt))
  );
}

function storageError(message: string, cause: unknown): Error {
  const error = new Error(message);
  error.cause = cause;
  return error;
}

export async function loadWardrobeItems(): Promise<ClothingItem[]> {
  let storedValue: string | null;

  try {
    storedValue = await AsyncStorage.getItem(WARDROBE_STORAGE_KEY);
  } catch (error) {
    throw storageError('Could not load your wardrobe. Please try again.', error);
  }

  if (storedValue === null) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue) || !parsedValue.every(isClothingItem)) {
      throw new Error('The saved wardrobe has an unsupported format.');
    }

    return parsedValue;
  } catch (error) {
    throw storageError('Could not read your saved wardrobe data.', error);
  }
}

export async function saveWardrobeItems(items: readonly ClothingItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    throw storageError('Could not save your wardrobe. Please try again.', error);
  }
}
