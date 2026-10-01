import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Alert } from 'react-native';

import AddClothesScreen from '../add-clothes';
import { useWardrobe } from '@/features/wardrobe/wardrobe-provider';

const mockAddItem = jest.fn<(...args: any[]) => Promise<unknown>>();

jest.mock('react-native/Libraries/Utilities/Platform', () => {
  const platform = {
    OS: 'web',
    select: (spec: Record<string, unknown>) => spec.web ?? spec.default,
  };
  return { __esModule: true, default: platform, ...platform };
});

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
}));

jest.mock('expo-image-picker', () => ({
  CameraType: { back: 'back' },
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('react-native/Libraries/Components/Pressable/Pressable', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const View = jest.requireActual<{ default: typeof import('react-native').View }>(
    'react-native/Libraries/Components/View/View',
  ).default;
  return {
    __esModule: true,
    default: ({ style, ...props }: { style?: unknown; [key: string]: unknown }) => {
      let resolvedStyle = style;
      if (typeof style === 'function') {
        resolvedStyle = style({ pressed: false });
        style({ pressed: true });
      }
      return React.createElement(
        View,
        { ...props, accessible: true, style: resolvedStyle } as never,
      );
    },
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    SafeAreaView: (props: Record<string, unknown>) => React.createElement(View, props),
    useSafeAreaInsets: () => ({ top: 24, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@/components/app-text', () => {
  const reactNative = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    AppText: reactNative.Text,
    AppTextInput: reactNative.TextInput,
  };
});

jest.mock('@/components/wardrobe/clothing-color-picker', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { ClothingColorPicker: (props: Record<string, unknown>) => React.createElement(View, props) };
});

jest.mock('@/features/wardrobe/wardrobe-provider', () => ({
  useWardrobe: jest.fn(),
}));

const mockBack = router.back as jest.MockedFunction<typeof router.back>;
const mockRequestCamera = ImagePicker.requestCameraPermissionsAsync as jest.Mock;
const mockRequestLibrary = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const mockLaunchCamera = ImagePicker.launchCameraAsync as jest.MockedFunction<
  typeof ImagePicker.launchCameraAsync
>;
const mockLaunchLibrary = ImagePicker.launchImageLibraryAsync as jest.MockedFunction<
  typeof ImagePicker.launchImageLibraryAsync
>;
const mockUseWardrobe = useWardrobe as jest.MockedFunction<typeof useWardrobe>;

const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

function imageAsset(
  uri: string,
  details: Partial<ImagePicker.ImagePickerAsset> = {},
): ImagePicker.ImagePickerAsset {
  return { height: 100, uri, width: 100, ...details };
}

describe('AddClothesScreen in a browser', () => {
  beforeEach(() => {
    mockUseWardrobe.mockReturnValue(
      { addItem: mockAddItem } as unknown as ReturnType<typeof useWardrobe>,
    );
    mockLaunchCamera.mockResolvedValue({ canceled: true, assets: null });
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: null });
  });

  test('uses an existing data URL without requesting native permission', async () => {
    mockLaunchCamera.mockResolvedValueOnce({
      canceled: false,
      assets: [imageAsset('data:image/png;base64,already-data')],
    });
    const view = await render(<AddClothesScreen />);

    await fireEvent.press(view.getByRole('button', { name: 'Take clothing photo' }));

    expect(mockRequestCamera).not.toHaveBeenCalled();
    expect(view.getByLabelText('Photo of new clothing item').props.source).toEqual({
      uri: 'data:image/png;base64,already-data',
    });
  });

  test('converts browser assets with explicit and default MIME types', async () => {
    const cases = [
      {
        asset: imageAsset('blob:one', { base64: 'AAAA', mimeType: 'image/webp' }),
        expected: 'data:image/webp;base64,AAAA',
      },
      {
        asset: imageAsset('blob:two', { base64: 'BBBB' }),
        expected: 'data:image/jpeg;base64,BBBB',
      },
    ];

    for (const { asset, expected } of cases) {
      mockLaunchLibrary.mockResolvedValueOnce({ canceled: false, assets: [asset] });
      const view = await render(<AddClothesScreen />);
      await fireEvent.press(
        view.getByRole('button', { name: 'Choose clothing photo from library' }),
      );
      expect(view.getByLabelText('Photo of new clothing item').props.source).toEqual({ uri: expected });
      await view.unmount();
    }

    expect(mockRequestLibrary).not.toHaveBeenCalled();
  });

  test('reports when a browser asset has no image data', async () => {
    mockLaunchLibrary.mockResolvedValueOnce({
      canceled: false,
      assets: [imageAsset('blob:missing')],
    });
    const view = await render(<AddClothesScreen />);

    await fireEvent.press(
      view.getByRole('button', { name: 'Choose clothing photo from library' }),
    );

    expect(alertSpy).toHaveBeenLastCalledWith(
      'Couldn’t add that photo',
      'The browser did not return image data.',
      [{ text: 'OK' }],
    );
  });
});
