import AsyncStorage from '@react-native-async-storage/async-storage';

import { normalizeClothingItem } from './item-schema';
import type { ClothingItem } from './types';

export const WARDROBE_STORAGE_KEY = '@matchclothes/wardrobe:v1';

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

    if (!Array.isArray(parsedValue)) {
      throw new Error('The saved wardrobe has an unsupported format.');
    }

    const normalizedItems = parsedValue.map(normalizeClothingItem);

    if (normalizedItems.some((item) => item === null)) {
      throw new Error('The saved wardrobe has an unsupported format.');
    }

    return normalizedItems as ClothingItem[];
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
