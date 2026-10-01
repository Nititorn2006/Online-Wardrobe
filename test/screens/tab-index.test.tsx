import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import HomeScreen from '@/app/(tabs)/index';
import type { ClothingItem } from '@/features/wardrobe/types';

const mockWardrobe: {
  items: ClothingItem[];
  outfits: { id: string }[];
} = {
  items: [],
  outfits: [],
};

jest.mock('@/components/app-text', () => {
  const reactNative = jest.requireActual<typeof import('react-native')>('react-native');
  return { AppText: reactNative.Text };
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

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('@/features/wardrobe/wardrobe-provider', () => ({
  useWardrobe: () => mockWardrobe,
}));

function item(
  id: string,
  createdAt: string,
  isFavorite = false,
): ClothingItem {
  return {
    id,
    name: `Item ${id}`,
    category: 'tops',
    formality: 'casual',
    color: '#123456',
    imageUri: `file:///${id}.jpg`,
    isFavorite,
    createdAt,
  };
}

describe('HomeScreen', () => {
  beforeEach(() => {
    mockWardrobe.items = [];
    mockWardrobe.outfits = [];
  });

  test('renders the empty dashboard and opens its main destinations', async () => {
    const view = await render(<HomeScreen />);

    expect(view.getAllByText('0')).toHaveLength(2);
    expect(view.getByText('Complete looks you save will appear here.')).toBeTruthy();
    expect(view.queryByText('Recently added')).toBeNull();

    await fireEvent.press(view.getByRole('button', { name: 'Plan an outfit' }));
    await fireEvent.press(view.getByRole('button', { name: 'Saved outfits, 0' }));

    expect(router.push).toHaveBeenNthCalledWith(1, '/recommend-outfit');
    expect(router.push).toHaveBeenNthCalledWith(2, '/outfits');
  });

  test('sorts and limits recent items, counts favorites, and opens a piece', async () => {
    mockWardrobe.items = [
      item('oldest', '2026-09-01T00:00:00.000Z'),
      item('two', '2026-09-02T00:00:00.000Z', true),
      item('three', '2026-09-03T00:00:00.000Z'),
      item('four', '2026-09-04T00:00:00.000Z', true),
      item('five', '2026-09-05T00:00:00.000Z'),
      item('six', '2026-09-06T00:00:00.000Z'),
      item('newest', '2026-09-07T00:00:00.000Z'),
    ];
    mockWardrobe.outfits = [{ id: 'look-1' }];

    const view = await render(<HomeScreen />);

    expect(view.getByText('7')).toBeTruthy();
    expect(view.getByText('2')).toBeTruthy();
    expect(view.getByText('1 look ready to wear')).toBeTruthy();
    expect(view.queryByText('Item oldest')).toBeNull();
    expect(view.getAllByText(/^Item /).map((node) => node.props.children)).toEqual([
      'Item newest',
      'Item six',
      'Item five',
      'Item four',
      'Item three',
      'Item two',
    ]);

    await fireEvent.press(view.getByText('See all'));
    await fireEvent.press(view.getByText('Item newest').parent!);

    expect(router.push).toHaveBeenNthCalledWith(1, '/closet');
    expect(router.push).toHaveBeenNthCalledWith(2, {
      pathname: '/clothes',
      params: { id: 'newest' },
    });
  });

  test('uses the plural saved-outfit copy', async () => {
    mockWardrobe.outfits = [{ id: 'look-1' }, { id: 'look-2' }];

    const view = await render(<HomeScreen />);

    expect(view.getByText('2 looks ready to wear')).toBeTruthy();
  });
});
