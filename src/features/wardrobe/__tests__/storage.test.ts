import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import {
  loadWardrobeItems,
  saveWardrobeItems,
  WARDROBE_STORAGE_KEY,
} from '../storage';
import type { ClothingItem } from '../types';

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

const mockedStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

const validItem: ClothingItem = {
  id: 'item-1',
  name: 'Blue shirt',
  category: 'tops',
  formality: 'casual',
  color: '#336699',
  imageUri: 'file:///blue-shirt.jpg',
  isFavorite: false,
  createdAt: '2026-09-30T08:00:00.000Z',
};

describe('wardrobe storage', () => {
  beforeEach(() => {
    mockedStorage.getItem.mockReset();
    mockedStorage.setItem.mockReset();
  });

  test('returns an empty wardrobe when nothing has been stored', async () => {
    mockedStorage.getItem.mockResolvedValue(null);

    await expect(loadWardrobeItems()).resolves.toEqual([]);
    expect(mockedStorage.getItem).toHaveBeenCalledWith(WARDROBE_STORAGE_KEY);
  });

  test('loads and normalizes saved wardrobe items', async () => {
    mockedStorage.getItem.mockResolvedValue(
      JSON.stringify([{ ...validItem, formality: undefined }]),
    );

    await expect(loadWardrobeItems()).resolves.toEqual([
      { ...validItem, formality: 'casual' },
    ]);
  });

  test('wraps failures while reading the storage service', async () => {
    const cause = new Error('storage unavailable');
    mockedStorage.getItem.mockRejectedValue(cause);

    await expect(loadWardrobeItems()).rejects.toMatchObject({
      message: 'Could not load your wardrobe. Please try again.',
      cause,
    });
  });

  test.each([
    ['malformed JSON', '{broken'],
    ['a non-array value', JSON.stringify({ item: validItem })],
    ['an invalid item', JSON.stringify([validItem, { ...validItem, id: '' }])],
  ])('wraps %s as unreadable wardrobe data', async (_label, storedValue) => {
    mockedStorage.getItem.mockResolvedValue(storedValue);

    await expect(loadWardrobeItems()).rejects.toMatchObject({
      message: 'Could not read your saved wardrobe data.',
      cause: expect.any(Error),
    });
  });

  test('serializes and saves wardrobe items', async () => {
    mockedStorage.setItem.mockResolvedValue(undefined);

    await expect(saveWardrobeItems([validItem])).resolves.toBeUndefined();
    expect(mockedStorage.setItem).toHaveBeenCalledWith(
      WARDROBE_STORAGE_KEY,
      JSON.stringify([validItem]),
    );
  });

  test('wraps failures while saving wardrobe items', async () => {
    const cause = new Error('disk full');
    mockedStorage.setItem.mockRejectedValue(cause);

    await expect(saveWardrobeItems([validItem])).rejects.toMatchObject({
      message: 'Could not save your wardrobe. Please try again.',
      cause,
    });
  });
});
