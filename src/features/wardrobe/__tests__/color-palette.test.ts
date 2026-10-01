import { describe, expect, test } from '@jest/globals';

import {
  ADVANCED_COLOR_GRID,
  clothingColorToHsv,
  clothingColorToRgb,
  COMMON_COLOR_OPTIONS,
  EXTENDED_COLOR_SWATCHES,
  hsvToClothingColor,
  isDarkClothingColor,
  normalizeClothingColor,
  rgbToClothingColor,
  rgbToHsv,
  SPECTRUM_COLOR_GRID,
  updateHsvChannel,
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

  test('converts RGB values to normalized clothing colors', () => {
    expect(rgbToClothingColor({ red: -20, green: 127.6, blue: 300 })).toBe(
      '#0080FF',
    );
    expect(clothingColorToRgb('#0080ff')).toEqual({
      red: 0,
      green: 128,
      blue: 255,
    });
    expect(clothingColorToRgb('invalid')).toBeNull();
  });

  test.each([
    [{ red: 0, green: 0, blue: 0 }, { hue: 0, saturation: 0, value: 0 }],
    [{ red: 255, green: 255, blue: 255 }, { hue: 0, saturation: 0, value: 100 }],
    [{ red: 255, green: 0, blue: 0 }, { hue: 0, saturation: 100, value: 100 }],
    [{ red: 255, green: 255, blue: 0 }, { hue: 60, saturation: 100, value: 100 }],
    [{ red: 0, green: 255, blue: 0 }, { hue: 120, saturation: 100, value: 100 }],
    [{ red: 0, green: 255, blue: 255 }, { hue: 180, saturation: 100, value: 100 }],
    [{ red: 0, green: 0, blue: 255 }, { hue: 240, saturation: 100, value: 100 }],
    [{ red: 255, green: 0, blue: 255 }, { hue: 300, saturation: 100, value: 100 }],
  ])('converts RGB %j to HSV', (rgb, expected) => {
    expect(rgbToHsv(rgb)).toEqual(expected);
  });

  test('clamps RGB inputs and parses colors into HSV', () => {
    expect(rgbToHsv({ red: 300, green: -10, blue: 0 })).toEqual({
      hue: 0,
      saturation: 100,
      value: 100,
    });
    expect(clothingColorToHsv('#00FF00')).toEqual({
      hue: 120,
      saturation: 100,
      value: 100,
    });
    expect(clothingColorToHsv('invalid')).toBeNull();
  });

  test.each([
    [0, '#FF0000'],
    [60, '#FFFF00'],
    [120, '#00FF00'],
    [180, '#00FFFF'],
    [240, '#0000FF'],
    [300, '#FF00FF'],
  ])('converts hue %d through every HSV sector', (hue, expected) => {
    expect(hsvToClothingColor({ hue, saturation: 100, value: 100 })).toBe(expected);
  });

  test('wraps hue and clamps saturation and brightness', () => {
    expect(hsvToClothingColor({ hue: -60, saturation: 100, value: 100 })).toBe(
      '#FF00FF',
    );
    expect(hsvToClothingColor({ hue: 360, saturation: 200, value: 200 })).toBe(
      '#FF0000',
    );
    expect(hsvToClothingColor({ hue: 20, saturation: -10, value: 100 })).toBe(
      '#FFFFFF',
    );
    expect(hsvToClothingColor({ hue: 20, saturation: 100, value: -10 })).toBe(
      '#000000',
    );
  });

  test('updates individual HSV channels with a safe invalid-color fallback', () => {
    expect(updateHsvChannel('#FF0000', 'hue', 120)).toBe('#00FF00');
    expect(updateHsvChannel('#FF0000', 'saturation', 0)).toBe('#FFFFFF');
    expect(updateHsvChannel('#FF0000', 'value', 50)).toBe('#800000');
    expect(updateHsvChannel('invalid', 'value', 100)).toBe('#FFFFFF');
  });

  test('builds complete advanced picker grids', () => {
    expect(ADVANCED_COLOR_GRID).toHaveLength(9);
    expect(ADVANCED_COLOR_GRID.every((row) => row.length === 12)).toBe(true);
    expect(SPECTRUM_COLOR_GRID).toHaveLength(8);
    expect(SPECTRUM_COLOR_GRID.every((row) => row.length === 16)).toBe(true);
    expect(ADVANCED_COLOR_GRID.flat().every(normalizeClothingColor)).toBe(true);
    expect(SPECTRUM_COLOR_GRID.flat().every(normalizeClothingColor)).toBe(true);
  });
});
