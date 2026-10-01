import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import {
  act,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Alert, Platform } from 'react-native';

import AddClothesScreen from '@/app/add-clothes';
import { useWardrobe } from '@/features/wardrobe/wardrobe-provider';

const mockAddItem = jest.fn<(...args: any[]) => Promise<unknown>>();

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
    useSafeAreaInsets: () => ({ top: 8, right: 0, bottom: 4, left: 0 }),
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
  const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    ClothingColorPicker: ({
      onChange,
      value,
    }: {
      onChange: (value: string) => void;
      value: string;
    }) =>
      React.createElement(
        Pressable,
        {
          accessibilityLabel: `Color picker ${value}`,
          accessibilityRole: 'button',
          onPress: () => onChange('#ABCDEF'),
        },
        React.createElement(Text, null, 'Pick another color'),
      ),
  };
});

jest.mock('@/features/wardrobe/wardrobe-provider', () => ({
  useWardrobe: jest.fn(),
}));

const mockBack = router.back as jest.MockedFunction<typeof router.back>;
const mockRequestCamera =
  ImagePicker.requestCameraPermissionsAsync as jest.MockedFunction<
    typeof ImagePicker.requestCameraPermissionsAsync
  >;
const mockRequestLibrary =
  ImagePicker.requestMediaLibraryPermissionsAsync as jest.MockedFunction<
    typeof ImagePicker.requestMediaLibraryPermissionsAsync
  >;
const mockLaunchCamera = ImagePicker.launchCameraAsync as jest.MockedFunction<
  typeof ImagePicker.launchCameraAsync
>;
const mockLaunchLibrary = ImagePicker.launchImageLibraryAsync as jest.MockedFunction<
  typeof ImagePicker.launchImageLibraryAsync
>;
const mockUseWardrobe = useWardrobe as jest.MockedFunction<typeof useWardrobe>;

const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

function cameraPermission(granted: boolean) {
  return {
    canAskAgain: true,
    expires: 'never',
    granted,
    status: granted ? 'granted' : 'denied',
  } as Awaited<ReturnType<typeof ImagePicker.requestCameraPermissionsAsync>>;
}

function libraryPermission(granted: boolean) {
  return {
    canAskAgain: true,
    expires: 'never',
    granted,
    status: granted ? 'granted' : 'denied',
  } as Awaited<ReturnType<typeof ImagePicker.requestMediaLibraryPermissionsAsync>>;
}

function imageAsset(uri: string): ImagePicker.ImagePickerAsset {
  return { height: 100, uri, width: 100 };
}

type TestView = Awaited<ReturnType<typeof render>>;

function saveButton(view: TestView) {
  return view.getByRole('button', { name: 'Save clothing item' });
}

async function chooseSuccessfulPhoto(view: TestView, source: 'camera' | 'library' = 'camera') {
  const launcher = source === 'camera' ? mockLaunchCamera : mockLaunchLibrary;
  launcher.mockResolvedValueOnce({
    canceled: false,
    assets: [imageAsset('file:///shirt.jpg')],
  });
  const label = source === 'camera' ? 'Take clothing photo' : 'Choose clothing photo from library';
  await fireEvent.press(view.getByRole('button', { name: label }));
}

