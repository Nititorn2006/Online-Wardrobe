import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import {
  act,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import ClothingDetailScreen from '../clothes';
import type { ClothingItem } from '@/features/wardrobe/types';
import { useWardrobe } from '@/features/wardrobe/wardrobe-provider';

const mockParams: { id?: string | string[] } = { id: 'item-1' };
const mockToggleFavorite = jest.fn<(id: string) => Promise<void>>();
const mockDeleteItem = jest.fn<(id: string) => Promise<void>>();
const mockUpdateItemDetails = jest.fn<(...args: any[]) => Promise<void>>();
const mockWardrobe: { items: ClothingItem[] } = { items: [] };

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: jest.fn(),
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

jest.mock('expo-image', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Image: (props: Record<string, unknown>) => React.createElement(View, props) };
});

jest.mock('react-native-safe-area-context', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { SafeAreaView: (props: Record<string, unknown>) => React.createElement(View, props) };
});

jest.mock('@/components/app-text', () => {
  const reactNative = jest.requireActual<typeof import('react-native')>('react-native');
  return { AppText: reactNative.Text, AppTextInput: reactNative.TextInput };
});

jest.mock('@/components/wardrobe/clothing-color-picker', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    ClothingColorPicker: ({
      disabled,
      onChange,
      value,
    }: {
      disabled?: boolean;
      onChange: (value: string) => void;
      value: string;
    }) =>
      React.createElement(
        Pressable,
        {
          accessibilityLabel: `Color picker ${value}`,
          accessibilityRole: 'button',
          disabled,
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
const mockUseLocalSearchParams = useLocalSearchParams as jest.MockedFunction<
  typeof useLocalSearchParams
>;
const mockUseWardrobe = useWardrobe as jest.MockedFunction<typeof useWardrobe>;

const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

function item(overrides: Partial<ClothingItem> = {}): ClothingItem {
  return {
    id: 'item-1',
    name: 'Black shirt',
    category: 'tops',
    formality: 'casual',
    color: '#292A2A',
    imageUri: 'file:///black-shirt.jpg',
    isFavorite: false,
    createdAt: '2026-09-25T00:00:00.000Z',
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

type TestView = Awaited<ReturnType<typeof render>>;

function editButton(view: TestView) {
  return view.getByRole('button', { name: 'Edit clothing details' });
}

describe('ClothingDetailScreen', () => {
  beforeEach(() => {
    mockParams.id = 'item-1';
    mockWardrobe.items = [item()];
    mockUseLocalSearchParams.mockReturnValue(mockParams);
    mockUseWardrobe.mockImplementation(
      () =>
        ({
          items: mockWardrobe.items,
          outfits: [],
          isHydrated: true,
          addItem: jest.fn(),
          toggleFavorite: mockToggleFavorite,
          deleteItem: mockDeleteItem,
          updateItemDetails: mockUpdateItemDetails,
          saveOutfit: jest.fn(),
          deleteOutfit: jest.fn(),
        }) as unknown as ReturnType<typeof useWardrobe>,
    );
    mockToggleFavorite.mockResolvedValue(undefined);
    mockDeleteItem.mockResolvedValue(undefined);
    mockUpdateItemDetails.mockResolvedValue(undefined);
  });

  test('renders a missing item for string and array parameters and goes back', async () => {
    mockWardrobe.items = [];
    const stringView = await render(<ClothingDetailScreen />);
    expect(stringView.getByText('This piece is no longer here')).toBeTruthy();
    await fireEvent.press(stringView.getByText('Back to my clothes'));
    expect(mockBack).toHaveBeenCalledTimes(1);
    await stringView.unmount();

    mockParams.id = ['missing', 'ignored'];
    const arrayView = await render(<ClothingDetailScreen />);
    expect(arrayView.getByText('This piece is no longer here')).toBeTruthy();
  });

  test('renders all item metadata, closes, and covers favorite and pressed appearances', async () => {
    const view = await render(<ClothingDetailScreen />);
    expect(view.getByText('Black shirt')).toBeTruthy();
    expect(view.getAllByText('Tops')).toHaveLength(2);
    expect(view.getByText('Casual')).toBeTruthy();
    expect(view.getByText('Not yet')).toBeTruthy();
    expect(view.getByLabelText('Photo of Black shirt')).toBeTruthy();
    expect(view.getByLabelText('Color #292A2A')).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Close clothing details' }));
    expect(mockBack).toHaveBeenCalledTimes(1);
    await view.unmount();

    mockWardrobe.items = [item({ isFavorite: true })];
    const favoriteView = await render(<ClothingDetailScreen />);
    expect(favoriteView.getByRole('button', { name: 'Remove from favorites' })).toBeTruthy();
    expect(favoriteView.getByText('Saved to favorites')).toBeTruthy();
    expect(favoriteView.getByText('Yes')).toBeTruthy();
  });

  test('renders safely when stored category and formality labels are unknown', async () => {
    mockWardrobe.items = [
      item({
        category: 'unknown-category' as ClothingItem['category'],
        formality: 'unknown-formality' as ClothingItem['formality'],
      }),
    ];
    const view = await render(<ClothingDetailScreen />);
    expect(view.getByText('Black shirt')).toBeTruthy();
  });

  test('updates favorites from both controls and shows the pending state', async () => {
    const pending = deferred<void>();
    mockToggleFavorite.mockReturnValueOnce(pending.promise);
    const view = await render(<ClothingDetailScreen />);

    await fireEvent.press(view.getByRole('button', { name: 'Add to favorites' }));
    await waitFor(() =>
      expect(view.getByRole('button', { name: 'Add to favorites' }).props.accessibilityState.busy).toBe(
        true,
      ),
    );
    await act(async () => pending.resolve(undefined));
    expect(mockToggleFavorite).toHaveBeenCalledWith('item-1');

    await fireEvent.press(view.getByText('Add to favorites'));
    expect(mockToggleFavorite).toHaveBeenCalledTimes(2);
  });

  test('reports favorite errors with explicit and fallback messages', async () => {
    const failures: [unknown, string][] = [
      [new Error('Favorite unavailable'), 'Favorite unavailable'],
      ['bad', 'Please try again.'],
    ];

    for (const [failure, expected] of failures) {
      mockToggleFavorite.mockRejectedValueOnce(failure);
      const view = await render(<ClothingDetailScreen />);
      await fireEvent.press(view.getByRole('button', { name: 'Add to favorites' }));
      expect(alertSpy).toHaveBeenLastCalledWith('Couldn’t update favorite', expected);
      await view.unmount();
    }
  });

  test('opens, changes, cancels, and reopens the classification editor', async () => {
    const view = await render(<ClothingDetailScreen />);
    await fireEvent.press(editButton(view));

    expect(view.getByText('Main color')).toBeTruthy();
    expect(view.getByLabelText('Clothing name').props.value).toBe('Black shirt');
    await fireEvent.changeText(view.getByLabelText('Clothing name'), 'Renamed shirt');
    expect(
      view.getByRole('button', { name: 'Tops' }).props.accessibilityState?.selected,
    ).toBe(true);
    await fireEvent.press(view.getByText('Bottoms'));
    await fireEvent.press(view.getByText('Formal'));
    await fireEvent.press(view.getByRole('button', { name: /^Color picker/ }));
    expect(view.getByRole('button', { name: 'Save clothing changes' })).toBeTruthy();

    await fireEvent.press(view.getByText('Cancel'));
    expect(view.queryByText('Main color')).toBeNull();
    await fireEvent.press(editButton(view));
    expect(view.getByRole('button', { name: 'Save clothing changes' })).toBeTruthy();
  });

  test('saves a renamed item with changed category, dress code, and color while showing progress', async () => {
    const pending = deferred<void>();
    mockUpdateItemDetails.mockReturnValueOnce(pending.promise);
    const view = await render(<ClothingDetailScreen />);
    await fireEvent.press(editButton(view));
    await fireEvent.changeText(view.getByLabelText('Clothing name'), '  Renamed shirt  ');
    await fireEvent.press(view.getByText('Bottoms'));
    await fireEvent.press(view.getByText('Formal'));
    await fireEvent.press(view.getByRole('button', { name: /^Color picker/ }));
    await fireEvent.press(view.getByText('Save changes'));

    await waitFor(() =>
      expect(view.getByLabelText('Saving clothing changes')).toBeTruthy(),
    );
    expect(mockUpdateItemDetails).toHaveBeenCalledWith('item-1', {
      name: '  Renamed shirt  ',
      category: 'bottoms',
      formality: 'formal',
      color: '#ABCDEF',
    });

    await act(async () => pending.resolve(undefined));
    expect(view.queryByText('Main color')).toBeNull();
  });

  test('keeps the editor open and reports detail update failures', async () => {
    const failures: [unknown, string][] = [
      [new Error('Update unavailable'), 'Update unavailable'],
      [{ reason: 'bad' }, 'Please try again.'],
    ];

    for (const [failure, expected] of failures) {
      mockUpdateItemDetails.mockRejectedValueOnce(failure);
      const view = await render(<ClothingDetailScreen />);
      await fireEvent.press(editButton(view));
      await fireEvent.press(view.getByText('Save changes'));
      expect(alertSpy).toHaveBeenLastCalledWith('Couldn’t update details', expected);
      expect(view.getByText('Main color')).toBeTruthy();
      await view.unmount();
    }
  });

  test('confirms deletion, shows progress, deletes, and returns', async () => {
    const pending = deferred<void>();
    mockDeleteItem.mockReturnValueOnce(pending.promise);
    const view = await render(<ClothingDetailScreen />);
    await fireEvent.press(view.getByText('Remove from closet'));

    expect(alertSpy).toHaveBeenLastCalledWith(
      'Remove Black shirt?',
      'This will delete the piece and its saved photo from your closet.',
      expect.any(Array),
    );
    const buttons = alertSpy.mock.calls.at(-1)?.[2] as {
      text: string;
      onPress?: () => void;
    }[];
    expect(buttons.map((button) => button.text)).toEqual(['Cancel', 'Remove']);
    await act(async () => buttons[1].onPress?.());
    await waitFor(() =>
      expect(
        view.getByRole('button', { name: 'Delete clothing item' }).props.accessibilityState,
      ).toEqual({ busy: true, disabled: true }),
    );

    await act(async () => pending.resolve(undefined));
    expect(mockDeleteItem).toHaveBeenCalledWith('item-1');
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  test('recovers from deletion errors with explicit and fallback messages', async () => {
    const failures: [unknown, string][] = [
      [new Error('Delete unavailable'), 'Delete unavailable'],
      [null, 'Please try again.'],
    ];

    for (const [failure, expected] of failures) {
      mockDeleteItem.mockRejectedValueOnce(failure);
      const view = await render(<ClothingDetailScreen />);
      await fireEvent.press(view.getByText('Remove from closet'));
      const buttons = alertSpy.mock.calls.at(-1)?.[2] as { onPress?: () => void }[];
      await act(async () => buttons[1].onPress?.());
      expect(alertSpy).toHaveBeenLastCalledWith('Couldn’t remove item', expected);
      expect(view.getByText('Remove from closet')).toBeTruthy();
      await view.unmount();
    }
  });
});
