import { describe, expect, test } from '@jest/globals';

import { normalizeClothingItem } from '../item-schema';

const legacyItem = {
  id: 'item-1',
  name: 'Blue shirt',
  category: 'tops',
  color: '#336699',
  imageUri: 'file:///blue-shirt.jpg',
  isFavorite: false,
  createdAt: '2026-09-30T08:00:00.000Z',
};

describe('normalizeClothingItem', () => {
  test('keeps a saved formality value', () => {
    expect(
      normalizeClothingItem({
        ...legacyItem,
        formality: 'smart-casual',
      }),
    ).toEqual({
      ...legacyItem,
      formality: 'smart-casual',
    });
  });

  test('migrates legacy wardrobe items to casual', () => {
    expect(normalizeClothingItem(legacyItem)).toEqual({
      ...legacyItem,
      formality: 'casual',
    });
  });

  test('rejects invalid wardrobe rows', () => {
    expect(
      normalizeClothingItem({
        ...legacyItem,
        category: 'not-a-category',
      }),
    ).toBeNull();
  });
});
