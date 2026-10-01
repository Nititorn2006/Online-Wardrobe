/* eslint-disable @typescript-eslint/no-require-imports */
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Collapsible } from '../ui/collapsible';

jest.mock('@/hooks/use-theme', () => ({ useTheme: () => ({ text: '#123456' }) }));
jest.mock('@/components/themed-text', () => ({ ThemedText: require('react-native').Text }));
jest.mock('@/components/themed-view', () => ({ ThemedView: require('react-native').View }));
jest.mock('expo-symbols', () => ({
  SymbolView: (props: object) => {
    const React = require('react');
    return React.createElement(require('react-native').View, { testID: 'symbol', ...props });
  },
}));
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: require('react-native').View },
  FadeIn: { duration: jest.fn(() => 'fade-in-200') },
}));

const mockDuration = (
  jest.requireMock('react-native-reanimated') as { FadeIn: { duration: jest.Mock } }
).FadeIn.duration;

describe('Collapsible', () => {
  test('opens and closes its content', async () => {
    const view = await render(
      <Collapsible title="Details"><Text>Hidden details</Text></Collapsible>,
    );
    const title = view.getByText('Details');
    expect(view.queryByText('Hidden details')).toBeNull();
    expect(view.getByTestId('symbol').props.style).toEqual({
      transform: [{ rotate: '90deg' }],
    });
    await fireEvent.press(title);
    expect(view.getByText('Hidden details')).toBeTruthy();
    expect(view.getByTestId('symbol').props.style).toEqual({
      transform: [{ rotate: '-90deg' }],
    });
    expect(mockDuration).toHaveBeenCalledWith(200);

    await fireEvent.press(view.getByText('Details'));
    expect(view.queryByText('Hidden details')).toBeNull();
  });
});
