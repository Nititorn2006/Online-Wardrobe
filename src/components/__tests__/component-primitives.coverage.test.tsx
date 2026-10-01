import { afterAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import { Image } from 'expo-image';
import { openBrowserAsync } from 'expo-web-browser';
import type { ReactElement } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';

import { ExternalLink } from '../external-link';
import { HintRow } from '../hint-row';
import { ThemedText, type ThemedTextProps } from '../themed-text';
import { ThemedView } from '../themed-view';
import { WebBadge } from '../web-badge';
import { useTheme } from '../../hooks/use-theme';

const mockTheme = {
  text: '#111111',
  background: '#222222',
  backgroundElement: '#333333',
  backgroundSelected: '#444444',
  textSecondary: '#555555',
};
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: require('@jest/globals').jest.fn(),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: require('@jest/globals').jest.fn(),
}));

jest.mock('@/components/app-text', () => {
  const mockJest = require('@jest/globals').jest as typeof jest;
  const reactNative = mockJest.requireActual<typeof import('react-native')>(
    'react-native',
  );
  return { AppText: reactNative.Text };
});

jest.mock('expo-image', () => {
  const mockJest = require('@jest/globals').jest as typeof jest;
  const React = mockJest.requireActual<typeof import('react')>('react');
  const reactNative = mockJest.requireActual<typeof import('react-native')>(
    'react-native',
  );

  return {
    Image: mockJest.fn((props: Record<string, unknown>) =>
      React.createElement(reactNative.View, { ...props, testID: 'badge-image' }),
    ),
  };
});

jest.mock('expo-router', () => {
  const mockJest = require('@jest/globals').jest as typeof jest;
  const React = mockJest.requireActual<typeof import('react')>('react');
  const reactNative = mockJest.requireActual<typeof import('react-native')>(
    'react-native',
  );

  return {
    Link: ({ children, ...props }: { children?: import('react').ReactNode }) =>
      React.createElement(
        reactNative.Pressable,
        { ...props, accessibilityRole: 'link' },
        children,
      ),
  };
});

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: require('@jest/globals').jest.fn(),
  WebBrowserPresentationStyle: { AUTOMATIC: 'automatic' },
}));

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockUseColorScheme = (
  jest.requireMock('react-native/Libraries/Utilities/useColorScheme') as {
    default: jest.Mock<() => 'dark' | 'light' | null>;
  }
).default;
const mockOpenBrowserAsync = openBrowserAsync as jest.MockedFunction<
  typeof openBrowserAsync
>;
const mockImage = Image as unknown as jest.Mock;

const originalPlatformOs = Platform.OS;

afterAll(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatformOs });
});

beforeEach(() => {
  mockUseTheme.mockReset();
  mockUseTheme.mockReturnValue(mockTheme as unknown as ReturnType<typeof useTheme>);
  mockUseColorScheme.mockReset();
  mockUseColorScheme.mockReturnValue('light');
  mockOpenBrowserAsync.mockClear();
  mockImage.mockClear();
});

