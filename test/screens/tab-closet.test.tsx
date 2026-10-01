import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import type { ClothingItem } from '@/features/wardrobe/types';

import ClosetScreen from '@/app/(tabs)/closet';

const mockToggleFavorite = jest.fn<(id: string) => Promise<void>>();
const mockWardrobe: {
  items: ClothingItem[];
  toggleFavorite: typeof mockToggleFavorite;
} = {
  items: [],
  toggleFavorite: mockToggleFavorite,
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

      return React.createElement(actual.Pressable as never, {
        ...props,
        style,
      } as never);
    },
  });
  return mocked;
});

jest.mock('@/components/app-text', () => {
  const ReactNative = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    AppText: ReactNative.Text,
    AppTextInput: ReactNative.TextInput,
  };
});

jest.mock('@/components/wardrobe/clothing-card', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Pressable: NativePressable, Text, View } =
    jest.requireActual<typeof import('react-native')>('react-native');

  return {
    ClothingCard: ({ item, onPress, onToggleFavorite }: {
      item: ClothingItem;
      onPress: () => void;
      onToggleFavorite: () => void;
    }) => React.createElement(
      View,
      null,
      React.createElement(
        NativePressable,
        { accessibilityLabel: `Open ${item.name}`, accessibilityRole: 'button', onPress },
        React.createElement(Text, null, item.name),
      ),
      React.createElement(
        NativePressable,
        {
          accessibilityLabel: `Favorite ${item.name}`,
          accessibilityRole: 'button',
          onPress: onToggleFavorite,
        },
        React.createElement(Text, null, 'Favorite item'),
      ),
    ),
  };
});

jest.mock('@/components/wardrobe/empty-closet', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Pressable: NativePressable, Text, View } =
    jest.requireActual<typeof import('react-native')>('react-native');

  return {
    EmptyCloset: ({ body, buttonLabel, onButtonPress, title }: {
      body?: string;
      buttonLabel?: string;
      onButtonPress?: () => void;
      title?: string;
    }) => React.createElement(
      View,
      null,
      React.createElement(Text, null, title),
      React.createElement(Text, null, body),
      onButtonPress
        ? React.createElement(
            NativePressable,
            {
              accessibilityLabel: buttonLabel,
              accessibilityRole: 'button',
              onPress: onButtonPress,
            },
            React.createElement(Text, null, buttonLabel),
          )
        : null,
    ),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    SafeAreaView: (props: Record<string, unknown>) => React.createElement(View, props),
  };
});

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('@/features/wardrobe/wardrobe-provider', () => ({
  useWardrobe: () => mockWardrobe,
}));

function clothingItem(
  id: string,
  name: string,
  overrides: Partial<ClothingItem> = {},
): ClothingItem {
  return {
    id,
    name,
    category: 'tops',
    formality: 'casual',
    color: '#123456',
    imageUri: `file:///${id}.jpg`,
    isFavorite: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('ClosetScreen', () => {
  beforeEach(() => {
    mockWardrobe.items = [];
    mockToggleFavorite.mockResolvedValue(undefined);
  });

  test('shows the empty closet and opens add clothes', async () => {
    const view = await render(<ClosetScreen />);

    expect(view.getByText('Your closet is waiting')).toBeTruthy();
    expect(
      view.getByText(
        'Photograph your favorite pieces and keep your whole wardrobe in one beautiful place.',
      ),
    ).toBeTruthy();

    await fireEvent.press(view.getByRole('button', { name: 'Add your first item' }));
    expect(router.push).toHaveBeenCalledWith('/add-clothes');

  });

  test('sorts items, opens details, favorites an item, searches, and resets results', async () => {
    mockWardrobe.items = [
      clothingItem('older', 'Blue Shirt', {
        isFavorite: true,
        createdAt: '2026-09-01T00:00:00.000Z',
      }),
      clothingItem('newer', 'Black Trousers', {
        category: 'bottoms',
        formality: 'formal',
        createdAt: '2026-09-02T00:00:00.000Z',
      }),
    ];

    const view = await render(<ClosetScreen />);

    const names = view.getAllByText(/^(Blue Shirt|Black Trousers)$/);
    expect(names.map((node) => node.props.children)).toEqual([
      'Black Trousers',
      'Blue Shirt',
    ]);

    await fireEvent.press(view.getByRole('button', { name: 'Open Blue Shirt' }));
    await fireEvent.press(view.getByRole('button', { name: 'Favorite Blue Shirt' }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/clothes',
      params: { id: 'older' },
    });
    expect(mockToggleFavorite).toHaveBeenCalledWith('older');

    await fireEvent.changeText(
      view.getByLabelText('Search your clothes'),
      ' blue ',
    );
    expect(view.getByText('Blue Shirt')).toBeTruthy();
    expect(view.queryByText('Black Trousers')).toBeNull();
    expect(view.getByText('Reset filters')).toBeTruthy();
    await fireEvent.press(view.getByText('Reset filters'));
    expect(view.getByText('Black Trousers')).toBeTruthy();

    await fireEvent.changeText(
      view.getByLabelText('Search your clothes'),
      'unknown',
    );
    expect(view.getByText('No matching pieces')).toBeTruthy();
    expect(
      view.getByText(
        'We couldn’t find anything named “unknown”. Try another search or clear the filters.',
      ),
    ).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Clear search'));
    expect(view.getByText('Black Trousers')).toBeTruthy();
  });

  test('filters favorites and exposes the no-favorites empty state', async () => {
    mockWardrobe.items = [clothingItem('one', 'Only Piece')];
    const view = await render(<ClosetScreen />);

    expect(view.getByText('Only Piece')).toBeTruthy();

    await fireEvent.press(view.getByRole('tab', { name: 'Favorites' }));
    expect(view.getByText('No favorites yet')).toBeTruthy();
    expect(
      view.getByText(
        'Tap the heart on pieces you reach for most, and they’ll gather here.',
      ),
    ).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Clear filters' }));
    expect(view.getByText('Only Piece')).toBeTruthy();

    await fireEvent.press(view.getByRole('tab', { name: 'All clothes' }));
  });

  test('filters by category and clears both matching and empty category states', async () => {
    mockWardrobe.items = [clothingItem('top', 'Green Top')];
    const view = await render(<ClosetScreen />);
    const allButtons = view.getAllByText('All');

    await fireEvent.press(view.getByText('Tops'));
    expect(view.getByText('Green Top')).toBeTruthy();
    await fireEvent.press(view.getByText('Reset filters'));

    await fireEvent.press(view.getByText('Bottoms'));
    expect(view.getByText('Nothing in this category')).toBeTruthy();
    expect(
      view.getByText(
        'Choose another category or add a new piece to this part of your wardrobe.',
      ),
    ).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Clear filters' }));

    await fireEvent.press(allButtons[0]);
  });

  test('filters dress code and covers the generic no-results state', async () => {
    mockWardrobe.items = [clothingItem('casual', 'Casual Top')];
    const view = await render(<ClosetScreen />);
    const allButtons = view.getAllByText('All');

    await fireEvent.press(view.getByText('Casual'));
    expect(view.getByText('Casual Top')).toBeTruthy();
    await fireEvent.press(view.getByText('Reset filters'));

    await fireEvent.press(view.getByText('Black tie'));
    expect(view.getByText('No pieces found')).toBeTruthy();
    expect(
      view.getByText('Try clearing your filters to see everything in your closet.'),
    ).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Clear filters' }));

    await fireEvent.press(allButtons[1]);
  });
});
