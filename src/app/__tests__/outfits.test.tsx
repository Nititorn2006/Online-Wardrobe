import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import type { ElementType } from 'react';
import {
  act,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';
import { router } from 'expo-router';
import { Alert } from 'react-native';

import SavedOutfitsScreen from '../outfits';
import type { SavedOutfit } from '../../features/outfits/types';
import type { ClothingItem } from '../../features/wardrobe/types';

const mockWardrobe: {
  outfits: SavedOutfit[];
  items: ClothingItem[];
  deleteOutfit: jest.MockedFunction<(id: string) => Promise<void>>;
} = {
  outfits: [],
  items: [],
  deleteOutfit: jest.fn<(id: string) => Promise<void>>(),
};

const mockSortSavedOutfits = jest.fn(
  (outfits: readonly SavedOutfit[], _today: string) => [...outfits],
);

jest.mock('react-native/Libraries/Components/Pressable/Pressable', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const View = jest.requireActual<{ default: ElementType }>(
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

      return React.createElement(View, {
        ...props,
        accessible: true,
        style: resolvedStyle,
      });
    },
  };
});

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
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock('@/features/outfits/saved-outfit-utils', () => ({
  sortSavedOutfits: (...args: [readonly SavedOutfit[], string]) =>
    mockSortSavedOutfits(...args),
}));

jest.mock('@/features/wardrobe/wardrobe-provider', () => ({
  useWardrobe: () => mockWardrobe,
}));

function clothingItem(id: string, name = `Item ${id}`): ClothingItem {
  return {
    id,
    name,
    category: 'tops',
    formality: 'casual',
    color: '#123456',
    imageUri: `file:///${id}.jpg`,
    isFavorite: false,
    createdAt: '2026-09-01T00:00:00.000Z',
  };
}

function savedOutfit(
  id: string,
  overrides: Partial<SavedOutfit> = {},
): SavedOutfit {
  return {
    id,
    name: `Look ${id}`,
    itemIds: [],
    formality: 'casual',
    occasion: 'everyday',
    plannedFor: '2026-10-05',
    createdAt: '2026-09-30T00:00:00.000Z',
    ...overrides,
  };
}

async function coverPressedStyles(
  view: Awaited<ReturnType<typeof render>>,
) {
  for (const button of view.getAllByRole('button')) {
    await fireEvent(button, 'pressIn');
    await fireEvent(button, 'pressOut');
  }
}

function confirmLatestDelete(alertSpy: jest.SpiedFunction<typeof Alert.alert>) {
  const buttons = alertSpy.mock.calls.at(-1)?.[2];
  const destructiveButton = buttons?.find((button) => button.style === 'destructive');
  destructiveButton?.onPress?.();
}

describe('SavedOutfitsScreen', () => {
  let alertSpy: jest.SpiedFunction<typeof Alert.alert>;

  beforeEach(() => {
    mockWardrobe.outfits = [];
    mockWardrobe.items = [];
    mockWardrobe.deleteOutfit.mockResolvedValue(undefined);
    mockSortSavedOutfits.mockImplementation((outfits) => [...outfits]);
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  test('renders the empty state and opens its destinations', async () => {
    const view = await render(<SavedOutfitsScreen />);

    expect(view.getByText('No saved outfits yet')).toBeTruthy();
    expect(mockSortSavedOutfits).toHaveBeenCalledWith(
      [],
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );

    await coverPressedStyles(view);
    await fireEvent.press(view.getByRole('button', { name: 'Close saved outfits' }));
    await fireEvent.press(view.getByRole('button', { name: 'Plan an outfit' }));

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/recommend-outfit');
  });

  test('renders known and fallback metadata, filters missing pieces, and opens clothes', async () => {
    const shirt = clothingItem('shirt', 'Shirt');
    const shoes = clothingItem('shoes', 'Shoes');
    mockWardrobe.items = [shirt, shoes];
    mockWardrobe.outfits = [
      savedOutfit('one', {
        name: 'One piece',
        itemIds: ['shirt', 'missing'],
      }),
      savedOutfit('two', {
        name: 'Two pieces',
        itemIds: ['shirt', 'shoes'],
        occasion: 'unknown' as SavedOutfit['occasion'],
        formality: 'unknown' as SavedOutfit['formality'],
      }),
    ];

    const view = await render(<SavedOutfitsScreen />);

    expect(view.getByText('Everyday · Casual · 1 piece')).toBeTruthy();
    expect(view.getByText(' ·  · 2 pieces')).toBeTruthy();
    expect(view.getAllByText('Shirt')).toHaveLength(2);
    expect(view.getByText('Shoes')).toBeTruthy();

    await coverPressedStyles(view);
    await fireEvent.press(view.getAllByRole('button', { name: 'Open Shirt' })[0]);

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/clothes',
      params: { id: 'shirt' },
    });
  });

  test('confirms deletion, shows the pending state, and clears it after success', async () => {
    let resolveDelete: (() => void) | undefined;
    mockWardrobe.outfits = [savedOutfit('pending', { name: 'Pending look' })];
    mockWardrobe.deleteOutfit.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        }),
    );

    const view = await render(<SavedOutfitsScreen />);
    const deleteButton = view.getByRole('button', { name: 'Delete Pending look' });

    await fireEvent.press(deleteButton);
    expect(alertSpy).toHaveBeenCalledWith(
      'Delete Pending look?',
      expect.stringContaining('Only this saved outfit will be removed.'),
      expect.any(Array),
    );

    await act(async () => {
      confirmLatestDelete(alertSpy);
    });

    await waitFor(() =>
      expect(
        view.getByRole('button', { name: 'Delete Pending look' }).props
          .accessibilityState.busy,
      ).toBe(true),
    );
    expect(mockWardrobe.deleteOutfit).toHaveBeenCalledWith('pending');

    await act(async () => {
      resolveDelete?.();
    });

    await waitFor(() =>
      expect(
        view.getByRole('button', { name: 'Delete Pending look' }).props
          .accessibilityState.busy,
      ).toBe(false),
    );
  });

  test.each([
    [new Error('Storage failed'), 'Storage failed'],
    ['bad response', 'Please try again.'],
  ])('reports a failed deletion for %p', async (reason, message) => {
    mockWardrobe.outfits = [savedOutfit('broken', { name: 'Broken look' })];
    mockWardrobe.deleteOutfit.mockRejectedValue(reason);

    const view = await render(<SavedOutfitsScreen />);
    await fireEvent.press(view.getByRole('button', { name: 'Delete Broken look' }));

    await act(async () => {
      confirmLatestDelete(alertSpy);
    });

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Couldn’t delete this outfit',
        message,
      ),
    );
    expect(
      view.getByRole('button', { name: 'Delete Broken look' }).props
        .accessibilityState.busy,
    ).toBe(false);
  });
});
