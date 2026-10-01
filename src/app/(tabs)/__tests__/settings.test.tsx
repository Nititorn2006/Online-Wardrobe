import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';

import type { TextSizeOption } from '@/features/wardrobe/text-size-provider';

import SettingsScreen from '../settings';

const mockSetTextSize = jest.fn<(value: TextSizeOption) => Promise<void>>();
const mockTextSize: {
  textSize: TextSizeOption;
  setTextSize: typeof mockSetTextSize;
} = {
  textSize: 'default',
  setTextSize: mockSetTextSize,
};

jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const actual = jest.requireActual<typeof import('react-native')>('react-native');

  const mocked = Object.create(actual) as typeof actual;
  Object.defineProperty(mocked, 'Pressable', {
    configurable: true,
    value: ({ style, ...props }: { style?: unknown; [key: string]: unknown }) => {
      if (typeof style === 'function') {
        style({ pressed: false });
        style({ pressed: true });
      }

      return React.createElement(actual.Pressable, { ...props, style });
    },
  });
  return mocked;
});

jest.mock('@/components/app-text', () => {
  const ReactNative = jest.requireActual<typeof import('react-native')>('react-native');
  return { AppText: ReactNative.Text };
});

jest.mock('@expo/vector-icons', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Ionicons: (props: Record<string, unknown>) => React.createElement(View, props) };
});

jest.mock('react-native-safe-area-context', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    SafeAreaView: (props: Record<string, unknown>) => React.createElement(View, props),
  };
});

jest.mock('@/features/wardrobe/text-size-provider', () => ({
  useTextSize: () => mockTextSize,
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    mockTextSize.textSize = 'default';
    mockSetTextSize.mockResolvedValue(undefined);
  });

  test('renders every text-size choice, selection state, dividers, and preview', async () => {
    const view = await render(<SettingsScreen />);

    expect(view.getByText('Settings')).toBeTruthy();
    expect(view.getByText('Small')).toBeTruthy();
    expect(view.getByText('Default')).toBeTruthy();
    expect(view.getByText('Large')).toBeTruthy();
    expect(view.getByText('Extra Large')).toBeTruthy();
    expect(view.getByText('Your online wardrobe')).toBeTruthy();

    expect(
      view.getByRole('button', { name: /Default Recommended text size/ }).props
        .accessibilityState,
    ).toEqual({ selected: true });
    expect(
      view.getByRole('button', { name: /Small More content fits on screen/ }).props
        .accessibilityState,
    ).toEqual({ selected: false });
  });

  test.each([
    ['Small', 'small'],
    ['Default', 'default'],
    ['Large', 'large'],
    ['Extra Large', 'extraLarge'],
  ] as const)('selects %s text', async (label, value) => {
    const view = await render(<SettingsScreen />);

    await fireEvent.press(view.getByRole('button', { name: new RegExp(`^${label}`) }));
    expect(mockSetTextSize).toHaveBeenCalledWith(value);
  });

  test('renders a different selected text size', async () => {
    mockTextSize.textSize = 'extraLarge';
    const view = await render(<SettingsScreen />);

    expect(
      view.getByRole('button', { name: /Extra Large Maximum readability/ }).props
        .accessibilityState,
    ).toEqual({ selected: true });
  });
});
