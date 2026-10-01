import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ElementType } from 'react';
import { Alert } from 'react-native';

import RecommendOutfitScreen from '@/app/recommend-outfit';
import {
  OUTFIT_OCCASIONS,
  type OutfitRecommendation,
  type OutfitRequest,
} from '@/features/outfits/types';
import {
  FORMALITY_LEVELS,
  type ClothingItem,
} from '@/features/wardrobe/types';

const mockSaveOutfit = jest.fn<() => Promise<unknown>>();
const mockWardrobe: {
  items: ClothingItem[];
  saveOutfit: typeof mockSaveOutfit;
} = {
  items: [],
  saveOutfit: mockSaveOutfit,
};

let mockRecommendation: OutfitRecommendation;
const mockRecommendOutfit = jest.fn(
  (_items: readonly ClothingItem[], _request: OutfitRequest) => mockRecommendation,
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
    navigate: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock('@/features/outfits/recommendation', () => ({
  recommendOutfit: (items: readonly ClothingItem[], request: OutfitRequest) =>
    mockRecommendOutfit(items, request),
}));

jest.mock('@/features/wardrobe/wardrobe-provider', () => ({
  useWardrobe: () => mockWardrobe,
}));

function clothingItem(id: string, name = `Item ${id}`): ClothingItem {
  return {
    id,
    name,
    category: id === 'bottom' ? 'bottoms' : 'tops',
    formality: 'casual',
    color: '#123456',
    imageUri: `file:///${id}.jpg`,
    isFavorite: false,
    createdAt: '2026-09-01T00:00:00.000Z',
  };
}

function recommendation(
  overrides: Partial<OutfitRecommendation> = {},
): OutfitRecommendation {
  return {
    items: [clothingItem('shirt', 'Shirt'), clothingItem('bottom', 'Trousers')],
    isComplete: true,
    missingMessage: null,
    canTryAnother: true,
    tryAnotherLabel: 'Try another',
    variationMessage: 'Another combination is available.',
    ...overrides,
  };
}

function roleButtonWithState(
  view: Awaited<ReturnType<typeof render>>,
  key: 'busy' | 'disabled',
  value: boolean,
) {
  return view
    .getAllByRole('button')
    .find((button) => button.props.accessibilityState?.[key] === value);
}

describe('RecommendOutfitScreen', () => {
  let alertSpy: jest.SpiedFunction<typeof Alert.alert>;

  beforeEach(() => {
    mockWardrobe.items = [clothingItem('shirt'), clothingItem('bottom')];
    mockSaveOutfit.mockResolvedValue({});
    mockRecommendation = recommendation();
    mockRecommendOutfit.mockImplementation(() => mockRecommendation);
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  test('changes every request choice, builds a look, shuffles, saves, and opens destinations', async () => {
    let resolveSave: (() => void) | undefined;
    mockSaveOutfit.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = () => resolve({});
        }),
    );

    const view = await render(<RecommendOutfitScreen />);

    expect(view.queryByText('YOUR LOOK')).toBeNull();
    expect(mockRecommendOutfit).toHaveBeenLastCalledWith(
      mockWardrobe.items,
      expect.objectContaining({
        occasion: 'everyday',
        formality: 'casual',
        seed: 0,
      }),
    );

    await fireEvent.press(view.getByRole('button', { name: 'Close outfit planner' }));
    await fireEvent.press(view.getAllByText('Date')[0]);
    await fireEvent.press(view.getByText('Formal'));
    await fireEvent.press(view.getByText('Tomorrow'));
    await fireEvent.press(view.getByRole('button', { name: 'Build my outfit ✦' }));

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(view.getByText('YOUR LOOK')).toBeTruthy();
    expect(view.getByText('Date · Formal')).toBeTruthy();
    expect(view.getByText('Ready')).toBeTruthy();
    expect(view.getByText('Another combination is available.')).toBeTruthy();

    await fireEvent.press(view.getByRole('button', { name: 'Open Shirt' }));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/clothes',
      params: { id: 'shirt' },
    });

    await fireEvent.press(view.getByRole('button', { name: 'Mix this look' }));
    expect(router.navigate).toHaveBeenCalledWith({
      pathname: '/try-outfits',
      params: {
        itemIds: 'shirt,bottom',
        occasion: 'date',
        formality: 'formal',
        plannedFor: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        importToken: expect.any(String),
      },
    });

    await fireEvent.press(view.getByRole('button', { name: '↻ Try another' }));
    expect(mockRecommendOutfit).toHaveBeenLastCalledWith(
      mockWardrobe.items,
      expect.objectContaining({ seed: 1 }),
    );

    const saveButton = view.getByRole('button', { name: 'Save outfit' });
    mockRecommendation.isComplete = false;
    saveButton.props.onPress();
    expect(mockSaveOutfit).not.toHaveBeenCalled();
    mockRecommendation.isComplete = true;

    await fireEvent.press(saveButton);
    await waitFor(() =>
      expect(roleButtonWithState(view, 'busy', true)).toBeTruthy(),
    );

    roleButtonWithState(view, 'busy', true)?.props.onPress();
    expect(mockSaveOutfit).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSave?.();
    });

    await waitFor(() => expect(view.getByText('✓ Saved')).toBeTruthy());
    view.getByRole('button', { name: '✓ Saved' }).props.onPress();
    expect(mockSaveOutfit).toHaveBeenCalledTimes(1);
    expect(mockSaveOutfit).toHaveBeenCalledWith({
      itemIds: ['shirt', 'bottom'],
      occasion: 'date',
      formality: 'formal',
      plannedFor: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });

    await fireEvent.press(view.getByText('Everyday'));
    expect(view.queryByText('YOUR LOOK')).toBeNull();
    await fireEvent.press(view.getByRole('button', { name: 'Build my outfit ✦' }));
    expect(view.getByText('Save outfit')).toBeTruthy();
  });

  test('shows an incomplete recommendation and opens add clothes', async () => {
    mockRecommendation = recommendation({
      items: [],
      isComplete: false,
      missingMessage: 'Add a top and bottom.',
      canTryAnother: false,
      tryAnotherLabel: 'No other look yet',
      variationMessage: null,
    });

    const view = await render(<RecommendOutfitScreen />);
    await fireEvent.press(view.getByRole('button', { name: 'Build my outfit ✦' }));

    expect(view.queryByText('Ready')).toBeNull();
    expect(view.getByText('This look needs another piece')).toBeTruthy();
    expect(view.getByText('Add a top and bottom.')).toBeTruthy();
    expect(view.queryByRole('button', { name: 'Save outfit' })).toBeNull();

    await fireEvent.press(view.getByRole('button', { name: 'Add clothes' }));
    expect(router.push).toHaveBeenCalledWith('/add-clothes');
  });

  test('does not shuffle when no other complete look exists', async () => {
    mockRecommendation = recommendation({
      canTryAnother: false,
      tryAnotherLabel: 'No other look yet',
      variationMessage: null,
    });

    const view = await render(<RecommendOutfitScreen />);
    await fireEvent.press(view.getByRole('button', { name: 'Build my outfit ✦' }));

    const tryAnotherButton = view.getByRole('button', {
      name: '↻ No other look yet',
    });
    expect(tryAnotherButton.props.accessibilityState.disabled).toBe(true);
    tryAnotherButton.props.onPress();

    expect(mockRecommendOutfit).toHaveBeenLastCalledWith(
      mockWardrobe.items,
      expect.objectContaining({ seed: 0 }),
    );
    expect(view.queryByText('Another combination is available.')).toBeNull();
  });

  test.each([
    [new Error('Database unavailable'), 'Database unavailable'],
    ['bad response', 'Please try again.'],
  ])('reports a failed save for %p', async (reason, message) => {
    mockSaveOutfit.mockRejectedValue(reason);

    const view = await render(<RecommendOutfitScreen />);
    await fireEvent.press(view.getByRole('button', { name: 'Build my outfit ✦' }));
    await fireEvent.press(view.getByRole('button', { name: 'Save outfit' }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Couldn’t save this outfit',
        message,
      ),
    );
    expect(view.getByText('Save outfit')).toBeTruthy();
  });

  test('handles missing labels defensively', async () => {
    const originalFind = Array.prototype.find;
    const findSpy = jest
      .spyOn(Array.prototype, 'find')
      .mockImplementation(function <T>(
        this: T[],
        predicate: (value: T, index: number, array: T[]) => unknown,
        thisArg?: unknown,
      ) {
        const looksLikeDateOptions =
          this.length === 7 &&
          this.every(
            (value) =>
              typeof value === 'object' &&
              value !== null &&
              'relativeLabel' in value,
          );

        if (
          this === (OUTFIT_OCCASIONS as unknown as T[]) ||
          this === (FORMALITY_LEVELS as unknown as T[]) ||
          looksLikeDateOptions
        ) {
          return undefined;
        }

        return originalFind.call(this, predicate, thisArg);
      });

    try {
      const view = await render(<RecommendOutfitScreen />);
      await fireEvent.press(view.getByRole('button', { name: 'Build my outfit ✦' }));

      expect(view.getByText('YOUR LOOK')).toBeTruthy();
      expect(view.getByText(' · ')).toBeTruthy();
    } finally {
      findSpy.mockRestore();
    }
  });
});