describe('ThemedText and ThemedView', () => {
  test('renders every text variant and both theme-color paths', async () => {
    const variants: NonNullable<ThemedTextProps['type']>[] = [
      'default',
      'title',
      'small',
      'smallBold',
      'subtitle',
      'link',
      'linkPrimary',
      'code',
    ];

    const view = await render(
      <>
        <ThemedText testID="implicit-default">Implicit</ThemedText>
        {variants.map((type) => (
          <ThemedText
            key={type}
            testID={`text-${type}`}
            themeColor={type === 'title' ? 'textSecondary' : undefined}
            type={type}
            style={{ letterSpacing: 1 }}>
            {type}
          </ThemedText>
        ))}
        <ThemedView testID="default-view" lightColor="#fff" darkColor="#000" />
        <ThemedView
          testID="selected-view"
          lightColor="#fff"
          darkColor="#000"
          type="backgroundSelected"
          style={{ opacity: 0.5 }}
        />
      </>,
    );

    expect(StyleSheet.flatten(view.getByTestId('implicit-default').props.style)).toEqual(
      expect.objectContaining({ color: mockTheme.text, fontSize: 16 }),
    );
    expect(StyleSheet.flatten(view.getByTestId('text-title').props.style)).toEqual(
      expect.objectContaining({ color: mockTheme.textSecondary, fontSize: 48, letterSpacing: 1 }),
    );
    expect(StyleSheet.flatten(view.getByTestId('text-code').props.style)).toEqual(
      expect.objectContaining({ fontSize: 12 }),
    );
    expect(StyleSheet.flatten(view.getByTestId('default-view').props.style)).toEqual(
      expect.objectContaining({ backgroundColor: mockTheme.background }),
    );
    expect(StyleSheet.flatten(view.getByTestId('selected-view').props.style)).toEqual(
      expect.objectContaining({ backgroundColor: mockTheme.backgroundSelected, opacity: 0.5 }),
    );
  });

  test('uses the Android code weight when the platform supplies it', () => {
    jest.doMock('react-native', () => {
      const actual = jest.requireActual<typeof import('react-native')>('react-native');

      return {
        Platform: {
          select: <Value,>(options: { android?: Value; default?: Value }) =>
            'android' in options ? options.android : options.default,
        },
        StyleSheet: actual.StyleSheet,
      };
    });
    jest.doMock('@/hooks/use-theme', () => ({ useTheme: () => mockTheme }));

    jest.isolateModules(() => {
      const { ThemedText: AndroidThemedText } = jest.requireActual<
        typeof import('../themed-text')
      >('../themed-text');
      const element = AndroidThemedText({ children: 'Code', type: 'code' }) as ReactElement<{
        style: unknown;
      }>;

      expect(StyleSheet.flatten(element.props.style)).toEqual(
        expect.objectContaining({ fontWeight: 700 }),
      );
    });

    jest.dontMock('react-native');
    jest.dontMock('@/hooks/use-theme');
  });
});

describe('HintRow and WebBadge', () => {
  test('renders default and custom hint-row content', async () => {
    const defaults = await render(<HintRow />);
    expect(defaults.getByText('Try editing')).toBeTruthy();
    expect(defaults.getByText('app/index.tsx')).toBeTruthy();
    await defaults.unmount();

    const custom = await render(<HintRow title="Read this" hint={<Text>custom hint</Text>} />);
    expect(custom.getByText('Read this')).toBeTruthy();
    expect(custom.getByText('custom hint')).toBeTruthy();
  });

  test('selects light and dark web badges', async () => {
    mockUseColorScheme.mockReturnValue('dark');
    const view = await render(<WebBadge />);

    expect(view.getByText(/^v/)).toBeTruthy();
    expect(view.getByTestId('badge-image')).toBeTruthy();

    mockUseColorScheme.mockReturnValue('light');
    await view.rerender(<WebBadge />);

    expect(mockImage).toHaveBeenCalledTimes(2);
  });
});

describe('ExternalLink', () => {
  test('prevents native navigation and opens the in-app browser', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    const preventDefault = jest.fn();
    const view = await render(
      <ExternalLink href="https://example.com" accessibilityLabel="Example link">
        <Text>Example</Text>
      </ExternalLink>,
    );
    const link = view.getByRole('link', { name: 'Example link' });

    await fireEvent.press(link, { preventDefault });

    expect(link.props.target).toBe('_blank');
    expect(link.props.href).toBe('https://example.com');
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(mockOpenBrowserAsync).toHaveBeenCalledWith('https://example.com', {
      presentationStyle: 'automatic',
    });
  });

  test('keeps normal browser navigation on web', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const preventDefault = jest.fn();
    const view = await render(
      <ExternalLink href="https://example.com/web" accessibilityLabel="Web link">
        <Text>Web</Text>
      </ExternalLink>,
    );

    await fireEvent.press(view.getByRole('link', { name: 'Web link' }), {
      preventDefault,
    });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(mockOpenBrowserAsync).not.toHaveBeenCalled();
  });
});
