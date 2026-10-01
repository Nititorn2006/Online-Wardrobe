/* eslint-disable @typescript-eslint/no-require-imports, import/no-duplicates */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';

import NativeAppTabs from '../app-tabs';
import WebAppTabs, { CustomTabList, TabButton } from '../app-tabs.web';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  usePathname: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, color }: { name: string; color: string }) => {
    const React = require('react');
    const reactNative = require('react-native');
    return React.createElement(
      reactNative.Text,
      { accessibilityLabel: `${name}:${color}` },
      name,
    );
  },
}));

const mockRouter = jest.requireMock('expo-router') as {
  router: { push: jest.Mock };
  usePathname: jest.Mock<() => string>;
};
const mockPush = mockRouter.router.push;
const mockUsePathname = mockRouter.usePathname;
const mockUseSafeAreaInsets = (
  jest.requireMock('react-native-safe-area-context') as {
    useSafeAreaInsets: jest.Mock<() => { top: number; right: number; bottom: number; left: number }>;
  }
).useSafeAreaInsets;

jest.mock('@/components/app-text', () => ({ AppText: require('react-native').Text }));

jest.mock('expo-router/ui', () => ({
  Tabs: ({ children, ...props }: { children?: ReactNode }) => {
    const React = require('react');
    const { View: MockView } = require('react-native');
    return React.createElement(MockView, props, children);
  },
  TabSlot: (props: object) => {
    const React = require('react');
    const { View: MockView } = require('react-native');
    return React.createElement(MockView, { testID: 'tab-slot', ...props });
  },
  TabList: ({ children, ...props }: { children?: ReactNode }) => {
    const React = require('react');
    const { View: MockView } = require('react-native');
    return React.createElement(MockView, props, children);
  },
  TabTrigger: ({ children, name, ...props }: { children?: ReactNode; name: string }) => {
    const React = require('react');
    const { Pressable: MockPressable } = require('react-native');
    return React.createElement(
      MockPressable,
      { accessibilityLabel: `tab-${name}`, ...props },
      children,
    );
  },
}));

beforeEach(() => {
  mockPush.mockReset();
  mockUsePathname.mockReset();
  mockUsePathname.mockReturnValue('/');
  mockUseSafeAreaInsets.mockReset();
  mockUseSafeAreaInsets.mockReturnValue({ top: 0, right: 0, bottom: 24, left: 0 });
});

describe('native app tabs', () => {
  test.each([
    ['/', 'home'],
    ['/try-outfits/look', 'shuffle'],
    ['/closet/item', 'shirt'],
    ['/settings/profile', 'settings'],
    ['/unknown', 'home-outline'],
  ])('reflects the current route %s', async (pathname, selectedIcon) => {
    mockUsePathname.mockReturnValue(pathname);
    const view = await render(<NativeAppTabs />);

    expect(view.getByText(selectedIcon)).toBeTruthy();
    expect(view.getByTestId('tab-slot')).toBeTruthy();
  });

  test('opens add clothes and covers both pressed styles', async () => {
    const view = await render(<NativeAppTabs />);
    const add = view.getByRole('button', { name: 'Add clothes' });

    await fireEvent.press(add);

    expect(mockPush).toHaveBeenCalledWith('/add-clothes');
  });

  test('keeps the bar above a small safe area', async () => {
    mockUseSafeAreaInsets.mockReturnValue({ top: 0, right: 0, bottom: 0, left: 0 });
    expect((await render(<NativeAppTabs />)).getByText('Home')).toBeTruthy();
  });
});

describe('web app tabs', () => {
  test('renders tabs and opens add clothes', async () => {
    const view = await render(<WebAppTabs />);
    const add = view.getByRole('button', { name: 'Add clothes' });

    await fireEvent.press(add);

    expect(mockPush).toHaveBeenCalledWith('/add-clothes');
    expect(view.getByText('Settings')).toBeTruthy();
  });

  test.each([false, true])('renders a tab button with focused=%s', async (isFocused) => {
    const onPress = jest.fn();
    const view = await render(
      <TabButton icon="★" isFocused={isFocused} onPress={onPress}>Label</TabButton>,
    );
    await fireEvent.press(view.getByText('Label'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('renders the custom tab list children', async () => {
    const view = await render(
      <CustomTabList accessibilityLabel="custom tabs"><Text>Child tab</Text></CustomTabList>,
    );

    expect(view.getByLabelText('custom tabs')).toBeTruthy();
    expect(view.getByText('Child tab')).toBeTruthy();
  });
});
