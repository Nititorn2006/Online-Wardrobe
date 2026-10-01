import { act, render, waitFor } from '@testing-library/react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import {
  AnimatedIcon as NativeAnimatedIcon,
  AnimatedSplashOverlay as NativeAnimatedSplashOverlay,
} from '../animated-icon';
import {
  AnimatedIcon as WebAnimatedIcon,
  AnimatedSplashOverlay as WebAnimatedSplashOverlay,
} from '../animated-icon.web';

jest.mock('expo-image', () => {
  const mockJest = require('@jest/globals').jest;
  const React = mockJest.requireActual('react');
  const reactNative = mockJest.requireActual('react-native');
  return {
    Image: mockJest.fn((props: object) =>
      React.createElement(reactNative.View, { ...props, testID: 'animated-image' }),
    ),
  };
});

jest.mock('expo-splash-screen', () => ({ hideAsync: jest.fn(() => Promise.resolve()) }));

jest.mock('react-native-worklets', () => ({
  scheduleOnRN: jest.fn((callback: (value: boolean) => void, value: boolean) => callback(value)),
}));

jest.mock('react-native-reanimated', () => {
  const mockJest = require('@jest/globals').jest;
  const reactNative = mockJest.requireActual('react-native');
  const KeyframeMock = mockJest.fn(function KeyframeMock(this: Record<string, unknown>, config: object) {
    this.config = config;
    this.duration = mockJest.fn(() => this);
    this.withCallback = mockJest.fn((callback: (finished: boolean) => void) => {
      this.callback = callback;
      return this;
    });
  });

  return {
    __esModule: true,
    default: { View: reactNative.View },
    Easing: { elastic: mockJest.fn((value: number) => `elastic-${value}`) },
    Keyframe: KeyframeMock,
  };
});

const mockHideAsync = SplashScreen.hideAsync as jest.MockedFunction<typeof SplashScreen.hideAsync>;
const mockScheduleOnRN = scheduleOnRN as jest.MockedFunction<typeof scheduleOnRN>;
const mockImage = Image as unknown as jest.Mock;
const mockKeyframe = Keyframe as unknown as jest.Mock;

describe('animated icons', () => {
  beforeEach(() => {
    mockHideAsync.mockClear();
    mockScheduleOnRN.mockClear();
    mockImage.mockClear();
  });

  test('animates and then removes the native splash overlay', async () => {
    const view = await render(<NativeAnimatedSplashOverlay />);
    await act(async () => {
      view.root.props.onLayout();
      await Promise.resolve();
    });

    expect(mockHideAsync).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(view.root.props.entering).toBeTruthy();
    });

    const splashKeyframe = mockKeyframe.mock.instances.find(
      (instance: { withCallback?: jest.Mock }) => instance.withCallback?.mock.calls.length,
    ) as { callback: (finished: boolean) => void };

    await act(() => splashKeyframe.callback(false));
    expect(view.getByTestId('animated-image')).toBeTruthy();

    await act(() => splashKeyframe.callback(true));
    expect(view.queryByTestId('animated-image')).toBeNull();
    expect(mockScheduleOnRN).toHaveBeenCalledWith(expect.any(Function), false);
  });

  test('renders every layer of native and web icons', async () => {
    const native = await render(<NativeAnimatedIcon />);
    expect(native.getAllByTestId('animated-image')).toHaveLength(2);
    await native.unmount();

    const web = await render(<WebAnimatedIcon />);
    expect(web.getAllByTestId('animated-image')).toHaveLength(2);
    expect(WebAnimatedSplashOverlay()).toBeNull();
  });
});
