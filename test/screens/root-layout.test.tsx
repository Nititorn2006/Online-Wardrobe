/* eslint-disable @typescript-eslint/no-require-imports, react/display-name */
import { expect, jest, test } from '@jest/globals';
import { render, waitFor } from '@testing-library/react-native';

import RootLayout from '@/app/_layout';

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Stack = ({ children, ...props }: { children?: import('react').ReactNode }) =>
    React.createElement(View, { testID: 'stack', ...props }, children);
  Stack.Screen = ({ name, ...props }: { name: string }) =>
    React.createElement(View, { accessibilityLabel: `screen-${name}`, ...props });

  return {
    DefaultTheme: {
      dark: false,
      colors: {
        background: 'old-background',
        border: 'old-border',
        card: 'old-card',
        notification: 'old-notification',
        primary: 'old-primary',
        text: 'old-text',
      },
      fonts: {},
    },
    Stack,
    ThemeProvider: ({ children, value }: { children?: import('react').ReactNode; value: object }) =>
      React.createElement(View, { testID: 'theme-provider', value }, children),
  };
});

jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(() => Promise.resolve()),
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: (props: object) => {
    const React = require('react');
    return React.createElement(require('react-native').View, { testID: 'status-bar', ...props });
  },
}));

jest.mock('@/features/wardrobe/text-size-provider', () => ({
  TextSizeProvider: ({ children }: { children?: import('react').ReactNode }) => {
    const React = require('react');
    return React.createElement(require('react-native').View, { testID: 'text-size-provider' }, children);
  },
}));

jest.mock('@/features/wardrobe/wardrobe-provider', () => ({
  WardrobeProvider: ({ children }: { children?: import('react').ReactNode }) => {
    const React = require('react');
    return React.createElement(require('react-native').View, { testID: 'wardrobe-provider' }, children);
  },
  useWardrobe: jest.fn(),
}));

const mockSplash = jest.requireMock('expo-splash-screen') as {
  hideAsync: jest.Mock;
  preventAutoHideAsync: jest.Mock;
};
const mockUseWardrobe = (
  jest.requireMock('@/features/wardrobe/wardrobe-provider') as { useWardrobe: jest.Mock }
).useWardrobe;

test('waits for hydration and then builds the complete navigation tree', async () => {
  expect(mockSplash.preventAutoHideAsync).toBeDefined();
  mockUseWardrobe.mockReturnValue({ isHydrated: false });
  const view = await render(<RootLayout />);

  expect(view.getByTestId('text-size-provider')).toBeTruthy();
  expect(view.getByTestId('wardrobe-provider')).toBeTruthy();
  expect(view.queryByTestId('stack')).toBeNull();
  expect(mockSplash.hideAsync).not.toHaveBeenCalled();

  mockUseWardrobe.mockReturnValue({ isHydrated: true });
  await view.rerender(<RootLayout />);

  await waitFor(() => expect(mockSplash.hideAsync).toHaveBeenCalledTimes(1));
  expect(view.getByTestId('theme-provider').props.value.colors).toEqual(
    expect.objectContaining({
      background: '#F7F5F1',
      card: '#FFFFFF',
      primary: '#4338B8',
      text: '#202826',
    }),
  );
  expect(view.getByTestId('status-bar').props.style).toBe('dark');
  expect(view.getByLabelText('screen-(tabs)')).toBeTruthy();
  expect(view.getByLabelText('screen-add-clothes').props.options).toEqual({
    animation: 'slide_from_bottom',
    presentation: 'fullScreenModal',
  });
  expect(view.getByLabelText('screen-clothes').props.options).toEqual({
    animation: 'slide_from_bottom',
    presentation: 'modal',
  });
});
