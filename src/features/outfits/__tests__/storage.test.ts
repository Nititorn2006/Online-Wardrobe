import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import {
  loadSavedOutfits,
  OUTFIT_STORAGE_KEY,
  saveSavedOutfits,
} from '../storage';
import type { SavedOutfit } from '../types';

jest.mock('@react-native-async-storage/async-storage', () => {
  // The factory runs before ESM imports, so obtain Jest lazily.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockJest = require('@jest/globals').jest as typeof jest;
  const storage = {
    getItem: mockJest.fn(),
    setItem: mockJest.fn(),
  };

  return { __esModule: true, default: storage, ...storage };
});

const savedOutfit: SavedOutfit = {
  id: 'outfit-1',
  name: 'Casual everyday look',
  itemIds: ['top', 'bottom'],
  formality: 'casual',
  occasion: 'everyday',
  plannedFor: '2026-10-01',
  createdAt: '2026-09-30T08:00:00.000Z',
};

const getItem = jest.spyOn(AsyncStorage, 'getItem');
const setItem = jest.spyOn(AsyncStorage, 'setItem');

describe('saved outfit storage', () => {
  beforeEach(() => {
    getItem.mockReset();
    setItem.mockReset();
  });

  test('returns an empty list when storage has no saved outfits', async () => {
    getItem.mockResolvedValue(null);

    await expect(loadSavedOutfits()).resolves.toEqual([]);
    expect(getItem).toHaveBeenCalledWith(OUTFIT_STORAGE_KEY);
  });

  test('loads and normalizes a saved outfit array', async () => {
    getItem.mockResolvedValue(
      JSON.stringify([{ ...savedOutfit, itemIds: ['top', 'bottom', 'top'] }]),
    );

    await expect(loadSavedOutfits()).resolves.toEqual([savedOutfit]);
  });

  test('wraps an AsyncStorage read failure and preserves its cause', async () => {
    const cause = new Error('native read failed');
    getItem.mockRejectedValue(cause);

    await expect(loadSavedOutfits()).rejects.toMatchObject({
      message: 'Could not load your saved outfits. Please try again.',
      cause,
    });
  });

  test.each([
    ['malformed JSON', '{'],
    ['a non-array payload', JSON.stringify({ outfit: savedOutfit })],
    [
      'an invalid outfit row',
      JSON.stringify([{ ...savedOutfit, itemIds: ['top'] }]),
    ],
  ])('wraps %s as unreadable saved data', async (_description, storedValue) => {
    getItem.mockResolvedValue(storedValue);

    await expect(loadSavedOutfits()).rejects.toMatchObject({
      message: 'Could not read your saved outfit data.',
      cause: expect.any(Error),
    });
  });

  test('serializes saved outfits under the versioned storage key', async () => {
    setItem.mockResolvedValue(undefined);

    await expect(saveSavedOutfits([savedOutfit])).resolves.toBeUndefined();
    expect(setItem).toHaveBeenCalledWith(
      OUTFIT_STORAGE_KEY,
      JSON.stringify([savedOutfit]),
    );
  });

  test('wraps an AsyncStorage write failure and preserves its cause', async () => {
    const cause = new Error('native write failed');
    setItem.mockRejectedValue(cause);

    await expect(saveSavedOutfits([savedOutfit])).rejects.toMatchObject({
      message: 'Could not save your outfits. Please try again.',
      cause,
    });
  });
});
