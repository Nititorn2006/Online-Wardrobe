import AsyncStorage from '@react-native-async-storage/async-storage';

import { normalizeSavedOutfit } from './outfit-schema';
import type { SavedOutfit } from './types';

export const OUTFIT_STORAGE_KEY = '@matchclothes/outfits:v1';

function storageError(message: string, cause: unknown): Error {
  const error = new Error(message);
  error.cause = cause;
  return error;
}

export async function loadSavedOutfits(): Promise<SavedOutfit[]> {
  let storedValue: string | null;

  try {
    storedValue = await AsyncStorage.getItem(OUTFIT_STORAGE_KEY);
  } catch (error) {
    throw storageError('Could not load your saved outfits. Please try again.', error);
  }

  if (storedValue === null) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      throw new Error('The saved outfits have an unsupported format.');
    }

    const normalizedOutfits = parsedValue.map(normalizeSavedOutfit);

    if (normalizedOutfits.some((outfit) => outfit === null)) {
      throw new Error('The saved outfits have an unsupported format.');
    }

    return normalizedOutfits as SavedOutfit[];
  } catch (error) {
    throw storageError('Could not read your saved outfit data.', error);
  }
}

export async function saveSavedOutfits(outfits: readonly SavedOutfit[]): Promise<void> {
  try {
    await AsyncStorage.setItem(OUTFIT_STORAGE_KEY, JSON.stringify(outfits));
  } catch (error) {
    throw storageError('Could not save your outfits. Please try again.', error);
  }
}
