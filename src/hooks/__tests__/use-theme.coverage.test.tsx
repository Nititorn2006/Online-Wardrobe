/* eslint-disable @typescript-eslint/no-require-imports */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { renderHook } from '@testing-library/react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '../use-theme';

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: require('@jest/globals').jest.fn(),
}));

const mockUseColorScheme = useColorScheme as jest.MockedFunction<
  () => 'dark' | 'light' | 'unspecified'
>;

describe('useTheme', () => {
  beforeEach(() => {
    mockUseColorScheme.mockReset();
  });

  test('maps an unspecified scheme to the light theme', async () => {
    mockUseColorScheme.mockReturnValue('unspecified');

    const { result } = await renderHook(() => useTheme());

    expect(result.current).toBe(Colors.light);
  });

  test('returns the selected color scheme', async () => {
    mockUseColorScheme.mockReturnValue('dark');

    const { result, rerender } = await renderHook(() => useTheme());
    expect(result.current).toBe(Colors.dark);

    mockUseColorScheme.mockReturnValue('light');
    await rerender(undefined);
    expect(result.current).toBe(Colors.light);
  });
});
