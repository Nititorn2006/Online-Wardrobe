import { describe, expect, test } from '@jest/globals';

import {
  COMMON_COLOR_OPTIONS,
  EXTENDED_COLOR_SWATCHES,
  isDarkClothingColor,
  normalizeClothingColor,
} from '../color-palette';

describe('clothing color palette', () => {
  test('normalizes valid colors and rejects invalid values', () => {
    expect(normalizeClothingColor(' #ab12ef ')).toBe('#AB12EF');
    expect(normalizeClothingColor('red')).toBeNull();
    expect(normalizeClothingColor('#123')).toBeNull();
  });

  test('contains unique tappable colors', () => {
    const colors = [
      ...COMMON_COLOR_OPTIONS.map((option) => option.hex),
      ...EXTENDED_COLOR_SWATCHES,
    ];

    expect(new Set(colors).size).toBe(colors.length);
  });

  test('identifies dark and light swatches for a readable checkmark', () => {
    expect(isDarkClothingColor('#000000')).toBe(true);
    expect(isDarkClothingColor('#FFFFFF')).toBe(false);
    expect(isDarkClothingColor('invalid')).toBe(false);
  });
});
