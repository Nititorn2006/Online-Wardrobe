import { afterEach, describe, expect, jest, test } from '@jest/globals';

afterEach(() => {
  jest.dontMock('react-native');
  jest.resetModules();
});

describe('design and theme constants', () => {
  test('exports the platform-selected values and shared tokens', () => {
    jest.doMock('react-native', () => ({
      Platform: {
        select: <T,>(options: { ios?: T }) => options.ios,
      },
    }));

    jest.isolateModules(() => {
      const design = jest.requireActual<typeof import('../design')>('../design');
      const theme = jest.requireActual<typeof import('../theme')>('../theme');

      expect(design.Palette).toEqual(
        expect.objectContaining({
          background: '#F7F5F1',
          brand: '#4338B8',
          white: '#FFFFFF',
        }),
      );
      expect(design.Layout).toEqual({ gutter: 20, maxWidth: 720, tabClearance: 108 });
      expect(design.Radius).toEqual({ small: 12, medium: 18, large: 26, pill: 999 });

      expect(theme.Colors.light.text).toBe('#000000');
      expect(theme.Colors.dark.text).toBe('#ffffff');
      expect(theme.Fonts).toEqual({
        sans: 'system-ui',
        serif: 'ui-serif',
        rounded: 'ui-rounded',
        mono: 'ui-monospace',
      });
      expect(theme.Spacing).toEqual({
        half: 2,
        one: 4,
        two: 8,
        three: 16,
        four: 24,
        five: 32,
        six: 64,
      });
      expect(theme.BottomTabInset).toBe(50);
      expect(theme.MaxContentWidth).toBe(800);
    });
  });

  test('uses nullish fallbacks when a platform selection is unavailable', () => {
    jest.doMock('react-native', () => ({
      Platform: {
        select: () => undefined,
      },
    }));

    jest.isolateModules(() => {
      const design = jest.requireActual<typeof import('../design')>('../design');
      const theme = jest.requireActual<typeof import('../theme')>('../theme');

      expect(design.Layout.tabClearance).toBe(108);
      expect(theme.Fonts).toBeUndefined();
      expect(theme.BottomTabInset).toBe(0);
    });
  });
});
