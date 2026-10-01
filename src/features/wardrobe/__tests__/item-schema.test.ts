import { describe, expect, test } from '@jest/globals';

import { normalizeClothingItem } from '../item-schema';
import { FORMALITY_LEVELS } from '../types';

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

  test.each(FORMALITY_LEVELS)('accepts the $label dress code', ({ value }) => {
    expect(
      normalizeClothingItem({
        ...legacyItem,
        formality: value,
      })?.formality,
    ).toBe(value);
  });

  test('rejects invalid wardrobe rows', () => {
    expect(
      normalizeClothingItem({
        ...legacyItem,
        category: 'not-a-category',
      }),
    ).toBeNull();
  });

  test.each([
    ['missing record', null],
    ['primitive value', 'not-an-item'],
    ['non-string id', { ...legacyItem, id: 12 }],
    ['empty id', { ...legacyItem, id: '' }],
    ['non-string name', { ...legacyItem, name: null }],
    ['empty name', { ...legacyItem, name: '' }],
    ['non-string color', { ...legacyItem, color: 123 }],
    ['empty color', { ...legacyItem, color: '' }],
    ['non-string image URI', { ...legacyItem, imageUri: false }],
    ['empty image URI', { ...legacyItem, imageUri: '' }],
    ['non-boolean favorite flag', { ...legacyItem, isFavorite: 'yes' }],
    ['non-string creation date', { ...legacyItem, createdAt: 123 }],
    ['invalid creation date', { ...legacyItem, createdAt: 'not-a-date' }],
  ])('rejects a row with %s', (_label, value) => {
    expect(normalizeClothingItem(value)).toBeNull();
  });
});
