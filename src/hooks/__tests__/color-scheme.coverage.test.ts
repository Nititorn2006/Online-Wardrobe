import { describe, expect, jest, test } from '@jest/globals';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: require('@jest/globals').jest.fn(() => 'dark'),
}));

import { useColorScheme as useNativeColorScheme } from '../use-color-scheme';
import { useColorScheme as useWebColorScheme } from '../use-color-scheme.web';

const mockUseColorScheme = (
  jest.requireMock('react-native/Libraries/Utilities/useColorScheme') as {
    default: jest.Mock;
  }
).default;

describe('color-scheme exports', () => {
  test('forwards the React Native hook on native and web', () => {
    expect(useNativeColorScheme()).toBe('dark');
    expect(useWebColorScheme()).toBe('dark');
    expect(mockUseColorScheme).toHaveBeenCalledTimes(2);
  });
});