describe('AddClothesScreen on native platforms', () => {
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    mockUseWardrobe.mockReturnValue(
      { addItem: mockAddItem } as unknown as ReturnType<typeof useWardrobe>,
    );
    mockRequestCamera.mockResolvedValue(cameraPermission(true));
    mockRequestLibrary.mockResolvedValue(libraryPermission(true));
    mockLaunchCamera.mockResolvedValue({ canceled: true, assets: null });
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: null });
    mockAddItem.mockResolvedValue({});
  });

  test('renders the empty form, exercises controls, and closes a clean draft', async () => {
    const view = await render(<AddClothesScreen />);

    expect(view.getByText('Add a photo and name to save')).toBeTruthy();
    expect(saveButton(view).props.accessibilityState.disabled).toBe(true);
    expect(view.getByText('Comfortable everyday outfits')).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Close add clothes' }));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  test('warns before discarding drafts made by every classification field', async () => {
    const cases: ((view: TestView) => Promise<unknown>)[] = [
      (view) => fireEvent.changeText(view.getByLabelText('Clothing name'), 'Draft'),
      (view) => fireEvent.press(view.getByRole('button', { name: 'Bottoms category' })),
      (view) => fireEvent.press(view.getByRole('button', { name: 'Formal dress code' })),
      (view) => fireEvent.press(view.getByRole('button', { name: /^Color picker/ })),
    ];

    for (const makeDraft of cases) {
      const view = await render(<AddClothesScreen />);
      await makeDraft(view);
      await fireEvent.press(view.getByRole('button', { name: 'Close add clothes' }));
      const buttons = alertSpy.mock.calls.at(-1)?.[2] as
        | { text?: string; onPress?: () => void }[]
        | undefined;
      expect(buttons?.map((button) => button.text)).toEqual(['Keep editing', 'Discard']);
      buttons?.[1].onPress?.();
      await view.unmount();
    }

    expect(mockBack).toHaveBeenCalledTimes(cases.length);
  });

  test('shows the three save requirements as the photo and name change', async () => {
    const view = await render(<AddClothesScreen />);

    await fireEvent.changeText(view.getByLabelText('Clothing name'), '  Shirt  ');
    expect(view.getByText('Add a photo to save')).toBeTruthy();
    await fireEvent.changeText(view.getByLabelText('Clothing name'), '');

    await chooseSuccessfulPhoto(view);
    expect(view.getByText('Add a name to save')).toBeTruthy();
    expect(view.getByLabelText('Photo of new clothing item')).toBeTruthy();

    await fireEvent.changeText(view.getByLabelText('Clothing name'), '  Shirt  ');
    expect(view.queryByText(/to save$/)).toBeNull();
    expect(view.getByLabelText('Photo of Shirt')).toBeTruthy();
    expect(saveButton(view).props.accessibilityState.disabled).toBe(false);

    await fireEvent.press(view.getByRole('button', { name: 'Remove selected photo' }));
    expect(view.getByText('Add a photo to save')).toBeTruthy();
  });

  test('handles denied camera and library permissions', async () => {
    mockRequestCamera.mockResolvedValueOnce(cameraPermission(false));
    const cameraView = await render(<AddClothesScreen />);
    await fireEvent.press(cameraView.getByRole('button', { name: 'Take clothing photo' }));
    expect(alertSpy).toHaveBeenLastCalledWith(
      'Permission needed',
      expect.stringContaining('camera'),
      [{ text: 'OK' }],
    );
    expect(mockLaunchCamera).not.toHaveBeenCalled();
    await cameraView.unmount();

    mockRequestLibrary.mockResolvedValueOnce(libraryPermission(false));
    const libraryView = await render(<AddClothesScreen />);
    await fireEvent.press(
      libraryView.getByRole('button', { name: 'Choose clothing photo from library' }),
    );
    expect(alertSpy).toHaveBeenLastCalledWith(
      'Permission needed',
      expect.stringContaining('photo library'),
      [{ text: 'OK' }],
    );
    expect(mockLaunchLibrary).not.toHaveBeenCalled();
  });

  test('ignores a second picker request and renders the busy overlay', async () => {
    const permission = deferred<ReturnType<typeof cameraPermission>>();
    mockRequestCamera.mockReturnValueOnce(permission.promise);
    const view = await render(<AddClothesScreen />);

    await fireEvent.press(view.getByRole('button', { name: 'Take clothing photo' }));
    await waitFor(() => expect(view.getByText('Opening photos…')).toBeTruthy());
    const busyCamera = view.getByRole('button', { name: 'Take clothing photo' });
    busyCamera.props.onPress();
    expect(mockRequestCamera).toHaveBeenCalledTimes(1);

    await act(async () => permission.resolve(cameraPermission(true)));
    await waitFor(() => expect(view.queryByText('Opening photos…')).toBeNull());
  });

  test('handles canceled pickers, missing assets, and picker errors', async () => {
    const canceledView = await render(<AddClothesScreen />);
    await fireEvent.press(canceledView.getByRole('button', { name: 'Take clothing photo' }));
    expect(canceledView.queryByLabelText(/Photo of/)).toBeNull();
    await canceledView.unmount();

    mockLaunchLibrary.mockResolvedValueOnce({ canceled: false, assets: [] });
    const missingView = await render(<AddClothesScreen />);
    await fireEvent.press(
      missingView.getByRole('button', { name: 'Choose clothing photo from library' }),
    );
    expect(alertSpy).toHaveBeenLastCalledWith(
      'Couldn’t add that photo',
      'The image picker returned no photo.',
      [{ text: 'OK' }],
    );
    await missingView.unmount();

    mockLaunchCamera.mockRejectedValueOnce('not-an-error');
    const errorView = await render(<AddClothesScreen />);
    await fireEvent.press(errorView.getByRole('button', { name: 'Take clothing photo' }));
    expect(alertSpy).toHaveBeenLastCalledWith(
      'Couldn’t add that photo',
      'Something went wrong while opening your photo. Please try again.',
      [{ text: 'OK' }],
    );
  });

  test('validates saving even when the disabled button handler is invoked directly', async () => {
    const view = await render(<AddClothesScreen />);

    await act(async () => saveButton(view).props.onPress());
    expect(alertSpy).toHaveBeenLastCalledWith(
      'Add a photo',
      'Choose or take a photo before saving this item.',
    );

    await chooseSuccessfulPhoto(view);
    await act(async () => saveButton(view).props.onPress());
    expect(alertSpy).toHaveBeenLastCalledWith(
      'Add a name',
      'Give this piece a short name before saving it.',
    );
  });

  test('saves all selected details, shows progress, and ignores a duplicate save', async () => {
    const pending = deferred<unknown>();
    mockAddItem.mockReturnValueOnce(pending.promise);
    const view = await render(<AddClothesScreen />);
    await chooseSuccessfulPhoto(view, 'library');
    await fireEvent.changeText(view.getByLabelText('Clothing name'), '  Work shirt  ');
    await fireEvent.press(view.getByRole('button', { name: 'Bottoms category' }));
    await fireEvent.press(view.getByRole('button', { name: 'Business dress code' }));
    await fireEvent.press(view.getByRole('button', { name: /^Color picker/ }));

    await fireEvent.press(saveButton(view));
    await waitFor(() => expect(saveButton(view).props.accessibilityState.disabled).toBe(true));
    saveButton(view).props.onPress();
    expect(mockAddItem).toHaveBeenCalledTimes(1);
    expect(mockAddItem).toHaveBeenCalledWith({
      name: 'Work shirt',
      category: 'bottoms',
      formality: 'business',
      color: '#ABCDEF',
      sourceUri: 'file:///shirt.jpg',
    });

    await act(async () => pending.resolve({}));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  test('reports save failures using the error message and fallback', async () => {
    const failures: [unknown, string][] = [
      [new Error('Storage full'), 'Storage full'],
      [new Error(''), 'Your changes weren’t saved. Please try again.'],
      ['bad', 'Your changes weren’t saved. Please try again.'],
    ];

    for (const [failure, expectedMessage] of failures) {
      mockAddItem.mockRejectedValueOnce(failure);
      const view = await render(<AddClothesScreen />);
      await chooseSuccessfulPhoto(view);
      await fireEvent.changeText(view.getByLabelText('Clothing name'), 'Shirt');
      await fireEvent.press(saveButton(view));
      expect(alertSpy).toHaveBeenLastCalledWith(
        'Couldn’t save this item',
        expectedMessage,
        [{ text: 'OK' }],
      );
      expect(saveButton(view).props.accessibilityState.disabled).toBe(false);
      await view.unmount();
    }
  });
});
