import { describe, expect, jest, test } from '@jest/globals';

import * as wardrobe from '../index';
import {
  CATEGORIES,
  FORMALITY_LEVELS,
  isClothingCategory,
  isClothingFormality,
} from '../types';

jest.mock('../wardrobe-provider', () => ({
  WardrobeProvider: 'mock-provider',
  useWardrobe: jest.fn(() => 'mock-context'),
}));

describe('wardrobe public types', () => {
  test('recognizes categories and rejects unsupported values', () => {
    expect(isClothingCategory(CATEGORIES[0].value)).toBe(true);
    expect(isClothingCategory(CATEGORIES[CATEGORIES.length - 1].value)).toBe(true);
    expect(isClothingCategory('pets')).toBe(false);
    expect(isClothingCategory(null)).toBe(false);
  });

  test('recognizes dress codes and rejects unsupported values', () => {
    expect(isClothingFormality(FORMALITY_LEVELS[0].value)).toBe(true);
    expect(
      isClothingFormality(FORMALITY_LEVELS[FORMALITY_LEVELS.length - 1].value),
    ).toBe(true);
    expect(isClothingFormality('costume')).toBe(false);
    expect(isClothingFormality(undefined)).toBe(false);
  });

  test('exposes the supported wardrobe API from the barrel', () => {
    expect(wardrobe.CATEGORIES).toBe(CATEGORIES);
    expect(wardrobe.FORMALITY_LEVELS).toBe(FORMALITY_LEVELS);
    expect(wardrobe.isClothingCategory('tops')).toBe(true);
    expect(wardrobe.isClothingFormality('formal')).toBe(true);
    expect(wardrobe.WardrobeProvider).toBe('mock-provider');
    expect(wardrobe.useWardrobe()).toBe('mock-context');
  });
});
